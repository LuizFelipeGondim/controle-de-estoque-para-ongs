import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server, mockItems, mockBatches } from '../test/server'
import ItemsPage from '../ItemsPage'

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
  return render(<ItemsPage {...defaultProps} {...props} />)
}

// ─── Estados de carregamento / erro ──────────────────────────────────────────

describe('ItemsPage — carregamento e erro', () => {
  it('exibe estado de carregamento antes dos dados chegarem', () => {
    // Não resolve a requisição — verifica a mensagem de loading
    server.use(
      http.get('http://localhost:3333/items', () => new Promise(() => {})),
      http.get('http://localhost:3333/batch', () => new Promise(() => {}))
    )

    renderPage()
    expect(screen.getByText(/carregando itens/i)).toBeInTheDocument()
  })

  it('exibe mensagem de erro quando a API falha', async () => {
    server.use(
      http.get('http://localhost:3333/items', () =>
        new HttpResponse(null, { status: 500 })
      )
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/falha ao buscar dados/i)).toBeInTheDocument()
    })
  })
})

// ─── Exibição dos itens ───────────────────────────────────────────────────────

describe('ItemsPage — exibição de itens', () => {
  it('exibe os itens agrupados por categoria após carregamento', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Arroz')).toBeInTheDocument()
      expect(screen.getByText('Feijão')).toBeInTheDocument()
    })

    // Categorias devem aparecer como títulos de seção
    expect(screen.getByRole('heading', { name: /cereal/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /grão/i })).toBeInTheDocument()
  })

  it('exibe badge "Essencial" nos itens marcados como essenciais', async () => {
    renderPage()

    await waitFor(() => {
      const badges = screen.getAllByText('Essencial')
      // Ambos mockItems têm is_essential: true
      expect(badges.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('exibe o estoque total calculado a partir dos lotes', async () => {
    renderPage()

    await waitFor(() => {
      // Arroz tem 1 lote com 40kg e vencimento em 2027 (não vencido)
      expect(screen.getByText(/40 kg/i)).toBeInTheDocument()
    })
  })

  it('exibe mensagem de vazio quando não há itens', async () => {
    server.use(
      http.get('http://localhost:3333/items', () => HttpResponse.json([])),
      http.get('http://localhost:3333/batch', () => HttpResponse.json([]))
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/nenhum item encontrado/i)).toBeInTheDocument()
    })
  })
})

// ─── Filtros ──────────────────────────────────────────────────────────────────

describe('ItemsPage — filtros', () => {
  it('filtra itens pelo campo de busca', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Arroz'))

    await user.type(screen.getByPlaceholderText(/buscar item/i), 'arroz')

    expect(screen.getByText('Arroz')).toBeInTheDocument()
    expect(screen.queryByText('Feijão')).not.toBeInTheDocument()
  })

  it('filtra itens pela categoria selecionada', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Arroz'))

    await user.selectOptions(
      screen.getByRole('combobox'),
      'cereal'
    )

    expect(screen.getByText('Arroz')).toBeInTheDocument()
    expect(screen.queryByText('Feijão')).not.toBeInTheDocument()
  })

  it('botão "Limpar Filtros" aparece após filtrar e limpa os filtros ao clicar', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Arroz'))

    await user.type(screen.getByPlaceholderText(/buscar item/i), 'arroz')

    const clearBtn = screen.getByRole('button', { name: /limpar filtros/i })
    expect(clearBtn).toBeInTheDocument()

    await user.click(clearBtn)

    // Após limpar, Feijão deve voltar
    expect(screen.getByText('Feijão')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /limpar filtros/i })).not.toBeInTheDocument()
  })
})

// ─── Modal de criação ─────────────────────────────────────────────────────────

describe('ItemsPage — modal de novo item', () => {
  it('abre o modal ao clicar em "Novo Item"', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Arroz'))

    await user.click(screen.getByRole('button', { name: /novo item/i }))

    expect(screen.getByRole('heading', { name: /cadastrar novo item/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/nome do item/i)).toBeInTheDocument()
  })

  it('fecha o modal ao clicar no botão de fechar (×)', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Arroz'))
    await user.click(screen.getByRole('button', { name: /novo item/i }))

    // Fecha pelo botão ×
    await user.click(screen.getByRole('button', { name: /cerrar modal/i }))

    expect(screen.queryByRole('heading', { name: /cadastrar novo item/i })).not.toBeInTheDocument()
  })

  it('cadastra um novo item e o adiciona à lista', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Arroz'))

    // Abre modal
    await user.click(screen.getByRole('button', { name: /novo item/i }))

    // Preenche o formulário
    await user.type(screen.getByLabelText(/nome do item/i), 'Macarrão')

    // Submete
    await user.click(screen.getByRole('button', { name: /salvar item/i }))

    // Modal deve fechar e o item deve aparecer na lista
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /cadastrar novo item/i })).not.toBeInTheDocument()
      expect(screen.getByText('Macarrão')).toBeInTheDocument()
    })
  })

  it('exibe erro no formulário quando a API retorna erro ao criar', async () => {
    server.use(
      http.post('http://localhost:3333/items', () =>
        HttpResponse.json({ message: 'Erro interno ao salvar' }, { status: 500 })
      )
    )

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Arroz'))
    await user.click(screen.getByRole('button', { name: /novo item/i }))
    await user.type(screen.getByLabelText(/nome do item/i), 'Macarrão')
    await user.click(screen.getByRole('button', { name: /salvar item/i }))

    await waitFor(() => {
      expect(screen.getByText(/erro interno ao salvar/i)).toBeInTheDocument()
    })
  })
})

