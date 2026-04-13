import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { adminLogin } from '@/lib/api'

interface AdminLoginProps {
  onLogin: (token: string, companyName: string) => void
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await adminLogin(email.trim(), password)
      // Persiste token na sessão para não perder ao navegar
      sessionStorage.setItem('admin_token', result.token)
      onLogin(result.token, result.domain)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-[#0b2a5b] text-white">
        <div className="container mx-auto flex items-center justify-center px-4 py-4">
          <h1 className="text-xl font-bold">Tacla Shopping — Painel de Gestores</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-center mb-2">
              <div className="rounded-full bg-[#0b2a5b]/10 p-3">
                <ShieldCheck className="h-8 w-8 text-[#0b2a5b]" />
              </div>
            </div>
            <CardTitle className="text-center text-lg">Acesso de Gestor</CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              Informe seu e-mail corporativo e a senha do painel.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="admin-email">E-mail</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="gestor@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Senha</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-[#0b2a5b] text-white hover:bg-[#0b2a5b]/90"
                size="lg"
                disabled={loading || !email.trim() || !password.trim()}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
