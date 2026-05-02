import { useState, useEffect } from 'react'
import { API_URL } from './config/api'
import './StockOverview.css'

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
              <span className="impact-chart__val">{item.kg.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}<span> kg</span></span>
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

function urgencyMod(days) {
  if (days <= 3) return 'urgent'
  if (days <= 7) return 'warning'
  return 'notice'
}

function daysLabel(days) {
  if (days === 1) return 'Vence amanhã'
  return `Vence em ${days} dias`
}

export default function StockOverview({ onLogout, onViewItems, onViewBatches, onViewDonations, onViewHistory }) {
  const [receivedImpact, setReceivedImpact] = useState({ total: 0, byCategory: [] });
  const [donatedImpact, setDonatedImpact] = useState({ total: 0, byCategory: [] });
  const [expiringAlerts, setExpiringAlerts] = useState([]);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [batchesRes, itemsRes, packetsRes, donItemsRes] = await Promise.all([
          fetch(`${API_URL}/batch`, { credentials: 'include' }),
          fetch(`${API_URL}/items`, { credentials: 'include' }),
          fetch(`${API_URL}/donation-packets?status=finalizado`, { credentials: 'include' }),
          fetch(`${API_URL}/donation-items`, { credentials: 'include' })
        ]);

        if (!batchesRes.ok || !itemsRes.ok) throw new Error('Falha ao buscar dados básicos');

        const batches = await batchesRes.json();
        const items = await itemsRes.json();
        const allFinalized = packetsRes.ok ? await packetsRes.json() : [];
        const allDonationItems = donItemsRes.ok ? await donItemsRes.json() : [];

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // 1. Alertas de Validade
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

        // 2. Estoque Crítico
        const itemTotals = items.map(item => {
          const itemBatches = batches.filter(b => b.item_type_id === item.id && b.status !== 'esgotado');
          const totalQty = itemBatches.reduce((sum, b) => {
            const isExpired = new Date(b.expiration_date) < today;
            return sum + (!isExpired ? b.current_quantity : 0);
          }, 0);
          return { ...item, totalQty };
        });

        const critical = itemTotals
          .filter(item => item.totalQty < item.min_stock_level)
          .sort((a, b) => (a.totalQty / item.min_stock_level) - (b.totalQty / item.min_stock_level));

        setCriticalAlerts(critical);

        // 3. Grid de Categorias
        const stats = CATEGORY_ORDER.map(catName => {
          const catItems = itemTotals.filter(i => i.category === catName);
          const totalQty = catItems.reduce((sum, i) => sum + i.totalQty, 0);
          const minQty = catItems.reduce((sum, i) => sum + i.min_stock_level, 0);
          if (catItems.length === 0 && totalQty === 0) return null;
          return { name: catName, emoji: CATEGORY_EMOJIS[catName] || "📦", qty: totalQty, minQty };
        }).filter(Boolean);
        setCategoryStats(stats);

        // 4. Impacto ENTRADAS
        const monthBatches = batches.filter(b => {
          const date = new Date(b.created_at || b.received_at || Date.now());
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        const dashReceivedTotal = monthBatches.reduce((sum, b) => sum + (b.initial_quantity * (b.item_conversion_factor || 1)), 0);
        const groupedReceived = monthBatches.reduce((acc, b) => {
          const cat = b.item_category || 'outros';
          acc[cat] = (acc[cat] || 0) + (b.initial_quantity * (b.item_conversion_factor || 1));
          return acc;
        }, {});
        setReceivedImpact({ 
          total: dashReceivedTotal, 
          byCategory: Object.entries(groupedReceived).map(([category, kg]) => ({ category, kg })).sort((a, b) => b.kg - a.kg) 
        });

        // 5. Impacto SAÍDAS
        const monthPackets = allFinalized.filter(p => {
          const date = new Date(p.donation_date);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        const monthPacketIds = new Set(monthPackets.map(p => p.id));
        let totalDonatedKg = 0;
        const groupedDonated = {};

        allDonationItems.forEach(di => {
          if (monthPacketIds.has(di.donation_packet_id)) {
            const batch = batches.find(b => b.id === di.batch_id);
            const weight = di.quantity_removed * (batch?.item_conversion_factor || 1);
            const cat = batch?.item_category || 'outros';
            totalDonatedKg += weight;
            groupedDonated[cat] = (groupedDonated[cat] || 0) + weight;
          }
        });
        setDonatedImpact({ 
          total: totalDonatedKg, 
          byCategory: Object.entries(groupedDonated).map(([category, kg]) => ({ category, kg })).sort((a, b) => b.kg - a.kg) 
        });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const todayStr = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="so">
      <header className="so-header">
        <div className="so-header__brand">
          <div className="so-header__logo" aria-hidden="true">🌱</div>
          <span className="so-header__brand-name">ONG<span>Conecta</span></span>
        </div>
        <nav className="so-header__nav">
          <button className="so-header__nav-btn" onClick={onViewHistory}>Histórico</button>
          <button className="so-header__nav-btn" onClick={onViewDonations}>Doações</button>
          <button className="so-header__nav-btn" onClick={onViewBatches}>Lotes</button>
          <button className="so-header__nav-btn" onClick={onViewItems}>Itens</button>
        </nav>
        <button className="so-header__logout" onClick={onLogout}>Sair</button>
      </header>

      <main className="so-main">
        <div className="so-container">
          <div className="so-page-header">
            <div>
              <p className="so-page-header__tag">Bem-vindo de volta</p>
              <h1 className="so-page-header__title">Visão Geral dos Estoques</h1>
            </div>
            <p className="so-page-header__date">{todayStr}</p>
          </div>

          <section className="so-section">
            <div className="so-section__head">
              <p className="so-section__tag">Atenção necessária</p>
              <h2 className="so-section__title">⚠️ Avisos</h2>
            </div>
            {loading ? <div className="so-dash-card__loading">Analisando dados...</div> : (
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
                          <span className="so-alert-item__days">{item.totalQty.toFixed(1)} {item.unit_of_measure} restante</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="so-section" id="estoque" aria-labelledby="estoque-titulo">
            <div className="so-section__head">
              <p className="so-section__tag">Inventário atual</p>
              <h2 id="estoque-titulo" className="so-section__title">📦 Estoque por Categoria</h2>
            </div>
            {loading ? <div className="so-dash-card__loading">Calculando...</div> : (
              <div className="so-categories-grid">
                {categoryStats.map((cat, i) => (
                  <div key={i} className={`so-cat-card ${cat.qty < cat.minQty ? 'so-cat-card--critical' : ''}`}>
                    <div className="so-cat-card__emoji">{cat.emoji}</div>
                    <div className="so-cat-card__name">{cat.name}</div>
                    <div className="so-cat-card__kg">{cat.qty.toFixed(1)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="so-section">
            <div className="so-section__head">
              <p className="so-section__tag">Impacto do mês</p>
              <h2 className="so-section__title">📊 Dashboard Mensal</h2>
            </div>
            <div className="so-dash-container">
              <div className="so-dash-card so-dash-card--donations">
                <div className="so-dash-card__header">
                  <div className="so-dash-card__icon">🤝</div>
                  <div className="so-dash-card__info">
                    <h3 className="so-dash-card__title">Itens Doados</h3>
                    <div className="so-dash-card__total">{donatedImpact.total.toFixed(1)}<span> kg</span></div>
                  </div>
                </div>
                <div className="so-dash-card__content">
                  {donatedImpact.byCategory.length > 0 ? <ImpactChart data={donatedImpact.byCategory} colorScheme="primary" /> : <p className="so-dash-card__empty">Sem doações.</p>}
                </div>
              </div>
              <div className="so-dash-card so-dash-card--received">
                <div className="so-dash-card__header">
                  <div className="so-dash-card__icon">📦</div>
                  <div className="so-dash-card__info">
                    <h3 className="so-dash-card__title">Itens Recebidos</h3>
                    <div className="so-dash-card__total">{receivedImpact.total.toFixed(1)}<span> kg</span></div>
                  </div>
                </div>
                <div className="so-dash-card__content">
                  {receivedImpact.byCategory.length > 0 ? <ImpactChart data={receivedImpact.byCategory} colorScheme="accent" /> : <p className="so-dash-card__empty">Sem entradas.</p>}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
