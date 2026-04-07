import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequester } from "@/context/RequesterContext";
import { UserCircle2 } from "lucide-react";

function isValidEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function RequesterForm() {
	const { setRequester } = useRequester();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [emailTouched, setEmailTouched] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const emailError = emailTouched && email !== "" && !isValidEmail(email);
	const canSubmit = name.trim().length > 0 && isValidEmail(email);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitted(true);
		if (!canSubmit) return;
		setRequester({ name: name.trim(), email: email.trim().toLowerCase() });
	}

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<header className="border-b bg-[#0b2a5b] text-white">
				<div className="container mx-auto flex items-center justify-center gap-2 px-4 py-4">
					<h1 className="text-xl font-bold">Tacla Shopping - Gerador de Assinaturas</h1>
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
									E-mail <span className="text-red-500">*</span>
								</Label>
								<Input id="req-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setEmailTouched(true)} className={emailError || (submitted && !isValidEmail(email)) ? "border-red-500 focus-visible:ring-red-500" : ""} />
								{(emailError || (submitted && !isValidEmail(email))) && <p className="text-sm text-red-500">Informe um e-mail válido.</p>}
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
