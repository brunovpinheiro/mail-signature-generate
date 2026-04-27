import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ExportConfig } from "@/types/export";
import { Loader2, Send } from "lucide-react";

interface ExportPanelProps {
	config: ExportConfig;
	onConfigChange: (config: Partial<ExportConfig>) => void;
	onSubmitForApproval: () => Promise<void>;
	isSubmitting: boolean;
	disabled: boolean;
}

export function ExportPanel({ onSubmitForApproval, isSubmitting, disabled }: ExportPanelProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Exportar</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
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
			</CardContent>
		</Card>
	);
}
