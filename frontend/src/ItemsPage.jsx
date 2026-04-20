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
          <p className="items-page-header__tag">Inventário Detalhado</p>
          <h1 className="items-page-header__title">Todos os Itens</h1>
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
    </div>
  )
}
