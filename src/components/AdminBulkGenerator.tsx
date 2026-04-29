import { useRef, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BulkPreviewGrid } from "./BulkPreviewGrid";
import { useBulkGenerator } from "@/hooks/useBulkGenerator";
import { DEFAULT_TEMPLATE_ID, getTemplateById } from "@/lib/templates";
import { getCompanyByDomain } from "@/lib/company-domains";
import { submitAdminBulk } from "@/lib/api";
import { Upload, FileDown, Loader2, Trash2, AlertCircle, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";

interface AdminBulkGeneratorProps {
  token: string;
  companyDomain: string;
}

export function AdminBulkGenerator({ token, companyDomain }: AdminBulkGeneratorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { items, errors, isProcessing, handleParseCSV, clearItems } = useBulkGenerator();

  const companyConfig = useMemo(() => getCompanyByDomain(companyDomain), [companyDomain]);
  const template = getTemplateById(companyConfig?.templateId ?? DEFAULT_TEMPLATE_ID);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ notified: number; skipped: number } | null>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleParseCSV(file);
        setResult(null);
      }
    },
    [handleParseCSV],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) {
        handleParseCSV(file);
        setResult(null);
      }
    },
    [handleParseCSV],
  );

  const handleGenerate = useCallback(async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await submitAdminBulk(token, {
        signatureItems: items.map((i) => i.data),
        companyDomain,
      });
      setResult({ notified: res.notified, skipped: res.skipped });
      clearItems();
    } catch (err) {
      toast.error((err as Error).message ?? "Erro ao gerar assinaturas.");
    } finally {
      setIsSubmitting(false);
    }
  }, [token, items, companyDomain, clearItems]);

  if (result !== null) {
    return (
      <Card>
        <CardContent className="pt-8 pb-8 space-y-4 text-center">
          <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
          <h2 className="text-xl font-semibold text-[#0b2a5b]">Assinaturas geradas!</h2>
          <p className="text-sm text-muted-foreground">
            {result.notified > 0 && <>{result.notified} pessoa(s) notificada(s) por e-mail com o link de download.<br /></>}
            {result.skipped > 0 && <>{result.skipped} assinatura(s) sem e-mail foram puladas.</>}
          </p>
          <Button variant="outline" onClick={() => setResult(null)}>
            Gerar novo lote
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Geração em Massa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Arquivo CSV</Label>
              <a href="/csv-template.csv" download className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <FileDown className="h-3 w-3" />
                Baixar template CSV
              </a>
            </div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Arraste um arquivo CSV ou clique para selecionar</p>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            </div>
          </div>

          {errors.length > 0 && (
            <div className="rounded-md bg-destructive/10 p-3 space-y-1">
              {errors.map((error, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <>
              <Separator />
              <BulkPreviewGrid items={items} template={template} logoUrl={companyConfig?.logoUrl} accentColor={companyConfig?.accentColor} />
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={isProcessing || isSubmitting}
                    className="flex-1 bg-[#0b2a5b] text-white hover:bg-[#0b2a5b]/90"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando…
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Gerar e Aprovar ({items.length} assinaturas)
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={clearItems} disabled={isProcessing || isSubmitting}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  As assinaturas serão aprovadas imediatamente.
                  <br />
                  Pessoas com e-mail no CSV receberão o link de download.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
