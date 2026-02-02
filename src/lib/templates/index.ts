import type { SignatureData } from '@/types/signature'
import { defaultTemplate } from './default'

export interface TemplateDefinition {
  id: string
  name: string
  description: string
  defaultWidth: number
  render: (data: SignatureData) => string
}

export const TEMPLATES: TemplateDefinition[] = [defaultTemplate]

export const DEFAULT_TEMPLATE_ID = 'default'

export function getTemplateById(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
