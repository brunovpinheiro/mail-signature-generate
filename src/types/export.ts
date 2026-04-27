import type { SignatureData } from './signature'

export type ExportFormat = 'png'

export interface ExportConfig {
  format: ExportFormat
  width: number
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
