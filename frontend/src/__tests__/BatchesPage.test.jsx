import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server, mockBatches, mockItems } from '../test/server'
import BatchesPage from '../BatchesPage'

// ─── Props padrão (navegação) ─────────────────────────────────────────────────
const defaultProps = {
  onBack: vi.fn(),
  onViewOverview: vi.fn(),
  onViewHistory: vi.fn(),
  onViewDonations: vi.fn(),
  onViewBatches: vi.fn(),
  onViewItems: vi.fn(),
  onLogout: vi.fn(),
  initialBatchId: null,
  onClearInitialBatch: vi.fn(),
}

function renderPage(props = {}) {
  return render(<BatchesPage {...defaultProps} {...props} />)
}

// ─── Estados de carregamento / erro ──────────────────────────────────────────

describe('BatchesPage — carregamento e erro', () => {
  it('exibe estado de carregamento antes dos dados chegarem', () => {
    server.use(
      http.get('http://localhost:3333/batch', () => new Promise(() => {})),
      http.get('http://localhost:3333/items', () => new Promise(() => {}))
    )

    renderPage()
    expect(screen.getByText(/carregando lotes/i)).toBeInTheDocument()
  })

  it('exibe mensagem de erro quando a API de lotes falha', async () => {
    server.use(
      http.get('http://localhost:3333/batch', () =>
        new HttpResponse(null, { status: 500 })
      )
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/falha ao buscar lotes/i)).toBeInTheDocument()
    })
  })

  it('exibe mensagem de erro quando a API de itens falha', async () => {
    server.use(
      http.get('http://localhost:3333/items', () =>
        new HttpResponse(null, { status: 500 })
      )
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/falha ao buscar itens/i)).toBeInTheDocument()
    })
  })
})

// ─── Exibição dos lotes ───────────────────────────────────────────────────────

describe('BatchesPage — exibição de lotes', () => {
  it('exibe os lotes após o carregamento', async () => {
    renderPage()

    await waitFor(() => {
      // mockBatches[0] e [2] são Arroz, mockBatches[1] é Feijão
      const arrozCells = screen.getAllByText(/🌾 Arroz/i)
      expect(arrozCells.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/🫘 Feijão/i)).toBeInTheDocument()
    })
  })

  it('exibe mensagem de vazio quando não há lotes', async () => {
    server.use(
      http.get('http://localhost:3333/batch', () => HttpResponse.json([])),
      http.get('http://localhost:3333/items', () => HttpResponse.json([]))
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/nenhum lote registrado/i)).toBeInTheDocument()
    })
  })

  it('exibe badge "Disponível" para lote ativo não vencido', async () => {
    renderPage()

    await waitFor(() => {
      const pills = screen.getAllByText('Disponível')
      expect(pills.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('exibe badge "Vencido" para lote com data de validade passada', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Vencido')).toBeInTheDocument()
    })
  })

  it('exibe badge "Esgotado" para lote com status esgotado', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Esgotado')).toBeInTheDocument()
    })
  })

  it('exibe o total de kg recebidos no cabeçalho do grupo de data', async () => {
    renderPage()

    // Os 3 mockBatches têm entry_date '2026-01-01' e quantidades 50 + 20 + 30 = 100 kg
    await waitFor(() => {
      expect(screen.getByText(/100.0 kg/i)).toBeInTheDocument()
    })
  })
})

// ─── Filtros ──────────────────────────────────────────────────────────────────

