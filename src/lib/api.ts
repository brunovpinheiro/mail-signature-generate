import type {
  SubmitRequestPayload,
  SubmitRequestResult,
  ApprovalTokenResponse,
  DownloadRequestData,
} from '@/types/approval'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const body = await res.json() as Record<string, unknown>
  if (!res.ok) {
    throw new Error((body.error as string) ?? `HTTP ${res.status}`)
  }
  return body as T
}

export async function submitRequest(
  payload: SubmitRequestPayload
): Promise<SubmitRequestResult> {
  return apiFetch<SubmitRequestResult>('/api/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getApprovalToken(
  token: string
): Promise<ApprovalTokenResponse> {
  return apiFetch<ApprovalTokenResponse>(`/api/approve/${token}`)
}

export async function postApprovalDecision(
  token: string,
  action: 'approve' | 'reject',
  reason?: string
): Promise<void> {
  await apiFetch(`/api/approve/${token}`, {
    method: 'POST',
    body: JSON.stringify({ action, reason }),
  })
}

export async function getDownloadRequest(
  requestId: string
): Promise<DownloadRequestData> {
  return apiFetch<DownloadRequestData>(`/api/requests/${requestId}`)
}

// ── Admin ────────────────────────────────────────────────────────────────────

export interface AdminLoginResult {
  token: string
  domain: string
}

export async function adminLogin(email: string, password: string): Promise<AdminLoginResult> {
  return apiFetch<AdminLoginResult>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export interface AdminSignatureItem {
  name: string
  jobTitle: string
  email?: string
  phone?: string
  website?: string
}

export interface AdminRequest {
  id: string
  requesterName: string
  requesterEmail: string
  type: 'single' | 'bulk'
  itemCount: number
  signatureItems: AdminSignatureItem[]
  status: string
  createdAt: string
}

export interface AdminRequestsResult {
  companyName: string
  domain: string
  requests: AdminRequest[]
}

export async function getAdminRequests(token: string): Promise<AdminRequestsResult> {
  return apiFetch<AdminRequestsResult>('/api/admin/requests', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function adminDecide(
  token: string,
  requestId: string,
  action: 'approve' | 'reject',
  reason?: string
): Promise<void> {
  await apiFetch(`/api/admin/requests/${requestId}/decide`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, reason }),
  })
}
