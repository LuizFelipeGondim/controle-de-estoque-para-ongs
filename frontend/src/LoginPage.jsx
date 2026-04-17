import { useState } from 'react'
import './LoginPage.css'

export default function LoginPage() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  /* Botão desativado até integração com backend */
  const handleSubmit = (e) => {
    e.preventDefault()
    /* autenticação ainda não disponível */
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
          {/* Name field */}
          <div className="login-form__group">
            <label htmlFor="login-name" className="login-form__label">
              Nome do colaborador
            </label>
            <div className="login-form__input-wrap">
              <span className="login-form__input-icon" aria-hidden="true">👤</span>
              <input
                id="login-name"
                type="text"
                className="login-form__input"
                placeholder="Ex: João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
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
          <button
            id="btn-login-submit"
            type="submit"
            className="login-form__submit"
            disabled
            aria-disabled="true"
            title="Autenticação ainda não disponível"
          >
            <span className="login-form__submit-icon" aria-hidden="true">🔒</span>
            Entrar
          </button>

          <p className="login-form__unavailable">
            Sistema de autenticação em desenvolvimento.
          </p>
        </form>
      </main>
    </div>
  )
}
