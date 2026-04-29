import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, LogOut, RefreshCw, InboxIcon, CheckCheck, Check, X } from 'lucide-react'
import { getAdminRequests, adminDecide } from '@/lib/api'
import type { AdminRequest } from '@/lib/api'
import { AdminBulkGenerator } from './AdminBulkGenerator'
import { toast } from 'sonner'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [companyDomain, setCompanyDomain] = useState('')
  const [requests, setRequests] = useState<AdminRequest[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSelected(new Set())
    try {
      const data = await getAdminRequests(token)
      setCompanyName(data.companyName)
      setCompanyDomain(data.domain)
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
  }, [token, onLogout])

  useEffect(() => { load() }, [load])

  const allSelected = requests.length > 0 && selected.size === requests.length

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(requests.map(r => r.id)))
  }

  async function approveSelected() {
    if (selected.size === 0) return
    setApproving(true)
    const ids = Array.from(selected)
    const results = await Promise.allSettled(
      ids.map(id => adminDecide(token, id, 'approve'))
    )
    const failed = results.filter(r => r.status === 'rejected').length
    const succeeded = ids.length - failed
    if (succeeded > 0) toast.success(`${succeeded} solicitação(ões) aprovada(s).`)
    if (failed > 0) toast.error(`${failed} aprovação(ões) falharam.`)
    setApproving(false)
    await load()
  }

  async function rejectSelected() {
    if (selected.size === 0) return
    setRejecting(true)
    const ids = Array.from(selected)
    const results = await Promise.allSettled(
      ids.map(id => adminDecide(token, id, 'reject'))
    )
    const failed = results.filter(r => r.status === 'rejected').length
    const succeeded = ids.length - failed
    if (succeeded > 0) toast.success(`${succeeded} solicitação(ões) reprovada(s).`)
    if (failed > 0) toast.error(`${failed} reprovação(ões) falharam.`)
    setRejecting(false)
    await load()
  }

  async function rejectSingle(id: string) {
    setRejectingId(id)
    try {
      await adminDecide(token, id, 'reject')
      toast.success('Solicitação reprovada.')
      await load()
    } catch {
      toast.error('Falha ao reprovar a solicitação.')
    } finally {
      setRejectingId(null)
    }
  }

  async function approveSingle(id: string) {
    setApprovingId(id)
    try {
      await adminDecide(token, id, 'approve')
      toast.success('Solicitação aprovada.')
      await load()
    } catch {
      toast.error('Falha ao aprovar a solicitação.')
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-[#0b2a5b] text-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">Painel do Gestor — {companyName || '…'}</h1>
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
        <Tabs defaultValue="pending">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Aprovações Pendentes</TabsTrigger>
            <TabsTrigger value="bulk">Gerar em Massa</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {loading ? 'Carregando…' : `${requests.length} solicitação(ões) aguardando aprovação`}
              </p>
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

            {!loading && requests.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-3 px-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-muted-foreground">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                    />
                    Selecionar todos
                  </label>
                  {selected.size > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                        onClick={rejectSelected}
                        disabled={rejecting || approving}
                      >
                        {rejecting
                          ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Reprovando…</>
                          : <><X className="h-4 w-4 mr-1" /> Reprovar {selected.size} selecionado(s)</>
                        }
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#0b2a5b] text-white hover:bg-[#0b2a5b]/90"
                        onClick={approveSelected}
                        disabled={approving || rejecting}
                      >
                        {approving
                          ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Aprovando…</>
                          : <><CheckCheck className="h-4 w-4 mr-1" /> Aprovar {selected.size} selecionado(s)</>
                        }
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {requests.map((r) => {
                    return (
                      <Card
                        key={r.id}
                        className={`transition-shadow ${selected.has(r.id) ? 'ring-2 ring-[#0b2a5b]/40' : ''}`}
                      >
                        <CardHeader className="pb-2 pt-4 px-4">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selected.has(r.id)}
                              onCheckedChange={() => toggleSelect(r.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <CardTitle className="text-base font-semibold leading-tight">
                                  {r.requesterName}
                                </CardTitle>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => rejectSingle(r.id)}
                                    disabled={rejectingId === r.id || approvingId === r.id || approving || rejecting}
                                  >
                                    {rejectingId === r.id
                                      ? <Loader2 className="h-3 w-3 animate-spin" />
                                      : <><X className="h-3 w-3 mr-1" />Reprovar</>
                                    }
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs text-green-700 border-green-300 hover:bg-green-50 hover:text-green-800"
                                    onClick={() => approveSingle(r.id)}
                                    disabled={approvingId === r.id || rejectingId === r.id || approving || rejecting}
                                  >
                                    {approvingId === r.id
                                      ? <Loader2 className="h-3 w-3 animate-spin" />
                                      : <><Check className="h-3 w-3 mr-1" />Aprovar</>
                                    }
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="px-4 pb-3">
                          <div className="space-y-2">
                            {r.signatureItems.map((item, idx) => (
                              <div
                                key={idx}
                                className="rounded-md border bg-muted/30 px-3 py-2 text-sm space-y-0.5"
                              >
                                <p className="font-medium text-foreground">{item.name}</p>
                                <p className="text-muted-foreground">{item.jobTitle}</p>
                                {item.email && <p className="text-muted-foreground text-xs">{item.email}</p>}
                                {item.phone && <p className="text-muted-foreground text-xs">{item.phone}</p>}
                                {item.website && <p className="text-muted-foreground text-xs">{item.website}</p>}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="bulk">
            {companyDomain && <AdminBulkGenerator token={token} companyDomain={companyDomain} />}
          </TabsContent>
        </Tabs>
      </main>

    </div>
  )
}
