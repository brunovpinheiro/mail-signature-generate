import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../_lib/supabase.js'
import { extractAdminToken } from '../_lib/admin-auth.js'
import { hashSignatureItems } from '../_lib/crypto.js'
import { sendRequesterApprovedEmail } from '../_lib/email.js'
import { getCompanyNameByDomain } from '../_lib/company-domains.js'
import type { SignatureItem } from '../_lib/types.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let adminPayload: { email: string; domain: string }
  try {
    adminPayload = extractAdminToken(req.headers['authorization'])
  } catch (err) {
    return res.status(401).json({ error: (err as Error).message })
  }

  try {
    const { signatureItems, companyDomain } = req.body as {
      signatureItems: SignatureItem[]
      companyDomain: string
    }

    if (!Array.isArray(signatureItems) || signatureItems.length === 0) {
      return res.status(400).json({ error: 'Dados da assinatura ausentes.' })
    }
    for (const item of signatureItems) {
      if (!item.name?.trim() || !item.jobTitle?.trim()) {
        return res.status(400).json({ error: 'Cada assinatura requer nome e cargo.' })
      }
    }

    const domain = companyDomain ?? adminPayload.domain
    const companyName = getCompanyNameByDomain(domain)
    const now = new Date().toISOString()
    const dataHash = hashSignatureItems(signatureItems)

    const { data: requestRow, error: insertError } = await supabase
      .from('requests')
      .insert({
        requester_name: adminPayload.email,
        requester_email: adminPayload.email,
        company_domain: domain,
        type: 'bulk',
        signature_items: signatureItems,
        data_hash: dataHash,
        status: 'approved',
        decision_by: adminPayload.email,
        decision_reason: 'Gerado pelo painel do gestor',
        decided_at: now,
        created_at: now,
      })
      .select('id')
      .single()

    if (insertError || !requestRow) {
      console.error('[admin/bulk] Insert error:', insertError)
      return res.status(500).json({ error: 'Erro ao registrar solicitação.' })
    }

    const requestId = requestRow.id as string

    await supabase.from('audit_logs').insert({
      request_id: requestId,
      event: 'approved',
      actor_email: adminPayload.email,
      metadata: { source: 'admin_bulk', item_count: signatureItems.length },
    })

    // Notifica cada pessoa que tem e-mail cadastrado
    let notified = 0
    let skipped = 0

    await Promise.allSettled(
      signatureItems.map(async (item) => {
        if (!item.email?.trim()) {
          skipped++
          return
        }
        try {
          await sendRequesterApprovedEmail({
            requesterName: item.name,
            requesterEmail: item.email.trim(),
            requestId,
            decidedBy: adminPayload.email,
            companyName,
          })
          notified++
        } catch (err) {
          console.error(`[admin/bulk] Failed to notify ${item.email}:`, err)
          skipped++
        }
      })
    )

    return res.status(201).json({ requestId, notified, skipped })
  } catch (err) {
    console.error('[admin/bulk] Unhandled error:', err)
    return res.status(500).json({ error: 'Erro interno.' })
  }
}
