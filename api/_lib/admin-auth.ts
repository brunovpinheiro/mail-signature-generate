import { createHmac, timingSafeEqual } from 'node:crypto'

const SESSION_HOURS = 8

function b64url(str: string): string {
  return Buffer.from(str).toString('base64url')
}

function parseB64url(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf-8')
}

function getSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET ?? process.env.ADMIN_PASSWORD
  if (!secret) throw new Error('ADMIN_JWT_SECRET env var not set')
  return secret
}

interface TokenPayload {
  email: string
  domain: string
  iat: number
  exp: number
}

/** Gera um token de sessão HMAC-SHA256 para o gestor. */
export function signAdminToken(email: string, domain: string): string {
  const now = Math.floor(Date.now() / 1000)
  const payload: TokenPayload = {
    email: email.toLowerCase(),
    domain: domain.toLowerCase(),
    iat: now,
    exp: now + SESSION_HOURS * 3600,
  }
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64url(JSON.stringify(payload))
  const signature = createHmac('sha256', getSecret()).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${signature}`
}

/** Verifica e decodifica um token de sessão. Lança erro se inválido/expirado. */
export function verifyAdminToken(token: string): TokenPayload {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Token malformado')
  const [header, body, signature] = parts

  const expectedSig = createHmac('sha256', getSecret()).update(`${header}.${body}`).digest('base64url')

  // Comparação segura contra timing attacks
  const sigBuf = Buffer.from(signature, 'base64url')
  const expBuf = Buffer.from(expectedSig, 'base64url')
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    throw new Error('Assinatura inválida')
  }

  const payload = JSON.parse(parseB64url(body)) as TokenPayload
  if (Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('Sessão expirada')
  }

  return payload
}

/** Extrai e valida o token do header Authorization: Bearer <token> */
export function extractAdminToken(authHeader: string | undefined): TokenPayload {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Token de autenticação ausente')
  }
  return verifyAdminToken(authHeader.slice(7))
}
