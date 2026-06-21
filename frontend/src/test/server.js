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
  {
    id: 2,
    item_type_id: 2,
    item_name: 'Feijão',
    item_category: 'grão',
    item_unit_of_measure: 'kg',
    item_conversion_factor: 1,
    initial_quantity: 20,
    current_quantity: 20,
    expiration_date: '2020-01-01', // vencido
    entry_date: '2026-01-01',
    status: 'disponível',
  },
  {
    id: 3,
    item_type_id: 1,
    item_name: 'Arroz',
    item_category: 'cereal',
    item_unit_of_measure: 'kg',
    item_conversion_factor: 1,
    initial_quantity: 30,
    current_quantity: 0,
    expiration_date: '2027-06-01',
    entry_date: '2026-01-01',
    status: 'esgotado',
  },
]

export const mockDonationPackets = [
  {
    id: 1,
    destination: 'Abrigo Esperança',
    destination_address: 'Rua das Flores, 123',
    donation_date: '2027-01-15',
    notes: 'Entrega urgente',
    status: 'preparando',
  },
  {
    id: 2,
    destination: 'Casa do Menor',
    destination_address: null,
    donation_date: '2026-12-20',
    notes: '',
    status: 'finalizado',
  },
]

export const mockDonationItems = [
  {
    id: 1,
    donation_packet_id: 1,
    batch_id: 1,
    quantity_removed: 10,
    item_name: 'Arroz',
    item_unit: 'kg',
  },
]

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

  http.post('http://localhost:3333/batch', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 99, ...body }, { status: 201 })
  }),

  http.delete('http://localhost:3333/batch/:id', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Donations
  http.get('http://localhost:3333/donation-packets', () => {
    return HttpResponse.json(mockDonationPackets)
  }),

  http.get('http://localhost:3333/donation-packets/:id', ({ params }) => {
    const packet = mockDonationPackets.find(p => p.id === Number(params.id))
    return packet ? HttpResponse.json(packet) : new HttpResponse(null, { status: 404 })
  }),

  http.post('http://localhost:3333/donation-packets', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 99, status: 'preparando', ...body }, { status: 201 })
  }),

  http.delete('http://localhost:3333/donation-packets/:id', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.patch('http://localhost:3333/donation-packets/:id/status', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ status: body.status })
  }),

  http.get('http://localhost:3333/donation-items', () => {
    return HttpResponse.json(mockDonationItems)
  }),

  http.post('http://localhost:3333/donation-items', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 99, ...body }, { status: 201 })
  }),

  http.delete('http://localhost:3333/donation-items/:id', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('http://localhost:3333/batch/:id', ({ params }) => {
    const batch = mockBatches.find(b => b.id === Number(params.id))
    return batch ? HttpResponse.json(batch) : new HttpResponse(null, { status: 404 })
  }),
]

// ─── Instância do servidor MSW ────────────────────────────────────────────────

export const server = setupServer(...handlers)
