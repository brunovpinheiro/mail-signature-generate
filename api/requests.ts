import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from './_lib/supabase.js'
import { generateToken, hashSignatureItems } from './_lib/crypto.js'
import { getApproversForRequester } from './_lib/approvers.js'
import type { SignatureItem, RequestType } from './_lib/types.js'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    // ── Busca aprovadores da empresa do solicitante ─────────────────────────
    const approvers = getApproversForRequester(normalizedEmail)
    if (approvers.length === 0) {
      console.error('[requests] No approvers configured for domain:', normalizedEmail.split('@')[1])
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
        company_domain: companyDomain ?? normalizedEmail.split('@')[1],
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
