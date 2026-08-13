import type { SignatureData } from './signature'

export type ExportFormat = 'png'

export interface ExportConfig {
  format: ExportFormat
  width: number
}

export interface BulkExportConfig extends ExportConfig {
  templateId: string
  logoUrl?: string
  accentColor?: string
  adminLogo?: { url: string; width: number; height: number }
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
