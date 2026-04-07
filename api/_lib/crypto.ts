import { randomBytes, createHash } from 'node:crypto'

/** Gera token de 256 bits (32 bytes → 64 hex chars). Nunca previsível. */
export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

/** SHA-256 dos dados da assinatura para garantir integridade pós-submissão. */
export function hashSignatureItems(items: unknown[]): string {
  return createHash('sha256')
    .update(JSON.stringify(items))
    .digest('hex')
}
