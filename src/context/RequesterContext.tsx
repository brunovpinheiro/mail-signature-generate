import { createContext, useContext, useState } from 'react'
import type { CompanyConfig } from '@/lib/company-domains'

export interface RequesterInfo {
  name: string
  email: string
  company: CompanyConfig
}

interface RequesterContextValue {
  requester: RequesterInfo | null
  setRequester: (info: RequesterInfo) => void
  clearRequester: () => void
}

const RequesterContext = createContext<RequesterContextValue | null>(null)

export function RequesterProvider({ children }: { children: React.ReactNode }) {
  const [requester, setRequesterState] = useState<RequesterInfo | null>(null)

  return (
    <RequesterContext.Provider
      value={{
        requester,
        setRequester: setRequesterState,
        clearRequester: () => setRequesterState(null),
      }}
    >
      {children}
    </RequesterContext.Provider>
  )
}

export function useRequester(): RequesterContextValue {
  const ctx = useContext(RequesterContext)
  if (!ctx) throw new Error('useRequester must be used inside RequesterProvider')
  return ctx
}
