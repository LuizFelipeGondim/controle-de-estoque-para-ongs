import { useEffect, useState } from 'react'
import { API_URL } from './config/api'
import './ItemsPage.css'

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
}

const CATEGORY_ORDER = [
  "cereal",
  "grão",
  "massa",
  "óleo",
  "laticínio",
  "hortifrúti",
  "proteína",
  "enlatado",
  "bebida",
  "condimento",
  "outros"
]

// Helper component for batch items
function BatchItem({ b, unit, isExpired }) {
  const expDate = new Date(b.expiration_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const entryDateRaw = b.entry_date;
  const entryDateStr = entryDateRaw ? new Date(entryDateRaw).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A';

  return (
    <li className={`batch-item ${isExpired ? 'batch-item--expired' : ''}`}>
      <div className="batch-info-main">
        <span className="batch-qty">{b.current_quantity} {unit}</span>
        <span className="batch-exp">Venc: {expDate}</span>
      </div>
      <div className="batch-entry">
        Entrada: {entryDateStr}
      </div>
    </li>
  );
}

export default function ItemsPage({ onBack }) {
  const [items, setItems] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ====== Form / Modal States ======
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewingItem, setViewingItem] = useState(null)
  const [editingItemId, setEditingItemId] = useState(null)
  const [formData, setFormData] = useState({
    name: '', category: 'outros', unit_of_measure: 'kg',
    min_stock_level: 0, is_essential: false, nutritional_info: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState(null)
  const [actionError, setActionError] = useState(null)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        const [itemsRes, batchesRes] = await Promise.all([
          fetch(`${API_URL}/items`, { credentials: 'include' }),
          fetch(`${API_URL}/batch`, { credentials: 'include' })
        ]);

        if (!itemsRes.ok || !batchesRes.ok) {
          throw new Error('Falha ao buscar dados do backend.')
        }

        const itemsData = await itemsRes.json();
        const batchesData = await batchesRes.json();

        setItems(itemsData);
        setBatches(batchesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [])

  // ====== Handlers ======
  const openNewItemModal = () => {
    setEditingItemId(null)
    setFormData({
      name: '', category: 'outros', unit_of_measure: 'kg',
      min_stock_level: 0, is_essential: false, nutritional_info: ''
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (item) => {
    setEditingItemId(item.id)
    setFormData({
      name: item.name,
      category: item.category,
      unit_of_measure: item.unit_of_measure,
      min_stock_level: item.min_stock_level,
      is_essential: Boolean(item.is_essential),
      nutritional_info: item.nutritional_info || ''
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }))
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)

    try {
      if (editingItemId) {
        const response = await fetch(`${API_URL}/items/${editingItemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...formData, conversion_factor: 1 })
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.message || 'Erro ao atualizar item.')
        }

        setItems(prev => prev.map(item => item.id === editingItemId ? { ...item, ...formData } : item))
      } else {
        const response = await fetch(`${API_URL}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...formData, conversion_factor: 1 })
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.message || 'Erro ao cadastrar novo item.')
        }

        const newIdData = await response.json()
        const newItem = { id: newIdData.id, ...formData, conversion_factor: 1 }
        setItems(prev => [...prev, newItem])
      }

      setIsModalOpen(false)
      setFormData({
        name: '', category: 'outros', unit_of_measure: 'kg',
        min_stock_level: 0, is_essential: false, nutritional_info: ''
      })
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteItem = async (itemId) => {
    setActionError(null)

    if (!window.confirm("Você tem certeza que deseja excluir este item do inventário?")) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.status === 204) {
        setItems(prev => prev.filter(item => item.id !== itemId))
      } else if (response.status === 409) {
        const data = await response.json().catch(() => ({}))
        setActionError(data.message || "Este item não pode ser excluído pois ainda possui lotes vinculados.")
      } else {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || "Erro ao tentar excluir o item.")
      }
    } catch (err) {
      setActionError(err.message)
    }
  }

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter ? item.category === categoryFilter : true
    return matchesSearch && matchesCategory
  })

  // Group items by category
  const groupedItems = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = filteredItems.filter(item => item.category === cat)
    return acc
  }, {})

  return (
    <div className="items-page">
      {/* ══ Header ══ */}
      <header className="items-header">
        <div className="items-header__brand">
          <div className="items-header__logo" aria-hidden="true">🌱</div>
          <span className="items-header__brand-name">
            ONG<span>Conecta</span>
          </span>
        </div>
        <button
          className="items-header__back"
          onClick={onBack}
          aria-label="Voltar para a visão geral"
        >
          Voltar
        </button>
      </header>

      {/* ══ Main Content ══ */}
      <main className="items-main" role="main">
        <div className="items-page-header">
          <div>
            <p className="items-page-header__tag">Inventário Detalhado</p>
            <h1 className="items-page-header__title">Todos os Itens</h1>
          </div>
          <button
            className="items-header__new-btn"
            onClick={openNewItemModal}
          >
            Novo Item
          </button>
        </div>

        <div className="items-filters">
          <input
            type="text"
            placeholder="Buscar Item..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="items-filter-input"
          />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="items-filter-select"
          >
            <option value="">Todas as Categorias</option>
            {CATEGORY_ORDER.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
          {(searchTerm || categoryFilter) && (
            <button
              className="items-filter-clear"
              onClick={() => { setSearchTerm(''); setCategoryFilter(''); }}
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {loading && <div className="items-loading">Carregando itens...</div>}

        {error && <div className="items-error">{error}</div>}

        {actionError && (
          <div className="items-action-error" onClick={() => setActionError(null)}>
            <span>⚠️</span> {actionError} (clique para fechar)
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="items-empty">Nenhum item encontrado.</div>
        )}

        {!loading && !error && CATEGORY_ORDER.map(cat => {
          const catItems = groupedItems[cat]
          if (!catItems || catItems.length === 0) return null

          return (
            <section key={cat} className="items-category-section">
              <h2 className="items-category-section__title">
                <span aria-hidden="true">{CATEGORY_EMOJIS[cat] || "📦"}</span>
                {cat}
              </h2>
              <div className="items-grid">
                {catItems.map(item => (
                  <div
                    key={item.id}
                    className="item-card"
                    onClick={() => setViewingItem(item)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="item-card__header">
                      <div className="item-card__title-box">
                        <h3 className="item-card__name">{item.name}</h3>
                        {item.is_essential ? (
                          <span className="item-card__badge" aria-label="Item essencial">Essencial</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="item-card__body">
                      <p>Estoque Total Ativo: <span>{
                        batches
                          .filter(b => {
                            const isSameItem = b.item_type_id === item.id
                            const isNotEsgotado = b.status !== 'esgotado'
                            const isNotExpired = new Date(b.expiration_date) >= new Date()
                            return isSameItem && isNotEsgotado && isNotExpired
                          })
                          .reduce((sum, b) => sum + b.current_quantity, 0)
                      } {item.unit_of_measure}</span></p>
                      <p>Mínimo: <span>{item.min_stock_level} {item.unit_of_measure}</span></p>
                      {item.nutritional_info && (
                        <p>Info: <span>{item.nutritional_info}</span></p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </main>

      {/* ══ Viewing Modal ══ */}
      {viewingItem && (
        <div className="item-modal-overlay" onClick={() => setViewingItem(null)}>
          <div className="item-modal-content item-modal-content--large" onClick={e => e.stopPropagation()}>
            <header className="item-modal-content__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <span style={{ fontSize: '1.8rem' }}>{CATEGORY_EMOJIS[viewingItem.category] || "📦"}</span>
                <h2>{viewingItem.name}</h2>
              </div>
              <button className="item-modal-content__close" onClick={() => setViewingItem(null)}>&times;</button>
            </header>

            <div className="item-modal-body--detailed">
              <div className="item-details-grid">
                <div className="item-details-main">
                  <h3 className="details-section-title">Informações Gerais</h3>
                  <div className="details-info-list">
                    <div className="details-info-item">
                      <span className="details-label">Categoria:</span>
                      <span className="details-value" style={{ textTransform: 'capitalize' }}>{viewingItem.category}</span>
                    </div>
                    <div className="details-info-item">
                      <span className="details-label">Estoque Total:</span>
                      <span className="details-value" style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>
                        {batches
                          .filter(b => b.item_type_id === viewingItem.id && b.status !== 'esgotado' && new Date(b.expiration_date) >= new Date())
                          .reduce((sum, b) => sum + b.current_quantity, 0)} {viewingItem.unit_of_measure}
                      </span>
                    </div>
                    <div className="details-info-item">
                      <span className="details-label">Mínimo de Segurança:</span>
                      <span className="details-value">{viewingItem.min_stock_level} {viewingItem.unit_of_measure}</span>
                    </div>
                    <div className="details-info-item">
                      <span className="details-label">Informação Nutricional:</span>
                      <span className="details-value">{viewingItem.nutritional_info || "Nenhuma informação cadastrada."}</span>
                    </div>
                  </div>

                  <div className="details-actions-footer">
                    <button
                      className="details-edit-btn"
                      onClick={() => {
                        const itemToEdit = viewingItem;
                        setViewingItem(null);
                        openEditModal(itemToEdit);
                      }}
                    >
                      ✎ Editar Cadastro
                    </button>
                    <button
                      className="details-delete-btn"
                      onClick={() => {
                        const idToDelete = viewingItem.id;
                        setViewingItem(null);
                        handleDeleteItem(idToDelete);
                      }}
                    >
                      &times; Remover Item
                    </button>
                  </div>
                </div>

                <div className="item-details-side">
                  <h3 className="details-section-title">Lotes Vinculados</h3>
                  <div className="details-batches-list">
                    {(() => {
                      const itemBatches = batches.filter(b => b.item_type_id === viewingItem.id && b.status !== 'esgotado');
                      if (itemBatches.length === 0) return <p className="details-empty-msg">Nenhum lote disponível.</p>;

                      const today = new Date();
                      const valid = itemBatches.filter(b => new Date(b.expiration_date) >= today);
                      const expired = itemBatches.filter(b => new Date(b.expiration_date) < today);

                      return (
                        <>
                          {valid.length > 0 && (
                            <div className="details-batch-group">
                              <h4 className="details-group-subtitle">Lotes Ativos</h4>
                              <ul className="details-batch-ul">
                                {valid.map(b => <BatchItem key={b.id} b={b} unit={viewingItem.unit_of_measure} />)}
                              </ul>
                            </div>
                          )}
                          {expired.length > 0 && (
                            <div className="details-batch-group">
                              <h4 className="details-group-subtitle details-group-subtitle--expired">Lotes Vencidos ⚠️</h4>
                              <ul className="details-batch-ul">
                                {expired.map(b => <BatchItem key={b.id} b={b} unit={viewingItem.unit_of_measure} isExpired />)}
                              </ul>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal Novo Item ══ */}
      {isModalOpen && (
        <div className="item-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="item-modal-content" onClick={e => e.stopPropagation()}>
            <header className="item-modal-content__header">
              <h2>{editingItemId ? 'Editar Item' : 'Cadastrar Novo Item'}</h2>
              <button
                className="item-modal-content__close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Cerrar modal"
              >
                &times;
              </button>
            </header>

            <form onSubmit={handleAddItem} className="item-modal-form">
              {formError && <div className="item-modal-form__error">{formError}</div>}

              <div className="item-modal-form__group">
                <label htmlFor="name">Nome do Item *</label>
                <input
                  type="text" id="name" name="name"
                  required value={formData.name} onChange={handleInputChange}
                  placeholder="Ex: Arroz Agulhinha Tipo 1"
                />
              </div>

              <div className="item-modal-form__row">
                <div className="item-modal-form__group">
                  <label htmlFor="category">Categoria *</label>
                  <select id="category" name="category" value={formData.category} onChange={handleInputChange}>
                    {CATEGORY_ORDER.map(cat => (
                      <option key={cat} value={cat}>{CATEGORY_EMOJIS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div className="item-modal-form__group">
                  <label htmlFor="unit_of_measure">Unidade de Medida *</label>
                  <select id="unit_of_measure" name="unit_of_measure" value={formData.unit_of_measure} onChange={handleInputChange}>
                    <option value="kg">Quilogramas (kg)</option>
                    <option value="litro">Litros (L)</option>
                    <option value="unidade">Unidades</option>
                    <option value="caixa">Caixas</option>
                  </select>
                </div>
              </div>

              <div className="item-modal-form__row">
                <div className="item-modal-form__group">
                  <label htmlFor="min_stock_level">Estoque Mínimo *</label>
                  <input
                    type="number" id="min_stock_level" name="min_stock_level" min="0" step="0.1"
                    required value={formData.min_stock_level} onChange={handleInputChange}
                  />
                </div>

                <div className="item-modal-form__group item-modal-form__group--checkbox">
                  <label className="checkbox-label" style={{ marginTop: 'auto' }}>
                    <input
                      type="checkbox" name="is_essential"
                      checked={formData.is_essential} onChange={handleInputChange}
                    />
                    Item Essencial?
                  </label>
                </div>
              </div>

              <div className="item-modal-form__group">
                <label htmlFor="nutritional_info">Informações Nutricionais (Opcional)</label>
                <input
                  type="text" id="nutritional_info" name="nutritional_info"
                  value={formData.nutritional_info} onChange={handleInputChange}
                  placeholder="Ex: Rico em ferro"
                />
              </div>

              <button type="submit" className="item-modal-form__submit" disabled={formLoading}>
                {formLoading ? 'Salvando...' : (editingItemId ? 'Salvar Alterações' : 'Salvar Item')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
