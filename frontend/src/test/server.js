import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// ─── Dados de exemplo ────────────────────────────────────────────────────────

export const mockItems = [
  {
    id: 1,
    name: 'Arroz',
    category: 'cereal',
    unit_of_measure: 'kg',
    min_stock_level: 10,
    is_essential: true,
    nutritional_info: 'Rico em carboidratos',
    conversion_factor: 1,
  },
  {
    id: 2,
    name: 'Feijão',
    category: 'grão',
    unit_of_measure: 'kg',
    min_stock_level: 5,
    is_essential: true,
    nutritional_info: 'Rico em proteínas',
    conversion_factor: 1,
  },
]

export const mockBatches = [
  {
    id: 1,
    item_type_id: 1,
    item_name: 'Arroz',
    item_category: 'cereal',
    item_unit_of_measure: 'kg',
    item_conversion_factor: 1,
    initial_quantity: 50,
    current_quantity: 40,
    expiration_date: '2027-01-01',
    entry_date: '2026-01-01',
    status: 'disponível',
  },
]

export const mockDonationPackets = []
export const mockDonationItems = []

// ─── Handlers padrão ─────────────────────────────────────────────────────────

export const handlers = [
  // Auth
  http.post('http://localhost:3333/auth/login', async ({ request }) => {
    const body = await request.json()
    if (body.email === 'admin@ong.org' && body.password === 'senha123') {
      return new HttpResponse(null, { status: 200 })
    }
    return new HttpResponse(null, { status: 401 })
  }),

  // Items
  http.get('http://localhost:3333/items', () => {
    return HttpResponse.json(mockItems)
  }),

  http.post('http://localhost:3333/items', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 99, ...body }, { status: 201 })
  }),

  http.put('http://localhost:3333/items/:id', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(body, { status: 200 })
  }),

  http.delete('http://localhost:3333/items/:id', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Batches
  http.get('http://localhost:3333/batch', () => {
    return HttpResponse.json(mockBatches)
  }),

  // Donations
  http.get('http://localhost:3333/donation-packets', () => {
    return HttpResponse.json(mockDonationPackets)
  }),

  http.get('http://localhost:3333/donation-items', () => {
    return HttpResponse.json(mockDonationItems)
  }),
]

// ─── Instância do servidor MSW ────────────────────────────────────────────────

export const server = setupServer(...handlers)
