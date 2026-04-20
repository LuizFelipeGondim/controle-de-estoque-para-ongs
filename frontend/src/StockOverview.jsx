import './StockOverview.css'

/* ── Dados mock — serão substituídos pela API ── */
const CATEGORIES = [
  { name: 'Arroz', emoji: '🌾', kg: 45.5, minKg: 20, maxKg: 80 },
  { name: 'Feijão', emoji: '🫘', kg: 8.2, minKg: 10, maxKg: 40 },
  { name: 'Macarrão', emoji: '🍝', kg: 22.0, minKg: 15, maxKg: 60 },
  { name: 'Grãos', emoji: '🌽', kg: 31.0, minKg: 20, maxKg: 80 },
  { name: 'Carne', emoji: '🥩', kg: 12.8, minKg: 15, maxKg: 50 },
  { name: 'Legume', emoji: '🥕', kg: 18.3, minKg: 10, maxKg: 40 },
  { name: 'Verdura', emoji: '🥬', kg: 5.1, minKg: 8, maxKg: 30 },
]

const EXPIRING = [
  { name: 'Espinafre', category: 'Verdura', daysLeft: 2, date: '19/04/2026' },
  { name: 'Arroz Tipo 1', category: 'Arroz', daysLeft: 4, date: '21/04/2026' },
  { name: 'Carne Bovina', category: 'Carne', daysLeft: 8, date: '25/04/2026' },
]

const DASHBOARD = {
  totalDonationsKg: 1247.5,
  totalReceivedKg: 4830.5,
}

/* Urgência da validade */
function urgencyMod(days) {
  if (days <= 3) return 'urgent'
  if (days <= 7) return 'warning'
  return 'notice'
}

function daysLabel(days) {
  if (days === 1) return 'Vence amanhã'
  return `Vence em ${days} dias`
}

