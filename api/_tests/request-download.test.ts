import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeDb } from './fake-supabase.js'
import { callHandler } from './http.js'

vi.mock('../_lib/supabase.js', async () => {
  const { fakeDb } = await import('./fake-supabase.js')
  return { supabase: fakeDb.client }
})

const { default: handler } = await import('../requests/[id].js')

const bia = { name: 'Bia', jobTitle: 'Vendedora', email: 'bia@itajaishopping.com.br' }
const caio = { name: 'Caio', jobTitle: 'Gerente', email: 'caio@itajaishopping.com.br' }
const semEmail = { name: 'Davi', jobTitle: 'Supervisor' }

function seedLote(status: 'awaiting_approval' | 'approved' | 'rejected' | 'expired' = 'approved') {
  fakeDb.seed('requests', [
    {
      id: 'lote',
      requester_name: 'Gestor',
      requester_email: 'gestor@itajaishopping.com.br',
      company_domain: 'itajaishopping.com.br',
      type: 'bulk',
      signature_items: [bia, caio, semEmail],
      data_hash: 'hash',
      status,
      decision_by: status === 'approved' ? 'gestor@itajaishopping.com.br' : null,
      decision_reason: null,
      decided_at: status === 'approved' ? '2026-10-01T12:00:00.000Z' : null,
      created_at: '2026-10-01T11:00:00.000Z',
    },
  ])
}

function download(id: string, email?: string) {
  return callHandler(handler, { query: email === undefined ? { id } : { id, email } })
}

beforeEach(() => {
  fakeDb.reset()
})

describe('GET /api/requests/:id', () => {
  it('entrega a quem está no lote só a própria assinatura, como individual', async () => {
    seedLote()

    const { status, body } = await download('lote', 'caio@itajaishopping.com.br')

    expect(status).toBe(200)
    expect(body.type).toBe('single')
    expect(body.signatureItems).toEqual([caio])
  })

  it('sem e-mail, entrega a solicitação aprovada inteira, como hoje', async () => {
    seedLote()

    const { status, body } = await download('lote')

    expect(status).toBe(200)
    expect(body).toMatchObject({
      id: 'lote',
      type: 'bulk',
      requesterName: 'Gestor',
      companyDomain: 'itajaishopping.com.br',
      status: 'approved',
      decidedAt: '2026-10-01T12:00:00.000Z',
      signatureItems: [bia, caio, semEmail],
    })
  })

  it('sem e-mail, não entrega os itens de uma solicitação não aprovada', async () => {
    seedLote('awaiting_approval')

    const { status, body } = await download('lote')

    expect(status).toBe(200)
    expect(body.status).toBe('awaiting_approval')
    expect(body.signatureItems).toBeNull()
  })

  it('com o e-mail do solicitante, entrega todos os itens', async () => {
    seedLote()

    const { status, body } = await download('lote', 'gestor@itajaishopping.com.br')

    expect(status).toBe(200)
    expect(body.type).toBe('bulk')
    expect(body.signatureItems).toEqual([bia, caio, semEmail])
  })

  it('aceita o e-mail com maiúsculas e espaços', async () => {
    seedLote()

    const { status, body } = await download('lote', ' Caio@ItajaiShopping.com.br ')

    expect(status).toBe(200)
    expect(body.signatureItems).toEqual([caio])
  })

  it('responde 404 para um e-mail que não está no lote', async () => {
    seedLote()

    const { status, body } = await download('lote', 'ninguem@itajaishopping.com.br')

    expect(status).toBe(404)
    expect(body).not.toHaveProperty('signatureItems')
  })

  it.each(['awaiting_approval', 'rejected', 'expired'] as const)(
    'não entrega nada a quem está num lote %s de outra pessoa',
    async (status) => {
      seedLote(status)

      const result = await download('lote', 'caio@itajaishopping.com.br')

      expect(result.status).toBe(404)
      expect(result.body).not.toHaveProperty('signatureItems')
    }
  )

  it('com o e-mail do solicitante, não entrega os itens de uma solicitação não aprovada', async () => {
    seedLote('awaiting_approval')

    const { status, body } = await download('lote', 'gestor@itajaishopping.com.br')

    expect(status).toBe(200)
    expect(body.signatureItems).toBeNull()
  })

  it('responde 404 para uma solicitação que não existe', async () => {
    const { status } = await download('nao-existe', 'caio@itajaishopping.com.br')
    expect(status).toBe(404)
  })
})
