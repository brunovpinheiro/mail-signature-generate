import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, AlertCircle, ShieldCheck } from "lucide-react";
import { getApprovalToken, postApprovalDecision } from "@/lib/api";
import { getTemplateById, DEFAULT_TEMPLATE_ID } from "@/lib/templates";
import { getCompanyByDomain } from "@/lib/company-domains";
import type { ApprovalTokenResponse } from "@/types/approval";
import type { SignatureData } from "@/types/signature";

export function ApprovalPage() {
	const { token } = useParams<{ token: string }>();
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState<ApprovalTokenResponse | null>(null);
	const [fetchError, setFetchError] = useState<string | null>(null);

	const [action, setAction] = useState<"approve" | "reject" | null>(null);
	const [reason, setReason] = useState("");
	const [reasonError, setReasonError] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [done, setDone] = useState<"approve" | "reject" | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);

	useEffect(() => {
		if (!token) return;
		getApprovalToken(token)
			.then(setData)
			.catch((err: Error) => setFetchError(err.message))
			.finally(() => setLoading(false));
	}, [token]);

	async function handleDecision() {
		if (!action || !token) return;
		if (action === "reject" && !reason.trim()) {
			setReasonError(true);
			return;
		}
		setSubmitting(true);
		setSubmitError(null);
		try {
			await postApprovalDecision(token, action, reason.trim() || undefined);
			setDone(action);
		} catch (err) {
			setSubmitError((err as Error).message);
		} finally {
			setSubmitting(false);
		}
	}

	// ── Loading ───────────────────────────────────────────────────────────────
	if (loading) {
		return (
			<PageShell>
				<div className="flex items-center gap-2 text-muted-foreground">
					<Loader2 className="h-5 w-5 animate-spin" /> Carregando…
				</div>
			</PageShell>
		);
	}

	// ── Erro de fetch ─────────────────────────────────────────────────────────
	if (fetchError || !data) {
		return (
			<PageShell>
				<Card className="max-w-lg w-full">
					<CardContent className="pt-6 space-y-4 text-center">
						<AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
						<h2 className="text-lg font-semibold text-red-600">Link inválido ou expirado</h2>
						<p className="text-sm text-muted-foreground">{fetchError ?? "Este link de aprovação não é válido."}</p>
					</CardContent>
				</Card>
			</PageShell>
		);
	}

	// ── Já decidido ───────────────────────────────────────────────────────────
	if (data.alreadyDecided) {
		const label = data.status === "approved" ? "aprovada" : data.status === "rejected" ? "reprovada" : "expirada";
		return (
			<PageShell>
				<Card className="max-w-lg w-full">
					<CardContent className="pt-6 space-y-4 text-center">
						<ShieldCheck className="h-12 w-12 text-[#0b2a5b] mx-auto" />
						<h2 className="text-lg font-semibold">Solicitação já processada</h2>
						<p className="text-sm text-muted-foreground">
							Esta solicitação já foi <strong>{label}</strong> por outro gestor.
							<br />
							Seu link foi invalidado automaticamente.
						</p>
					</CardContent>
				</Card>
			</PageShell>
		);
	}

	// ── Após decisão ──────────────────────────────────────────────────────────
	if (done) {
		return (
			<PageShell>
				<Card className="max-w-lg w-full">
					<CardContent className="pt-6 space-y-4 text-center">
						{done === "approve" ? <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" /> : <XCircle className="h-12 w-12 text-red-500 mx-auto" />}
						<h2 className="text-lg font-semibold">{done === "approve" ? "Assinatura aprovada!" : "Solicitação reprovada"}</h2>
						<p className="text-sm text-muted-foreground">
							O solicitante foi notificado por e-mail.
							<br />
							Você pode fechar esta página.
						</p>
					</CardContent>
				</Card>
			</PageShell>
		);
	}

	// ── Tela principal de aprovação ────────────────────────────────────────────
	const { requestData, managerEmailMasked } = data;
	const company = getCompanyByDomain(requestData.companyDomain);
	const template = getTemplateById(company?.templateId ?? DEFAULT_TEMPLATE_ID);
	const logoUrl = company?.logoUrl;
	const accentColor = company?.accentColor;
	const typeLabel = requestData.type === "single" ? "Individual" : `Em Massa (${requestData.signatureItems.length} assinaturas)`;

	return (
		<PageShell>
			<div className="w-full max-w-2xl space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<ShieldCheck className="h-5 w-5 text-[#0b2a5b]" />
							Aprovação de Assinatura
						</CardTitle>
						<p className="text-sm text-muted-foreground">
							Você está aprovando como <strong>{managerEmailMasked}</strong>
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
							<p>
								<span className="text-muted-foreground">Solicitante:</span> <strong>{requestData.requesterName}</strong>
							</p>
							<p>
								<span className="text-muted-foreground">Tipo:</span> {typeLabel}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Previews das assinaturas */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Preview da(s) Assinatura(s)</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{requestData.signatureItems.map((item: SignatureData, i: number) => (
							<div key={i} className="rounded-md border bg-white p-4">
								{requestData.type === "bulk" && <p className="text-xs text-muted-foreground mb-2 font-medium">{item.name}</p>}
								{template && <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: template.render(item, logoUrl, accentColor) }} />}
							</div>
						))}
					</CardContent>
				</Card>

				{/* Botões de decisão */}
				<Card>
					<CardContent className="pt-6 space-y-4">
						{submitError && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">{submitError}</div>}

						{action === "reject" && (
							<div className="space-y-2">
								<label className="text-sm font-medium">
									Justificativa da reprovação <span className="text-red-500">*</span>
								</label>
								<textarea
									className={`w-full rounded-md border px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring ${reasonError ? "border-red-500" : ""}`}
									placeholder="Descreva o motivo da reprovação…"
									value={reason}
									onChange={(e) => {
										setReason(e.target.value);
										setReasonError(false);
									}}
								/>
								{reasonError && <p className="text-sm text-red-500">Justificativa obrigatória.</p>}
							</div>
						)}

						<div className="flex gap-3">
							{action !== "reject" && (
								<Button
									className="flex-1 bg-green-600 hover:bg-green-700"
									size="lg"
									onClick={() => {
										if (action === "approve") handleDecision();
										else setAction("approve");
									}}
									disabled={submitting}
								>
									{submitting && action === "approve" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
									{action === "approve" ? "Confirmar Aprovação" : "Aprovar"}
								</Button>
							)}

							{action !== "approve" && (
								<Button
									variant={action === "reject" ? "default" : "outline"}
									className={action === "reject" ? "flex-1 bg-red-600 hover:bg-red-700" : "flex-1"}
									size="lg"
									onClick={() => {
										if (action === "reject") handleDecision();
										else setAction("reject");
									}}
									disabled={submitting}
								>
									{submitting && action === "reject" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
									{action === "reject" ? "Confirmar Reprovação" : "Reprovar"}
								</Button>
							)}

							{action !== null && (
								<Button
									variant="ghost"
									size="lg"
									onClick={() => {
										setAction(null);
										setReason("");
										setReasonError(false);
									}}
									disabled={submitting}
								>
									Cancelar
								</Button>
							)}
						</div>

						{action === "approve" && <p className="text-xs text-center text-muted-foreground">Clique em "Confirmar Aprovação" para aprovar a assinatura.</p>}
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
				<div className="container mx-auto flex items-center justify-between px-4 py-5">
					<img src="/logo-navbar.png" alt="Logo" className="h-8" />
					<span className="text-base font-normal">Gerador de Assinaturas</span>
				</div>
			</header>
			<main className="flex-1 flex items-center justify-center px-4 py-8">{children}</main>
		</div>
	);
}
