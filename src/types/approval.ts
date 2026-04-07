import type { SignatureData } from './signature'

export type RequestType = 'single' | 'bulk'
export type RequestStatus = 'awaiting_approval' | 'approved' | 'rejected' | 'expired'

export interface SubmitRequestPayload {
  requesterName: string
  requesterEmail: string
  type: RequestType
  signatureItems: SignatureData[]
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

export interface DownloadRequestData {
  id: string
  type: RequestType
  requesterName: string
  status: RequestStatus
  decidedAt: string | null
  signatureItems: SignatureData[] | null
}
