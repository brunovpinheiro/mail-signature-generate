import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle } from "lucide-react";

/**
 * Motivos prontos de reprovação. Cobrem os casos recorrentes para que o gestor
 * reprove com um clique — o campo livre fica só para o que sobra.
 */
export const REJECT_REASONS = [
	"Nome escrito incorretamente",
	"Cargo incorreto",
	"Nome ou cargo em CAIXA ALTA",
	"Telefone incorreto",
	"E-mail incorreto",
	"Dados incompletos",
] as const;

const OTHER = "Outro motivo";

interface RejectReasonDialogProps {
	open: boolean;
	/** Quantas solicitações receberão este motivo (rótulo do botão em lote). */
	count?: number;
	submitting?: boolean;
	onCancel: () => void;
	onConfirm: (reason: string) => void;
}

export function RejectReasonDialog({ open, count = 1, submitting = false, onCancel, onConfirm }: RejectReasonDialogProps) {
	const [selected, setSelected] = useState<string[]>([]);
	const [other, setOther] = useState("");
	const [error, setError] = useState(false);

	// Reabrir sempre começa limpo, para não herdar o motivo da reprovação anterior
	useEffect(() => {
		if (open) {
			setSelected([]);
			setOther("");
			setError(false);
		}
	}, [open]);

	useEffect(() => {
		if (!open) return;
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape" && !submitting) onCancel();
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, submitting, onCancel]);

	if (!open) return null;

	const otherSelected = selected.includes(OTHER);

	function toggle(reason: string) {
		setError(false);
		setSelected((prev) => (prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]));
	}

	function handleConfirm() {
		const parts = selected.filter((r) => r !== OTHER);
		if (otherSelected && other.trim()) parts.push(other.trim());

		if (parts.length === 0) {
			setError(true);
			return;
		}
		onConfirm(parts.join("; "));
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="reject-dialog-title">
			<div className="w-full max-w-md rounded-lg bg-background shadow-lg">
				<div className="space-y-1 border-b px-6 py-4">
					<h2 id="reject-dialog-title" className="flex items-center gap-2 text-lg font-semibold text-[#0b2a5b]">
						<XCircle className="h-5 w-5 text-red-600" />
						Motivo da reprovação
					</h2>
					<p className="text-sm text-muted-foreground">
						{count > 1
							? `O motivo será aplicado às ${count} solicitações selecionadas e enviado aos solicitantes.`
							: "O solicitante receberá este motivo por e-mail e verá na aba “Minhas solicitações”."}
					</p>
				</div>

				<div className="space-y-2 px-6 py-4">
					{[...REJECT_REASONS, OTHER].map((reason) => (
						<label key={reason} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60">
							<input type="checkbox" checked={selected.includes(reason)} onChange={() => toggle(reason)} className="h-4 w-4 accent-[#0b2a5b]" />
							<span>{reason}</span>
						</label>
					))}

					{otherSelected && (
						<textarea
							autoFocus
							className="mt-1 min-h-[72px] w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
							placeholder="Descreva o motivo…"
							value={other}
							onChange={(e) => {
								setOther(e.target.value);
								setError(false);
							}}
						/>
					)}

					{error && <p className="text-sm text-red-500">Selecione ao menos um motivo{otherSelected ? " ou descreva em “Outro motivo”" : ""}.</p>}
				</div>

				<div className="flex justify-end gap-2 border-t px-6 py-4">
					<Button variant="outline" onClick={onCancel} disabled={submitting}>
						Cancelar
					</Button>
					<Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleConfirm} disabled={submitting}>
						{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
						{count > 1 ? `Reprovar ${count}` : "Confirmar reprovação"}
					</Button>
				</div>
			</div>
		</div>
	);
}
