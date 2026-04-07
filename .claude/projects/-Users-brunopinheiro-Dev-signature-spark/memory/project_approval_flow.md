---
name: Fluxo de Aprovação — Signature Spark
description: Arquitetura e arquivos do fluxo de aprovação com gestores implementado no projeto
type: project
---

Implementado fluxo completo de aprovação com identificação do solicitante, tokens seguros por gestor, e e-mails via Resend.

**Why:** O app era client-side puro (sem backend). Para ter aprovação segura com tokens invalidáveis, e-mails e auditoria, foi necessário adicionar Vercel Serverless Functions + Supabase + Resend.

**How to apply:** Qualquer mudança no fluxo de aprovação envolve os arquivos abaixo. Para adicionar campos à solicitação, atualizar o schema Supabase + tipos em `api/_lib/types.ts` + `src/types/approval.ts`.

### Estrutura adicionada

**Backend (Vercel Serverless Functions):**
- `api/requests.ts` — POST: cria solicitação, gera tokens, envia e-mails
- `api/approve/[token].ts` — GET: valida token; POST: registra decisão, invalida outros tokens
- `api/requests/[id].ts` — GET: retorna dados da solicitação para download (só expõe se aprovada)
- `api/_lib/supabase.ts` — cliente Supabase (service role key, server-side only)
- `api/_lib/crypto.ts` — generateToken() 256-bit, hashSignatureItems() SHA-256
- `api/_lib/approvers.ts` — carrega lista de gestores de `config/approvers.json` ou env var `APPROVERS_LIST`
- `api/_lib/email.ts` — templates HTML + envio via Resend (from: no-reply@taclashopping.com.br)
- `api/_lib/types.ts` — tipos compartilhados do backend

**Frontend (React):**
- `src/context/RequesterContext.tsx` — contexto com nome+email do solicitante
- `src/components/RequesterForm.tsx` — tela de identificação (bloqueia acesso sem preencher)
- `src/components/ApprovalPage.tsx` — rota /approve/:token (para gestores)
- `src/components/DownloadPage.tsx` — rota /download/:requestId (para solicitante após aprovação)
- `src/lib/api.ts` — cliente fetch para os endpoints

**Configuração:**
- `config/approvers.json` — lista editável de e-mails gestores
- `supabase/schema.sql` — schema do banco (rodar no Supabase SQL Editor)
- `.env.example` — variáveis necessárias: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, APP_URL
- `vercel.json` — rewrite corrigido para não interceptar rotas /api/

**Tabelas Supabase:**
- `requests` — solicitações (status: awaiting_approval | approved | rejected | expired)
- `approval_tokens` — tokens por gestor por solicitação (expires_at 72h, uso único)
- `audit_logs` — log imutável de todos os eventos

**Segurança implementada:**
- Tokens 256-bit aleatórios, um por gestor
- Anti-auto-aprovação verificada no POST /api/approve/:token
- Primeira decisão invalida todos os outros tokens da mesma solicitação
- Lista de gestores nunca exposta ao client
- signatureItems imutáveis após submissão (hash SHA-256 armazenado)
