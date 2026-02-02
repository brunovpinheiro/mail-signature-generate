import { useRef, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QualitySlider } from './QualitySlider'
import { BulkPreviewGrid } from './BulkPreviewGrid'
import { useBulkGenerator } from '@/hooks/useBulkGenerator'
import { DEFAULT_TEMPLATE_ID, getTemplateById } from '@/lib/templates'
import type { ExportFormat } from '@/types/export'
import { Upload, Download, FileDown, Loader2, Trash2, AlertCircle, ArrowLeft, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

export function BulkGenerator() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    items,
    errors,
    isProcessing,
    progress,
    generatedImages,
    handleParseCSV,
    generateAllImages,
    downloadAllAsZip,
    downloadSingleImage,
    clearItems,
    clearImages,
  } = useBulkGenerator()

  const [format, setFormat] = useState<ExportFormat>('png')
  const [jpegQuality, setJpegQuality] = useState(0.92)

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleParseCSV(file)
      }
    },
    [handleParseCSV]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file && file.name.endsWith('.csv')) {
        handleParseCSV(file)
      }
    },
    [handleParseCSV]
  )

  const handleGenerate = useCallback(async () => {
    await generateAllImages({
      templateId: DEFAULT_TEMPLATE_ID,
      format,
      width: 540,
      jpegQuality,
    })
    toast.success('Imagens geradas com sucesso!')
  }, [generateAllImages, format, jpegQuality])

  const handleDownloadAll = useCallback(async () => {
    await downloadAllAsZip()
    toast.success('Download iniciado!')
  }, [downloadAllAsZip])

  const template = getTemplateById(DEFAULT_TEMPLATE_ID)

  // Show generated images result
  if (generatedImages.length > 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Imagens Geradas ({generatedImages.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={handleDownloadAll} size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Todas (ZIP)
                </Button>
                <Button variant="outline" onClick={clearImages} size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedImages.map((image) => (
                <div
                  key={image.index}
                  className="rounded-lg border bg-white p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{image.name}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadSingleImage(image.index)}
                    >
                      <Download className="mr-2 h-3 w-3" />
                      Baixar
                    </Button>
                  </div>
                  <img
                    src={image.dataUrl}
                    alt={`Assinatura de ${image.name}`}
                    className="w-full h-auto rounded border"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show config + generate
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Geração em Massa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Arquivo CSV</Label>
              <a
                href="/csv-template.csv"
                download
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
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
              <p className="text-sm text-muted-foreground">
                Arraste um arquivo CSV ou clique para selecionar
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Errors */}
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

          {/* Items loaded */}
          {items.length > 0 && (
            <>
              <Separator />

              <div className="space-y-2">
                <Label>Formato</Label>
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as ExportFormat)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpg">JPG</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {format === 'jpg' && (
                <QualitySlider value={jpegQuality} onChange={setJpegQuality} />
              )}

              <Separator />

              <BulkPreviewGrid items={items} template={template} />

              {/* Progress */}
              {isProcessing && progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Gerando imagens...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={isProcessing}
                  className="flex-1"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Gerar Todas
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={clearItems}
                  disabled={isProcessing}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
