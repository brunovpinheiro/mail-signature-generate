import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../_lib/supabase.js'
import { itemsForEmail, normalizeEmail } from '../_lib/signature-items.js'
import type { RequestRow } from '../_lib/types.js'

/**
 * GET /api/requests/:id[?email=<endereço>]
 *
 * Sem `email`, devolve a solicitação inteira (é o que os links /download/:id
 * enviados por e-mail usam). Com `email` de quem não é o solicitante, devolve
 * só a assinatura daquela pessoa, como individual, e 404 se ela não está numa
 * solicitação aprovada — sem revelar que a solicitação existe.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const id = req.query.id as string

  const { data, error } = await supabase
    .from('requests')
    .select(
      'id, type, requester_name, requester_email, company_domain, signature_items, status, decided_at, decision_by'
    )
    .eq('id', id)
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'Solicitação não encontrada.' })
  }

  const row = data as Pick<
    RequestRow,
    | 'id'
    | 'type'
    | 'requester_name'
    | 'requester_email'
    | 'company_domain'
    | 'signature_items'
    | 'status'
    | 'decided_at'
    | 'decision_by'
  >

  const email = typeof req.query.email === 'string' ? normalizeEmail(req.query.email) : null

  // Retorna apenas dados necessários; nunca expõe tokens
  const view = {
    id: row.id,
    type: row.type,
    requesterName: row.requester_name,
    companyDomain: row.company_domain ?? row.requester_email.split('@')[1],
    status: row.status,
    decidedAt: row.decided_at,
    // Apenas expõe signature_items se aprovado
    signatureItems: row.status === 'approved' ? row.signature_items : null,
  }

  if (email === null || email === row.requester_email) {
    return res.status(200).json(view)
  }

  const ownItems = row.status === 'approved' ? itemsForEmail(row.signature_items, email) : []
  if (ownItems.length === 0) {
    return res.status(404).json({ error: 'Solicitação não encontrada.' })
  }

  // Só a assinatura da própria pessoa, para o front gerar um PNG e não o ZIP do lote.
  return res.status(200).json({ ...view, type: 'single', signatureItems: ownItems })
}
