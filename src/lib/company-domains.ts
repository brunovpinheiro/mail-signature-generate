export interface CompanyConfig {
	domain: string;
	name: string;
	/**
	 * ID do template a usar: 'default' (Tacla azul) ou 'shopping' (cinza + banner)
	 */
	templateId: string;
	/** Caminho para o logo usado na assinatura (relativo à raiz pública) */
	logoUrl: string;
	/** URL padrão pré-preenchida no campo "Website" do editor */
	defaultWebsite: string;
}

/**
 * Empreendimentos do grupo Tacla Shopping.
 *
 * Logos das sub-empresas estão em public/logos/.
 * Tacla Shopping usa o logo principal em /mail-logo.png.
 */
export const COMPANY_DOMAINS: CompanyConfig[] = [
	{
		domain: "taclashopping.com.br",
		name: "Tacla Shopping",
		templateId: "default",
		logoUrl: "/mail-logo.png",
		defaultWebsite: "https://taclashopping.com.br",
	},
	{
		domain: "palladiumcuritiba.com.br",
		name: "Palladium Curitiba",
		templateId: "shopping",
		logoUrl: "/logos/palladium-curitiba.png",
		defaultWebsite: "https://palladiumcuritiba.com.br",
	},
	{
		domain: "palladiumumuarama.com.br",
		name: "Palladium Umuarama",
		templateId: "shopping",
		logoUrl: "/logos/palladium-umuarama.png",
		defaultWebsite: "https://palladiumumuarama.com.br",
	},
	{
		domain: "palladiumpontagrossa.com.br",
		name: "Palladium Ponta Grossa",
		templateId: "shopping",
		logoUrl: "/logos/palladium-pontagrossa.png",
		defaultWebsite: "https://palladiumpontagrossa.com.br",
	},
	{
		domain: "catuaipalladium.com.br",
		name: "Catuaí Palladium",
		templateId: "shopping",
		logoUrl: "/logos/catuai-palladium.png",
		defaultWebsite: "https://catuaipalladium.com.br",
	},
	{
		domain: "itajaishopping.com.br",
		name: "Itajaí Shopping",
		templateId: "shopping",
		logoUrl: "/logos/itajai-shopping.png",
		defaultWebsite: "https://itajaishopping.com.br",
	},
	{
		domain: "outletportobelo.com.br",
		name: "Outlet Porto Belo",
		templateId: "shopping",
		logoUrl: "/logos/porto-belo.png",
		defaultWebsite: "https://outletportobelo.com.br",
	},
	{
		domain: "citycenteroutlet.com.br",
		name: "City Center Outlet",
		templateId: "shopping",
		logoUrl: "/logos/city-center.png",
		defaultWebsite: "https://citycenteroutlet.com.br",
	},
	{
		domain: "venturashopping.com.br",
		name: "Ventura Shopping",
		templateId: "shopping",
		logoUrl: "/logos/ventura.png",
		defaultWebsite: "https://venturashopping.com.br",
	},
	{
		domain: "shoppingestacao.com.br",
		name: "Shopping Estação",
		templateId: "shopping",
		logoUrl: "/logos/estacao.png",
		defaultWebsite: "https://shoppingestacao.com.br",
	},
	{
		domain: "jockeyplaza.com.br",
		name: "Jockey Plaza",
		templateId: "shopping",
		logoUrl: "/logos/jockey-plaza.png",
		defaultWebsite: "https://jockeyplaza.com.br",
	},
	{
		domain: "shoppingcidadesorocaba.com.br",
		name: "Shopping Cidade Sorocaba",
		templateId: "shopping",
		logoUrl: "/logos/shopping-cidade.png",
		defaultWebsite: "https://shoppingcidadesorocaba.com.br",
	},
	{
		domain: "plazacamposgerais.com.br",
		name: "Plaza Campos Gerais",
		templateId: "shopping",
		logoUrl: "/logos/plaza-campos-gerais.png",
		defaultWebsite: "https://plazacamposgerais.com.br",
	},
];

/** Extrai o domínio de um endereço de e-mail. */
function extractDomain(email: string): string {
	return email.split("@")[1]?.toLowerCase() ?? "";
}

/** Retorna a empresa correspondente ao domínio do e-mail, ou null. */
export function getCompanyByEmail(email: string): CompanyConfig | null {
	const domain = extractDomain(email);
	if (!domain) return null;
	return COMPANY_DOMAINS.find((c) => c.domain === domain) ?? null;
}

/** Retorna a empresa correspondente a um domínio, ou null. */
export function getCompanyByDomain(domain: string): CompanyConfig | null {
	return COMPANY_DOMAINS.find((c) => c.domain === domain.toLowerCase()) ?? null;
}

/** Lista com todos os domínios válidos. */
export const VALID_DOMAINS = COMPANY_DOMAINS.map((c) => c.domain);
