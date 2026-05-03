import { useEffect, useState } from 'react'
import { API_URL } from './config/api'
import './HistoryPage.css'

export default function HistoryPage({ 
  onBack,
  onViewOverview,
  onViewHistory,
  onViewDonations,
  onViewBatches,
  onViewItems,
  onLogout
}) {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter states
  const [filterDate, setFilterDate] = useState('')
  const [filterType, setFilterType] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true)
      try {
        // 1. Buscar Lotes (Entradas)
        const batchesRes = await fetch(`${API_URL}/batch`, { credentials: 'include' })
        const batches = await batchesRes.json()

        // 2. Buscar Pacotes Finalizados (Saídas)
        const packetsRes = await fetch(`${API_URL}/donation-packets?status=finalizado`, { credentials: 'include' })
        const finalizedPackets = await packetsRes.ok ? await packetsRes.json() : []

        // 3. Buscar Itens de Doação (detalhes das saídas)
        const itemsRes = await fetch(`${API_URL}/donation-items`, { credentials: 'include' })
        const donationItems = await itemsRes.ok ? await itemsRes.json() : []

        // ── PROCESSAR ENTRADAS ──
        const entries = batches.map(b => ({
          id: `entry-${b.id}`,
          date: b.created_at || new Date().toISOString(),
          type: 'entrada',
          itemName: b.item_name,
          quantity: b.initial_quantity,
          unit: b.item_unit_of_measure,
          partner: 'Doador/Fornecedor',
          notes: `Lote com validade ${new Date(b.expiration_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`
        }))

        // ── PROCESSAR SAÍDAS ──
        const finalizedIds = new Set(finalizedPackets.map(p => p.id))
        const exitItems = donationItems.filter(di => finalizedIds.has(di.donation_packet_id))
        
        const exits = []
        for (const item of exitItems) {
          const packet = finalizedPackets.find(p => p.id === item.donation_packet_id)
          if (packet) {
            const batch = batches.find(b => b.id === item.batch_id)
            
            exits.push({
              id: `exit-${item.id}`,
              date: packet.donation_date,
              type: 'saida',
              itemName: batch?.item_name || 'Item',
              quantity: item.quantity_removed,
              unit: batch?.item_unit_of_measure || 'un',
              partner: packet.destination,
              notes: packet.notes || 'Doação realizada'
            })
          }
        }

        // 4. Unificar e Ordenar por data descendente
        const allMovements = [...entries, ...exits].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        )

        setMovements(allMovements)
      } catch (err) {
        setError('Erro ao compilar histórico de movimentações.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  return (
    <div className="history-page">
      {/* ══ Header ══ */}
      <header className="history-header">
        <div className="history-header__brand" onClick={onViewOverview} style={{ cursor: 'pointer' }}>
          <div className="history-header__logo" aria-hidden="true">🌱</div>
          <span className="history-header__brand-name">
            ONG<span>Conecta</span>
          </span>
        </div>
        <nav className="history-header__nav">
          <button className="history-header__nav-btn" onClick={onViewOverview}>Overview</button>
          <button className="history-header__nav-btn history-header__nav-btn--active" onClick={onViewHistory}>Histórico</button>
          <button className="history-header__nav-btn" onClick={onViewDonations}>Doações</button>
          <button className="history-header__nav-btn" onClick={onViewBatches}>Lotes</button>
          <button className="history-header__nav-btn" onClick={onViewItems}>Itens</button>
        </nav>
        <button className="history-header__logout" onClick={onLogout}>Sair</button>
      </header>

      {/* ══ Main Content ══ */}
      <main className="history-main" role="main">
        <div className="history-page-header">
          <div>
            <p className="history-page-header__tag">Transparência e Controle</p>
            <h1 className="history-page-header__title">Histórico de Movimentações</h1>
          </div>
        </div>

        <div className="history-filters">
          <input 
            type="text" 
            placeholder="Buscar por item..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="history-filter-input"
          />
          <input 
            type="date" 
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="history-filter-date"
            title="Filtrar por data"
          />
          <select 
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="history-filter-select"
          >
            <option value="">Todos os Tipos</option>
            <option value="entrada">Entradas</option>
            <option value="saida">Saídas</option>
          </select>
          {(searchTerm || filterDate || filterType) && (
            <button 
              className="history-filter-clear"
              onClick={() => { setSearchTerm(''); setFilterDate(''); setFilterType(''); }}
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {loading && <div className="history-loading">Compilando histórico...</div>}
        {error && <div className="history-error">{error}</div>}

        {!loading && !error && movements.length === 0 && (
          <div className="history-empty">
            <p>Nenhuma movimentação registrada no período.</p>
            <p className="history-empty__sub">Entradas de lotes e saídas para doação aparecerão aqui.</p>
          </div>
        )}

        {!loading && !error && movements.length > 0 && (
          <div className="history-container">
            <div className="history-card">
              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Item</th>
                      <th>Quantidade</th>
                      <th>Origem / Destino</th>
                      <th>Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements
                      .filter(move => {
                        const matchesSearch = move.itemName.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesDate = filterDate ? move.date.startsWith(filterDate) : true;
                        const matchesType = filterType ? move.type === filterType : true;
                        return matchesSearch && matchesDate && matchesType;
                      })
                      .map(move => {
                      const date = new Date(move.date).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      
                      return (
                        <tr key={move.id} className={`history-row--${move.type}`}>
                          <td className="col-date">{date}</td>
                          <td className="col-type">
                            <span className={`type-badge type-badge--${move.type}`}>
                              {move.type === 'entrada' ? '⬇ Entrada' : '⬆ Saída'}
                            </span>
                          </td>
                          <td className="col-item">{move.itemName}</td>
                          <td className="col-qty">
                            <span className={`qty-val qty-val--${move.type}`}>
                              {move.type === 'entrada' ? '+' : '-'}{move.quantity.toFixed(1)} {move.unit}
                            </span>
                          </td>
                          <td className="col-partner">{move.partner}</td>
                          <td className="col-notes">{move.notes}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
