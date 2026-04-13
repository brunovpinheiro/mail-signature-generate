# PRD — Ajustes no Gerador de Assinaturas Tacla Shopping

**Data:** 2026-04-12  
**Status:** Implementado  
**Projeto:** signature-spark

---

## Contexto

O gerador já possui um fluxo funcional:

1. Solicitante informa nome + e-mail → preenche dados da assinatura → envia para aprovação
2. Gestor recebe e-mail com link único (`/approve/:token`) → aprova ou reprova
3. Solicitante recebe e-mail com link de download (`/download/:requestId`)

Existem três ajustes solicitados:

1. Detecção automática de empresa pelo domínio do e-mail (12 empresas)
2. Painel web de aprovação para gestores (sem dependência de e-mail)
3. Manutenção do fluxo atual de notificação por e-mail pós-aprovação

---

## Funcionalidade 1 — Detecção de Empresa pelo Domínio de E-mail

### Objetivo

Ao informar o e-mail no `RequesterForm`, o sistema detecta o domínio e carrega automaticamente o template e a identidade visual da empresa correspondente.

### Empresas (12 no total)

| #    | Empresa                                        | Domínio de e-mail           | Template ID |
| ---- | ---------------------------------------------- | --------------------------- | ----------- |
| 1    | Tacla Shopping (grupo principal)               | `@taclashopping.com.br`     | `tacla`     |
| 2    | Palladium Curitiba                             | `@palladiumcuritiba.com.br` | `palladium` |
| 3–12 | _(a preencher com os demais domínios e nomes)_ | `@...`                      | `...`       |

> **Ação necessária antes da implementação:** fornecer a lista completa dos 12 domínios com nome da empresa e, se houver, cor/logo diferente por empresa.

### Comportamento esperado

- Enquanto o usuário digita o e-mail no `RequesterForm`, nenhuma empresa é exibida.
- Assim que o e-mail for válido e o domínio reconhecido, aparece um badge/indicador discreto: **"Empresa detectada: Palladium Curitiba"**.
- Se o domínio não for reconhecido (e-mail externo, pessoal), o sistema usa o template padrão do grupo Tacla ou bloqueia o acesso (a definir).
- O template selecionado é passado para o `SignatureEditor` e `SignaturePreview`.

### Impacto técnico

- **`src/lib/company-domains.ts`** (novo): mapa `domínio → { companyName, templateId, brandColor, logoUrl }`.
- **`src/lib/templates/`**: adicionar os demais templates (1 por empresa ou agrupados se o layout for igual e só muda logo/cor).
- **`src/context/RequesterContext.tsx`**: incluir `company` no estado do solicitante.
- **`src/components/RequesterForm.tsx`**: exibir feedback visual de empresa detectada.
- **`src/components/SignatureEditor.tsx`**: receber `templateId` da empresa ao invés do default fixo.

---

## Funcionalidade 2 — Painel de Aprovação para Gestores

### Objetivo

Substituir (ou complementar) o fluxo de aprovação por link individual com um painel web centralizado onde os gestores fazem login e veem todas as solicitações pendentes.

### Rota

`/admin` (protegida por autenticação simples)

### Autenticação do Gestor

**Opção recomendada — senha fixa compartilhada (MVP):**

- Gestor acessa `/admin`, informa uma senha configurada via variável de ambiente (`MANAGER_PASSWORD`).
- Após autenticação, recebe um token de sessão simples (JWT com expiração de 8h) armazenado em `localStorage`.
- Sem cadastro de usuário, sem OAuth — suficiente para um time pequeno.

**Opção futura:** integrar com o provedor de identidade corporativo (Google Workspace SSO), se necessário.

### Tela: Lista de Solicitações

| Campo exibido                | Origem                                        |
| ---------------------------- | --------------------------------------------- |
| Nome do solicitante          | `requesterName`                               |
| E-mail do solicitante        | `requesterEmail`                              |
| Empresa detectada            | `company.name`                                |
| Tipo (Individual / Em Massa) | `type`                                        |
| Quantidade de assinaturas    | `signatureItems.length`                       |
| Data da solicitação          | `createdAt`                                   |
| Status                       | `awaiting_approval` / `approved` / `rejected` |

**Sem preview visual da assinatura** — apenas os dados preenchidos pelo solicitante (nome, cargo, telefone, etc.).

### Tela: Detalhe da Solicitação

Ao clicar em uma solicitação pendente, o gestor vê:

- Dados do solicitante (nome, e-mail, empresa)
- Lista de assinaturas solicitadas com os campos preenchidos:
  - Nome | Cargo | E-mail | Telefone | Website
