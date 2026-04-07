import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { SignatureData } from "@/types/signature";

function isValidEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatPhone(value: string): string {
	const digits = value.replace(/\D/g, "").slice(0, 11);
	if (digits.length <= 2) return digits.length ? `(${digits}` : "";
	if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
	if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
	return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

interface SignatureEditorProps {
	data: SignatureData;
	onChange: (data: Partial<SignatureData>) => void;
}

export function SignatureEditor({ data, onChange }: SignatureEditorProps) {
	const [emailError, setEmailError] = useState(false);

	function handleEmailChange(value: string) {
		onChange({ email: value });
		setEmailError(value !== "" && !isValidEmail(value));
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Editor de Assinatura</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-4">
					<h4 className="text-sm font-medium text-muted-foreground">Dados Obrigatórios</h4>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="name">Nome *</Label>
							<Input id="name" placeholder="Seu nome completo" value={data.name} onChange={(e) => onChange({ name: e.target.value })} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="jobTitle">Cargo *</Label>
							<Input id="jobTitle" placeholder="Seu cargo" value={data.jobTitle} onChange={(e) => onChange({ jobTitle: e.target.value })} />
						</div>
					</div>
				</div>

				<Separator />

				<div className="space-y-4">
					<h4 className="text-sm font-medium text-muted-foreground">Dados Opcionais</h4>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input id="email" type="email" placeholder="seu@email.com" value={data.email ?? ""} onChange={(e) => handleEmailChange(e.target.value)} className={emailError ? "border-red-500 focus-visible:ring-red-500" : ""} />
							{emailError && <p className="text-sm text-red-500">E-mail inválido</p>}
						</div>
						<div className="space-y-2">
							<Label htmlFor="phone">Telefone</Label>
							<Input id="phone" placeholder="(00) 00000-0000" value={data.phone ?? ""} onChange={(e) => onChange({ phone: formatPhone(e.target.value) })} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="website">Website</Label>
							<Input id="website" placeholder="https://seusite.com" value={data.website ?? ""} onChange={(e) => onChange({ website: e.target.value })} disabled />
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
