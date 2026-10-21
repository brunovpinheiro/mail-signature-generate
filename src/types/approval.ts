import type { SignatureData } from './signature'

export type RequestType = 'single' | 'bulk'
export type RequestStatus = 'awaiting_approval' | 'approved' | 'rejected' | 'expired'

export interface SubmitRequestPayload {
  requesterName: string
  requesterEmail: string
  type: RequestType
  signatureItems: SignatureData[]
  companyDomain?: string
}

export interface SubmitRequestResult {
  requestId: string
}

export interface ApprovalTokenView {
  alreadyDecided: false
  requestData: {
    id: string
    type: RequestType
    requesterName: string
    requesterEmail: string
    companyDomain: string
    signatureItems: SignatureData[]
    createdAt: string
  }
  managerEmailMasked: string
}

export interface ApprovalAlreadyDecided {
  alreadyDecided: true
  status: RequestStatus
}

export type ApprovalTokenResponse = ApprovalTokenView | ApprovalAlreadyDecided

/**
 * Relação da solicitação com o e-mail consultado: enviada por ele, ou aprovada
 * com uma assinatura que outra pessoa gerou para ele.
 */
export type MyRequestRelation = 'requested' | 'generated_for'

/** Resumo de uma solicitação na aba "Minhas solicitações" — sem os dados da assinatura. */
export interface MyRequestSummary {
  id: string
  relation: MyRequestRelation
  type: RequestType
  requesterName: string
  companyDomain: string | null
  status: RequestStatus
  /** Em `generated_for`, sempre 1: só a assinatura da pessoa pode ser baixada. */
  itemCount: number
  /** Nome da pessoa da assinatura — em individuais e em `generated_for`. */
  signatureName: string | null
  decisionReason: string | null
  decidedAt: string | null
  createdAt: string
}

export interface DownloadRequestData {
  id: string
  type: RequestType
  requesterName: string
  companyDomain: string
  status: RequestStatus
  decidedAt: string | null
  signatureItems: SignatureData[] | null
}
