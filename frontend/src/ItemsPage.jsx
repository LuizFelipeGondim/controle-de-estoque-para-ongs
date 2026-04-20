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

export default function ItemsPage({ onBack }) {
  const [items, setItems] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ====== Form / Modal States ======
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '', category: 'outros', unit_of_measure: 'unidade',
    min_stock_level: 0, is_essential: false, nutritional_info: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState(null)

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
      setIsModalOpen(false)
      setFormData({
        name: '', category: 'outros', unit_of_measure: 'unidade',
        min_stock_level: 0, is_essential: false, nutritional_info: ''
      })
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  // Group items by category
  const groupedItems = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = items.filter(item => item.category === cat)
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
            onClick={() => setIsModalOpen(true)}
          >
            Novo Item
          </button>
        </div>

        {loading && <div className="items-loading">Carregando itens...</div>}

        {error && <div className="items-error">{error}</div>}

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
                  <div key={item.id} className="item-card">
                    <div className="item-card__header">
                      <h3 className="item-card__name">{item.name}</h3>
                      {item.is_essential ? (
                        <span className="item-card__badge" aria-label="Item essencial">Essencial</span>
                      ) : null}
                    </div>
                    <div className="item-card__body">
                      <p>Estoque Total: <span>{
                        batches
                          .filter(b => b.item_type_id === item.id && b.status !== 'esgotado')
                          .reduce((sum, b) => sum + b.current_quantity, 0)
                      } {item.unit_of_measure}</span></p>
                      <p>Mínimo: <span>{item.min_stock_level} {item.unit_of_measure}</span></p>
                      {item.nutritional_info && (
                        <p>Info: <span>{item.nutritional_info}</span></p>
                      )}

                      <div className="item-card__batches">
                        <h4 className="item-card__batches-title">Lotes Ativos</h4>
                        {(() => {
                          const itemBatches = batches.filter(b => b.item_type_id === item.id && b.status !== 'esgotado');
                          if (itemBatches.length === 0) {
                            return <p className="item-card__no-batches">Nenhum lote disponível.</p>;
                          }
                          return (
                            <ul className="item-card__batch-list" role="list">
                              {itemBatches.map(b => {
                                const expDate = new Date(b.expiration_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                                const entryDateRaw = b.entry_date;
                                const entryDateStr = entryDateRaw ? new Date(entryDateRaw).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A';

                                return (
                                  <li key={b.id} className={`batch-item batch-item--${b.status}`}>
                                    <div className="batch-info-main">
                                      <span className="batch-qty">{b.current_quantity} {item.unit_of_measure}</span>
                                      <span className="batch-exp">Venc: {expDate}</span>
                                    </div>
                                    <div className="batch-entry">
                                      Entrada: {entryDateStr}
                                    </div>
                                  </li>
                                )
                              })}
                            </ul>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </main>

      {/* ══ Modal Novo Item ══ */}
      {isModalOpen && (
        <div className="item-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="item-modal-content" onClick={e => e.stopPropagation()}>
            <header className="item-modal-content__header">
              <h2>Cadastrar Novo Item</h2>
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
                <label htmlFor="name">Nome do Alimento *</label>
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
                {formLoading ? 'Salvando...' : 'Salvar Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
