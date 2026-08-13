import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from './_lib/supabase.js'
import { generateToken, hashSignatureItems } from './_lib/crypto.js'
import { getApproversForDomain } from './_lib/approvers.js'
import type { SignatureItem, RequestType, RequestRow } from './_lib/types.js'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ── Rate limit da consulta por e-mail ────────────────────────────────────────
// Best-effort: o estado vive na memória da instância serverless, então o limite
// é por instância e some em cold start. Serve para frear varredura ingênua de
// endereços; não é uma garantia forte.
const LOOKUP_WINDOW_MS = 60_000
const LOOKUP_MAX_PER_WINDOW = 10
const lookupHits = new Map<string, number[]>()

function isLookupRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (lookupHits.get(ip) ?? []).filter((t) => now - t < LOOKUP_WINDOW_MS)
  recent.push(now)
  lookupHits.set(ip, recent)

  // Evita crescimento indefinido do Map em instâncias de vida longa
  if (lookupHits.size > 5_000) {
    for (const [key, hits] of lookupHits) {
      if (hits.every((t) => now - t >= LOOKUP_WINDOW_MS)) lookupHits.delete(key)
    }
  }

  return recent.length > LOOKUP_MAX_PER_WINDOW
}

/**
 * GET /api/requests?email=<endereço exato>
 *
 * Lista as solicitações de um solicitante para a aba "Minhas solicitações".
 * Exige o endereço completo — não faz busca parcial nem por domínio — e nunca
 * devolve os dados da assinatura, só o resumo. O conteúdo continua vindo de
 * GET /api/requests/:id, que só o expõe quando a solicitação está aprovada.
 */
async function handleList(req: VercelRequest, res: VercelResponse) {
  const rawEmail = (req.query.email as string | undefined)?.trim().toLowerCase()

  if (!rawEmail || !isValidEmail(rawEmail)) {
    return res.status(400).json({ error: 'E-mail inválido.' })
  }

  const forwarded = req.headers['x-forwarded-for']
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim() ?? 'unknown'

  if (isLookupRateLimited(ip)) {
    return res.status(429).json({ error: 'Muitas consultas. Aguarde um minuto e tente novamente.' })
  }

  const { data, error } = await supabase
    .from('requests')
    .select('id, type, requester_name, company_domain, signature_items, status, decision_reason, decided_at, created_at')
    .eq('requester_email', rawEmail)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[requests] List error:', error)
    return res.status(500).json({ error: 'Erro ao buscar solicitações.' })
  }

  const rows = (data ?? []) as Array<
    Pick<
      RequestRow,
      | 'id'
      | 'type'
      | 'requester_name'
      | 'company_domain'
      | 'signature_items'
      | 'status'
      | 'decision_reason'
      | 'decided_at'
      | 'created_at'
    >
  >

  return res.status(200).json({
    requests: rows.map((row) => ({
      id: row.id,
      type: row.type,
      requesterName: row.requester_name,
      companyDomain: row.company_domain,
      status: row.status,
      itemCount: Array.isArray(row.signature_items) ? row.signature_items.length : 0,
      // Só faz sentido para reprovadas; hoje esse motivo só existia no e-mail.
      decisionReason: row.status === 'rejected' ? row.decision_reason : null,
      decidedAt: row.decided_at,
      createdAt: row.created_at,
    })),
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return handleList(req, res)
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { requesterName, requesterEmail, type, signatureItems, companyDomain } = req.body as {
      requesterName: string
      requesterEmail: string
      type: RequestType
      signatureItems: SignatureItem[]
      companyDomain?: string
    }

    // ── Validação de entrada ────────────────────────────────────────────────
    if (!requesterName?.trim()) {
      return res.status(400).json({ error: 'Nome do solicitante é obrigatório.' })
    }
    if (!requesterEmail?.trim() || !isValidEmail(requesterEmail)) {
      return res.status(400).json({ error: 'E-mail do solicitante inválido.' })
    }
    if (!['single', 'bulk'].includes(type)) {
      return res.status(400).json({ error: 'Tipo inválido.' })
    }
    if (!Array.isArray(signatureItems) || signatureItems.length === 0) {
      return res.status(400).json({ error: 'Dados da assinatura ausentes.' })
    }
    for (const item of signatureItems) {
      if (!item.name?.trim() || !item.jobTitle?.trim()) {
        return res.status(400).json({ error: 'Cada assinatura requer nome e cargo.' })
      }
    }

    const normalizedEmail = requesterEmail.trim().toLowerCase()
    const resolvedDomain = companyDomain?.trim().toLowerCase() ?? normalizedEmail.split('@')[1]

    // ── Busca aprovadores do empreendimento solicitado ──────────────────────
    const approvers = getApproversForDomain(resolvedDomain)
    if (approvers.length === 0) {
      console.error('[requests] No approvers configured for domain:', resolvedDomain)
      return res.status(400).json({ error: 'Domínio de e-mail não habilitado para gerar assinaturas.' })
    }

    const dataHash = hashSignatureItems(signatureItems)
    const now = new Date().toISOString()

    // ── Criar solicitação ────────────────────────────────────────────────────
    const { data: requestRow, error: insertError } = await supabase
      .from('requests')
      .insert({
        requester_name: requesterName.trim(),
        requester_email: normalizedEmail,
        company_domain: resolvedDomain,
        type,
        signature_items: signatureItems,
        data_hash: dataHash,
        status: 'awaiting_approval',
        created_at: now,
      })
      .select('id')
      .single()

    if (insertError || !requestRow) {
      console.error('[requests] Insert error:', insertError)
      return res.status(500).json({ error: 'Erro ao registrar solicitação.' })
    }

    const requestId = requestRow.id as string

    // ── Log: criação ─────────────────────────────────────────────────────────
    await supabase.from('audit_logs').insert({
      request_id: requestId,
      event: 'request_created',
      actor_email: normalizedEmail,
      metadata: { type, item_count: signatureItems.length },
    })

    // ── Gerar tokens de aprovação para os gestores ───────────────────────────
    const tokenExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

    await Promise.all(
      approvers.map(async (managerEmail) => {
        const token = generateToken()

        const { error: tokenError } = await supabase.from('approval_tokens').insert({
          request_id: requestId,
          manager_email: managerEmail,
          token,
          expires_at: tokenExpiresAt,
        })

        if (tokenError) {
          console.error('[requests] Token insert error:', tokenError)
          throw new Error('Erro ao gerar token de aprovação.')
        }

        await supabase.from('audit_logs').insert({
          request_id: requestId,
          event: 'token_sent',
          actor_email: managerEmail,
          metadata: { token_prefix: token.slice(0, 8) },
        })

      })
    )

    return res.status(201).json({ requestId })
  } catch (err) {
    console.error('[requests] Unhandled error:', err)
    const message = err instanceof Error ? err.message : 'Erro interno.'
    return res.status(500).json({ error: message })
  }
}
