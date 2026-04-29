import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../_lib/supabase.js'
import { getApproversForDomain, getCompanyApprovers } from '../_lib/approvers.js'
import { sendWeeklyDigestEmail } from '../_lib/email.js'
import { getCompanyNameByDomain } from '../_lib/company-domains.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers['authorization']
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  try {
    const { data: pendingRequests, error } = await supabase
      .from('requests')
      .select('company_domain')
      .eq('status', 'awaiting_approval')

    if (error) {
      console.error('[weekly-digest] Supabase error:', error)
      return res.status(500).json({ error: 'Erro ao buscar solicitações pendentes.' })
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      console.log('[weekly-digest] No pending requests. Skipping digest.')
      return res.status(200).json({ sent: 0, message: 'Nenhuma solicitação pendente.' })
    }

    // Agrupa contagem por domínio
    const countByDomain = pendingRequests.reduce<Record<string, number>>((acc, row) => {
      const domain = row.company_domain as string
      acc[domain] = (acc[domain] ?? 0) + 1
      return acc
    }, {})

    // Para cada domínio com pendências, notifica os gestores
    let totalSent = 0
    const knownDomains = Object.keys(getCompanyApprovers())

    for (const [domain, count] of Object.entries(countByDomain)) {
      const approvers = getApproversForDomain(domain)
      if (approvers.length === 0) {
        console.warn(`[weekly-digest] No approvers configured for domain: ${domain}`)
        continue
      }

      const companyName = getCompanyNameByDomain(domain) ?? domain

      for (const managerEmail of approvers) {
        try {
          await sendWeeklyDigestEmail({ managerEmail, companyName, pendingCount: count })
          totalSent++
          console.log(`[weekly-digest] Sent digest to ${managerEmail} (${count} pending for ${domain})`)
        } catch (emailErr) {
          console.error(`[weekly-digest] Failed to send to ${managerEmail}:`, emailErr)
        }
      }
    }

    return res.status(200).json({ sent: totalSent, domains: Object.keys(countByDomain).length })
  } catch (err) {
    console.error('[weekly-digest] Unhandled error:', err)
    return res.status(500).json({ error: 'Erro interno.' })
  }
}
