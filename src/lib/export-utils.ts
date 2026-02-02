import type { SignatureData } from '@/types/signature'
import type { ExportConfig, BulkSignatureItem, GeneratedImage } from '@/types/export'
import { renderHtmlToImage } from './image-utils'

export function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',')
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(parts[1])
  const n = bstr.length
  const u8arr = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i)
  }
  return new Blob([u8arr], { type: mime })
}

export async function generateBulkImages(
  items: BulkSignatureItem[],
  config: ExportConfig,
  templateFn: (data: SignatureData) => string,
  onProgress: (percent: number) => void
): Promise<GeneratedImage[]> {
  const format = config.format === 'png' ? 'png' : 'jpg'
  const images: GeneratedImage[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const html = templateFn(item.data)

    const dataUrl = await renderHtmlToImage(html, {
      width: config.width,
      format,
      quality: config.jpegQuality,
    })

    images.push({
      name: item.data.name,
      dataUrl,
      index: item.index,
    })

    onProgress(Math.round(((i + 1) / items.length) * 100))
  }

  return images
}

export async function downloadImagesAsZip(
  images: GeneratedImage[],
  format: 'png' | 'jpg'
): Promise<void> {
  const { default: JSZip } = await import('jszip')
  const { saveAs } = await import('file-saver')

  const zip = new JSZip()

  for (let i = 0; i < images.length; i++) {
    const image = images[i]
    const blob = dataUrlToBlob(image.dataUrl)
    const filename = `${sanitizeFilename(image.name)}_${i + 1}.${format}`
    zip.file(filename, blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  saveAs(zipBlob, 'signatures.zip')
}
