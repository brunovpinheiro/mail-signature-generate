import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { QualitySlider } from './QualitySlider'
import type { ExportConfig, ExportFormat } from '@/types/export'
import { Download, Copy, Loader2, ArrowLeft, ImageIcon } from 'lucide-react'

interface ExportPanelProps {
  config: ExportConfig
  onConfigChange: (config: Partial<ExportConfig>) => void
  onGenerate: () => void
  onDownload: () => void
  onClear: () => void
  onCopyHtml: () => void
  generatedImageUrl: string | null
  isExporting: boolean
  disabled: boolean
}

export function ExportPanel({
  config,
  onConfigChange,
  onGenerate,
  onDownload,
  onClear,
  onCopyHtml,
  generatedImageUrl,
  isExporting,
  disabled,
}: ExportPanelProps) {
  if (generatedImageUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resultado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-white p-2">
            <img
              src={generatedImageUrl}
              alt="Assinatura gerada"
              className="w-full h-auto"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={onDownload} className="flex-1" size="lg">
              <Download className="mr-2 h-4 w-4" />
              Baixar
            </Button>
            <Button variant="outline" onClick={onClear} size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Exportar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Formato</Label>
          <Select
            value={config.format}
            onValueChange={(value) => onConfigChange({ format: value as ExportFormat })}
          >
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

        {config.format === 'jpg' && (
          <QualitySlider
            value={config.jpegQuality}
            onChange={(jpegQuality) => onConfigChange({ jpegQuality })}
          />
        )}

        <Button
          onClick={config.format === 'html' ? onCopyHtml : onGenerate}
          disabled={disabled || isExporting}
          className="w-full"
          size="lg"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : config.format === 'html' ? (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copiar HTML
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-4 w-4" />
              Gerar Imagem
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
