import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import LoginPage from '../LoginPage'

// Helper: busca o input de senha pelo id (mais preciso que label)
const getPasswordInput = () => document.getElementById('login-password')
const getEmailInput = () => screen.getByLabelText('E-mail')

describe('LoginPage', () => {
  it('renderiza os campos de e-mail e senha', () => {
    render(<LoginPage onLogin={vi.fn()} />)

    expect(getEmailInput()).toBeInTheDocument()
    expect(getPasswordInput()).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('o botão de submit está habilitado antes do envio', async () => {
    const user = userEvent.setup()
    render(<LoginPage onLogin={vi.fn()} />)

    await user.type(getEmailInput(), 'admin@ong.org')
    await user.type(getPasswordInput(), 'senha123')

    expect(screen.getByRole('button', { name: /entrar/i })).not.toBeDisabled()
  })

  it('chama onLogin ao submeter credenciais válidas', async () => {
    const onLogin = vi.fn()
    const user = userEvent.setup()
    render(<LoginPage onLogin={onLogin} />)

    await user.type(getEmailInput(), 'admin@ong.org')
    await user.type(getPasswordInput(), 'senha123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledOnce()
    })
  })

  it('exibe mensagem de erro ao submeter credenciais inválidas', async () => {
    const user = userEvent.setup()
    render(<LoginPage onLogin={vi.fn()} />)

    await user.type(getEmailInput(), 'errado@ong.org')
    await user.type(getPasswordInput(), 'senhaerrada')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByText(/e-mail ou senha incorretos/i)).toBeInTheDocument()
    })
  })

  it('exibe mensagem de erro quando o servidor não responde', async () => {
    server.use(
      http.post('http://localhost:3333/auth/login', () => {
        return HttpResponse.error()
      })
    )

    const user = userEvent.setup()
    render(<LoginPage onLogin={vi.fn()} />)

    await user.type(getEmailInput(), 'admin@ong.org')
    await user.type(getPasswordInput(), 'senha123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByText(/erro ao conectar ao servidor/i)).toBeInTheDocument()
    })
  })

  it('alterna a visibilidade da senha ao clicar no botão de mostrar/ocultar', async () => {
    const user = userEvent.setup()
    render(<LoginPage onLogin={vi.fn()} />)

    const passwordInput = getPasswordInput()
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Clica no botão de mostrar senha
    await user.click(screen.getByRole('button', { name: /mostrar senha/i }))
    expect(passwordInput).toHaveAttribute('type', 'text')

    // Clica novamente para ocultar
    await user.click(screen.getByRole('button', { name: /ocultar senha/i }))
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})