describe('BatchesPage — filtros', () => {
  it('filtra lotes pelo campo de busca de texto', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getAllByText(/🌾 Arroz/i))

    await user.type(screen.getByPlaceholderText(/buscar por alimento/i), 'feijão')

    expect(screen.getByText(/🫘 Feijão/i)).toBeInTheDocument()
    expect(screen.queryByText(/🌾 Arroz/i)).not.toBeInTheDocument()
  })

  it('filtra lotes pela categoria selecionada', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getAllByText(/🌾 Arroz/i))

    // Seleciona a categoria "grão" no combobox de categoria
    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], 'grão')

    expect(screen.getByText(/🫘 Feijão/i)).toBeInTheDocument()
    expect(screen.queryByText(/🌾 Arroz/i)).not.toBeInTheDocument()
  })

  it('botão "Limpar Filtros" aparece após filtrar e limpa ao clicar', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getAllByText(/🌾 Arroz/i))

    await user.type(screen.getByPlaceholderText(/buscar por alimento/i), 'feijão')
    expect(screen.getByRole('button', { name: /limpar filtros/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /limpar filtros/i }))

    // Após limpar, Arroz deve voltar
    await waitFor(() => {
      expect(screen.getAllByText(/🌾 Arroz/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.queryByRole('button', { name: /limpar filtros/i })).not.toBeInTheDocument()
    })
  })
})

// ─── Modal de criação ─────────────────────────────────────────────────────────

describe('BatchesPage — modal de novo lote', () => {
  it('abre o modal ao clicar em "Adicionar Lote"', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getAllByText(/🌾 Arroz/i))

    await user.click(screen.getByRole('button', { name: /adicionar lote/i }))

    expect(screen.getByRole('heading', { name: /adicionar lote/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/alimento \/ tipo de item/i)).toBeInTheDocument()
  })

  it('fecha o modal ao clicar no botão ×', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getAllByText(/🌾 Arroz/i))
    await user.click(screen.getByRole('button', { name: /adicionar lote/i }))

    await user.click(screen.getByRole('button', { name: /cerrar modal/i }))

    expect(screen.queryByRole('heading', { name: /adicionar lote/i })).not.toBeInTheDocument()
  })

  it('exibe erro de validação quando campos obrigatórios estão vazios', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getAllByText(/🌾 Arroz/i))
    await user.click(screen.getByRole('button', { name: /adicionar lote/i }))

    // Tenta submeter sem preencher nada
    await user.click(screen.getByRole('button', { name: /confirmar registro/i }))

    expect(screen.getByText(/por favor, preencha todos os campos/i)).toBeInTheDocument()
  })

  it('exibe erro ao submeter com item selecionado mas sem quantidade e data', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getAllByText(/🌾 Arroz/i))
    await user.click(screen.getByRole('button', { name: /adicionar lote/i }))

    // Seleciona apenas o item, não preenche quantidade nem data
    await user.selectOptions(screen.getByLabelText(/alimento \/ tipo de item/i), [mockItems[0].id.toString()])

    await user.click(screen.getByRole('button', { name: /confirmar registro/i }))

    await waitFor(() => {
      expect(screen.getByText(/por favor, preencha todos os campos/i)).toBeInTheDocument()
    })
  })

  it('exibe erro no formulário quando a API retorna erro ao criar', async () => {
    server.use(
      http.post('http://localhost:3333/batch', () =>
        HttpResponse.json({ message: 'Erro interno ao salvar lote.' }, { status: 500 })
      )
    )

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getAllByText(/🌾 Arroz/i))
    await user.click(screen.getByRole('button', { name: /adicionar lote/i }))

    await user.selectOptions(screen.getByLabelText(/alimento \/ tipo de item/i), [mockItems[0].id.toString()])
    await user.type(screen.getByLabelText(/quantidade inicial/i), '10')
    await user.type(screen.getByLabelText(/vencimento/i), '2027-12-31')

    await user.click(screen.getByRole('button', { name: /confirmar registro/i }))

    await waitFor(() => {
      expect(screen.getByText(/erro interno ao salvar lote/i)).toBeInTheDocument()
    })
  })
})

// ─── Modal de visualização ────────────────────────────────────────────────────

