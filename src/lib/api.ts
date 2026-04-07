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
