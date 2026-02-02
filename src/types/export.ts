import type { SignatureData } from './signature'

export type ExportFormat = 'jpg' | 'png' | 'html'

export interface ExportConfig {
  format: ExportFormat
  width: number
  jpegQuality: number
}

export interface BulkExportConfig extends ExportConfig {
  templateId: string
}

export interface BulkSignatureItem {
  data: SignatureData
  index: number
}

export interface GeneratedImage {
  name: string
  dataUrl: string
  index: number
}
