import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'node:crypto'
import { supabase } from '../_lib/supabase.js'

/**
 * Webhook do Resend.
 *
 * Bounce e reclamação de spam são ASSÍNCRONOS: o `send` responde 200 e a
 * falha só chega minutos depois. Sem isto, uma assinatura aprovada some sem
 * deixar rastro — foi exatamente o que aconteceu com os endereços que caíram
 * na lista de supressão.
 *
 * Configurar em Resend → Webhooks, apontando para
 * https://<APP_URL>/api/webhooks/resend com os eventos email.bounced e
 * email.complained, e gravar o signing secret em RESEND_WEBHOOK_SECRET.
 */
export const config = {
  api: { bodyParser: false },
}

const EVENT_MAP: Record<string, 'email_bounced' | 'email_complained' | 'email_suppressed' | 'email_failed'> = {
  'email.bounced': 'email_bounced',
  'email.complained': 'email_complained',
  // Destinatário na lista de supressão: o Resend descarta sem nem tentar.
  // Era o estado do segundo e-mail que o Shopping Estação não recebeu.
  'email.suppressed': 'email_suppressed',
  'email.failed': 'email_failed',
}

function readRawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

/**
 * Verificação de assinatura no padrão Svix, que é o que o Resend usa.
 * Assina `${id}.${timestamp}.${payload}` com HMAC-SHA256 e compara em tempo
 * constante contra as assinaturas do header (pode haver mais de uma durante
 * rotação de secret).
 */
function isValidSignature(secret: string, headers: VercelRequest['headers'], raw: string): boolean {
  const id = headers['svix-id'] as string | undefined
  const timestamp = headers['svix-timestamp'] as string | undefined
  const signatureHeader = headers['svix-signature'] as string | undefined

  if (!id || !timestamp || !signatureHeader) return false

  // Rejeita replays de mais de 5 minutos
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > 300) return false

  // O secret vem como "whsec_<base64>"
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const expected = crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${raw}`).digest('base64')
  const expectedBuf = Buffer.from(expected)

  // Header: "v1,<sig> v1,<sig>"
  return signatureHeader.split(' ').some((entry) => {
    const sig = entry.split(',')[1]
    if (!sig) return false
    const sigBuf = Buffer.from(sig)
    return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    console.error('[webhook] RESEND_WEBHOOK_SECRET não configurado')
    return res.status(500).json({ error: 'Webhook não configurado.' })
  }

  const raw = await readRawBody(req)

  if (!isValidSignature(secret, req.headers, raw)) {
    console.warn('[webhook] Assinatura inválida — payload descartado')
    return res.status(401).json({ error: 'Assinatura inválida.' })
  }

  let payload: { type?: string; data?: { email_id?: string; to?: string[]; bounce?: { type?: string; subType?: string } } }
  try {
    payload = JSON.parse(raw)
  } catch {
    return res.status(400).json({ error: 'Payload inválido.' })
  }

  const event = EVENT_MAP[payload.type ?? '']
  // Outros eventos (delivered, opened…) são ignorados de propósito: só
  // interessa registrar o que representa falha de entrega.
  if (!event) return res.status(200).json({ ignored: payload.type ?? null })

  const recipient = payload.data?.to?.[0] ?? null
  const emailId = payload.data?.email_id ?? null

  // Reencontra a solicitação pelo id que o audit_log guardou no envio.
  let requestId: string | null = null
  if (emailId) {
    const { data } = await supabase
      .from('audit_logs')
      .select('request_id')
      .eq('event', 'email_sent')
      .eq('metadata->>resend_id', emailId)
      .limit(1)
      .maybeSingle()
    requestId = (data?.request_id as string | undefined) ?? null
  }

  const { error } = await supabase.from('audit_logs').insert({
    request_id: requestId,
    event,
    actor_email: recipient,
    metadata: {
      resend_id: emailId,
      bounce_type: payload.data?.bounce?.type ?? null,
      bounce_subtype: payload.data?.bounce?.subType ?? null,
    },
  })

  if (error) {
    console.error('[webhook] Falha ao gravar audit_log:', error)
    // 500 faz o Resend reenviar — melhor do que perder o evento
    return res.status(500).json({ error: 'Erro ao registrar evento.' })
  }

  console.warn(`[webhook] ${event} para ${recipient} (solicitação ${requestId ?? 'não identificada'})`)

  return res.status(200).json({ recorded: event })
}
