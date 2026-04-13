import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, LogOut, RefreshCw, ChevronRight, InboxIcon } from 'lucide-react'
import { getAdminRequests } from '@/lib/api'
import type { AdminRequest } from '@/lib/api'

interface AdminDashboardProps {
  token: string
  onLogout: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminDashboard({ token, onLogout }: AdminDashboardProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [requests, setRequests] = useState<AdminRequest[]>([])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminRequests(token)
      setCompanyName(data.companyName)
      setRequests(data.requests)
    } catch (err) {
      const msg = (err as Error).message
      if (msg.includes('expirada') || msg.includes('Token') || msg.includes('Sessão')) {
        onLogout()
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-[#0b2a5b] text-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">Painel de Aprovações — {companyName || '…'}</h1>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:text-white hover:bg-white/20"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0b2a5b]">Solicitações Pendentes</h2>
            <p className="text-sm text-muted-foreground">
              {loading ? 'Carregando…' : `${requests.length} solicitação(ões) aguardando aprovação`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-600 mb-4">
            {error}
          </div>
        )}

        {!loading && requests.length === 0 && !error && (
          <Card>
            <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
              <InboxIcon className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">Nenhuma solicitação pendente no momento.</p>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-[#0b2a5b]" />
          </div>
        )}

        <div className="space-y-3">
          {requests.map((r) => (
            <Card
              key={r.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/admin/requests/${r.id}`, { state: { request: r, token, companyName } })}
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base font-semibold leading-tight">
                    {r.requesterName}
                  </CardTitle>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {r.type === 'single' ? 'Individual' : `Em Massa · ${r.itemCount}`}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 text-sm text-muted-foreground space-y-1">
                <p>{r.requesterEmail}</p>
                <p>Solicitado em {formatDate(r.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
