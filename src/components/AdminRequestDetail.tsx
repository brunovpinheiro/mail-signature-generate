import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle, ArrowLeft, ShieldCheck } from 'lucide-react'
import { adminDecide } from '@/lib/api'
import type { AdminRequest } from '@/lib/api'

interface LocationState {
  request: AdminRequest
  token: string
  companyName: string
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

export function AdminRequestDetail() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: LocationState | null }

  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [done, setDone] = useState<'approve' | 'reject' | null>(null)

  if (!state?.request) {
    return (
      <PageShell>
        <p className="text-muted-foreground text-sm">Solicitação não encontrada.</p>
        <Button variant="outline" onClick={() => navigate('/admin')} className="mt-4">
          Voltar ao painel
        </Button>
      </PageShell>
    )
  }

  const { request: r, token, companyName } = state
  const typeLabel = r.type === 'single' ? 'Individual' : `Em Massa (${r.itemCount} assinaturas)`

  async function handleDecision() {
    if (!action) return
    if (action === 'reject' && !reason.trim()) {
      setReasonError(true)
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      await adminDecide(token, r.id, action, reason.trim() || undefined)
      setDone(action)
    } catch (err) {
      setSubmitError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <PageShell companyName={companyName}>
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6 space-y-4 text-center">
            {done === 'approve'
              ? <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              : <XCircle className="h-12 w-12 text-red-500 mx-auto" />}
            <h2 className="text-lg font-semibold">
              {done === 'approve' ? 'Assinatura aprovada!' : 'Solicitação reprovada'}
            </h2>
            <p className="text-sm text-muted-foreground">
              O solicitante foi notificado por e-mail.
            </p>
            <Button
              className="bg-[#0b2a5b] text-white hover:bg-[#0b2a5b]/90"
              onClick={() => navigate('/admin')}
            >
              Voltar ao painel
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  return (
    <PageShell companyName={companyName}>
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </div>

        {/* Dados do solicitante */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0b2a5b]" />
              Detalhes da Solicitação
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p><span className="text-muted-foreground">Solicitante:</span> <strong>{r.requesterName}</strong></p>
            <p><span className="text-muted-foreground">E-mail:</span> {r.requesterEmail}</p>
            <p><span className="text-muted-foreground">Tipo:</span> {typeLabel}</p>
            <p><span className="text-muted-foreground">Data:</span> {formatDate(r.createdAt)}</p>
          </CardContent>
        </Card>

        {/* Dados das assinaturas (sem preview visual) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Dados das Assinaturas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {r.signatureItems.map((item, i) => (
              <div key={i} className="rounded-md bg-muted/40 border px-4 py-3 text-sm space-y-1">
                {r.type === 'bulk' && (
                  <p className="text-xs font-medium text-muted-foreground mb-1">Assinatura {i + 1}</p>
                )}
                <p><span className="text-muted-foreground">Nome:</span> <strong>{item.name}</strong></p>
                <p><span className="text-muted-foreground">Cargo:</span> {item.jobTitle}</p>
                {item.email && <p><span className="text-muted-foreground">E-mail:</span> {item.email}</p>}
                {item.phone && <p><span className="text-muted-foreground">Telefone:</span> {item.phone}</p>}
                {item.website && <p><span className="text-muted-foreground">Website:</span> {item.website}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Ações */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            {submitError && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {submitError}
              </div>
            )}

            {action === 'reject' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Justificativa da reprovação <span className="text-red-500">*</span>
                </label>
                <textarea
                  className={`w-full rounded-md border px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring ${reasonError ? 'border-red-500' : ''}`}
                  placeholder="Descreva o motivo da reprovação…"
                  value={reason}
                  onChange={(e) => { setReason(e.target.value); setReasonError(false) }}
                />
                {reasonError && <p className="text-sm text-red-500">Justificativa obrigatória.</p>}
              </div>
            )}

            <div className="flex gap-3">
              {action !== 'reject' && (
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="lg"
                  onClick={() => action === 'approve' ? handleDecision() : setAction('approve')}
                  disabled={submitting}
                >
                  {submitting && action === 'approve'
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  {action === 'approve' ? 'Confirmar Aprovação' : 'Aprovar'}
                </Button>
              )}

              {action !== 'approve' && (
                <Button
                  variant={action === 'reject' ? 'default' : 'outline'}
                  className={action === 'reject' ? 'flex-1 bg-red-600 hover:bg-red-700' : 'flex-1'}
                  size="lg"
                  onClick={() => action === 'reject' ? handleDecision() : setAction('reject')}
                  disabled={submitting}
                >
                  {submitting && action === 'reject'
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <XCircle className="mr-2 h-4 w-4" />}
                  {action === 'reject' ? 'Confirmar Reprovação' : 'Reprovar'}
                </Button>
              )}

              {action !== null && (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => { setAction(null); setReason(''); setReasonError(false) }}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}

function PageShell({ children, companyName }: { children: React.ReactNode; companyName?: string }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-[#0b2a5b] text-white">
        <div className="container mx-auto flex items-center justify-center px-4 py-4">
          <h1 className="text-xl font-bold">
            Painel de Aprovações{companyName ? ` — ${companyName}` : ''}
          </h1>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center px-4 py-8">
        {children}
      </main>
    </div>
  )
}
