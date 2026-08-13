import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, AlertCircle, Clock, CheckCircle2, XCircle, Inbox, RefreshCw } from "lucide-react";
import { listMyRequests, getDownloadRequest } from "@/lib/api";
import { downloadSignatureRequest } from "@/lib/signature-download";
import { toast } from "sonner";
import type { MyRequestSummary, RequestStatus } from "@/types/approval";

function formatDate(iso: string): string {
	return new Date(iso).toLocaleString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

const STATUS_META: Record<RequestStatus, { label: string; className: string; Icon: typeof Clock }> = {
	awaiting_approval: { label: "Aguardando aprovação", className: "bg-yellow-100 text-yellow-800", Icon: Clock },
	approved: { label: "Aprovada", className: "bg-green-100 text-green-800", Icon: CheckCircle2 },
	rejected: { label: "Reprovada", className: "bg-red-100 text-red-800", Icon: XCircle },
	expired: { label: "Expirada", className: "bg-muted text-muted-foreground", Icon: AlertCircle },
};

function StatusBadge({ status }: { status: RequestStatus }) {
	const { label, className, Icon } = STATUS_META[status];
	return (
		<span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
			<Icon className="h-3.5 w-3.5" />
			{label}
		</span>
	);
}

export function MyRequestsPanel({ email }: { email: string }) {
	const [requests, setRequests] = useState<MyRequestSummary[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [downloadingId, setDownloadingId] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			setRequests(await listMyRequests(email));
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setLoading(false);
		}
	}, [email]);

	useEffect(() => {
		void load();
	}, [load]);

	// Busca os dados da assinatura sob demanda — a listagem não os carrega.
	const handleDownload = useCallback(async (id: string) => {
		setDownloadingId(id);
		try {
			const data = await getDownloadRequest(id);
			if (!data.signatureItems?.length) {
				toast.error("Esta solicitação não está disponível para download.");
				return;
			}
			await downloadSignatureRequest(data);
			toast.success(data.type === "bulk" ? "Download do ZIP iniciado!" : "Download iniciado!");
		} catch (err) {
			toast.error((err as Error).message ?? "Erro ao gerar a assinatura.");
		} finally {
			setDownloadingId(null);
		}
	}, []);

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
				<div className="space-y-1">
					<CardTitle className="text-lg text-[#0b2a5b]">Minhas solicitações</CardTitle>
					<p className="text-sm text-muted-foreground">
						Solicitações enviadas por <strong>{email}</strong>. As aprovadas podem ser baixadas aqui a qualquer momento.
					</p>
				</div>
				<Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
					<RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
					Atualizar
				</Button>
			</CardHeader>

			<CardContent>
				{loading && (
					<div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
						<Loader2 className="h-4 w-4 animate-spin" /> Carregando…
					</div>
				)}

				{!loading && error && (
					<div className="space-y-3 py-8 text-center">
						<AlertCircle className="mx-auto h-10 w-10 text-red-500" />
						<p className="text-sm text-muted-foreground">{error}</p>
						<Button variant="outline" size="sm" onClick={() => void load()}>
							Tentar novamente
						</Button>
					</div>
				)}

				{!loading && !error && requests?.length === 0 && (
					<div className="space-y-2 py-10 text-center">
						<Inbox className="mx-auto h-10 w-10 text-muted-foreground/60" />
						<p className="text-sm text-muted-foreground">Nenhuma solicitação encontrada para este e-mail.</p>
					</div>
				)}

				{!loading && !error && requests && requests.length > 0 && (
					<ul className="divide-y">
						{requests.map((r) => (
							<li key={r.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
								<div className="min-w-0 space-y-1.5">
									<div className="flex flex-wrap items-center gap-2">
										<StatusBadge status={r.status} />
										<span className="text-sm font-medium">
											{r.type === "single" ? "Individual" : `Em massa (${r.itemCount} assinaturas)`}
										</span>
									</div>
									<p className="text-xs text-muted-foreground">
										Enviada em {formatDate(r.createdAt)}
										{r.decidedAt && ` · decidida em ${formatDate(r.decidedAt)}`}
									</p>
									{r.decisionReason && (
										<p className="rounded border-l-2 border-red-400 bg-red-50 px-2 py-1.5 text-xs text-red-900">
											<span className="font-medium">Motivo:</span> {r.decisionReason}
										</p>
									)}
								</div>

								{r.status === "approved" && (
									<Button
										onClick={() => void handleDownload(r.id)}
										disabled={downloadingId !== null}
										className="shrink-0 bg-[#0b2a5b] text-white hover:bg-[#0b2a5b]/90"
										size="sm"
									>
										{downloadingId === r.id ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando…
											</>
										) : (
											<>
												<Download className="mr-2 h-4 w-4" /> {r.type === "bulk" ? "Baixar ZIP" : "Baixar"}
											</>
										)}
									</Button>
								)}
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
