import { useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BulkPreviewGrid } from "./BulkPreviewGrid";
import { useBulkGenerator } from "@/hooks/useBulkGenerator";
import { DEFAULT_TEMPLATE_ID, getTemplateById } from "@/lib/templates";
import { submitRequest } from "@/lib/api";
import { useRequester } from "@/context/RequesterContext";
import { Upload, FileDown, Loader2, Trash2, AlertCircle, Send, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";

export function BulkGenerator() {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { requester } = useRequester();
	const { items, errors, isProcessing, handleParseCSV, clearItems } = useBulkGenerator();

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				handleParseCSV(file);
				setSubmitted(false);
			}
		},
		[handleParseCSV],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			const file = e.dataTransfer.files[0];
			if (file && file.name.endsWith(".csv")) {
				handleParseCSV(file);
				setSubmitted(false);
			}
		},
		[handleParseCSV],
	);

	const handleSubmitForApproval = useCallback(async () => {
		if (!requester || items.length === 0) return;
		setIsSubmitting(true);
		try {
			await submitRequest({
				requesterName: requester.name,
				requesterEmail: requester.email,
				type: "bulk",
				signatureItems: items.map((i) => i.data),
			});
			setSubmitted(true);
		} catch (err) {
			toast.error((err as Error).message ?? "Erro ao enviar solicitação.");
		} finally {
			setIsSubmitting(false);
		}
	}, [requester, items]);

	const template = getTemplateById(DEFAULT_TEMPLATE_ID);

	// ── Confirmação pós-envio ─────────────────────────────────────────────────
	if (submitted) {
		return (
			<div className="space-y-6">
				<Card>
					<CardContent className="pt-8 pb-8 space-y-4 text-center">
						<CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
						<h2 className="text-xl font-semibold text-[#0b2a5b]">Solicitação enviada!</h2>
						<p className="text-sm text-muted-foreground">As {items.length} assinaturas foram enviadas para aprovação dos gestores. Você receberá um e-mail com o resultado assim que a decisão for tomada.</p>
						<div className="flex items-center justify-center gap-2 rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
							<Mail className="h-4 w-4 shrink-0" />
							Fique de olho no seu e-mail!
						</div>
						<Button
							variant="outline"
							onClick={() => {
								setSubmitted(false);
								clearItems();
							}}
						>
							Enviar novo lote
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// ── Upload + configuração ──────────────────────────────────────────────────
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Geração em Massa</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Upload Area */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label>Arquivo CSV</Label>
							<a href="/csv-template.csv" download className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
								<FileDown className="h-3 w-3" />
								Baixar template CSV
							</a>
						</div>
						<div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 cursor-pointer hover:border-primary/50 transition-colors">
							<Upload className="h-8 w-8 text-muted-foreground" />
							<p className="text-sm text-muted-foreground">Arraste um arquivo CSV ou clique para selecionar</p>
							<input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
						</div>
					</div>

					{/* Errors */}
					{errors.length > 0 && (
						<div className="rounded-md bg-destructive/10 p-3 space-y-1">
							{errors.map((error, i) => (
								<div key={i} className="flex items-start gap-2 text-sm text-destructive">
									<AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
									<span>{error}</span>
								</div>
							))}
						</div>
					)}

					{/* Items loaded */}
					{items.length > 0 && (
						<>
							<Separator />

							<BulkPreviewGrid items={items} template={template} />

							{/* Actions */}
							<div className="space-y-3">
								<div className="flex gap-3">
									<Button onClick={handleSubmitForApproval} disabled={isProcessing || isSubmitting} className="flex-1 bg-[#0b2a5b] text-white hover:bg-[#0b2a5b]/90" size="lg">
										{isSubmitting ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Enviando…
											</>
										) : (
											<>
												<Send className="mr-2 h-4 w-4" />
												Enviar para Aprovação ({items.length} assinaturas)
											</>
										)}
									</Button>
									<Button variant="outline" onClick={clearItems} disabled={isProcessing || isSubmitting}>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
								<p className="text-xs text-center text-muted-foreground">
									As assinaturas serão enviadas para aprovação dos gestores.
									<br />
									Você receberá o download por e-mail após a aprovação.
								</p>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
