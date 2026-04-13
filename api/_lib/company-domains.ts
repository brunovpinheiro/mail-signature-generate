/**
 * Versão backend do mapeamento de empresas.
 * Deve permanecer sincronizada com src/lib/company-domains.ts.
 */
const COMPANY_NAMES: Record<string, string> = {
  'taclashopping.com.br':          'Tacla Shopping',
  'palladiumcuritiba.com.br':       'Palladium Curitiba',
  'palladiumumuarama.com.br':       'Palladium Umuarama',
  'palladiumpontagrossa.com.br':    'Palladium Ponta Grossa',
  'catuaipalladium.com.br':         'Catuaí Palladium',
  'itajaishopping.com.br':          'Itajaí Shopping',
  'outletportobelo.com.br':         'Outlet Porto Belo',
  'citycenteroutlet.com.br':        'City Center Outlet',
  'venturashopping.com.br':         'Ventura Shopping',
  'shoppingestacao.com.br':         'Shopping Estação',
  'jockeyplaza.com.br':             'Jockey Plaza',
  'shoppingcidadesorocaba.com.br':  'Shopping Cidade Sorocaba',
  'plazacamposgerais.com.br':       'Plaza Campos Gerais',
}

export function getCompanyNameByEmail(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  return COMPANY_NAMES[domain] ?? 'Tacla Shopping'
}

export function getCompanyNameByDomain(domain: string): string {
  return COMPANY_NAMES[domain.toLowerCase()] ?? domain
}
