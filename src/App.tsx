import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignatureEditor } from "@/components/SignatureEditor";
import { SignaturePreview } from "@/components/SignaturePreview";
import { ExportPanel } from "@/components/ExportPanel";
import { BulkGenerator } from "@/components/BulkGenerator";
import { useSignatureEditor } from "@/hooks/useSignatureEditor";
import { useExport } from "@/hooks/useExport";
import { Toaster, toast } from "sonner";

function App() {
	const { signatureData, setSignatureData, generatedHtml, isValid } = useSignatureEditor();

	const { exportConfig, setExportConfig, generatedImageUrl, generateImage, downloadImage, clearImage, copyHtml, isExporting } = useExport();

	// Clear generated image when signature data changes
	useEffect(() => {
		clearImage();
	}, [generatedHtml, clearImage]);

	const handleGenerate = async () => {
		await generateImage(generatedHtml);
		toast.success("Imagem gerada com sucesso!");
	};

	const handleCopyHtml = async () => {
		await copyHtml(generatedHtml);
		toast.success("HTML copiado para o clipboard!");
	};

	const handleDownload = () => {
		downloadImage(signatureData.name);
		toast.success("Download iniciado!");
	};

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b bg-[#0b2a5b] text-white">
				<div className="container mx-auto flex items-center justify-center gap-2 px-4 py-4">
					<h1 className="text-xl font-bold">Tacla Shopping - Gerador de Assinaturas</h1>
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
								<SignatureEditor data={signatureData} onChange={setSignatureData} />
								<SignaturePreview html={generatedHtml} />
							</div>
							<div>
								<ExportPanel config={exportConfig} onConfigChange={setExportConfig} onGenerate={handleGenerate} onDownload={handleDownload} onClear={clearImage} onCopyHtml={handleCopyHtml} generatedImageUrl={generatedImageUrl} isExporting={isExporting} disabled={!isValid} />
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

export default App;