/* ── Componente ── */
export default function StockOverview({ onLogout, onViewItems, onAddBatch }) {
  const lowStock = CATEGORIES.filter(c => c.kg < c.minKg)

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="so">

      {/* ══ Header ══ */}
      <header className="so-header">
        <div className="so-header__brand">
          <div className="so-header__logo" aria-hidden="true">🌱</div>
          <span className="so-header__brand-name">
            ONG<span>Conecta</span>
          </span>
        </div>
        <button
          id="btn-logout"
          className="so-header__logout"
          onClick={onLogout}
          aria-label="Sair da plataforma"
        >
          Sair
        </button>
      </header>

      {/* ══ Conteúdo principal ══ */}
      <main className="so-main" role="main">
        <div className="so-container">

          {/* Título da página */}
          <div className="so-page-header">
            <div>
              <p className="so-page-header__tag">Bem-vindo de volta</p>
              <h1 className="so-page-header__title">Visão Geral dos Estoques</h1>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem'}}>
              <p className="so-page-header__date" aria-label="Data de hoje">{today}</p>
              <button 
                className="so-header__logout" 
                style={{borderColor: 'var(--color-primary-light)', color: 'var(--color-primary-light)'}}
                onClick={onAddBatch}
              >
                ➕ Entrada de Lote
              </button>
            </div>
          </div>

          {/* ══ Seção 1 — Avisos ══ */}
          <section className="so-section" id="avisos" aria-labelledby="avisos-titulo">
            <div className="so-section__head">
              <p className="so-section__tag">Atenção necessária</p>
              <h2 id="avisos-titulo" className="so-section__title">⚠️ Avisos</h2>
            </div>

            <div className="so-alerts-grid">

              {/* Validade próxima */}
              <div className="so-alert-panel so-alert-panel--expiry">
                <div className="so-alert-panel__header">
                  <span aria-hidden="true">🗓️</span>
                  <span>Validade Próxima</span>
                  <span className="so-alert-panel__count" aria-label={`${EXPIRING.length} itens`}>
                    {EXPIRING.length}
                  </span>
                </div>
                <ul className="so-alert-list" role="list">
                  {EXPIRING.map((item, i) => (
                    <li key={i} className={`so-alert-item so-alert-item--${urgencyMod(item.daysLeft)}`}>
                      <div className="so-alert-item__info">
                        <span className="so-alert-item__name">{item.name}</span>
                        <span className="so-alert-item__cat">{item.category}</span>
                      </div>
                      <span className="so-alert-item__days">{daysLabel(item.daysLeft)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Estoque crítico */}
              <div className="so-alert-panel so-alert-panel--critical">
                <div className="so-alert-panel__header">
                  <span aria-hidden="true">🔴</span>
                  <span>Estoque Crítico</span>
                  <span className="so-alert-panel__count so-alert-panel__count--red" aria-label={`${lowStock.length} itens`}>
                    {lowStock.length}
                  </span>
                </div>
                {lowStock.length === 0 ? (
                  <p className="so-alert-panel__empty">✅ Todos os itens estão acima do mínimo.</p>
                ) : (
                  <ul className="so-alert-list" role="list">
                    {lowStock.map((item, i) => (
                      <li key={i} className="so-alert-item so-alert-item--urgent">
                        <div className="so-alert-item__info">
                          <span className="so-alert-item__name">{item.emoji} {item.name}</span>
                          <span className="so-alert-item__cat">Mínimo: {item.minKg} kg</span>
                        </div>
                        <span className="so-alert-item__days">{item.kg} kg restante</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

            </div>
          </section>

          {/* ══ Seção 2 — Estoque por Categoria ══ */}
          <section className="so-section" id="estoque" aria-labelledby="estoque-titulo">
            <div className="so-section__head" style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem'}}>
              <div>
                <p className="so-section__tag">Inventário atual</p>
                <h2 id="estoque-titulo" className="so-section__title">📦 Estoque por Categoria</h2>
              </div>
              <button 
                className="so-header__logout" 
                style={{marginBottom: '0.2rem'}}
                onClick={onViewItems}
              >
                Ver todos os itens
              </button>
            </div>

            <div className="so-categories-grid">
              {CATEGORIES.map((cat, i) => {
                const isCritical = cat.kg < cat.minKg
                const pct = Math.min((cat.kg / cat.maxKg) * 100, 100)
                return (
                  <div
                    key={i}
                    className={`so-cat-card${isCritical ? ' so-cat-card--critical' : ''}`}
                  >
                    {isCritical && (
                      <span className="so-cat-card__badge" aria-label="Estoque crítico">Crítico</span>
                    )}
                    <div className="so-cat-card__emoji" aria-hidden="true">{cat.emoji}</div>
                    <div className="so-cat-card__name">{cat.name}</div>
                    <div className="so-cat-card__kg">
                      {cat.kg.toFixed(1)}<span> kg</span>
                    </div>
                    <div
                      className="so-cat-card__bar-track"
                      role="progressbar"
                      aria-valuenow={cat.kg}
                      aria-valuemin={0}
                      aria-valuemax={cat.maxKg}
                      aria-label={`${cat.name}: ${cat.kg} de ${cat.maxKg} kg`}
                    >
                      <div
                        className={`so-cat-card__bar-fill${isCritical ? ' so-cat-card__bar-fill--critical' : ''}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="so-cat-card__min">Mín: {cat.minKg} kg</div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ══ Seção 3 — Dashboard ══ */}
          <section className="so-section" id="dashboard" aria-labelledby="dash-titulo">
            <div className="so-section__head">
              <p className="so-section__tag">Impacto social</p>
              <h2 id="dash-titulo" className="so-section__title">📊 Dashboard</h2>
            </div>

            <div className="so-dash-grid">
              <div className="so-metric-card so-metric-card--donations">
                <div className="so-metric-card__icon" aria-hidden="true">🤝</div>
                <div className="so-metric-card__value">
                  {DASHBOARD.totalDonationsKg.toLocaleString('pt-BR')}
                  <span> kg</span>
                </div>
                <div className="so-metric-card__label">Doações realizadas</div>
                <div className="so-metric-card__sublabel">Total acumulado</div>
              </div>

              <div className="so-metric-card so-metric-card--received">
                <div className="so-metric-card__icon" aria-hidden="true">📦</div>
                <div className="so-metric-card__value">
                  {DASHBOARD.totalReceivedKg.toLocaleString('pt-BR')}
                  <span> kg</span>
                </div>
                <div className="so-metric-card__label">Alimentos recebidos</div>
                <div className="so-metric-card__sublabel">Total acumulado</div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
