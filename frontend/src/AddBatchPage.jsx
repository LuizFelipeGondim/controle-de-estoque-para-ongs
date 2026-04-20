import { useState, useEffect } from 'react'
import { API_URL } from './config/api'
import './AddBatchPage.css'

export default function AddBatchPage({ onBack }) {
  const [items, setItems] = useState([])
  const [loadingItems, setLoadingItems] = useState(true)
  
  const [selectedItem, setSelectedItem] = useState('')
  const [quantity, setQuantity] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    async function fetchItems() {
      try {
        const response = await fetch(`${API_URL}/items`, {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setItems(data)
        } else {
          setFeedback({ type: 'error', message: 'Erro ao carregar tipos de alimentos do banco.' })
        }
      } catch (err) {
        setFeedback({ type: 'error', message: 'Falha de conexão com o servidor.' })
      } finally {
        setLoadingItems(false)
      }
    }
    fetchItems()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFeedback(null)
    
    if (!selectedItem || !quantity || !expirationDate) {
      setFeedback({ type: 'error', message: 'Por favor, preencha todos os campos.' })
      return
    }

    if (Number(quantity) <= 0) {
      setFeedback({ type: 'error', message: 'A quantidade deve ser maior que zero.' })
      return
    }

    setIsSubmitting(true)

    try {
      // Garantir compatibilidade ISO para API que exige iso.datetime no Zod
      const isoDate = new Date(expirationDate).toISOString()

      const response = await fetch(`${API_URL}/batch`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_type_id: selectedItem,
          initial_quantity: Number(quantity),
          expiration_date: isoDate
        })
      })

      if (response.ok) {
        setFeedback({ type: 'success', message: 'Lote registrado com sucesso!' })
        // Limpar o formulário após cadastro
        setSelectedItem('')
        setQuantity('')
        setExpirationDate('')
      } else {
        const data = await response.json()
        setFeedback({ type: 'error', message: data.message || 'Erro ao registrar o lote.' })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Falha de conexão com o servidor.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="ab-page">
      {/* ══ Header ══ */}
      <header className="ab-header">
        <div className="ab-header__brand">
          <div className="ab-header__logo" aria-hidden="true">🌱</div>
          <span className="ab-header__brand-name">
            ONG<span>Conecta</span>
          </span>
        </div>
        <button
          className="ab-header__back"
          onClick={onBack}
          aria-label="Voltar para a visão geral"
        >
          Voltar
        </button>
      </header>

      {/* ══ Main Content ══ */}
      <main className="ab-main" role="main">
        <div className="ab-page-header">
          <h1 className="ab-page-header__title">Registrar Novo Lote</h1>
          <p className="ab-page-header__subtitle">Adicione a entrada de doações ao estoque da organização</p>
        </div>

        <section className="ab-card">
          {feedback && (
            <div className={`ab-feedback ab-feedback--${feedback.type}`} role="alert">
              {feedback.message}
            </div>
          )}

          <form className="ab-form" onSubmit={handleSubmit} noValidate>
            
            {/* Campo Item */}
            <div className="ab-form__group">
              <label htmlFor="ab-item" className="ab-form__label">
                Alimento / Tipo de Item
              </label>
              <select
                id="ab-item"
                className="ab-form__select"
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                disabled={loadingItems}
              >
                <option value="" disabled>
                  {loadingItems ? 'Carregando itens...' : 'Selecione o alimento'}
                </option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.unit_of_measure}) - {item.category}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo Quantidade */}
            <div className="ab-form__group">
              <label htmlFor="ab-quantity" className="ab-form__label">
                Quantidade Inicial Recebida
              </label>
              <input
                id="ab-quantity"
                type="number"
                className="ab-form__input"
                placeholder="Ex: 50"
                min="0.1"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={loadingItems}
              />
            </div>

            {/* Campo Validade */}
            <div className="ab-form__group">
              <label htmlFor="ab-date" className="ab-form__label">
                Data de Validade (Vencimento)
              </label>
              <input
                id="ab-date"
                type="date"
                className="ab-form__input"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                disabled={loadingItems}
              />
            </div>

            <button
              type="submit"
              className="ab-form__submit"
              disabled={isSubmitting || loadingItems}
            >
              <span aria-hidden="true">{isSubmitting ? '⏳' : '✅'}</span>
              {isSubmitting ? 'Registrando lote...' : 'Confirmar Registro'}
            </button>

          </form>
        </section>
      </main>
    </div>
  )
}
