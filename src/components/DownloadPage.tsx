import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { getDownloadRequest } from "@/lib/api";
import { getTemplateById, DEFAULT_TEMPLATE_ID } from "@/lib/templates";
import { renderHtmlToImage } from "@/lib/image-utils";
import { downloadDataUrl, downloadImagesAsZip, sanitizeFilename } from "@/lib/export-utils";
import { toast } from "sonner";
import type { DownloadRequestData } from "@/types/approval";
import type { SignatureData } from "@/types/signature";

export function DownloadPage() {
	const { requestId } = useParams<{ requestId: string }>();
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState<DownloadRequestData | null>(null);
	const [fetchError, setFetchError] = useState<string | null>(null);
	const [generating, setGenerating] = useState(false);

	useEffect(() => {
		if (!requestId) return;
		getDownloadRequest(requestId)
			.then(setData)
			.catch((err: Error) => setFetchError(err.message))
			.finally(() => setLoading(false));
	}, [requestId]);

	const handleDownload = useCallback(async () => {
		if (!data?.signatureItems) return;
		const template = getTemplateById(DEFAULT_TEMPLATE_ID);
		if (!template) return;

		setGenerating(true);
		try {
			if (data.type === "single") {
				const item = data.signatureItems[0];
				const html = template.render(item);
				const dataUrl = await renderHtmlToImage(html, { width: 540, format: "png" });
				const filename = `${sanitizeFilename(item.name || "assinatura")}.png`;
				downloadDataUrl(dataUrl, filename);
				toast.success("Download iniciado!");
			} else {
				// Gerar e zipar em massa
				const images = [];
				for (let i = 0; i < data.signatureItems.length; i++) {
					const item = data.signatureItems[i];
					const html = template.render(item);
					const dataUrl = await renderHtmlToImage(html, { width: 540, format: "png" });
					images.push({ name: item.name, dataUrl, index: i });
				}
				await downloadImagesAsZip(images, "png");
				toast.success("Download do ZIP iniciado!");
			}
		} catch {
			toast.error("Erro ao gerar imagem. Tente novamente.");
		} finally {
			setGenerating(false);
		}
	}, [data]);

	if (loading) {
		return (
			<PageShell>
				<div className="flex items-center gap-2 text-muted-foreground">
					<Loader2 className="h-5 w-5 animate-spin" /> Carregando…
				</div>
			</PageShell>
		);
	}

	if (fetchError || !data) {
		return (
			<PageShell>
				<Card className="max-w-lg w-full">
					<CardContent className="pt-6 space-y-4 text-center">
						<AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
						<h2 className="text-lg font-semibold">Solicitação não encontrada</h2>
						<p className="text-sm text-muted-foreground">{fetchError}</p>
					</CardContent>
				</Card>
			</PageShell>
		);
	}

	if (data.status === "awaiting_approval") {
		return (
			<PageShell>
				<Card className="max-w-lg w-full">
					<CardContent className="pt-6 space-y-4 text-center">
						<Clock className="h-12 w-12 text-yellow-500 mx-auto" />
						<h2 className="text-lg font-semibold">Aguardando aprovação</h2>
						<p className="text-sm text-muted-foreground">Sua solicitação ainda está em análise. Você receberá um e-mail quando houver uma decisão.</p>
					</CardContent>
				</Card>
			</PageShell>
		);
	}

	if (data.status === "rejected" || data.status === "expired") {
		const label = data.status === "rejected" ? "reprovada" : "expirada";
		return (
			<PageShell>
				<Card className="max-w-lg w-full">
					<CardContent className="pt-6 space-y-4 text-center">
						<AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
						<h2 className="text-lg font-semibold">Solicitação {label}</h2>
						<p className="text-sm text-muted-foreground">Esta solicitação foi {label}. Acesse a página principal para fazer uma nova solicitação.</p>
						<Button variant="outline" onClick={() => (window.location.href = "/")}>
							Fazer nova solicitação
						</Button>
					</CardContent>
				</Card>
			</PageShell>
		);
	}

	// status === 'approved'
	const template = getTemplateById(DEFAULT_TEMPLATE_ID);
	const typeLabel = data.type === "single" ? "individual" : `em massa (${data.signatureItems!.length} assinaturas)`;

	return (
		<PageShell>
			<div className="w-full max-w-2xl space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<CheckCircle2 className="h-5 w-5 text-green-600" />
							Assinatura Aprovada
						</CardTitle>
						<p className="text-sm text-muted-foreground">Solicitação {typeLabel} aprovada. Clique em "Baixar" para gerar e fazer o download.</p>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Preview(s) */}
						{data.signatureItems!.map((item: SignatureData, i: number) => (
							<div key={i} className="rounded-md border bg-white p-4">
								{data.type === "bulk" && <p className="text-xs text-muted-foreground mb-2 font-medium">{item.name}</p>}
								{template && <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: template.render(item) }} />}
							</div>
						))}

						<Button onClick={handleDownload} disabled={generating} className="w-full bg-[#0b2a5b] text-white hover:bg-[#0b2a5b]/90" size="lg">
							{generating ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando…
								</>
							) : (
								<>
									<Download className="mr-2 h-4 w-4" /> {data.type === "bulk" ? "Baixar ZIP com todas as assinaturas" : "Baixar Assinatura (PNG)"}
								</>
							)}
						</Button>
					</CardContent>
				</Card>
			</div>
		</PageShell>
	);
}

function PageShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<header className="border-b bg-[#0b2a5b] text-white">
				<div className="container mx-auto flex items-center justify-center px-4 py-4">
					<h1 className="text-xl font-bold">Tacla Shopping - Gerador de Assinaturas</h1>
				</div>
			</header>
			<main className="flex-1 flex items-center justify-center px-4 py-8">{children}</main>
		</div>
	);
}
