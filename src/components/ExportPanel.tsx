import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { QualitySlider } from "./QualitySlider";
import type { ExportConfig, ExportFormat } from "@/types/export";
import { Copy, Loader2, Send } from "lucide-react";

interface ExportPanelProps {
	config: ExportConfig;
	onConfigChange: (config: Partial<ExportConfig>) => void;
	onCopyHtml: () => void;
	onSubmitForApproval: () => Promise<void>;
	isSubmitting: boolean;
	disabled: boolean;
}

export function ExportPanel({ config, onConfigChange, onCopyHtml, onSubmitForApproval, isSubmitting, disabled }: ExportPanelProps) {
	const isHtml = config.format === "html";

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Exportar</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-2">
					<Label>Formato</Label>
					<Select value={config.format} onValueChange={(value) => onConfigChange({ format: value as ExportFormat })}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="png">PNG</SelectItem>
							<SelectItem value="jpg">JPG</SelectItem>
							<SelectItem value="html">HTML (Clipboard)</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{config.format === "jpg" && <QualitySlider value={config.jpegQuality} onChange={(jpegQuality) => onConfigChange({ jpegQuality })} />}

				{isHtml ? (
					<Button onClick={onCopyHtml} disabled={disabled} className="w-full" size="lg">
						<Copy className="mr-2 h-4 w-4" />
						Copiar HTML
					</Button>
				) : (
					<>
						<Button onClick={onSubmitForApproval} disabled={disabled || isSubmitting} className="w-full bg-[#0b2a5b] text-white hover:bg-[#0b2a5b]/90" size="lg">
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Enviando…
								</>
							) : (
								<>
									<Send className="mr-2 h-4 w-4" />
									Enviar para Aprovação
								</>
							)}
						</Button>
						<p className="text-xs text-center text-muted-foreground">
							Sua assinatura será enviada para aprovação dos gestores.
							<br />
							Você receberá o download por e-mail após a aprovação.
						</p>
					</>
				)}
			</CardContent>
		</Card>
	);
}
