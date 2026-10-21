import type { SignatureItem } from './types.js'

/** Forma canônica de e-mail usada na gravação e nas buscas: sem espaços nas pontas e em minúsculas. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Itens da assinatura cujo e-mail é o informado (já normalizado). */
export function itemsForEmail(items: SignatureItem[] | null | undefined, email: string): SignatureItem[] {
  if (!Array.isArray(items)) return []
  return items.filter((item) => typeof item.email === 'string' && normalizeEmail(item.email) === email)
}

/**
 * Itens prontos para gravar: e-mails normalizados, para que a busca por
 * contenção JSONB em "Minhas solicitações" encontre a pessoa.
 */
export function normalizeSignatureItems(items: SignatureItem[]): SignatureItem[] {
  return items.map((item) =>
    typeof item.email === 'string' ? { ...item, email: normalizeEmail(item.email) } : item
  )
}
