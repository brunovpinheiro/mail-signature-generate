import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequester } from "@/context/RequesterContext";
import { getCompanyByEmail } from "@/lib/company-domains";
import { UserCircle2, CheckCircle2, XCircle } from "lucide-react";

function isValidEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function RequesterForm() {
	const { setRequester } = useRequester();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [emailTouched, setEmailTouched] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const company = isValidEmail(email) ? getCompanyByEmail(email) : null;
	const domainValid = isValidEmail(email) ? company !== null : true;
	const emailFormatError = emailTouched && email !== "" && !isValidEmail(email);
	const domainError = emailTouched && isValidEmail(email) && company === null;
	const canSubmit = name.trim().length > 0 && isValidEmail(email) && company !== null;

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitted(true);
		setEmailTouched(true);
		if (!canSubmit || !company) return;
		setRequester({ name: name.trim(), email: email.trim().toLowerCase(), company });
	}

	const showEmailBadge = isValidEmail(email);

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<header className="border-b bg-[#0b2a5b] text-white">
				<div className="container mx-auto flex items-center justify-between px-4 py-5">
					<img src="/logo-navbar.png" alt="Logo" className="h-8" />
					<span className="text-base font-normal">Gerador de Assinaturas</span>
				</div>
			</header>

			<main className="flex-1 flex items-center justify-center px-4 py-12">
				<Card className="w-full max-w-md">
					<CardHeader className="space-y-1 pb-4">
						<div className="flex items-center justify-center mb-2">
							<div className="rounded-full bg-[#0b2a5b]/10 p-3">
								<UserCircle2 className="h-8 w-8 text-[#0b2a5b]" />
							</div>
						</div>
						<CardTitle className="text-center text-lg">Identificação do Solicitante</CardTitle>
						<p className="text-center text-sm text-muted-foreground">Informe seus dados antes de gerar a assinatura. Você receberá o resultado por e-mail após a aprovação.</p>
					</CardHeader>

					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4" noValidate>
							<div className="space-y-2">
								<Label htmlFor="req-name">
									Nome completo <span className="text-red-500">*</span>
								</Label>
								<Input id="req-name" placeholder="Seu nome completo" value={name} onChange={(e) => setName(e.target.value)} className={submitted && !name.trim() ? "border-red-500 focus-visible:ring-red-500" : ""} />
								{submitted && !name.trim() && <p className="text-sm text-red-500">Nome é obrigatório.</p>}
							</div>

							<div className="space-y-2">
								<Label htmlFor="req-email">
									E-mail corporativo <span className="text-red-500">*</span>
								</Label>
								<Input id="req-email" type="email" placeholder="seu@empresa.com.br" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setEmailTouched(true)} className={emailFormatError || (submitted && !isValidEmail(email)) || domainError || (submitted && !domainValid) ? "border-red-500 focus-visible:ring-red-500" : showEmailBadge && company ? "border-green-500 focus-visible:ring-green-500" : ""} />

								{/* Feedback de empresa detectada */}
								{showEmailBadge && company && (
									<div className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
										<CheckCircle2 className="h-4 w-4 shrink-0" />
										<span>
											Empreendimento detectada: <strong>{company.name}</strong>
										</span>
									</div>
								)}

								{/* Domínio não permitido */}
								{(domainError || (submitted && isValidEmail(email) && !company)) && (
									<div className="flex items-center gap-1.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
										<XCircle className="h-4 w-4 shrink-0" />
										<span>Este domínio não está habilitado para gerar assinaturas.</span>
									</div>
								)}

								{/* Formato inválido */}
								{(emailFormatError || (submitted && !isValidEmail(email))) && !domainError && <p className="text-sm text-red-500">Informe um e-mail válido.</p>}
							</div>

							<Button type="submit" className="w-full bg-[#0b2a5b] text-white hover:bg-[#0b2a5b]/90" size="lg">
								Continuar
							</Button>
						</form>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
