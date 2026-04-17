import './StockOverview.css'

export default function StockOverview({ onLogout }) {
  return (
    <div className="stock-overview">
      <header className="stock-overview__header">
        <div className="stock-overview__brand">
          <div className="stock-overview__logo" aria-hidden="true">🌱</div>
          <span className="stock-overview__brand-name">
            ONG<span>Conecta</span>
          </span>
        </div>

        <button
          id="btn-logout"
          className="stock-overview__logout"
          onClick={onLogout}
          aria-label="Sair da plataforma"
        >
          Sair
        </button>
      </header>

      <main className="stock-overview__main" role="main">
        <div className="stock-overview__placeholder">
          <div className="stock-overview__placeholder-icon" aria-hidden="true">📦</div>
          <h1 className="stock-overview__placeholder-title">Visão Geral dos Estoques</h1>
          <p className="stock-overview__placeholder-desc">
            Esta página está em desenvolvimento e será implementada em breve.
          </p>
          <div className="stock-overview__placeholder-badge">Em breve</div>
        </div>
      </main>
    </div>
  )
}
