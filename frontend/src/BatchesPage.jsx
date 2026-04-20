import { useEffect, useState, useMemo } from 'react'
import { API_URL } from './config/api'
import './BatchesPage.css'

export default function BatchesPage({ onBack }) {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // order options: 'exp_asc', 'exp_desc', 'entry_desc', 'entry_asc'
  const [sortOption, setSortOption] = useState('exp_asc')

  useEffect(() => {
    async function fetchBatches() {
      try {
        const response = await fetch(`${API_URL}/batch`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Falha ao buscar lotes do backend.')
        }

        const data = await response.json();
        setBatches(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBatches();
  }, [])

  const sortedBatches = useMemo(() => {
    return [...batches].sort((a, b) => {
      const dateA = new Date(a.expiration_date).getTime()
      const dateB = new Date(b.expiration_date).getTime()
      
      const entryA = new Date(a.entry_date || a.created_at || 0).getTime()
      const entryB = new Date(b.entry_date || b.created_at || 0).getTime()

      if (sortOption === 'exp_asc') return dateA - dateB
      if (sortOption === 'exp_desc') return dateB - dateA
      if (sortOption === 'entry_desc') return entryB - entryA
      if (sortOption === 'entry_asc') return entryA - entryB
      
      return 0
    })
  }, [batches, sortOption])

  return (
    <div className="batches-page">
      {/* ══ Header ══ */}
      <header className="batches-header">
        <div className="batches-header__brand">
          <div className="batches-header__logo" aria-hidden="true">🌱</div>
          <span className="batches-header__brand-name">
            ONG<span>Conecta</span>
          </span>
        </div>
        <button
          className="batches-header__back"
          onClick={onBack}
          aria-label="Voltar para a visão geral"
        >
          Voltar
        </button>
      </header>

      {/* ══ Main Content ══ */}
      <main className="batches-main" role="main">
        <div className="batches-page-header">
          <div>
            <p className="batches-page-header__tag">Controle Operacional</p>
            <h1 className="batches-page-header__title">Visão de Lotes</h1>
          </div>
          
          <div className="batches-sort-control">
            <label htmlFor="sortSelect">Ordenar por:</label>
            <select 
              id="sortSelect" 
              value={sortOption} 
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="exp_asc">Validade (Mais próximos)</option>
              <option value="exp_desc">Validade (Mais distantes)</option>
              <option value="entry_desc">Entrada (Mais recentes)</option>
              <option value="entry_asc">Entrada (Mais antigos)</option>
            </select>
          </div>
        </div>

        {loading && <div className="batches-loading">Carregando lotes...</div>}
        
        {error && <div className="batches-error">{error}</div>}

        {!loading && !error && batches.length === 0 && (
          <div className="batches-empty">Nenhum lote registrado.</div>
        )}

        {!loading && !error && batches.length > 0 && (
          <div className="batches-table-wrapper">
            <table className="batches-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Alimento</th>
                  <th>Categoria</th>
                  <th>Qtd Atual</th>
                  <th>Validade</th>
                  <th>Data Entrada</th>
                </tr>
              </thead>
              <tbody>
                {sortedBatches.map(batch => {
                  const expDate = new Date(batch.expiration_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                  const entryRaw = batch.entry_date || batch.created_at
                  const entryDate = entryRaw ? new Date(entryRaw).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'
                  const statusLabel = batch.status === 'esgotado' ? 'Esgotado' : 'Disponível'
                  
                  return (
                    <tr key={batch.id} className={`batch-row batch-row--${batch.status}`}>
                      <td>
                        <span className={`batch-status-badge batch-status-badge--${batch.status}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="batch-cell-name">{batch.item_name}</td>
                      <td className="batch-cell-cat" style={{textTransform: 'capitalize'}}>{batch.item_category}</td>
                      <td className="batch-cell-qty">{batch.current_quantity} {batch.item_unit_of_measure}</td>
                      <td className="batch-cell-exp">{expDate}</td>
                      <td className="batch-cell-entry">{entryDate}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
