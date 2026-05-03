import { useState } from 'react'
import { API_URL } from './config/api'
import './LoginPage.css'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        onLogin()
      } else {
        setError('E-mail ou senha incorretos.')
      }
    } catch (err) {
      console.log(JSON.stringify({ email, password }))
      console.error(err)
      setError('Erro ao conectar ao servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Background layers */}
      <div className="login-page__bg" aria-hidden="true" />
      <div className="login-page__orb login-page__orb--1" aria-hidden="true" />
      <div className="login-page__orb login-page__orb--2" aria-hidden="true" />

      {/* Card */}
      <main className="login-card" role="main" aria-labelledby="login-title">

        {/* Brand */}
        <div className="login-card__brand">
          <div className="login-card__logo" aria-hidden="true">🌱</div>
          <span className="login-card__brand-name">
            ONG<span>Conecta</span>
          </span>
        </div>

        {/* Header */}
        <div className="login-card__header">
          <div className="login-card__badge">
            <span className="login-card__badge-dot" />
            Área do Colaborador
          </div>
          <h1 id="login-title" className="login-card__title">
            Bem-vindo de volta
          </h1>
          <p className="login-card__subtitle">
            Insira suas credenciais para acessar o sistema de estoque.
          </p>
        </div>

        {/* Form */}
        <form
          className="login-form"
          onSubmit={handleSubmit}
          aria-label="Formulário de login"
          noValidate
        >
          {/* Email field */}
          <div className="login-form__group">
            <label htmlFor="login-email" className="login-form__label">
              E-mail
            </label>
            <div className="login-form__input-wrap">
              <span className="login-form__input-icon" aria-hidden="true">✉️</span>
              <input
                id="login-email"
                type="email"
                className="login-form__input"
                placeholder="Ex: joao@ong.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="login-form__group">
            <label htmlFor="login-password" className="login-form__label">
              Senha
            </label>
            <div className="login-form__input-wrap">
              <span className="login-form__input-icon" aria-hidden="true">🔑</span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="login-form__input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-form__toggle-pw"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Submit */}
          {error && <div className="login-form__error" style={{ color: '#ff4d4f', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
          <button
            id="btn-login-submit"
            type="submit"
            className="login-form__submit"
            disabled={isLoading}
          >
            <span className="login-form__submit-icon" aria-hidden="true">→</span>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </main>
    </div>
  )
}
