import { useState, useCallback } from 'react'
import type { BulkSignatureItem, BulkExportConfig, GeneratedImage } from '@/types/export'
import { parseCSV } from '@/lib/csv-utils'
import { generateBulkImages, downloadImagesAsZip, downloadDataUrl, sanitizeFilename } from '@/lib/export-utils'
import { getTemplateById } from '@/lib/templates'

interface UseBulkGeneratorReturn {
  items: BulkSignatureItem[]
  errors: string[]
  isProcessing: boolean
  progress: number
  generatedImages: GeneratedImage[]
  handleParseCSV: (file: File) => void
  generateAllImages: (config: BulkExportConfig) => Promise<void>
  downloadAllAsZip: () => Promise<void>
  downloadSingleImage: (index: number) => void
  clearItems: () => void
  clearImages: () => void
}

export function useBulkGenerator(): UseBulkGeneratorReturn {
  const [items, setItems] = useState<BulkSignatureItem[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])

  const handleParseCSV = useCallback((file: File) => {
    setIsProcessing(true)
    setProgress(0)
    setErrors([])
    setGeneratedImages([])

    parseCSV(file).then(({ items: parsedItems, errors: parseErrors }) => {
      setItems(parsedItems)
      setErrors(parseErrors)
      setIsProcessing(false)
    })
  }, [])

  const generateAllImages = useCallback(
    async (config: BulkExportConfig) => {
      if (items.length === 0) return

      const template = getTemplateById(config.templateId)
      if (!template) return

      setIsProcessing(true)
      setProgress(0)
      setGeneratedImages([])

      const images = await generateBulkImages(
        items,
        config,
        (data) => template.render(data, config.logoUrl, config.accentColor),
        (percent) => setProgress(percent)
      )

      setGeneratedImages(images)
      setIsProcessing(false)
    },
    [items]
  )

  const downloadAllAsZip = useCallback(async () => {
    if (generatedImages.length === 0) return
    await downloadImagesAsZip(generatedImages)
  }, [generatedImages])

  const downloadSingleImage = useCallback(
    (index: number) => {
      const image = generatedImages.find((img) => img.index === index)
      if (!image) return
      const filename = `${sanitizeFilename(image.name)}_${index + 1}.png`
      downloadDataUrl(image.dataUrl, filename)
    },
    [generatedImages]
  )

  const clearItems = useCallback(() => {
    setItems([])
    setErrors([])
    setProgress(0)
    setGeneratedImages([])
  }, [])

  const clearImages = useCallback(() => {
    setGeneratedImages([])
    setProgress(0)
  }, [])

  return {
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
  }
}
