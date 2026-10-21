import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeDb } from './fake-supabase.js'
import { callHandler } from './http.js'

vi.mock('../_lib/supabase.js', async () => {
  const { fakeDb } = await import('./fake-supabase.js')
  return { supabase: fakeDb.client }
})

const { default: handler } = await import('../requests.js')

type Status = 'awaiting_approval' | 'approved' | 'rejected' | 'expired'

let seq = 0
function request(overrides: {
  id?: string
  requester_email: string
  requester_name?: string
  type?: 'single' | 'bulk'
  status?: Status
  signature_items: Array<{ name: string; jobTitle: string; email?: string }>
  created_at?: string
}) {
  seq++
  return {
    id: `req-${seq}`,
    requester_name: overrides.requester_name ?? 'Fulano',
    company_domain: 'itajaishopping.com.br',
    type: overrides.type ?? 'single',
    data_hash: 'hash',
    status: overrides.status ?? 'approved',
    decision_by: null,
    decision_reason: null,
    decided_at: null,
    created_at: overrides.created_at ?? new Date(Date.UTC(2026, 9, 1, 0, seq)).toISOString(),
    ...overrides,
  }
}

function list(email: string) {
  return callHandler(handler, { query: { email } })
}

beforeEach(() => {
  fakeDb.reset()
})

