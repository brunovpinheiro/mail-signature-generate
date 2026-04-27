import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../_lib/supabase.js'
import { isApprover } from '../_lib/approvers.js'
import {
  sendRequesterApprovedEmail,
  sendRequesterRejectedEmail,
} from '../_lib/email.js'
import type { RequestRow, TokenRow } from '../_lib/types.js'

// Mensagem genérica para tokens inválidos — não revela se existem
const TOKEN_INVALID_MSG = 'Link de aprovação inválido ou expirado.'

async function resolveToken(token: string): Promise<
  | { error: string; status: number }
  | { tokenRow: TokenRow; requestRow: RequestRow }
> {
  const { data: tokenRow, error } = await supabase
    .from('approval_tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !tokenRow) {
    return { error: TOKEN_INVALID_MSG, status: 404 }
  }

  const t = tokenRow as TokenRow

  if (new Date(t.expires_at) < new Date()) {
    await supabase.from('audit_logs').insert({
      request_id: t.request_id,
      event: 'token_expired',
      metadata: { token_prefix: token.slice(0, 8) },
    })
    return { error: TOKEN_INVALID_MSG, status: 410 }
  }

  if (t.used_at || t.invalidated_at) {
    return { error: TOKEN_INVALID_MSG, status: 410 }
  }

  if (!isApprover(t.manager_email)) {
    await supabase.from('audit_logs').insert({
      request_id: t.request_id,
      event: 'unauthorized_attempt',
      actor_email: t.manager_email,
      metadata: { reason: 'email_removed_from_approvers_list' },
    })
    return { error: TOKEN_INVALID_MSG, status: 403 }
  }

  const { data: requestRow, error: reqError } = await supabase
    .from('requests')
    .select('*')
    .eq('id', t.request_id)
    .single()

  if (reqError || !requestRow) {
    return { error: 'Solicitação não encontrada.', status: 404 }
  }

  return { tokenRow: t, requestRow: requestRow as RequestRow }
}

// ── GET: visualizar solicitação ───────────────────────────────────────────────

async function handleGet(req: VercelRequest, res: VercelResponse) {
  const token = req.query.token as string
  const result = await resolveToken(token)

  if ('error' in result) {
    return res.status(result.status).json({ error: result.error })
  }

  const { tokenRow, requestRow } = result

  // Se a solicitação já foi decidida, informa sem expor detalhes internos
  if (requestRow.status !== 'awaiting_approval') {
    return res.status(200).json({
      alreadyDecided: true,
      status: requestRow.status,
    })
  }

  await supabase.from('audit_logs').insert({
    request_id: requestRow.id,
    event: 'token_viewed',
    actor_email: tokenRow.manager_email,
    metadata: { token_prefix: token.slice(0, 8) },
  })

  return res.status(200).json({
    alreadyDecided: false,
    requestData: {
      id: requestRow.id,
      type: requestRow.type,
      requesterName: requestRow.requester_name,
      requesterEmail: requestRow.requester_email,
      companyDomain: requestRow.company_domain ?? requestRow.requester_email.split('@')[1],
      signatureItems: requestRow.signature_items,
      createdAt: requestRow.created_at,
    },
    // E-mail mascarado (não expõe o endereço completo ao solicitante)
    managerEmailMasked: maskEmail(tokenRow.manager_email),
  })
}

// ── POST: registrar decisão ────────────────────────────────────────────────────

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const token = req.query.token as string
  const { action, reason } = req.body as {
    action: 'approve' | 'reject'
    reason?: string
  }

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Ação inválida.' })
  }
  if (action === 'reject' && !reason?.trim()) {
    return res.status(400).json({ error: 'Justificativa obrigatória para reprovação.' })
  }

  const result = await resolveToken(token)
  if ('error' in result) {
    return res.status(result.status).json({ error: result.error })
  }

  const { tokenRow, requestRow } = result

  if (requestRow.status !== 'awaiting_approval') {
    return res.status(409).json({
      error: 'Esta solicitação já foi processada.',
      status: requestRow.status,
    })
  }

  // ── Proteção anti-auto-aprovação ─────────────────────────────────────────
  if (tokenRow.manager_email.toLowerCase() === requestRow.requester_email.toLowerCase()) {
    await supabase.from('audit_logs').insert({
      request_id: requestRow.id,
      event: 'self_approval_attempt',
      actor_email: tokenRow.manager_email,
    })
    return res.status(403).json({
      error: 'Auto-aprovação não permitida.',
    })
  }

  const decidedAt = new Date().toISOString()
  const newStatus = action === 'approve' ? 'approved' : 'rejected'

  // ── Atualizar solicitação ─────────────────────────────────────────────────
  await supabase
    .from('requests')
    .update({
      status: newStatus,
      decision_by: tokenRow.manager_email,
      decision_reason: action === 'reject' ? reason!.trim() : null,
      decided_at: decidedAt,
    })
    .eq('id', requestRow.id)

  // ── Marcar este token como usado ──────────────────────────────────────────
  await supabase
    .from('approval_tokens')
    .update({ used_at: decidedAt })
    .eq('id', tokenRow.id)

  // ── Invalidar todos os outros tokens da mesma solicitação ─────────────────
  const { data: otherTokens } = await supabase
    .from('approval_tokens')
    .select('id')
    .eq('request_id', requestRow.id)
    .neq('id', tokenRow.id)
    .is('used_at', null)
    .is('invalidated_at', null)

  if (otherTokens && otherTokens.length > 0) {
    await supabase
      .from('approval_tokens')
      .update({ invalidated_at: decidedAt })
      .in(
        'id',
        otherTokens.map((t) => t.id)
      )

    await supabase.from('audit_logs').insert(
      otherTokens.map((t) => ({
        request_id: requestRow.id,
        event: 'token_invalidated',
        metadata: { token_id: t.id, reason: 'first_decision_reached' },
      }))
    )
  }

  // ── Log da decisão ────────────────────────────────────────────────────────
  await supabase.from('audit_logs').insert({
    request_id: requestRow.id,
    event: newStatus,
    actor_email: tokenRow.manager_email,
    metadata: action === 'reject' ? { reason } : {},
  })

  // ── Notificar solicitante ──────────────────────────────────────────────────
  if (action === 'approve') {
    await sendRequesterApprovedEmail({
      requesterName: requestRow.requester_name,
      requesterEmail: requestRow.requester_email,
      requestId: requestRow.id,
      decidedBy: tokenRow.manager_email,
    })
  } else {
    await sendRequesterRejectedEmail({
      requesterName: requestRow.requester_name,
      requesterEmail: requestRow.requester_email,
      reason: reason!.trim(),
    })
  }

  return res.status(200).json({ success: true, status: newStatus })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') return handleGet(req, res)
  if (req.method === 'POST') return handlePost(req, res)
  return res.status(405).json({ error: 'Method not allowed' })
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  const masked = local.slice(0, 2) + '***'
  return `${masked}@${domain}`
}
