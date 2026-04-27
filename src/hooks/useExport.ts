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
  isExporting: boolean
}

export function useExport(): UseExportReturn {
  const [exportConfig, setExportConfigState] = useState<ExportConfig>({
    format: 'png',
    width: 540,
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
        const dataUrl = await renderHtmlToImage(html, {
          width: exportConfig.width,
          format: 'png',
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
    const filename = name ? `${sanitizeFilename(name)}.png` : 'signature.png'
    downloadDataUrl(generatedImageUrl, filename)
  }, [generatedImageUrl])

  const clearImage = useCallback(() => {
    setGeneratedImageUrl(null)
  }, [])

  return {
    exportConfig,
    setExportConfig,
    generatedImageUrl,
    generateImage,
    downloadImage,
    clearImage,
    isExporting,
  }
}
