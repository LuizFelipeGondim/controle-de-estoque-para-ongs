import { useEffect, useState, useMemo } from 'react'
import { API_URL } from './config/api'
import './BatchesPage.css'

const CATEGORY_EMOJIS = {
  "cereal": "🌾",
  "grão": "🫘",
  "massa": "🍝",
  "óleo": "🛢️",
  "laticínio": "🥛",
  "hortifrúti": "🥬",
  "proteína": "🥩",
  "enlatado": "🥫",
  "bebida": "🧃",
  "condimento": "🧂",
  "outros": "📦"
};

export default function BatchesPage({ 
  onBack, 
  initialBatchId, 
  onClearInitialBatch,
  onViewOverview,
  onViewHistory,
  onViewDonations,
  onViewBatches,
  onViewItems,
  onLogout
}) {
  const [batches, setBatches] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewingBatch, setViewingBatch] = useState(null)
  const [selectedItem, setSelectedItem] = useState('')
  const [quantity, setQuantity] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [actionError, setActionError] = useState(null)

  // order options: 'exp_asc', 'exp_desc', 'entry_desc', 'entry_asc'
  const [sortOption, setSortOption] = useState('exp_asc')

  // Filter states
  const [filterText, setFilterText] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterExpDate, setFilterExpDate] = useState('')

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

  // Handle deep link from Overview
  useEffect(() => {
    if (initialBatchId && batches.length > 0) {
      const targetBatch = batches.find(b => b.id === initialBatchId)
      if (targetBatch) {
        setViewingBatch(targetBatch)
        if (onClearInitialBatch) onClearInitialBatch()
      }
    }
  }, [initialBatchId, batches, onClearInitialBatch])

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

  const handleDelete = async (batchId) => {
    setActionError(null)

    if (!window.confirm("Você tem certeza que deseja excluir este lote? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/batch/${batchId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.status === 204) {
        // Sucesso brutal - remover do estado local
        setBatches(prev => prev.filter(b => b.id !== batchId))
      } else if (response.status === 409) {
        const data = await response.json().catch(() => ({}))
        setActionError(data.message || "Este lote não pode ser deletado pois já possui doações vinculadas.")
      } else {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || "Erro ao tentar excluir o lote.")
      }
    } catch (err) {
      setActionError(err.message)
    }
  }

  const groupedBatches = useMemo(() => {
    // 0. Filter batches
    const filteredBatches = batches.filter(b => {
      const matchesText = filterText ? b.item_name.toLowerCase().includes(filterText.toLowerCase()) : true;
      const matchesCat = filterCategory ? b.item_category === filterCategory : true;
      let matchesExpDate = true;
      if (filterExpDate) {
        const expDate = new Date(b.expiration_date);
        const filterDate = new Date(filterExpDate + 'T23:59:59');
        matchesExpDate = expDate <= filterDate;
      }
      return matchesText && matchesCat && matchesExpDate;
    });

    // 1. Sort all batches by entry date (newest first)
    const sorted = [...filteredBatches].sort((a, b) => {
      const entryA = new Date(a.entry_date || a.created_at || 0).getTime()
      const entryB = new Date(b.entry_date || b.created_at || 0).getTime()
      return entryB - entryA || a.item_name.localeCompare(b.item_name)
    })

    // 2. Group by date string (YYYY-MM-DD)
    const groups = sorted.reduce((acc, batch) => {
      const dateObj = new Date(batch.entry_date || batch.created_at)
      const dateKey = dateObj.toISOString().split('T')[0] // "2026-04-20"

      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(batch)
      return acc
    }, {})

    // 3. Convert to array and sort groups by date descending
    return Object.entries(groups).sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
  }, [batches, filterText, filterCategory, filterExpDate])

  const formatDateDesc = (dateIso) => {
    const date = new Date(dateIso + 'T12:00:00') // Avoid timezone shifts
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    const formatted = date.toLocaleDateString('pt-BR', options)
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  return (
    <div className="batches-page">
      {/* ══ Header ══ */}
      <header className="batches-header">
        <div className="batches-header__brand" onClick={onViewOverview} style={{ cursor: 'pointer' }}>
          <div className="batches-header__logo" aria-hidden="true">🌱</div>
          <span className="batches-header__brand-name">
            ONG<span>Conecta</span>
          </span>
        </div>
        <nav className="batches-header__nav">
          <button className="batches-header__nav-btn" onClick={onViewOverview}>Overview</button>
          <button className="batches-header__nav-btn" onClick={onViewHistory}>Histórico</button>
          <button className="batches-header__nav-btn" onClick={onViewDonations}>Doações</button>
          <button className="batches-header__nav-btn batches-header__nav-btn--active" onClick={onViewBatches}>Lotes</button>
          <button className="batches-header__nav-btn" onClick={onViewItems}>Itens</button>
        </nav>
        <button className="batches-header__logout" onClick={onLogout}>Sair</button>
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

        <div className="batches-sort-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p>Lotes agrupados por data de entrada no estoque</p>
          <div className="batches-filters" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(filterText || filterCategory || filterExpDate) && (
              <button 
                className="batches-filter-clear"
                onClick={() => { setFilterText(''); setFilterCategory(''); setFilterExpDate(''); }}
              >
                Limpar Filtros
              </button>
            )}
            <input
              type="text"
              placeholder="Buscar por alimento..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="batches-filter-input"
            />
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="batches-filter-select"
            >
              <option value="">Todas as categorias</option>
              {[...new Set(items.map(i => i.category))].sort().map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Vence até:</span>
              <input
                type="date"
                value={filterExpDate}
                onChange={e => setFilterExpDate(e.target.value)}
                className="batches-filter-input"
                style={{ width: 'auto' }}
              />
            </div>
          </div>
        </div>

        {loading && <div className="batches-loading">Carregando lotes...</div>}

        {error && <div className="batches-error">{error}</div>}

        {actionError && (
          <div className="batches-action-error" onClick={() => setActionError(null)}>
            <span>⚠️</span> {actionError} (clique para fechar)
          </div>
        )}

        {!loading && !error && batches.length === 0 && (
          <div className="batches-empty">Nenhum lote registrado.</div>
        )}

        {!loading && !error && groupedBatches.length > 0 && (
          <div className="batches-list-container">
            {groupedBatches.map(([dateKey, itemsInDate]) => {
              const totalQtyInDay = itemsInDate.reduce((sum, b) => sum + Number(b.initial_quantity), 0)

              return (
                <section key={dateKey} className="batch-date-group">
                  <header className="batch-date-group__header">
                    <div className="batch-date-group__info">
                      <span className="batch-date-group__icon">📥</span>
                      <h2 className="batch-date-group__title">{formatDateDesc(dateKey)}</h2>
                    </div>
                    <div className="batch-date-group__summary">
                      Recebidos: <strong>{totalQtyInDay.toFixed(1)} kg</strong>
                    </div>
                  </header>

                  <div className="batches-table">
                    <div className="batches-table__head">
                      <div className="col-item">Alimento</div>
                      <div className="col-cat">Categoria</div>
                      <div className="col-qty">Qtd. Inicial</div>
                      <div className="col-qty">Qtd. Atual</div>
                      <div className="col-exp">Validade</div>
                      <div className="col-status">Status</div>
                    </div>

                    <div className="batches-table__body">
                      {itemsInDate.map(batch => {
                        const expDate = new Date(batch.expiration_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                        const today = new Date();
                        const expTime = new Date(batch.expiration_date);
                        const diffTime = expTime - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        const isUrgent = batch.status !== 'esgotado' && diffDays <= 5 && diffDays >= 0;
                        const isExpired = batch.status !== 'esgotado' && diffDays < 0;

                        const statusLabel = batch.status === 'esgotado' ? 'Esgotado' : (isExpired ? 'Vencido' : 'Disponível');
                        const badgeStatusClass = batch.status === 'esgotado' ? 'esgotado' : (isExpired ? 'vencido' : 'disponivel');

                        return (
                          <div
                            key={batch.id}
                            className={`batch-row batch-row--${badgeStatusClass}`}
                            onClick={() => setViewingBatch(batch)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="col-item">
                              <span className="item-name-primary">{CATEGORY_EMOJIS[batch.item_category?.toLowerCase()] || "📦"} {batch.item_name}</span>
                            </div>
                            <div className="col-cat">
                              <span className="cat-tag">{batch.item_category}</span>
                            </div>
                            <div className="col-qty">
                              <span className="qty-val">{Number(batch.initial_quantity).toFixed(1)}</span>
                              <span className="qty-unit">{batch.item_unit_of_measure}</span>
                            </div>
                            <div className="col-qty">
                              <span className="qty-val">{Number(batch.current_quantity).toFixed(1)}</span>
                              <span className="qty-unit">{batch.item_unit_of_measure}</span>
                            </div>
                            <div className="col-exp">
                              <span className="exp-val">
                                {expDate}
                              </span>
                            </div>
                            <div className="col-status">
                              <span className={`status-pill status-pill--${badgeStatusClass}`}>
                                {statusLabel}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </main>

      {/* ══ Viewing Modal ══ */}
      {viewingBatch && (
        <div className="batch-modal-overlay" onClick={() => setViewingBatch(null)}>
          <div className="batch-modal-content batch-modal-content--large" onClick={e => e.stopPropagation()}>
            <header className="batch-modal-content__header">
              <h2>Detalhes do Lote #{viewingBatch.id}</h2>
              <button className="batch-modal-content__close" onClick={() => setViewingBatch(null)}>&times;</button>
            </header>

            <div className="batch-modal-content__body">
              <div className="batch-details-grid">
                <div className="batch-details-main">
                  <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary-light)' }}>Informações do Lote</h3>
                  <div className="batch-details-list">
                    <div className="batch-detail-item">
                      <span className="batch-detail-label">Status:</span>
                      <span className={`status-pill status-pill--${viewingBatch.status === 'esgotado' ? 'esgotado' : (new Date(viewingBatch.expiration_date) - new Date() < 0 ? 'vencido' : 'disponivel')}`}>
                        {viewingBatch.status === 'esgotado' ? 'Esgotado' : (new Date(viewingBatch.expiration_date) - new Date() < 0 ? 'Vencido' : 'Disponível')}
                      </span>
                    </div>
                    <div className="batch-detail-item">
                      <span className="batch-detail-label">Qtd. Inicial:</span>
                      <span>{viewingBatch.initial_quantity} {viewingBatch.item_unit_of_measure}</span>
                    </div>
                    <div className="batch-detail-item">
                      <span className="batch-detail-label">Qtd. Atual:</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>{viewingBatch.current_quantity} {viewingBatch.item_unit_of_measure}</span>
                    </div>
                    <div className="batch-detail-item">
                      <span className="batch-detail-label">Data de Validade:</span>
                      <span>{new Date(viewingBatch.expiration_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                    </div>
                    <div className="batch-detail-item">
                      <span className="batch-detail-label">Data de Entrada:</span>
                      <span>{new Date(viewingBatch.entry_date || viewingBatch.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                <div className="batch-details-side">
                  <h3>Informações do Item</h3>
                  {(() => {
                    const parentItem = items.find(i => i.id === viewingBatch.item_type_id);
                    if (!parentItem) return <p>Informação do item não encontrada.</p>;
                    return (
                      <div className="batch-item-info">
                        <div className="batch-item-header">
                          <span className="batch-item-emoji">{CATEGORY_EMOJIS[parentItem.category?.toLowerCase()] || "📦"}</span>
                          <h4>{parentItem.name}</h4>
                        </div>
                        <p className="batch-item-category">{parentItem.category}</p>
                        <div className="batch-item-stats">
                          <p><strong>Unidade:</strong> {parentItem.unit_of_measure}</p>
                          <p><strong>Mínimo:</strong> {parentItem.min_stock_level} {parentItem.unit_of_measure}</p>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>

            <footer className="batch-modal-content__footer">
              <button 
                type="button" 
                className="batch-modal-form__delete-btn"
                onClick={() => {
                  handleDelete(viewingBatch.id);
                  setViewingBatch(null);
                }}
                style={{ 
                  background: 'rgba(224, 90, 43, 0.1)', 
                  color: 'var(--color-danger-light)', 
                  padding: '0.8rem 1.5rem', 
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(224, 90, 43, 0.3)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  marginTop: '1.5rem',
                  float: 'left'
                }}
              >
                🗑️ Excluir Lote
              </button>
              
              <button 
                type="button" 
                className="batch-modal-form__cancel"
                onClick={() => setViewingBatch(null)}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  color: 'white', 
                  padding: '0.8rem 1.5rem', 
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  marginTop: '1.5rem',
                  float: 'right'
                }}
              >
                Fechar Detalhes
              </button>
              <div style={{ clear: 'both' }}></div>
            </footer>
          </div>
        </div>
      )}

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