describe('BatchesPage — modal de detalhes do lote', () => {
  it('abre o modal de detalhes ao clicar em uma linha da tabela', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getAllByText(/🌾 Arroz/i))

    // Clica na primeira linha de Arroz
    await user.click(screen.getAllByText(/🌾 Arroz/i)[0])

    expect(screen.getByRole('heading', { name: /detalhes do lote #1/i })).toBeInTheDocument()
    expect(screen.getByText(/informações do lote/i)).toBeInTheDocument()
    expect(screen.getByText(/informações do item/i)).toBeInTheDocument()
  })

  it('fecha o modal de detalhes ao clicar em "Fechar Detalhes"', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getAllByText(/🌾 Arroz/i))
    await user.click(screen.getAllByText(/🌾 Arroz/i)[0])

    expect(screen.getByRole('heading', { name: /detalhes do lote #1/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /fechar detalhes/i }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /detalhes do lote/i })).not.toBeInTheDocument()
    })
  })

  it('fecha o modal de detalhes ao clicar no overlay', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getAllByText(/🌾 Arroz/i))
    await user.click(screen.getAllByText(/🌾 Arroz/i)[0])

    const overlay = document.querySelector('.batch-modal-overlay')
    await user.click(overlay)

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /detalhes do lote/i })).not.toBeInTheDocument()
    })
  })

  it('exibe deep link ao receber initialBatchId', async () => {
    renderPage({ initialBatchId: 1 })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /detalhes do lote #1/i })).toBeInTheDocument()
    })
  })
})

// ─── Exclusão de lote ─────────────────────────────────────────────────────────

describe('BatchesPage — exclusão de lote', () => {
  it('remove o lote da lista ao confirmar exclusão', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText(/🫘 Feijão/i))
    await user.click(screen.getByText(/🫘 Feijão/i))

    await user.click(screen.getByRole('button', { name: /excluir lote/i }))

    await waitFor(() => {
      expect(screen.queryByText(/🫘 Feijão/i)).not.toBeInTheDocument()
    })

    vi.restoreAllMocks()
  })

  it('não remove o lote quando o usuário cancela o diálogo de confirmação', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText(/🫘 Feijão/i))
    await user.click(screen.getByText(/🫘 Feijão/i))
    await user.click(screen.getByRole('button', { name: /excluir lote/i }))

    // Feijão ainda deve estar visível
    expect(screen.getByText(/🫘 Feijão/i)).toBeInTheDocument()

    vi.restoreAllMocks()
  })

  it('exibe erro de ação quando a API retorna 409 (doações vinculadas)', async () => {
    server.use(
      http.delete('http://localhost:3333/batch/:id', () =>
        HttpResponse.json(
          { message: 'Este lote não pode ser deletado pois já possui doações vinculadas.' },
          { status: 409 }
        )
      )
    )
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText(/🫘 Feijão/i))
    await user.click(screen.getByText(/🫘 Feijão/i))
    await user.click(screen.getByRole('button', { name: /excluir lote/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/este lote não pode ser deletado pois já possui doações vinculadas/i)
      ).toBeInTheDocument()
    })

    vi.restoreAllMocks()
  })
})

// ─── Navegação ────────────────────────────────────────────────────────────────

describe('BatchesPage — navegação', () => {
  it('chama onLogout ao clicar em "Sair"', async () => {
    const onLogout = vi.fn()
    const user = userEvent.setup()
    renderPage({ onLogout })

    await waitFor(() => screen.getAllByText(/🌾 Arroz/i))

    await user.click(screen.getByRole('button', { name: /sair/i }))
    expect(onLogout).toHaveBeenCalledOnce()
  })

  it('chama onViewOverview ao clicar em "Overview"', async () => {
    const onViewOverview = vi.fn()
    const user = userEvent.setup()
    renderPage({ onViewOverview })

    await waitFor(() => screen.getAllByText(/🌾 Arroz/i))

    await user.click(screen.getByRole('button', { name: /overview/i }))
    expect(onViewOverview).toHaveBeenCalledOnce()
  })

  it('chama onViewItems ao clicar em "Itens"', async () => {
    const onViewItems = vi.fn()
    const user = userEvent.setup()
    renderPage({ onViewItems })

    await waitFor(() => screen.getAllByText(/🌾 Arroz/i))

    await user.click(screen.getByRole('button', { name: /^itens$/i }))
    expect(onViewItems).toHaveBeenCalledOnce()
  })
})