describe('GET /api/requests?email=', () => {
  it('mostra ao solicitante as próprias solicitações em todos os status', async () => {
    const statuses: Status[] = ['awaiting_approval', 'approved', 'rejected', 'expired']
    fakeDb.seed(
      'requests',
      statuses.map((status) =>
        request({
          requester_email: 'ana@itajaishopping.com.br',
          status,
          signature_items: [{ name: 'Ana', jobTitle: 'Analista' }],
        })
      )
    )

    const { status, body } = await list('ana@itajaishopping.com.br')

    expect(status).toBe(200)
    expect(body.requests.map((r: { status: Status }) => r.status).sort()).toEqual([...statuses].sort())
    expect(body.requests.every((r: { relation: string }) => r.relation === 'requested')).toBe(true)
  })

  it('mostra o lote aprovado de outra pessoa como gerado para o e-mail, com o nome da assinatura e quem gerou', async () => {
    fakeDb.seed('requests', [
      request({
        id: 'lote',
        requester_email: 'gestor@itajaishopping.com.br',
        requester_name: 'Gestor',
        type: 'bulk',
        status: 'approved',
        signature_items: [
          { name: 'Bia', jobTitle: 'Vendedora', email: 'bia@itajaishopping.com.br' },
          { name: 'Caio', jobTitle: 'Gerente', email: 'caio@itajaishopping.com.br' },
        ],
      }),
    ])

    const { status, body } = await list('caio@itajaishopping.com.br')

    expect(status).toBe(200)
    expect(body.requests).toHaveLength(1)
    expect(body.requests[0]).toMatchObject({
      id: 'lote',
      relation: 'generated_for',
      signatureName: 'Caio',
      requesterName: 'Gestor',
      status: 'approved',
    })
  })

  it('não mostra solicitações de outras pessoas que não foram aprovadas', async () => {
    const statuses: Status[] = ['awaiting_approval', 'rejected', 'expired']
    fakeDb.seed(
      'requests',
      statuses.map((status) =>
        request({
          requester_email: 'gestor@itajaishopping.com.br',
          type: 'bulk',
          status,
          signature_items: [{ name: 'Caio', jobTitle: 'Gerente', email: 'caio@itajaishopping.com.br' }],
        })
      )
    )

    const { status, body } = await list('caio@itajaishopping.com.br')

    expect(status).toBe(200)
    expect(body.requests).toEqual([])
  })

  it('encontra a assinatura mesmo com o e-mail digitado em maiúsculas e com espaços', async () => {
    fakeDb.seed('requests', [
      request({
        requester_email: 'gestor@itajaishopping.com.br',
        type: 'bulk',
        signature_items: [{ name: 'Caio', jobTitle: 'Gerente', email: 'caio@itajaishopping.com.br' }],
      }),
    ])

    const { body } = await list('  Caio@ItajaiShopping.com.br ')

    expect(body.requests).toHaveLength(1)
    expect(body.requests[0].relation).toBe('generated_for')
  })

  it('mostra uma única vez, como enviada, a solicitação em que o solicitante também está nos itens', async () => {
    fakeDb.seed('requests', [
      request({
        id: 'propria',
        requester_email: 'ana@itajaishopping.com.br',
        type: 'single',
        signature_items: [{ name: 'Ana', jobTitle: 'Analista', email: 'ana@itajaishopping.com.br' }],
      }),
    ])

    const { body } = await list('ana@itajaishopping.com.br')

    expect(body.requests).toHaveLength(1)
    expect(body.requests[0]).toMatchObject({ id: 'propria', relation: 'requested' })
  })

  it('não revela o tamanho do lote para quem só está nos itens', async () => {
    fakeDb.seed('requests', [
      request({
        requester_email: 'gestor@itajaishopping.com.br',
        type: 'bulk',
        signature_items: [
          { name: 'Bia', jobTitle: 'Vendedora', email: 'bia@itajaishopping.com.br' },
          { name: 'Caio', jobTitle: 'Gerente', email: 'caio@itajaishopping.com.br' },
          { name: 'Davi', jobTitle: 'Supervisor', email: 'davi@itajaishopping.com.br' },
        ],
      }),
    ])

    const { body } = await list('caio@itajaishopping.com.br')

    expect(body.requests[0].itemCount).toBe(1)
  })

  it('junta enviadas e geradas numa lista só, da mais recente para a mais antiga', async () => {
    fakeDb.seed('requests', [
      request({
        id: 'lote-antigo',
        requester_email: 'gestor@itajaishopping.com.br',
        type: 'bulk',
        created_at: '2026-01-10T12:00:00.000Z',
        signature_items: [{ name: 'Caio', jobTitle: 'Gerente', email: 'caio@itajaishopping.com.br' }],
      }),
      request({
        id: 'enviada',
        requester_email: 'caio@itajaishopping.com.br',
        status: 'awaiting_approval',
        created_at: '2026-05-10T12:00:00.000Z',
        signature_items: [{ name: 'Caio', jobTitle: 'Gerente Geral' }],
      }),
      request({
        id: 'lote-novo',
        requester_email: 'outro@itajaishopping.com.br',
        type: 'bulk',
        created_at: '2026-09-10T12:00:00.000Z',
        signature_items: [{ name: 'Caio', jobTitle: 'Gerente', email: 'caio@itajaishopping.com.br' }],
      }),
    ])

    const { body } = await list('caio@itajaishopping.com.br')

    expect(body.requests.map((r: { id: string; relation: string }) => [r.id, r.relation])).toEqual([
      ['lote-novo', 'generated_for'],
      ['enviada', 'requested'],
      ['lote-antigo', 'generated_for'],
    ])
  })

  it('encontra a assinatura de uma planilha com o e-mail em maiúsculas e espaços, depois de aprovada', async () => {
    vi.stubEnv('COMPANY_APPROVERS', JSON.stringify({ 'itajaishopping.com.br': ['gestor@itajaishopping.com.br'] }))
    const created = await callHandler(handler, {
      method: 'POST',
      body: {
        requesterName: 'Ana',
        requesterEmail: 'ana@itajaishopping.com.br',
        type: 'bulk',
        companyDomain: 'itajaishopping.com.br',
        signatureItems: [{ name: 'Caio', jobTitle: 'Gerente', email: '  Caio@ItajaiShopping.com.br ' }],
      },
    })
    expect(created.status).toBe(201)
    // A aprovação acontece por outra rota; aqui só o resultado dela importa.
    fakeDb.tables.requests[0].status = 'approved'

    const { body } = await list('caio@itajaishopping.com.br')

    expect(body.requests).toHaveLength(1)
    expect(body.requests[0]).toMatchObject({ id: created.body.requestId, relation: 'generated_for' })
  })

  it('nunca devolve os dados das assinaturas na listagem', async () => {
    fakeDb.seed('requests', [
      request({
        requester_email: 'gestor@itajaishopping.com.br',
        type: 'bulk',
        signature_items: [
          { name: 'Bia', jobTitle: 'Vendedora', email: 'bia@itajaishopping.com.br' },
          { name: 'Caio', jobTitle: 'Gerente', email: 'caio@itajaishopping.com.br' },
        ],
      }),
    ])

    const { body } = await list('caio@itajaishopping.com.br')

    expect(JSON.stringify(body)).not.toContain('Bia')
    expect(JSON.stringify(body)).not.toContain('Vendedora')
    expect(body.requests[0]).not.toHaveProperty('signatureItems')
  })

  it('devolve lista vazia quando o e-mail não aparece em nada', async () => {
    fakeDb.seed('requests', [
      request({
        requester_email: 'gestor@itajaishopping.com.br',
        type: 'bulk',
        signature_items: [{ name: 'Bia', jobTitle: 'Vendedora', email: 'bia@itajaishopping.com.br' }],
      }),
    ])

    const { status, body } = await list('ninguem@itajaishopping.com.br')

    expect(status).toBe(200)
    expect(body.requests).toEqual([])
  })

  it.each(['', 'caio', '@itajaishopping.com.br', 'caio@'])('recusa e-mail incompleto ou inválido (%j)', async (email) => {
    const { status } = await list(email)
    expect(status).toBe(400)
  })

  it('limita as consultas por IP', async () => {
    const ip = '203.0.113.7'
    const statuses: number[] = []
    for (let i = 0; i < 11; i++) {
      const { status } = await callHandler(handler, {
        query: { email: 'caio@itajaishopping.com.br' },
        headers: { 'x-forwarded-for': ip },
      })
      statuses.push(status)
    }

    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true)
    expect(statuses[10]).toBe(429)
  })
})
