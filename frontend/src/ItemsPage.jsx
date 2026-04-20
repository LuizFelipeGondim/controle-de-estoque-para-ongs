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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchItems() {
      try {
        const response = await fetch(`${API_URL}/items`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Falha ao buscar itens do backend.')
        }

        const data = await response.json();
        setItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
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
    </div>
  )
}
