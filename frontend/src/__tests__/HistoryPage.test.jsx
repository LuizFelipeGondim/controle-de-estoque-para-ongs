import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import HistoryPage from '../HistoryPage'

// ─── Props padrão (navegação) ─────────────────────────────────────────────────
const defaultProps = {
  onBack: vi.fn(),
  onViewOverview: vi.fn(),
  onViewHistory: vi.fn(),
  onViewDonations: vi.fn(),
  onViewBatches: vi.fn(),
  onViewItems: vi.fn(),
  onLogout: vi.fn(),
}

function renderPage(props = {}) {
  return render(<HistoryPage {...defaultProps} {...props} />)
}

// ─── Estados de carregamento / erro ──────────────────────────────────────────

describe('HistoryPage — carregamento e erro', () => {
  it('exibe estado de carregamento antes dos dados chegarem', () => {
    renderPage()
    expect(screen.getByText(/compilando histórico/i)).toBeInTheDocument()
  })

  it('exibe mensagem de erro quando alguma API falha', async () => {
    server.use(
      http.get('http://localhost:3333/batch', () => new HttpResponse(null, { status: 500 }))
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/erro ao compilar histórico de movimentações/i)).toBeInTheDocument()
    })
  })
})

// ─── Exibição e consolidação ──────────────────────────────────────────────────

describe('HistoryPage — exibição e consolidação de entradas e saídas', () => {
  it('exibe a lista consolidada com Entradas e Saídas formatadas', async () => {
    // Adicionar um item para o pacote 2 (finalizado)
    server.use(
      http.get('http://localhost:3333/donation-items', () => {
        return HttpResponse.json([
          { id: 99, donation_packet_id: 2, batch_id: 1, quantity_removed: 15, item_name: 'Feijão', item_unit: 'kg' }
        ])
      })
    )

    renderPage()

    await waitFor(() => {
      // "Casa do Menor" é o parceiro de destino para a Saída do mock finalizado (ID 2 do mock)
      // "Doador/Fornecedor" é o padrão para entradas de lote
      expect(screen.getByText('Casa do Menor')).toBeInTheDocument()
      expect(screen.getAllByText('Doador/Fornecedor').length).toBeGreaterThan(0)
    })

    // Checando as badges de tipo
    expect(screen.getAllByText('⬇ Entrada').length).toBeGreaterThan(0)
    expect(screen.getAllByText('⬆ Saída').length).toBeGreaterThan(0)
  })

  it('exibe o estado vazio quando não há itens', async () => {
    // Sobrescrevendo os mocks para retornar listas vazias
    server.use(
      http.get('http://localhost:3333/batch', () => HttpResponse.json([])),
      http.get('http://localhost:3333/donation-packets', () => HttpResponse.json([])),
      http.get('http://localhost:3333/donation-items', () => HttpResponse.json([]))
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/nenhuma movimentação registrada no período/i)).toBeInTheDocument()
    })
  })
})

// ─── Filtros ──────────────────────────────────────────────────────────────────

describe('HistoryPage — filtros', () => {
  it('filtra movimentações por busca de nome do item', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getAllByText(/arroz/i))

    const searchInput = screen.getByPlaceholderText(/buscar por item/i)
    await user.type(searchInput, 'feijão')

    expect(screen.getByText(/feijão/i)).toBeInTheDocument()
    expect(screen.queryByText(/arroz /i)).not.toBeInTheDocument() // espaço após arroz para evitar capturas fracas
  })

  it('filtra movimentações por tipo (Entrada / Saída)', async () => {
    // Override local para garantir existência de saída
    server.use(
      http.get('http://localhost:3333/donation-items', () => {
        return HttpResponse.json([
          { id: 99, donation_packet_id: 2, batch_id: 1, quantity_removed: 15, item_name: 'Feijão', item_unit: 'kg' }
        ])
      })
    )
    
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getAllByText(/arroz/i))

    const typeSelect = screen.getAllByRole('combobox').find(el => el.classList.contains('history-filter-select'))
    
    // Filtrando por Saída
    await user.selectOptions(typeSelect, 'saida')

    expect(screen.queryAllByText('⬇ Entrada').length).toBe(0) // Nenhuma entrada deve ser mostrada
    expect(screen.getAllByText('⬆ Saída').length).toBeGreaterThan(0)
  })

  it('botão "Limpar Filtros" limpa os filtros e retorna todos os itens', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getAllByText(/arroz/i))

    const searchInput = screen.getByPlaceholderText(/buscar por item/i)
    await user.type(searchInput, 'texto que nao existe')

    expect(screen.getByRole('button', { name: /limpar filtros/i })).toBeInTheDocument()
    expect(screen.queryAllByText('⬇ Entrada').length).toBe(0)
    expect(screen.queryAllByText('⬆ Saída').length).toBe(0)

    await user.click(screen.getByRole('button', { name: /limpar filtros/i }))

    expect(screen.getAllByText(/arroz/i).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /limpar filtros/i })).not.toBeInTheDocument()
  })
})

// ─── Navegação ────────────────────────────────────────────────────────────────

describe('HistoryPage — navegação', () => {
  it('chama onLogout ao clicar em "Sair"', async () => {
    const onLogout = vi.fn()
    const user = userEvent.setup()
    renderPage({ onLogout })

    await waitFor(() => screen.getAllByText('Doador/Fornecedor'))

    await user.click(screen.getByRole('button', { name: /sair/i }))
    expect(onLogout).toHaveBeenCalledOnce()
  })

  it('chama onViewOverview ao clicar em "Overview"', async () => {
    const onViewOverview = vi.fn()
    const user = userEvent.setup()
    renderPage({ onViewOverview })

    await waitFor(() => screen.getAllByText('Doador/Fornecedor'))

    await user.click(screen.getByRole('button', { name: /overview/i }))
    expect(onViewOverview).toHaveBeenCalledOnce()
  })

  it('chama onViewDonations ao clicar em "Doações"', async () => {
    const onViewDonations = vi.fn()
    const user = userEvent.setup()
    renderPage({ onViewDonations })

    await waitFor(() => screen.getAllByText('Doador/Fornecedor'))

    await user.click(screen.getByRole('button', { name: /^doaç/i }))
    expect(onViewDonations).toHaveBeenCalledOnce()
  })
  
  it('chama onViewBatches ao clicar em "Lotes"', async () => {
    const onViewBatches = vi.fn()
    const user = userEvent.setup()
    renderPage({ onViewBatches })

    await waitFor(() => screen.getAllByText('Doador/Fornecedor'))

    await user.click(screen.getByRole('button', { name: /^lotes$/i }))
    expect(onViewBatches).toHaveBeenCalledOnce()
  })
})
