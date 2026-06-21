import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import App from '../App'

// Helper para fazer login de forma consistente
async function doLogin(user) {
  await user.type(screen.getByLabelText('E-mail'), 'admin@ong.org')
  await user.type(document.getElementById('login-password'), 'senha123')
  await user.click(screen.getByRole('button', { name: /entrar/i }))
}

describe('App — fluxo de navegação', () => {
  it('exibe a tela de login por padrão', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /bem-vindo de volta/i })).toBeInTheDocument()
  })

  it('navega para o StockOverview após login bem-sucedido', async () => {
    const user = userEvent.setup()
    render(<App />)

    await doLogin(user)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /visão geral dos estoques/i })
      ).toBeInTheDocument()
    })
  })

  it('navega para a página de Itens a partir do StockOverview', async () => {
    const user = userEvent.setup()
    render(<App />)

    await doLogin(user)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^itens$/i })).toBeInTheDocument()
    )

    await user.click(screen.getByRole('button', { name: /^itens$/i }))

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /todos os itens/i })
      ).toBeInTheDocument()
    })
  })

  it('retorna à tela de login ao clicar em Sair', async () => {
    const user = userEvent.setup()
    render(<App />)

    await doLogin(user)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument()
    )

    await user.click(screen.getByRole('button', { name: /sair/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bem-vindo de volta/i })).toBeInTheDocument()
    })
  })
})
