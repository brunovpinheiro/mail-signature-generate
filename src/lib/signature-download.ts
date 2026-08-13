import { getTemplateById, DEFAULT_TEMPLATE_ID } from "@/lib/templates";
import { getCompanyByDomain } from "@/lib/company-domains";
import { renderHtmlToImage } from "@/lib/image-utils";
import { downloadDataUrl, downloadImagesAsZip, sanitizeFilename } from "@/lib/export-utils";
import type { RequestType } from "@/types/approval";
import type { SignatureData } from "@/types/signature";

interface DownloadableRequest {
	type: RequestType;
	companyDomain?: string | null;
	signatureItems: SignatureData[] | null;
}

/**
 * Gera as imagens da assinatura e dispara o download — PNG para solicitações
 * individuais, ZIP para as em massa.
 *
 * Compartilhado entre a página /download/:requestId e a aba
 * "Minhas solicitações", para que ambas produzam exatamente o mesmo arquivo.
 */
export async function downloadSignatureRequest(data: DownloadableRequest): Promise<void> {
	if (!data.signatureItems?.length) return;

	const company = getCompanyByDomain(data.companyDomain ?? "");
	const template = getTemplateById(company?.templateId ?? DEFAULT_TEMPLATE_ID);
	if (!template) throw new Error("Template não encontrado.");

	const logoUrl = company?.logoUrl;
	const accentColor = company?.accentColor;
	const adminLogo = company?.adminLogo;
	const width = template.defaultWidth;

	if (data.type === "single") {
		const item = data.signatureItems[0];
		const html = template.render(item, logoUrl, accentColor, adminLogo);
		const dataUrl = await renderHtmlToImage(html, { width, format: "png" });
		downloadDataUrl(dataUrl, `${sanitizeFilename(item.name || "assinatura")}.png`);
		return;
	}

	const images = [];
	for (let i = 0; i < data.signatureItems.length; i++) {
		const item = data.signatureItems[i];
		const html = template.render(item, logoUrl, accentColor, adminLogo);
		const dataUrl = await renderHtmlToImage(html, { width, format: "png" });
		images.push({ name: item.name, dataUrl, index: i });
	}
	await downloadImagesAsZip(images, "png");
}
