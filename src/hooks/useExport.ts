import { useState, useCallback } from 'react'
import type { ExportConfig } from '@/types/export'
import { renderHtmlToImage } from '@/lib/image-utils'
import { downloadDataUrl, sanitizeFilename } from '@/lib/export-utils'

interface UseExportReturn {
  exportConfig: ExportConfig
  setExportConfig: (config: Partial<ExportConfig>) => void
  generatedImageUrl: string | null
  generateImage: (html: string) => Promise<void>
  downloadImage: (name: string) => void
  clearImage: () => void
  copyHtml: (html: string) => Promise<void>
  isExporting: boolean
}

export function useExport(): UseExportReturn {
  const [exportConfig, setExportConfigState] = useState<ExportConfig>({
    format: 'png',
    width: 540,
    jpegQuality: 0.92,
  })
  const [isExporting, setIsExporting] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)

  const setExportConfig = useCallback((config: Partial<ExportConfig>) => {
    setExportConfigState((prev) => ({ ...prev, ...config }))
    setGeneratedImageUrl(null)
  }, [])

  const generateImage = useCallback(
    async (html: string) => {
      if (!html) return

      setIsExporting(true)
      try {
        const format = exportConfig.format === 'jpg' ? 'jpg' : 'png'
        const dataUrl = await renderHtmlToImage(html, {
          width: exportConfig.width,
          format,
          quality: exportConfig.jpegQuality,
        })
        setGeneratedImageUrl(dataUrl)
      } finally {
        setIsExporting(false)
      }
    },
    [exportConfig]
  )

  const downloadImage = useCallback((name: string) => {
    if (!generatedImageUrl) return
    const ext = exportConfig.format === 'jpg' ? 'jpg' : 'png'
    const filename = name ? `${sanitizeFilename(name)}.${ext}` : `signature.${ext}`
    downloadDataUrl(generatedImageUrl, filename)
  }, [generatedImageUrl, exportConfig.format])

  const clearImage = useCallback(() => {
    setGeneratedImageUrl(null)
  }, [])

  const copyHtml = useCallback(async (html: string) => {
    await navigator.clipboard.writeText(html)
  }, [])

  return {
    exportConfig,
    setExportConfig,
    generatedImageUrl,
    generateImage,
    downloadImage,
    clearImage,
    copyHtml,
    isExporting,
  }
}
