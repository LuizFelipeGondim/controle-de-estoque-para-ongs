import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server, mockDonationPackets, mockDonationItems, mockBatches } from '../test/server'
import DonationsPage from '../DonationsPage'

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
  return render(<DonationsPage {...defaultProps} {...props} />)
}

// ─── Estados de carregamento / erro ──────────────────────────────────────────

describe('DonationsPage — carregamento e erro', () => {
  it('exibe estado de carregamento antes dos dados chegarem', () => {
    server.use(
      http.get('http://localhost:3333/donation-packets', () => new Promise(() => {}))
    )

    renderPage()
    expect(screen.getByText(/carregando/i)).toBeInTheDocument()
  })

  it('exibe mensagem de erro quando a API falha', async () => {
    server.use(
      http.get('http://localhost:3333/donation-packets', () =>
        new HttpResponse(null, { status: 500 })
      )
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/falha ao buscar pacotes/i)).toBeInTheDocument()
    })
  })
})

// ─── Exibição dos pacotes ─────────────────────────────────────────────────────

describe('DonationsPage — exibição de pacotes', () => {
  it('exibe os pacotes de doação após o carregamento', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Abrigo Esperança')).toBeInTheDocument()
      expect(screen.getByText('Casa do Menor')).toBeInTheDocument()
    })
  })

  it('exibe o status correto de cada pacote', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('preparando')).toBeInTheDocument()
      expect(screen.getByText('finalizado')).toBeInTheDocument()
    })
  })

  it('exibe endereço do pacote quando informado', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Rua das Flores, 123')).toBeInTheDocument()
    })
  })

  it('exibe "Endereço não informado" quando endereço for nulo', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Endereço não informado')).toBeInTheDocument()
    })
  })

  it('botão de excluir (×) aparece apenas para pacotes com status "preparando"', async () => {
    renderPage()

    await waitFor(() => screen.getByText('Abrigo Esperança'))

    // Apenas 1 botão × de exclusão de pacote deve existir (somente o "preparando")
    const deleteBtns = document.querySelectorAll('.packet-delete-btn')
    expect(deleteBtns.length).toBe(1)
  })

  it('exibe mensagem de lista vazia quando não há pacotes', async () => {
    server.use(
      http.get('http://localhost:3333/donation-packets', () => HttpResponse.json([]))
    )

    renderPage()

    await waitFor(() => {
      // A grid deve estar vazia — sem cards de pacotes
      expect(screen.queryByText('Abrigo Esperança')).not.toBeInTheDocument()
      expect(screen.queryByText('Casa do Menor')).not.toBeInTheDocument()
    })
  })
})

// ─── Filtros ──────────────────────────────────────────────────────────────────

describe('DonationsPage — filtros', () => {
  it('filtra pacotes pelo campo de busca por destino', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Abrigo Esperança'))

    await user.type(screen.getByPlaceholderText(/buscar por destino/i), 'abrigo')

    expect(screen.getByText('Abrigo Esperança')).toBeInTheDocument()
    expect(screen.queryByText('Casa do Menor')).not.toBeInTheDocument()
  })

  it('botão "Limpar Filtros" aparece após filtrar e limpa ao clicar', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Abrigo Esperança'))

    await user.type(screen.getByPlaceholderText(/buscar por destino/i), 'abrigo')
    expect(screen.getByRole('button', { name: /limpar filtros/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /limpar filtros/i }))

    await waitFor(() => {
      expect(screen.getByText('Casa do Menor')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /limpar filtros/i })).not.toBeInTheDocument()
    })
  })
})

// ─── Modal de criação de pacote ───────────────────────────────────────────────

describe('DonationsPage — modal de novo pacote', () => {
  it('abre o modal ao clicar em "Novo Pacote"', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Abrigo Esperança'))

    await user.click(screen.getByRole('button', { name: /novo pacote/i }))

    expect(screen.getByRole('heading', { name: /registrar novo pacote/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/destino \/ instituição/i)).toBeInTheDocument()
  })

  it('fecha o modal ao clicar no ×', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Abrigo Esperança'))
    await user.click(screen.getByRole('button', { name: /novo pacote/i }))

    // O modal tem um botão × sem aria-label — acessa pelo texto
    const closeBtn = document.querySelector('.donation-modal-content__close')
    await user.click(closeBtn)

    expect(screen.queryByRole('heading', { name: /registrar novo pacote/i })).not.toBeInTheDocument()
  })

  it('cria um novo pacote e fecha o modal com sucesso', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Abrigo Esperança'))
    await user.click(screen.getByRole('button', { name: /novo pacote/i }))

    await user.type(screen.getByLabelText(/destino \/ instituição/i), 'ONG Futuro')

    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /registrar novo pacote/i })).not.toBeInTheDocument()
    })
  })

  it('exibe erro quando a API retorna erro ao criar pacote', async () => {
    server.use(
      http.post('http://localhost:3333/donation-packets', () =>
        HttpResponse.json({ message: 'Erro interno ao criar pacote.' }, { status: 500 })
      )
    )

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Abrigo Esperança'))
    await user.click(screen.getByRole('button', { name: /novo pacote/i }))
    await user.type(screen.getByLabelText(/destino \/ instituição/i), 'ONG Teste')
    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    await waitFor(() => {
      expect(screen.getByText(/erro interno ao criar pacote/i)).toBeInTheDocument()
    })
  })
})

// ─── Exclusão de pacote ───────────────────────────────────────────────────────

