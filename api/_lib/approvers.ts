type CompanyApproversMap = Record<string, string[]>

let companyCache: CompanyApproversMap | null = null

/**
 * Retorna o mapa completo de aprovadores por domínio de empresa.
 * Fonte exclusiva: variável de ambiente COMPANY_APPROVERS (JSON string).
 *
 * Formato esperado:
 * {
 *   "taclashopping.com.br": ["gestor@taclashopping.com.br"],
 *   "palladiumcuritiba.com.br": ["gestor@palladiumcuritiba.com.br"]
 * }
 */
export function getCompanyApprovers(): CompanyApproversMap {
  if (companyCache) return companyCache

  const envVar = process.env.COMPANY_APPROVERS
  if (!envVar) {
    console.error('[approvers] COMPANY_APPROVERS env var not set')
    return {}
  }

  try {
    const parsed = JSON.parse(envVar) as CompanyApproversMap
    companyCache = {}
    for (const domain of Object.keys(parsed)) {
      companyCache[domain.toLowerCase()] = parsed[domain].map((e) => e.trim().toLowerCase())
    }
    return companyCache
  } catch {
    console.error('[approvers] Failed to parse COMPANY_APPROVERS — invalid JSON')
    return {}
  }
}

/** Retorna os aprovadores da empresa do solicitante (pelo domínio do e-mail). */
export function getApproversForRequester(requesterEmail: string): string[] {
  const domain = requesterEmail.split('@')[1]?.toLowerCase()
  if (!domain) return []
  return getCompanyApprovers()[domain] ?? []
}

/** Retorna os aprovadores de um domínio específico. */
export function getApproversForDomain(domain: string): string[] {
  return getCompanyApprovers()[domain.toLowerCase()] ?? []
}

/** Verifica se um e-mail é aprovador de qualquer empresa. */
export function isApprover(email: string): boolean {
  const normalized = email.toLowerCase()
  return Object.values(getCompanyApprovers()).some((list) => list.includes(normalized))
}

/**
 * Retorna o domínio da empresa que o gestor representa,
 * ou null se o e-mail não estiver cadastrado.
 */
export function getManagerDomain(managerEmail: string): string | null {
  const normalized = managerEmail.toLowerCase()
  for (const [domain, list] of Object.entries(getCompanyApprovers())) {
    if (list.includes(normalized)) return domain
  }
  return null
}
