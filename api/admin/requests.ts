import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../_lib/supabase.js'
import { extractAdminToken } from '../_lib/admin-auth.js'
import { getCompanyNameByDomain } from '../_lib/company-domains.js'
import type { RequestRow } from '../_lib/types.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let session
  try {
    session = extractAdminToken(req.headers.authorization)
  } catch (err) {
    return res.status(401).json({ error: (err as Error).message })
  }

  // Busca solicitações pendentes do domínio do gestor
  const { data, error } = await supabase
    .from('requests')
    .select('id, requester_name, requester_email, type, signature_items, status, created_at')
    .eq('status', 'awaiting_approval')
    .ilike('requester_email', `%@${session.domain}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/requests] Supabase error:', error)
    return res.status(500).json({ error: 'Erro ao buscar solicitações.' })
  }

  const rows = (data ?? []) as Pick<
    RequestRow,
    'id' | 'requester_name' | 'requester_email' | 'type' | 'signature_items' | 'status' | 'created_at'
  >[]

  const companyName = getCompanyNameByDomain(session.domain)

  return res.status(200).json({
    companyName,
    domain: session.domain,
    requests: rows.map((r) => ({
      id: r.id,
      requesterName: r.requester_name,
      requesterEmail: r.requester_email,
      type: r.type,
      itemCount: Array.isArray(r.signature_items) ? r.signature_items.length : 0,
      signatureItems: r.signature_items,
      status: r.status,
      createdAt: r.created_at,
    })),
  })
}
