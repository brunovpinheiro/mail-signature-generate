import type { VercelRequest, VercelResponse } from '@vercel/node'
import { signAdminToken } from '../_lib/admin-auth.js'
import { getManagerDomain } from '../_lib/approvers.js'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body as { email?: string; password?: string }

  if (!email?.trim() || !isValidEmail(email)) {
    return res.status(400).json({ error: 'E-mail inválido.' })
  }
  if (!password?.trim()) {
    return res.status(400).json({ error: 'Senha obrigatória.' })
  }

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    console.error('[admin/login] ADMIN_PASSWORD env var not set')
    return res.status(500).json({ error: 'Configuração de autenticação ausente.' })
  }

  // Verifica senha
  if (password.trim() !== adminPassword) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' })
  }

  // Verifica se o e-mail está cadastrado como aprovador de alguma empresa
  const normalizedEmail = email.trim().toLowerCase()
  const domain = getManagerDomain(normalizedEmail)

  if (!domain) {
    return res.status(403).json({ error: 'E-mail não autorizado como gestor.' })
  }

  const token = signAdminToken(normalizedEmail, domain)
  return res.status(200).json({ token, domain })
}
