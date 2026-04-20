import { useState, useEffect } from 'react'
import { API_URL } from './config/api'
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

const MOCK_DONATIONS = [
  { category: 'Cestas Básicas', kg: 450 },
  { category: 'Marmitas', kg: 320 },
  { category: 'Higiene', kg: 120 },
  { category: 'Grãos', kg: 85 },
];

/* Componente de Gráfico de Barras */
function ImpactChart({ data, colorScheme = 'primary' }) {
  const maxVal = Math.max(...data.map(d => d.kg), 1);

  return (
    <div className="impact-chart">
      {data.map((item, i) => {
        const pct = (item.kg / maxVal) * 100;
        return (
          <div key={i} className="impact-chart__row">
            <div className="impact-chart__label">
              <span className="impact-chart__cat">{item.category}</span>
              <span className="impact-chart__val">{item.kg.toLocaleString('pt-BR')}<span> kg</span></span>
            </div>
            <div className="impact-chart__bar-track">
              <div
                className={`impact-chart__bar-fill impact-chart__bar-fill--${colorScheme}`}
                style={{ width: `${pct}%`, transitionDelay: `${i * 100}ms` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
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
export default function StockOverview({ onLogout, onViewItems, onViewBatches }) {
  const [receivedImpact, setReceivedImpact] = useState({ total: 0, byCategory: [] });
  const [loadingDash, setLoadingDash] = useState(true);

  const lowStock = CATEGORIES.filter(c => c.kg < c.minKg)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch(`${API_URL}/batch`, { credentials: 'include' });
        if (!response.ok) throw new Error('Falha ao buscar dados do dashboard');

        const batches = await response.json();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Filtrar lotes do mês atual
        const monthBatches = batches.filter(b => {
          const date = new Date(b.created_at || b.received_at || Date.now());
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        const total = monthBatches.reduce((sum, b) => sum + b.initial_quantity, 0);

        // Agrupar por categoria
        const grouped = monthBatches.reduce((acc, b) => {
          const cat = b.item_category || 'Outros';
          acc[cat] = (acc[cat] || 0) + b.initial_quantity;
          return acc;
        }, {});

        const byCategory = Object.entries(grouped)
          .map(([category, kg]) => ({ category, kg }))
          .sort((a, b) => b.kg - a.kg);

        setReceivedImpact({ total, byCategory });
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDash(false);
      }
    }

    fetchDashboardData();
  }, []);

  const todayStr = new Date().toLocaleDateString('pt-BR', {
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <p className="so-page-header__date" aria-label="Data de hoje">{todayStr}</p>
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
            <div className="so-section__head" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p className="so-section__tag">Inventário atual</p>
                <h2 id="estoque-titulo" className="so-section__title">📦 Estoque por Categoria</h2>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <button
                  className="so-header__logout"
                  onClick={onViewBatches}
                >
                  Ver todos os lotes
                </button>
                <button
                  className="so-header__logout"
                  onClick={onViewItems}
                >
                  Ver todos os itens
                </button>
              </div>
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
              <p className="so-section__tag">Impacto do mês atual</p>
              <h2 id="dash-titulo" className="so-section__title">📊 Dashboard Mensal</h2>
            </div>

            <div className="so-dash-container">
              {/* Subseção: Doações Realizadas (Mock) */}
              <div className="so-dash-card so-dash-card--donations">
                <div className="so-dash-card__header">
                  <div className="so-dash-card__icon">🤝</div>
                  <div className="so-dash-card__info">
                    <h3 className="so-dash-card__title">Itens Doados</h3>
                    <div className="so-dash-card__total">
                      {(975).toLocaleString('pt-BR')}<span> kg</span>
                    </div>
                  </div>
                </div>
                <div className="so-dash-card__content">
                  <p className="so-dash-card__subtitle">Distribuição por categoria (Mock)</p>
                  <ImpactChart data={MOCK_DONATIONS} colorScheme="primary" />
                </div>
              </div>

              {/* Subseção: Itens Recebidos (Real) */}
              <div className="so-dash-card so-dash-card--received">
                <div className="so-dash-card__header">
                  <div className="so-dash-card__icon">📦</div>
                  <div className="so-dash-card__info">
                    <h3 className="so-dash-card__title">Itens Recebidos</h3>
                    <div className="so-dash-card__total">
                      {receivedImpact.total.toLocaleString('pt-BR')}<span> kg</span>
                    </div>
                  </div>
                </div>
                <div className="so-dash-card__content">
                  {loadingDash ? (
                    <div className="so-dash-card__loading">Carregando dados...</div>
                  ) : receivedImpact.byCategory.length > 0 ? (
                    <>
                      <p className="so-dash-card__subtitle">Distribuição por categoria</p>
                      <ImpactChart data={receivedImpact.byCategory} colorScheme="accent" />
                    </>
                  ) : (
                    <p className="so-dash-card__empty">Nenhuma entrada registrada este mês.</p>
                  )}
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
