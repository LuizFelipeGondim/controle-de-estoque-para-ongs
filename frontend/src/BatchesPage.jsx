import { useEffect, useState, useMemo } from 'react'
import { API_URL } from './config/api'
import './BatchesPage.css'

export default function BatchesPage({ onBack }) {
  const [batches, setBatches] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState('')
  const [quantity, setQuantity] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  // order options: 'exp_asc', 'exp_desc', 'entry_desc', 'entry_asc'
  const [sortOption, setSortOption] = useState('exp_asc')

  useEffect(() => {
    async function fetchData() {
      try {
        const [batchesRes, itemsRes] = await Promise.all([
          fetch(`${API_URL}/batch`, { credentials: 'include' }),
          fetch(`${API_URL}/items`, { credentials: 'include' })
        ])

        if (!batchesRes.ok) throw new Error('Falha ao buscar lotes do backend.')
        if (!itemsRes.ok) throw new Error('Falha ao buscar itens do backend.')

        const batchesData = await batchesRes.json();
        const itemsData = await itemsRes.json();

        setBatches(batchesData);
        setItems(itemsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [])

  const handleAddBatch = async (e) => {
    e.preventDefault()
    setFormError(null)

    if (!selectedItem || !quantity || !expirationDate) {
      setFormError('Por favor, preencha todos os campos.')
      return
    }

    if (Number(quantity) <= 0) {
      setFormError('A quantidade deve ser maior que zero.')
      return
    }

    setIsSubmitting(true)

    try {
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

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Erro ao registrar o lote.')
      }

      // Re-fetch batches to ensure we have the joined item details
      const refreshBatchesRes = await fetch(`${API_URL}/batch`, { credentials: 'include' })
      if (refreshBatchesRes.ok) {
        const refreshedData = await refreshBatchesRes.json()
        setBatches(refreshedData)
      }

      setIsModalOpen(false)
      setSelectedItem('')
      setQuantity('')
      setExpirationDate('')
    } catch (err) {
      setFormError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const groupedBatches = useMemo(() => {
    const sorted = [...batches].sort((a, b) => {
      const dateA = new Date(a.expiration_date).getTime()
      const dateB = new Date(b.expiration_date).getTime()
      const entryA = new Date(a.entry_date || a.created_at || 0).getTime()
      const entryB = new Date(b.entry_date || b.created_at || 0).getTime()

      if (sortOption === 'exp_asc') return dateA - dateB
      if (sortOption === 'exp_desc') return dateB - dateA
      if (sortOption === 'entry_desc') return entryB - entryA
      if (sortOption === 'entry_asc') return entryA - entryB
      return 0
    })

    // Grouping by item_name
    const groups = sorted.reduce((acc, batch) => {
      const key = batch.item_name
      if (!acc[key]) acc[key] = []
      acc[key].push(batch)
      return acc
    }, {})

    // Sort groups alphabetically by item name
    return Object.entries(groups).sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
  }, [batches, sortOption])

  return (
    <div className="batches-page">
      {/* ══ Header ══ */}
      <header className="batches-header">
        <div className="batches-header__brand">
          <div className="batches-header__logo" aria-hidden="true">🌱</div>
          <span className="batches-header__brand-name">
            ONG<span>Conecta</span>
          </span>
        </div>
        <button
          className="batches-header__back"
          onClick={onBack}
          aria-label="Voltar para a visão geral"
        >
          Voltar
        </button>
      </header>

      {/* ══ Main Content ══ */}
      <main className="batches-main" role="main">
        <div className="batches-page-header">
          <div>
            <p className="batches-page-header__tag">Controle Operacional</p>
            <h1 className="batches-page-header__title">Visão de Lotes</h1>
          </div>
          <button
            className="batches-header__new-btn"
            onClick={() => setIsModalOpen(true)}
          >
            Adicionar Lote
          </button>
        </div>

        <div className="batches-sort-control-container">

          <div className="batches-sort-control">
            <label htmlFor="sortSelect">Ordenar por:</label>
            <select
              id="sortSelect"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="exp_asc">Validade (Mais próximos)</option>
              <option value="exp_desc">Validade (Mais distantes)</option>
              <option value="entry_desc">Entrada (Mais recentes)</option>
              <option value="entry_asc">Entrada (Mais antigos)</option>
            </select>
          </div>
        </div>

        {loading && <div className="batches-loading">Carregando lotes...</div>}

        {error && <div className="batches-error">{error}</div>}

        {!loading && !error && batches.length === 0 && (
          <div className="batches-empty">Nenhum lote registrado.</div>
        )}

        {!loading && !error && groupedBatches.length > 0 && (
          <div className="batches-groups-container">
            {groupedBatches.map(([itemName, itemBatches]) => {
              const firstBatch = itemBatches[0];
              const totalQty = itemBatches.reduce((sum, b) => sum + (b.status !== 'esgotado' ? b.current_quantity : 0), 0);

              return (
                <section key={itemName} className="batch-item-group">
                  <header className="batch-item-group__header">
                    <div className="batch-item-group__title-box">
                      <h2 className="batch-item-group__title">{itemName}</h2>
                      <span className="batch-item-group__category">{firstBatch.item_category}</span>
                    </div>
                    <div className="batch-item-group__summary">
                      <span className="summary-label">Estoque Total Ativo:</span>
                      <span className="summary-value">{totalQty.toFixed(1)} <span>{firstBatch.item_unit_of_measure}</span></span>
                    </div>
                  </header>

                  <div className="batches-grid">
                    {itemBatches.map(batch => {
                      const expDate = new Date(batch.expiration_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                      const entryRaw = batch.entry_date || batch.created_at
                      const entryDate = entryRaw ? new Date(entryRaw).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'
                      const statusLabel = batch.status === 'esgotado' ? 'Esgotado' : 'Disponível'

                      const today = new Date();
                      const expTime = new Date(batch.expiration_date);
                      const diffTime = expTime - today;
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      const isUrgent = batch.status !== 'esgotado' && diffDays <= 5 && diffDays >= 0;
                      const isExpired = batch.status !== 'esgotado' && diffDays < 0;

                      return (
                        <div key={batch.id} className={`batch-card batch-card--${batch.status} ${isUrgent ? 'batch-card--urgent' : ''} ${isExpired ? 'batch-card--expired' : ''}`}>
                          <div className="batch-card__header">
                            <span className={`batch-status-badge batch-status-badge--${batch.status}`}>
                              <span className="pulse-dot"></span>
                              {statusLabel}
                            </span>
                          </div>

                          <div className="batch-card__content">
                            <div className="batch-card__metrics">
                              <div className="batch-card__qty">
                                <span className="metric-value">{batch.current_quantity} <span>{batch.item_unit_of_measure}</span></span>
                              </div>
                            </div>

                            <div className="batch-card__dates">
                              <div className="batch-date">
                                <span className="date-icon">🗓️</span>
                                <div className="date-details">
                                  <span className="date-label">Validade</span>
                                  <span className={`date-value ${isUrgent || isExpired ? 'date-value--warning' : ''}`}>
                                    {expDate}
                                    {(isUrgent || isExpired) && <span className="warning-tag">{isExpired ? 'Vencido' : 'Urgente'}</span>}
                                  </span>
                                </div>
                              </div>
                              <div className="batch-date">
                                <span className="date-icon">📥</span>
                                <div className="date-details">
                                  <span className="date-label">Entrada</span>
                                  <span className="date-value">{entryDate}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="batch-card__accent-bar"></div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </main>

      {/* ══ Modal Novo Lote ══ */}
      {isModalOpen && (
        <div className="batch-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="batch-modal-content" onClick={e => e.stopPropagation()}>
            <header className="batch-modal-content__header">
              <h2>Adicionar Lote</h2>
              <button
                className="batch-modal-content__close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Cerrar modal"
              >
                &times;
              </button>
            </header>

            <form onSubmit={handleAddBatch} className="batch-modal-form">
              {formError && <div className="batch-modal-form__error">{formError}</div>}

              {/* Campo Item */}
              <div className="batch-modal-form__group">
                <label htmlFor="modal-item">Alimento / Tipo de Item *</label>
                <select
                  id="modal-item"
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                >
                  <option value="" disabled>Selecione o alimento</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.unit_of_measure}) - {item.category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="batch-modal-form__row">
                <div className="batch-modal-form__group">
                  <label htmlFor="modal-qty">Quantidade Inicial *</label>
                  <input
                    id="modal-qty"
                    type="number"
                    placeholder="Ex: 50"
                    min="0.1"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>

                <div className="batch-modal-form__group">
                  <label htmlFor="modal-date">Vencimento (Validade) *</label>
                  <input
                    id="modal-date"
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="batch-modal-form__submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registrando...' : 'Confirmar Registro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
