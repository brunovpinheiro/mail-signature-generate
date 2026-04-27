import Papa from 'papaparse'
import type { SignatureData } from '@/types/signature'
import type { BulkSignatureItem } from '@/types/export'

export const COLUMN_MAPPINGS: Record<string, keyof SignatureData> = {
  name: 'name',
  nome: 'name',
  jobtitle: 'jobTitle',
  job_title: 'jobTitle',
  cargo: 'jobTitle',
  email: 'email',
  'e-mail': 'email',
  phone: 'phone',
  telefone: 'phone',
  mobile: 'mobile',
  mobilephone: 'mobile',
  celular: 'mobile',
  website: 'website',
  site: 'website',
  url: 'website',
}

const REQUIRED_FIELDS: (keyof SignatureData)[] = ['name', 'jobTitle']
const MAX_ROWS = 500

export function validateRow(
  row: Record<string, string>,
  index: number
): { data: SignatureData | null; error: string | null } {
  const mapped: Partial<SignatureData> = {}

  for (const [rawKey, value] of Object.entries(row)) {
    const normalizedKey = rawKey.trim().toLowerCase()
    const field = COLUMN_MAPPINGS[normalizedKey]
    if (field && value?.trim()) {
      mapped[field] = value.trim()
    }
  }

  const missing = REQUIRED_FIELDS.filter((f) => !mapped[f])
  if (missing.length > 0) {
    return {
      data: null,
      error: `Linha ${index + 1}: campos obrigatórios ausentes: ${missing.join(', ')}`,
    }
  }

  return {
    data: mapped as SignatureData,
    error: null,
  }
}

export function parseCSV(
  file: File
): Promise<{ items: BulkSignatureItem[]; errors: string[] }> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const items: BulkSignatureItem[] = []
        const errors: string[] = []

        const rows = results.data as Record<string, string>[]
        const limitedRows = rows.slice(0, MAX_ROWS)

        if (rows.length > MAX_ROWS) {
          errors.push(`CSV contém ${rows.length} linhas. Limite de ${MAX_ROWS} linhas aplicado.`)
        }

        limitedRows.forEach((row, index) => {
          const result = validateRow(row, index)
          if (result.data) {
            items.push({ data: result.data, index })
          }
          if (result.error) {
            errors.push(result.error)
          }
        })

        resolve({ items, errors })
      },
      error: (error: Error) => {
        resolve({ items: [], errors: [`Erro ao processar CSV: ${error.message}`] })
      },
    })
  })
}
