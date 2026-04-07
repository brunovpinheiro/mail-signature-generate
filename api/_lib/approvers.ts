import { readFileSync } from 'node:fs'
import { join } from 'node:path'

let cache: string[] | null = null

export function getApprovers(): string[] {
  if (cache) return cache

  // Variável de ambiente tem precedência (recomendado no Vercel)
  const envVar = process.env.APPROVERS_LIST
  if (envVar) {
    cache = envVar
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    return cache
  }

  // Fallback: arquivo JSON (funciona em desenvolvimento)
  try {
    const configPath = join(process.cwd(), 'config', 'approvers.json')
    const config = JSON.parse(readFileSync(configPath, 'utf-8')) as {
      approvers: string[]
    }
    cache = config.approvers.map((e) => e.toLowerCase())
    return cache
  } catch {
    console.error('[approvers] Failed to load approvers.json')
    return []
  }
}

export function isApprover(email: string): boolean {
  return getApprovers().includes(email.toLowerCase())
}
