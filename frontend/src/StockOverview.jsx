import { useState, useEffect } from 'react'
import { API_URL } from './config/api'
import './StockOverview.css'

/* ── Dados mock — serão substituídos pela API ── */
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

const CATEGORY_ORDER = [
  "cereal", "grão", "massa", "óleo", "laticínio", "hortifrúti", "proteína", "enlatado", "bebida", "condimento", "outros"
];

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
  const [expiringAlerts, setExpiringAlerts] = useState([]);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [batchesRes, itemsRes] = await Promise.all([
          fetch(`${API_URL}/batch`, { credentials: 'include' }),
          fetch(`${API_URL}/items`, { credentials: 'include' })
        ]);

        if (!batchesRes.ok || !itemsRes.ok) throw new Error('Falha ao buscar dados');

        const batches = await batchesRes.json();
        const items = await itemsRes.json();

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // 1. Processar Alertas de Validade (próximos 15 dias)
        const expiring = batches
          .filter(b => b.status !== 'esgotado')
          .map(b => {
            const expDate = new Date(b.expiration_date);
            const diffTime = expDate - today;
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { ...b, daysLeft };
          })
          .filter(b => b.daysLeft >= 0 && b.daysLeft <= 15)
          .sort((a, b) => a.daysLeft - b.daysLeft);

        setExpiringAlerts(expiring);

        // 2. Processar Estoque Crítico e Totais por Categoria
        const itemTotals = items.map(item => {
          const itemBatches = batches.filter(b => b.item_type_id === item.id && b.status !== 'esgotado');
          const totalKg = itemBatches.reduce((sum, b) => {
            const isExpired = new Date(b.expiration_date) < today;
            return sum + (!isExpired ? b.current_quantity : 0);
          }, 0);
          return { ...item, totalKg };
        });

        const critical = itemTotals
          .filter(item => item.totalKg < item.min_stock_level)
          .sort((a, b) => (a.totalKg / a.min_stock_level) - (b.totalKg / b.min_stock_level));

        setCriticalAlerts(critical);

        // 3. Agrupar por Categoria para o Grid
        const stats = CATEGORY_ORDER.map(catName => {
          const catItems = itemTotals.filter(i => i.category === catName);
          const totalKg = catItems.reduce((sum, i) => sum + i.totalKg, 0);
          const minKg = catItems.reduce((sum, i) => sum + i.min_stock_level, 0);
          
          if (catItems.length === 0 && totalKg === 0) return null;

          return {
            name: catName,
            emoji: CATEGORY_EMOJIS[catName] || "📦",
            kg: totalKg,
            minKg: minKg || 10,
            maxKg: Math.max(totalKg * 1.5, minKg * 2, 50)
          };
        }).filter(Boolean);

        setCategoryStats(stats);

        // 4. Dashboard Impacto Mensal
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const monthBatches = batches.filter(b => {
          const date = new Date(b.created_at || b.received_at || Date.now());
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        const dashTotal = monthBatches.reduce((sum, b) => sum + b.initial_quantity, 0);
        const grouped = monthBatches.reduce((acc, b) => {
          const cat = b.item_category || 'outros';
          acc[cat] = (acc[cat] || 0) + b.initial_quantity;
          return acc;
        }, {});

        const byCategory = Object.entries(grouped)
          .map(([category, kg]) => ({ category, kg }))
          .sort((a, b) => b.kg - a.kg);

        setReceivedImpact({ total: dashTotal, byCategory });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
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

            {loading ? (
              <div className="so-dash-card__loading">Analisando lotes e estoques...</div>
            ) : (
              <div className="so-alerts-grid">
                {/* Validade próxima */}
                <div className="so-alert-panel so-alert-panel--expiry">
                  <div className="so-alert-panel__header">
                    <span aria-hidden="true">🗓️</span>
                    <span>Validade Próxima</span>
                    <span className="so-alert-panel__count" aria-label={`${expiringAlerts.length} lotes`}>
                      {expiringAlerts.length}
                    </span>
                  </div>
                  {expiringAlerts.length === 0 ? (
                    <p className="so-alert-panel__empty">✅ Nenhum lote vencendo nos próximos 15 dias.</p>
                  ) : (
                    <ul className="so-alert-list" role="list">
                      {expiringAlerts.map((b, i) => (
                        <li key={i} className={`so-alert-item so-alert-item--${urgencyMod(b.daysLeft)}`}>
                          <div className="so-alert-item__info">
                            <span className="so-alert-item__name">{b.item_name}</span>
                            <span className="so-alert-item__cat">{b.item_category} • {b.current_quantity}{b.item_unit_of_measure}</span>
                          </div>
                          <span className="so-alert-item__days">{daysLabel(b.daysLeft)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Estoque crítico */}
                <div className="so-alert-panel so-alert-panel--critical">
                  <div className="so-alert-panel__header">
                    <span aria-hidden="true">🔴</span>
                    <span>Estoque Crítico</span>
                    <span className="so-alert-panel__count so-alert-panel__count--red" aria-label={`${criticalAlerts.length} itens`}>
                      {criticalAlerts.length}
                    </span>
                  </div>
                  {criticalAlerts.length === 0 ? (
                    <p className="so-alert-panel__empty">✅ Todos os itens estão acima do mínimo.</p>
                  ) : (
                    <ul className="so-alert-list" role="list">
                      {criticalAlerts.map((item, i) => (
                        <li key={i} className="so-alert-item so-alert-item--urgent">
                          <div className="so-alert-item__info">
                            <span className="so-alert-item__name">{CATEGORY_EMOJIS[item.category] || "📦"} {item.name}</span>
                            <span className="so-alert-item__cat">Mínimo: {item.min_stock_level} {item.unit_of_measure}</span>
                          </div>
                          <span className="so-alert-item__days">{item.totalKg.toFixed(1)} {item.unit_of_measure} restante</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
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

            {loading ? (
               <div className="so-dash-card__loading">Calculando saldos por categoria...</div>
            ) : (
              <div className="so-categories-grid">
                {categoryStats.map((cat, i) => {
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
            )}
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
                  {loading ? (
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
