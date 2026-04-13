import type { SignatureData } from '@/types/signature'
import { defaultTemplate } from './default'
import { shoppingTemplate } from './shopping'

export interface TemplateDefinition {
  id: string
  name: string
  description: string
  defaultWidth: number
  /** logoUrl sobrescreve o logo padrão; se omitido usa o fallback do template */
  render: (data: SignatureData, logoUrl?: string) => string
}

export const TEMPLATES: TemplateDefinition[] = [defaultTemplate, shoppingTemplate]

export const DEFAULT_TEMPLATE_ID = 'default'

export function getTemplateById(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
}
