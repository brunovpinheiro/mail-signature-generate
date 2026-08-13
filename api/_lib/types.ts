export interface SignatureItem {
  name: string
  jobTitle: string
  email?: string
  phone?: string
  website?: string
}

export type RequestType = 'single' | 'bulk'
export type RequestStatus = 'awaiting_approval' | 'approved' | 'rejected' | 'expired'

export interface RequestRow {
  id: string
  requester_name: string
  requester_email: string
  company_domain: string | null
  type: RequestType
  signature_items: SignatureItem[]
  data_hash: string
  status: RequestStatus
  decision_by: string | null
  decision_reason: string | null
  decided_at: string | null
  created_at: string
}

export interface TokenRow {
  id: string
  request_id: string
  manager_email: string
  token: string
  expires_at: string
  used_at: string | null
  invalidated_at: string | null
  created_at: string
}

export type AuditEvent =
  | 'request_created'
  | 'token_sent'
  | 'token_viewed'
  | 'approved'
  | 'rejected'
  | 'token_invalidated'
  | 'unauthorized_attempt'
  | 'self_approval_attempt'
  | 'token_expired'
  | 'token_already_used'
  | 'request_already_decided'
  // Envio aceito pelo Resend (não é garantia de entrega)
  | 'email_sent'
  // Resend recusou o envio na hora da chamada
  | 'email_failed'
  // Chegou depois, via webhook do Resend
  | 'email_bounced'
  | 'email_complained'
  // Destinatário na lista de supressão — descartado sem tentativa de entrega
  | 'email_suppressed'