- Botões: **Aprovar** / **Reprovar** (reprovar exige justificativa, como no fluxo atual)

### Comportamento após decisão

- Status da solicitação atualizado no banco.
- Solicitante recebe e-mail (igual ao fluxo atual):
  - **Aprovado:** e-mail com link de download.
  - **Reprovado:** e-mail com o motivo.
- Solicitação some da fila de pendentes e vai para "Histórico".

### Filtros úteis (MVP)

- Filtro por status: Pendentes / Aprovadas / Reprovadas
- Filtro por empresa
- Ordenação por data (mais recente primeiro, padrão)

### Impacto técnico

- **`src/components/AdminLogin.tsx`** (novo): tela de login do gestor.
- **`src/components/AdminDashboard.tsx`** (novo): painel com lista de solicitações.
- **`src/components/AdminRequestDetail.tsx`** (novo): detalhe + ação de aprovação.
- **`src/lib/api.ts`**: novos endpoints:
  - `GET /api/admin/requests` — lista paginada com filtros
  - `GET /api/admin/requests/:id` — detalhe
  - `POST /api/admin/requests/:id/decide` — aprovar ou reprovar
  - `POST /api/admin/login` — autenticação
- **`api/admin/`** (Vercel Functions): implementar os handlers acima com verificação de token JWT.
- **`src/App.tsx`**: adicionar rotas `/admin` e `/admin/requests/:id`.

---

## Funcionalidade 3 — Manutenção do Fluxo de E-mail

O fluxo existente de e-mail por link (`/approve/:token`) **permanece funcional** em paralelo com o painel. O gestor pode aprovar por qualquer um dos dois caminhos.

Ajuste necessário: os e-mails de notificação enviados ao gestor devem incluir o nome da empresa detectada no assunto e no corpo.

Exemplo de assunto atual:

> "Nova solicitação de assinatura — João Silva"

Exemplo ajustado:

> "[Palladium Curitiba] Nova solicitação de assinatura — João Silva"

---

## Fora do Escopo deste PRD

- Geração de assinaturas em massa com upload CSV (já existe, sem alteração)
- Customização de templates pelo gestor via interface
- Multitenancy isolado por empresa (banco/projeto separado por empresa)
- Autenticação do solicitante com senha (continua sendo só nome + e-mail)

---

## Dependências e Perguntas em Aberto

| #   | Pergunta                                                                                                        | Quem responde                                                                                                                                                                                                                                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Quais são os 12 domínios de e-mail e os nomes exatos das empresas?                                              | taclashopping.com.br, palladiumcuritiba.com.br, palladiumumuarama.com.br, palladiumpontagrossa.com.br, catuaipalladium.com.br, itajaishopping.com.br, outletportobelo.com.br, citycenteroutlet.com.br, venturashopping.com.br, shoppingestacao.com.br, jockeyplaza.com.br, shoppingcidadesorocaba.com.br, plazacamposgerais.com.br |
| 2   | Cada empresa tem logo e cor primária diferentes no template, ou o layout é idêntico para todas?                 | Tacla Shopping segue modelo unido, os demais mudam logo                                                                                                                                                                                                                                                                            |
| 3   | O que acontece se o domínio do e-mail não for reconhecido — bloqueia ou usa template padrão Tacla?              | Bloqueia e avisa que este dominio não é permitido.                                                                                                                                                                                                                                                                                 |
| 4   | O painel do gestor precisa de histórico visível ou só a fila de pendentes é suficiente?                         | Fila de pendentes somente                                                                                                                                                                                                                                                                                                          |
| 5   | Mais de uma pessoa pode ser gestor aprovador? Se sim, qualquer um aprova ou precisa ser específico por empresa? | Especifico por empresa                                                                                                                                                                                                                                                                                                             |

---

## Ordem de Implementação Sugerida

1. **Mapeamento de domínios** — criar `company-domains.ts` com os 12 domínios (após resposta às perguntas 1–3)
2. **Detecção no RequesterForm** — lógica de detecção + feedback visual
3. **Templates por empresa** — duplicar/ajustar o template default com as identidades visuais
4. **API do painel** — endpoints `GET/POST /api/admin/*` com autenticação JWT
5. **Frontend do painel** — `AdminLogin`, `AdminDashboard`, `AdminRequestDetail`
6. **Rotas no App.tsx** — integrar `/admin`
7. **Ajuste nos e-mails** — incluir nome da empresa no assunto/corpo