describe('DonationsPage — exclusão de pacote', () => {
  it('remove o pacote da lista ao confirmar exclusão', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Abrigo Esperança'))

    const deleteBtn = document.querySelector('.packet-delete-btn')
    await user.click(deleteBtn)

    await waitFor(() => {
      expect(screen.queryByText('Abrigo Esperança')).not.toBeInTheDocument()
    })

    vi.restoreAllMocks()
  })

  it('não remove o pacote quando o usuário cancela', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Abrigo Esperança'))

    const deleteBtn = document.querySelector('.packet-delete-btn')
    await user.click(deleteBtn)

    expect(screen.getByText('Abrigo Esperança')).toBeInTheDocument()

    vi.restoreAllMocks()
  })
})

// ─── View "Gerenciar Itens" ───────────────────────────────────────────────────

describe('DonationsPage — gerenciar itens do pacote', () => {
  it('navega para a view de gerenciar itens ao clicar em "Gerenciar Itens"', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Abrigo Esperança'))

    await user.click(screen.getByRole('button', { name: /gerenciar itens/i }))

    await waitFor(() => {
      expect(screen.getByText(/preparando doação para/i)).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Abrigo Esperança' })).toBeInTheDocument()
    })
  })

  it('exibe os itens do pacote na view de gerenciar', async () => {
    // Configura /donation-items para retornar item do pacote 1
    server.use(
      http.get('http://localhost:3333/donation-items', ({ request }) => {
        const url = new URL(request.url)
        if (url.searchParams.get('donation_packet_id') === '1') {
          return HttpResponse.json(mockDonationItems)
        }
        return HttpResponse.json([])
      })
    )

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Abrigo Esperança'))
    await user.click(screen.getByRole('button', { name: /gerenciar itens/i }))

    await waitFor(() => {
      expect(screen.getByText('Arroz')).toBeInTheDocument()
    })
  })

  it('exibe "Este pacote está vazio" quando não há itens', async () => {
    server.use(
      http.get('http://localhost:3333/donation-items', () => HttpResponse.json([]))
    )

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Abrigo Esperança'))
    await user.click(screen.getByRole('button', { name: /gerenciar itens/i }))

    await waitFor(() => {
      expect(screen.getByText(/este pacote está vazio/i)).toBeInTheDocument()
    })
  })

  it('volta para a lista ao clicar em "Voltar para Lista"', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Abrigo Esperança'))
    await user.click(screen.getByRole('button', { name: /gerenciar itens/i }))

    await waitFor(() => screen.getByText(/preparando doação para/i))

    await user.click(screen.getByRole('button', { name: /voltar para lista/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /pacotes de doação/i })).toBeInTheDocument()
    })
  })

  it('finaliza o pacote ao clicar em "Finalizar Doação"', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    server.use(
      http.get('http://localhost:3333/donation-items', () => HttpResponse.json([]))
    )

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Abrigo Esperança'))
    await user.click(screen.getByRole('button', { name: /gerenciar itens/i }))

    await waitFor(() => screen.getByRole('button', { name: /finalizar doação/i }))
    await user.click(screen.getByRole('button', { name: /finalizar doação/i }))

    await waitFor(() => {
      // Volta para a lista após finalizar
      expect(screen.getByRole('heading', { name: /pacotes de doação/i })).toBeInTheDocument()
    })

    vi.restoreAllMocks()
  })

  it('cancela o pacote ao clicar em "Cancelar Pacote"', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    server.use(
      http.get('http://localhost:3333/donation-items', () => HttpResponse.json([]))
    )

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Abrigo Esperança'))
    await user.click(screen.getByRole('button', { name: /gerenciar itens/i }))

    await waitFor(() => screen.getByRole('button', { name: /cancelar pacote/i }))
    await user.click(screen.getByRole('button', { name: /cancelar pacote/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /pacotes de doação/i })).toBeInTheDocument()
    })

    vi.restoreAllMocks()
  })

  it('botão "Ver Detalhes" aparece para pacotes finalizados (sem ações de edição)', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => screen.getByText('Casa do Menor'))

    // "Casa do Menor" é finalizado — botão deve dizer "Ver Detalhes"
    const cards = document.querySelectorAll('.packet-card')
    const finalizadoCard = [...cards].find(c => c.textContent.includes('Casa do Menor'))
    const btn = finalizadoCard.querySelector('.packet-action-btn')
    expect(btn.textContent).toMatch(/ver detalhes/i)
  })
})

// ─── Navegação ────────────────────────────────────────────────────────────────

describe('DonationsPage — navegação', () => {
  it('chama onLogout ao clicar em "Sair"', async () => {
    const onLogout = vi.fn()
    const user = userEvent.setup()
    renderPage({ onLogout })

    await waitFor(() => screen.getByText('Abrigo Esperança'))

    await user.click(screen.getByRole('button', { name: /sair/i }))
    expect(onLogout).toHaveBeenCalledOnce()
  })

  it('chama onViewOverview ao clicar em "Overview"', async () => {
    const onViewOverview = vi.fn()
    const user = userEvent.setup()
    renderPage({ onViewOverview })

    await waitFor(() => screen.getByText('Abrigo Esperança'))

    await user.click(screen.getByRole('button', { name: /overview/i }))
    expect(onViewOverview).toHaveBeenCalledOnce()
  })

  it('chama onViewBatches ao clicar em "Lotes"', async () => {
    const onViewBatches = vi.fn()
    const user = userEvent.setup()
    renderPage({ onViewBatches })

    await waitFor(() => screen.getByText('Abrigo Esperança'))

    await user.click(screen.getByRole('button', { name: /^lotes$/i }))
    expect(onViewBatches).toHaveBeenCalledOnce()
  })
})