// ─── Modal de visualização ────────────────────────────────────────────────────

describe('ItemsPage — modal de visualização de item', () => {
  it('abre o modal de detalhes ao clicar em um card de item', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Arroz'))
    await user.click(screen.getByText('Arroz'))

    // O modal de visualização deve aparecer — usa within para evitar ambiguidade
    // com o <h3> do card que permanece visível atrás do modal
    const modalContent = document.querySelector('.item-modal-content')
    const modal = within(modalContent).getByRole('heading', { name: 'Arroz' })
    expect(modal).toBeInTheDocument()

    // Deve mostrar informações do item
    expect(screen.getByText(/informações gerais/i)).toBeInTheDocument()
    expect(screen.getByText(/lotes vinculados/i)).toBeInTheDocument()
  })

  it('exibe "Nenhum lote disponível" para itens sem lotes', async () => {
    // Sobrescreve /batch para retornar vazio, garantindo que o Feijão não tem lotes
    server.use(
      http.get('http://localhost:3333/batch', () => HttpResponse.json([]))
    )

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Feijão'))
    await user.click(screen.getByText('Feijão'))

    await waitFor(() => {
      expect(screen.getByText(/nenhum lote disponível/i)).toBeInTheDocument()
    })

  })

  it('fecha o modal ao clicar no overlay', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Arroz'))
    await user.click(screen.getByText('Arroz'))

    // Verifica que o modal está aberto — usa within para evitar ambiguidade
    // com o <h3> do card que permanece visível atrás do modal
    const modalContent = document.querySelector('.item-modal-content')
    expect(within(modalContent).getByRole('heading', { name: 'Arroz' })).toBeInTheDocument()

    // Fecha pelo overlay (clica fora do conteúdo do modal)
    // O overlay é o div com classe item-modal-overlay
    const overlay = document.querySelector('.item-modal-overlay')
    await user.click(overlay)

    await waitFor(() => {
      expect(screen.queryByText(/informações gerais/i)).not.toBeInTheDocument()
    })
  })
})

// ─── Edição de item ───────────────────────────────────────────────────────────

describe('ItemsPage — edição de item', () => {
  it('abre o modal de edição com dados preenchidos ao clicar em "Editar"', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Arroz'))
    await user.click(screen.getByText('Arroz'))

    await user.click(screen.getByRole('button', { name: /editar cadastro/i }))

    // Modal de edição deve ter os dados do item
    expect(screen.getByRole('heading', { name: /editar item/i })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Arroz')).toBeInTheDocument()
  })

  it('salva a edição e atualiza o item na lista', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Arroz'))
    await user.click(screen.getByText('Arroz'))
    await user.click(screen.getByRole('button', { name: /editar cadastro/i }))

    // Limpa o nome e digita o novo
    const nameInput = screen.getByDisplayValue('Arroz')
    await user.clear(nameInput)
    await user.type(nameInput, 'Arroz Integral')

    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /editar item/i })).not.toBeInTheDocument()
      expect(screen.getByText('Arroz Integral')).toBeInTheDocument()
    })
  })
})

// ─── Exclusão de item ─────────────────────────────────────────────────────────

describe('ItemsPage — exclusão de item', () => {
  it('remove o item da lista ao confirmar exclusão', async () => {
    // Confirma o diálogo automaticamente
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Arroz'))
    await user.click(screen.getByText('Arroz'))
    await user.click(screen.getByRole('button', { name: /remover item/i }))

    await waitFor(() => {
      expect(screen.queryByText('Arroz')).not.toBeInTheDocument()
    })

    vi.restoreAllMocks()
  })

  it('não remove o item quando o usuário cancela o diálogo de confirmação', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Arroz'))
    await user.click(screen.getByText('Arroz'))
    await user.click(screen.getByRole('button', { name: /remover item/i }))

    // Item ainda deve estar na lista
    expect(screen.getByText('Arroz')).toBeInTheDocument()

    vi.restoreAllMocks()
  })

  it('exibe erro de ação quando a API retorna 409 (lotes vinculados)', async () => {
    server.use(
      http.delete('http://localhost:3333/items/:id', () =>
        HttpResponse.json(
          { message: 'Este item não pode ser excluído pois ainda possui lotes vinculados.' },
          { status: 409 }
        )
      )
    )
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Arroz'))
    await user.click(screen.getByText('Arroz'))
    await user.click(screen.getByRole('button', { name: /remover item/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/este item não pode ser excluído pois ainda possui lotes vinculados/i)
      ).toBeInTheDocument()
    })

    vi.restoreAllMocks()
  })
})

// ─── Navegação ────────────────────────────────────────────────────────────────

describe('ItemsPage — navegação', () => {
  it('chama onLogout ao clicar em "Sair"', async () => {
    const onLogout = vi.fn()
    const user = userEvent.setup()
    renderPage({ onLogout })

    await waitFor(() => screen.getByText('Arroz'))

    await user.click(screen.getByRole('button', { name: /sair/i }))
    expect(onLogout).toHaveBeenCalledOnce()
  })

  it('chama onViewOverview ao clicar em "Overview"', async () => {
    const onViewOverview = vi.fn()
    const user = userEvent.setup()
    renderPage({ onViewOverview })

    await waitFor(() => screen.getByText('Arroz'))

    await user.click(screen.getByRole('button', { name: /overview/i }))
    expect(onViewOverview).toHaveBeenCalledOnce()
  })
})
