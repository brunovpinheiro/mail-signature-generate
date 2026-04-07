import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../_lib/supabase.js'
import type { RequestRow } from '../_lib/types.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const id = req.query.id as string

  const { data, error } = await supabase
    .from('requests')
    .select(
      'id, type, requester_name, signature_items, status, decided_at, decision_by'
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
    | 'signature_items'
    | 'status'
    | 'decided_at'
    | 'decision_by'
  >

  // Retorna apenas dados necessários; nunca expõe requester_email ou tokens
  return res.status(200).json({
    id: row.id,
    type: row.type,
    requesterName: row.requester_name,
    status: row.status,
    decidedAt: row.decided_at,
    // Apenas expõe signature_items se aprovado
    signatureItems: row.status === 'approved' ? row.signature_items : null,
  })
}
