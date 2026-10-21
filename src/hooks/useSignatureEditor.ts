import { useState, useEffect, useMemo } from "react";
import type { SignatureData } from "@/types/signature";
import { DEFAULT_TEMPLATE_ID, getTemplateById } from "@/lib/templates";

interface UseSignatureEditorOptions {
	templateId?: string;
	logoUrl?: string;
	defaultWebsite?: string;
	accentColor?: string;
	adminLogo?: { url: string; width: number; height: number };
}

interface UseSignatureEditorReturn {
	signatureData: SignatureData;
	setSignatureData: (data: Partial<SignatureData>) => void;
	/** Substitui todo o conteúdo do editor — ex.: ao gerar uma nova a partir de uma assinatura existente. */
	loadSignatureData: (data: SignatureData) => void;
	generatedHtml: string;
	isValid: boolean;
}

export function useSignatureEditor(options: UseSignatureEditorOptions = {}): UseSignatureEditorReturn {
	const { templateId = DEFAULT_TEMPLATE_ID, logoUrl, defaultWebsite = "https://taclashopping.com.br", accentColor, adminLogo } = options;

	const [signatureData, setSignatureDataState] = useState<SignatureData>(() => ({
		name: "",
		jobTitle: "",
		website: defaultWebsite,
	}));
	const [generatedHtml, setGeneratedHtml] = useState("");

	// Quando a empresa mudar, atualiza o website padrão se o campo ainda não foi editado pelo usuário
	useEffect(() => {
		setSignatureDataState((prev) => {
			const isStillDefault = prev.website === "" || COMPANY_WEBSITES.has(prev.website ?? "");
			if (isStillDefault) return { ...prev, website: defaultWebsite };
			return prev;
		});
	}, [defaultWebsite]);

	const setSignatureData = (data: Partial<SignatureData>) => {
		setSignatureDataState((prev) => ({ ...prev, ...data }));
	};

	// Itens de planilha costumam vir sem website; o padrão da empresa entra no lugar
	// (e acompanha a troca de empresa, pelo efeito acima).
	const loadSignatureData = (data: SignatureData) => {
		setSignatureDataState({ ...data, website: data.website || defaultWebsite });
	};

	const isValid = useMemo(() => {
		return signatureData.name.trim().length > 0 && signatureData.jobTitle.trim().length > 0;
	}, [signatureData]);

	useEffect(() => {
		if (!isValid) {
			setGeneratedHtml("");
			return;
		}
		const template = getTemplateById(templateId);
		if (template) {
			setGeneratedHtml(template.render(signatureData, logoUrl, accentColor, adminLogo));
		}
	}, [signatureData, isValid, templateId, logoUrl, accentColor, adminLogo]);

	return {
		signatureData,
		setSignatureData,
		loadSignatureData,
		generatedHtml,
		isValid,
	};
}

// Conjunto de websites padrão das empresas — se o usuário não editou, o campo
// acompanha automaticamente a empresa selecionada.
const COMPANY_WEBSITES = new Set(["https://taclashopping.com.br", "https://palladiumcuritiba.com.br", "https://palladiumumuarama.com.br", "https://palladiumpontagrossa.com.br", "https://catuaipalladium.com.br", "https://itajaishopping.com.br", "https://outletportobelo.com.br", "https://citycenteroutlet.com.br", "https://venturashopping.com.br", "https://shoppingestacao.com.br", "https://jockeyplaza.com.br", "https://shoppingcidadesorocaba.com.br", "https://plazacamposgerais.com.br", "https://shoppingpalladium.com.br"]);
