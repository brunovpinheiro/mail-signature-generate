import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignatureEditor } from "@/components/SignatureEditor";
import { SignaturePreview } from "@/components/SignaturePreview";
import { ExportPanel } from "@/components/ExportPanel";
import { BulkGenerator } from "@/components/BulkGenerator";
import { RequesterForm } from "@/components/RequesterForm";
import { ApprovalPage } from "@/components/ApprovalPage";
import { DownloadPage } from "@/components/DownloadPage";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminRequestDetail } from "@/components/AdminRequestDetail";
import { DevPreview } from "@/components/DevPreview";
import { RequesterProvider, useRequester } from "@/context/RequesterContext";
import { useSignatureEditor } from "@/hooks/useSignatureEditor";
import { useExport } from "@/hooks/useExport";
import { submitRequest } from "@/lib/api";
import { Toaster, toast } from "sonner";
import { CheckCircle2, Mail } from "lucide-react";
// ── Tela de confirmação pós-envio ─────────────────────────────────────────────
function SubmittedState({ onReset }: { onReset: () => void }) {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<header className="border-b bg-[#0b2a5b] text-white">
				<div className="container mx-auto flex items-center justify-between px-4 py-5">
					<img src="/logo-navbar.png" alt="Logo" className="h-8" />
					<span className="text-base font-normal">Gerador de Assinaturas</span>
				</div>
			</header>
			<main className="flex-1 flex items-center justify-center px-4">
				<Card className="max-w-md w-full">
					<CardContent className="pt-8 pb-8 space-y-4 text-center">
						<CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
						<h2 className="text-xl font-semibold text-[#0b2a5b]">Solicitação enviada!</h2>
						<p className="text-sm text-muted-foreground">Sua assinatura foi enviada para aprovação dos gestores. Você receberá um e-mail com o resultado assim que a decisão for tomada.</p>
						<div className="flex items-center justify-center gap-2 rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
							<Mail className="h-4 w-4 shrink-0" />
							Fique de olho no seu e-mail!
						</div>
						<Button variant="outline" onClick={onReset} className="mt-2">
							Fazer nova solicitação
						</Button>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}

// ── Aplicação principal (aba Individual + Em Massa) ───────────────────────────
function MainApp() {
	const { requester } = useRequester();
	const [selectedCompany, setSelectedCompany] = useState(requester?.company);
	const { signatureData, setSignatureData, generatedHtml, isValid } = useSignatureEditor({
		templateId: selectedCompany?.templateId,
		logoUrl: selectedCompany?.logoUrl,
		defaultWebsite: selectedCompany?.defaultWebsite,
		accentColor: selectedCompany?.accentColor,
	});
	const { exportConfig, setExportConfig } = useExport();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	if (!requester) return <RequesterForm />;
	if (submitted) return <SubmittedState onReset={() => setSubmitted(false)} />;

	const handleSubmitForApproval = async () => {
		if (!isValid || !requester) return;
		setIsSubmitting(true);
		try {
			await submitRequest({
				requesterName: requester.name,
				requesterEmail: requester.email,
				type: "single",
				signatureItems: [signatureData],
				companyDomain: selectedCompany?.domain,
			});
			setSubmitted(true);
		} catch (err) {
			toast.error((err as Error).message ?? "Erro ao enviar solicitação.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b bg-[#0b2a5b] text-white">
				<div className="container mx-auto flex items-center justify-between px-4 py-5">
					<img src="/logo-navbar.png" alt="Logo" className="h-8" />
					<span className="text-base font-normal">Gerador de Assinaturas</span>
				</div>
			</header>

			<main className="container mx-auto px-4 py-6">
				<Tabs defaultValue="single">
					<TabsList className="mb-6">
						<TabsTrigger value="single">Individual</TabsTrigger>
						<TabsTrigger value="bulk">Em Massa</TabsTrigger>
					</TabsList>

					<TabsContent value="single">
						<div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
							<div className="space-y-6">
								<SignatureEditor data={signatureData} onChange={setSignatureData} selectedCompanyDomain={selectedCompany?.domain} onCompanyChange={(company) => setSelectedCompany(company)} />
								<SignaturePreview html={generatedHtml} />
							</div>
							<div>
								<ExportPanel config={exportConfig} onConfigChange={setExportConfig} onSubmitForApproval={handleSubmitForApproval} isSubmitting={isSubmitting} disabled={!isValid} />
							</div>
						</div>
					</TabsContent>

					<TabsContent value="bulk">
						<BulkGenerator />
					</TabsContent>
				</Tabs>
			</main>

			<Toaster position="bottom-right" richColors />
		</div>
	);
}

// ── Painel admin ──────────────────────────────────────────────────────────────
function AdminApp() {
	const [token, setToken] = useState<string | null>(() => sessionStorage.getItem("admin_token"));
	function handleLogin(newToken: string, _domain: string) {
		setToken(newToken);
	}

	function handleLogout() {
		sessionStorage.removeItem("admin_token");
		setToken(null);
	}

	if (!token) return <AdminLogin onLogin={handleLogin} />;
	return <AdminDashboard token={token} onLogout={handleLogout} />;
}

// ── Raiz com roteamento ───────────────────────────────────────────────────────
function App() {
	return (
		<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
			<RequesterProvider>
				<Routes>
					<Route path="/approve/:token" element={<ApprovalPage />} />
					<Route path="/download/:requestId" element={<DownloadPage />} />
					<Route path="/admin" element={<AdminApp />} />
					<Route path="/admin/requests/:id" element={<AdminRequestDetail />} />
					{import.meta.env.DEV && <Route path="/dev" element={<DevPreview />} />}
					<Route path="/*" element={<MainApp />} />
				</Routes>
			</RequesterProvider>
			<Toaster position="bottom-right" richColors />
		</BrowserRouter>
	);
}

export default App;
