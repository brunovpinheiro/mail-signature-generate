import { useState } from "react";
import { COMPANY_DOMAINS, getCompanyByDomain } from "@/lib/company-domains";
import { getTemplateById } from "@/lib/templates";
import { renderHtmlToImage } from "@/lib/image-utils";
import { downloadDataUrl } from "@/lib/export-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download } from "lucide-react";
import type { SignatureData } from "@/types/signature";

const DEFAULT_DATA: SignatureData = {
	name: "Bruno Pinheiro",
	jobTitle: "Gerente de Marketing",
	email: "bruno@palladiumcuritiba.com.br",
	phone: "(41) 3000-0000",
	mobile: "(41) 99999-9999",
	website: "https://palladiumcuritiba.com.br",
};

export function DevPreview() {
	const [domain, setDomain] = useState(COMPANY_DOMAINS[0].domain);
	const [data, setData] = useState<SignatureData>(DEFAULT_DATA);
	const [pngUrl, setPngUrl] = useState<string | null>(null);
	const [generating, setGenerating] = useState(false);

	const company = getCompanyByDomain(domain);
	const template = getTemplateById(company?.templateId ?? "default");
	const html = template ? template.render(data, company?.logoUrl, company?.accentColor) : "";

	async function handleGeneratePng() {
		if (!html) return;
		setGenerating(true);
		setPngUrl(null);
		try {
			const url = await renderHtmlToImage(html, { width: template?.defaultWidth ?? 660, format: "png" });
			setPngUrl(url);
		} finally {
			setGenerating(false);
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 p-8 space-y-6 max-w-3xl mx-auto">
			<div className="text-xs font-mono text-orange-600 bg-orange-50 border border-orange-200 rounded px-3 py-1 inline-block">DEV ONLY — não aparece em produção</div>
			<h1 className="text-2xl font-bold">Preview de Assinatura (Dev)</h1>

			{/* Seletor de empresa */}
			<div className="space-y-1">
				<Label>Empreendimento</Label>
				<Select
					value={domain}
					onValueChange={(v) => {
						setDomain(v);
						setPngUrl(null);
					}}
				>
					<SelectTrigger className="w-80">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{COMPANY_DOMAINS.map((c) => (
							<SelectItem key={c.domain} value={c.domain}>
								{c.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Dados da assinatura */}
			<div className="grid grid-cols-2 gap-3 bg-white border rounded-lg p-4">
				{(["name", "jobTitle", "email", "phone", "mobile", "website"] as (keyof SignatureData)[]).map((field) => (
					<div key={field} className="space-y-1">
						<Label className="text-xs text-muted-foreground">{field}</Label>
						<Input
							value={data[field] ?? ""}
							onChange={(e) => {
								setData((d) => ({ ...d, [field]: e.target.value }));
								setPngUrl(null);
							}}
						/>
					</div>
				))}
			</div>

			{/* Preview HTML */}
			<div className="space-y-1">
				<p className="text-xs font-medium text-muted-foreground">Preview HTML</p>
				<div className="bg-white border rounded-lg p-4 overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />
			</div>

			{/* Gerar PNG */}
			<Button onClick={handleGeneratePng} disabled={generating}>
				{generating ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Gerando PNG…
					</>
				) : (
					"Gerar PNG"
				)}
			</Button>

			{pngUrl && (
				<div className="space-y-3">
					<p className="text-xs font-medium text-muted-foreground">PNG Gerado</p>
					<img src={pngUrl} alt="Assinatura gerada" className="border rounded-lg shadow-sm" />
					<Button variant="outline" size="sm" onClick={() => downloadDataUrl(pngUrl, `preview-${domain}.png`)}>
						<Download className="mr-2 h-4 w-4" />
						Baixar PNG
					</Button>
				</div>
			)}
		</div>
	);
}
