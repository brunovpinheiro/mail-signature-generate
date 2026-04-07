import { useState, useEffect, useMemo } from 'react'
import type { SignatureData } from '@/types/signature'
import { DEFAULT_TEMPLATE_ID, getTemplateById } from '@/lib/templates'

interface UseSignatureEditorReturn {
  signatureData: SignatureData
  setSignatureData: (data: Partial<SignatureData>) => void
  generatedHtml: string
  isValid: boolean
}

const DEFAULT_DATA: SignatureData = {
  name: '',
  jobTitle: '',
  website: 'https://taclashopping.com.br',
}

export function useSignatureEditor(): UseSignatureEditorReturn {
  const [signatureData, setSignatureDataState] = useState<SignatureData>(DEFAULT_DATA)
  const [generatedHtml, setGeneratedHtml] = useState('')

  const setSignatureData = (data: Partial<SignatureData>) => {
    setSignatureDataState((prev) => ({ ...prev, ...data }))
  }

  const isValid = useMemo(() => {
    return (
      signatureData.name.trim().length > 0 &&
      signatureData.jobTitle.trim().length > 0
    )
  }, [signatureData])

  useEffect(() => {
    if (!isValid) {
      setGeneratedHtml('')
      return
    }
    const template = getTemplateById(DEFAULT_TEMPLATE_ID)
    if (template) {
      setGeneratedHtml(template.render(signatureData))
    }
  }, [signatureData, isValid])

  return {
    signatureData,
    setSignatureData,
    generatedHtml,
    isValid,
  }
}
