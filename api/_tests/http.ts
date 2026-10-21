import type { VercelRequest, VercelResponse } from '@vercel/node'

type Handler = (req: VercelRequest, res: VercelResponse) => unknown

let ipCounter = 0

/** IP diferente a cada chamada, para o limite de consultas não vazar entre testes. */
export function uniqueIp(): string {
  ipCounter++
  return `10.0.${Math.floor(ipCounter / 256)}.${ipCounter % 256}`
}

export async function callHandler(
  handler: Handler,
  init: {
    method?: string
    query?: Record<string, string>
    body?: unknown
    headers?: Record<string, string>
  } = {}
): Promise<{ status: number; body: any }> {
  const req = {
    method: init.method ?? 'GET',
    query: init.query ?? {},
    body: init.body,
    headers: { 'x-forwarded-for': uniqueIp(), ...init.headers },
  } as unknown as VercelRequest

  const result = { status: 200, body: undefined as any }
  const res = {
    status(code: number) {
      result.status = code
      return res
    },
    json(payload: unknown) {
      result.body = payload
      return res
    },
  } as unknown as VercelResponse

  await handler(req, res)
  return result
}
