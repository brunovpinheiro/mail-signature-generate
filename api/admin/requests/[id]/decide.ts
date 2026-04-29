import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../../../_lib/supabase.js'
import { extractAdminToken } from '../../../_lib/admin-auth.js'
import { getCompanyNameByDomain } from '../../../_lib/company-domains.js'
import {
  sendRequesterApprovedEmail,
  sendRequesterRejectedEmail,
} from '../../../_lib/email.js'
import type { RequestRow } from '../../../_lib/types.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── Autenticação ──────────────────────────────────────────────────────────
  let session
  try {
    session = extractAdminToken(req.headers.authorization)
  } catch (err) {
    return res.status(401).json({ error: (err as Error).message })
  }

  const requestId = req.query.id as string
  const { action, reason } = req.body as { action?: string; reason?: string }

  if (!['approve', 'reject'].includes(action ?? '')) {
    return res.status(400).json({ error: 'Ação inválida.' })
  }

  // ── Busca solicitação ─────────────────────────────────────────────────────
  const { data: requestRow, error: fetchError } = await supabase
    .from('requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (fetchError || !requestRow) {
    return res.status(404).json({ error: 'Solicitação não encontrada.' })
  }

  const row = requestRow as RequestRow

  // ── Verifica que a solicitação pertence ao domínio do gestor ──────────────
  const requesterDomain = row.requester_email.split('@')[1]?.toLowerCase()
  if (requesterDomain !== session.domain) {
    await supabase.from('audit_logs').insert({
      request_id: requestId,
      event: 'unauthorized_attempt',
      actor_email: session.email,
      metadata: { reason: 'domain_mismatch', manager_domain: session.domain, requester_domain: requesterDomain },
    })
    return res.status(403).json({ error: 'Acesso não autorizado a esta solicitação.' })
  }

  if (row.status !== 'awaiting_approval') {
    return res.status(409).json({
      error: 'Esta solicitação já foi processada.',
      status: row.status,
    })
  }

  // ── Proteção anti-auto-aprovação ──────────────────────────────────────────
  if (session.email === row.requester_email) {
    await supabase.from('audit_logs').insert({
      request_id: requestId,
      event: 'self_approval_attempt',
      actor_email: session.email,
    })
    return res.status(403).json({ error: 'Auto-aprovação não permitida.' })
  }

  const decidedAt = new Date().toISOString()
  const newStatus = action === 'approve' ? 'approved' : 'rejected'

  // ── Atualizar solicitação ─────────────────────────────────────────────────
  await supabase
    .from('requests')
    .update({
      status: newStatus,
      decision_by: session.email,
      decision_reason: action === 'reject' ? (reason?.trim() ?? null) : null,
      decided_at: decidedAt,
    })
    .eq('id', requestId)

  // ── Invalidar tokens de aprovação por link pendentes ─────────────────────
  const { data: pendingTokens } = await supabase
    .from('approval_tokens')
    .select('id')
    .eq('request_id', requestId)
    .is('used_at', null)
    .is('invalidated_at', null)

  if (pendingTokens && pendingTokens.length > 0) {
    await supabase
      .from('approval_tokens')
      .update({ invalidated_at: decidedAt })
      .in('id', pendingTokens.map((t) => t.id))

    await supabase.from('audit_logs').insert(
      pendingTokens.map((t) => ({
        request_id: requestId,
        event: 'token_invalidated',
        metadata: { token_id: t.id, reason: 'admin_decision' },
      }))
    )
  }

  // ── Log da decisão ────────────────────────────────────────────────────────
  await supabase.from('audit_logs').insert({
    request_id: requestId,
    event: newStatus,
    actor_email: session.email,
    metadata: action === 'reject' ? { reason, source: 'admin_panel' } : { source: 'admin_panel' },
  })

  const companyName = getCompanyNameByDomain(session.domain)

  // ── Notificar solicitante ─────────────────────────────────────────────────
  if (action === 'approve') {
    await sendRequesterApprovedEmail({
      requesterName: row.requester_name,
      requesterEmail: row.requester_email,
      requestId,
      decidedBy: session.email,
      companyName,
    })
  } else {
    await sendRequesterRejectedEmail({
      requesterName: row.requester_name,
      requesterEmail: row.requester_email,
      reason: reason?.trim() ?? '',
      companyName,
    })
  }

  return res.status(200).json({ success: true, status: newStatus })
}
