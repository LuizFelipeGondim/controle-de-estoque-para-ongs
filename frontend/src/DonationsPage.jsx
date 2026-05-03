import { useEffect, useState } from 'react'
import { API_URL } from './config/api'
import './DonationsPage.css'

export default function DonationsPage({ 
  onBack,
  onViewOverview,
  onViewHistory,
  onViewDonations,
  onViewBatches,
  onViewItems,
  onLogout
}) {
  const [packets, setPackets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)

  // View state: 'list' or 'manage-items'
  const [view, setView] = useState('list')
  const [selectedPacket, setSelectedPacket] = useState(null)
  const [packetItems, setPacketItems] = useState([])
  const [itemsLoading, setItemsLoading] = useState(false)

  // Add Item Modal States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [availableBatches, setAvailableBatches] = useState([])
  const [batchesLoading, setBatchesLoading] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [quantityToRemove, setQuantityToRemove] = useState('')

  // Modal / Form States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState(null)
  const [formData, setFormData] = useState({
    destination: '',
    destination_address: '',
    donation_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState('')

  useEffect(() => {
    fetchPackets()
  }, [])

  async function fetchPackets() {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/donation-packets`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Falha ao buscar pacotes.')
      const data = await response.json()
      setPackets(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchPacketItems(packetId) {
    setItemsLoading(true)
    try {
      const itemsRes = await fetch(`${API_URL}/donation-items?donation_packet_id=${packetId}`, {
        credentials: 'include'
      })
      if (!itemsRes.ok) throw new Error('Falha ao buscar itens do pacote.')
      const itemsData = await itemsRes.json()

      const enrichedItems = await Promise.all(itemsData.map(async (item) => {
        const batchRes = await fetch(`${API_URL}/batch/${item.batch_id}`, { credentials: 'include' })
        if (batchRes.ok) {
          const batch = await batchRes.json()
          return {
            ...item,
            item_name: batch.item_name,
            item_unit: batch.item_unit_of_measure,
            conversion_factor: batch.item_conversion_factor
          }
        }
        return item
      }))

      setPacketItems(enrichedItems)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setItemsLoading(false)
    }
  }

  async function fetchAvailableBatches() {
    setBatchesLoading(true)
    try {
      const response = await fetch(`${API_URL}/batch?status=disponivel`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Falha ao buscar lotes disponíveis.')
      const data = await response.json()
      
      const today = new Date();
      const validBatches = data.filter(batch => {
        const expTime = new Date(batch.expiration_date);
        const diffTime = expTime - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0;
      });

      setAvailableBatches(validBatches)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBatchesLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCreatePacket = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)

    try {
      const isoDate = new Date(formData.donation_date).toISOString()
      const response = await fetch(`${API_URL}/donation-packets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formData, donation_date: isoDate })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.message || 'Erro ao criar pacote.')
      }

      setIsModalOpen(false)
      setFormData({
        destination: '',
        destination_address: '',
        donation_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      fetchPackets()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeletePacket = async (packetId) => {
    setActionError(null)
    if (!window.confirm("Tem certeza que deseja excluir este pacote?")) return

    try {
      const response = await fetch(`${API_URL}/donation-packets/${packetId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.status === 204) {
        setPackets(prev => prev.filter(p => p.id !== packetId))
      } else {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Erro ao deletar pacote.')
      }
    } catch (err) {
      setActionError(err.message)
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    if (!selectedBatch || !quantityToRemove) return
    
    setFormLoading(true)
    setFormError(null)
    setActionError(null)

    try {
      const response = await fetch(`${API_URL}/donation-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          donation_packet_id: selectedPacket.id,
          batch_id: selectedBatch.id,
          quantity_removed: Number(quantityToRemove)
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.message || 'Erro ao adicionar item.')
      }

      setIsItemModalOpen(false)
      setSelectedBatch(null)
      setQuantityToRemove('')
      
      const updatedPacketRes = await fetch(`${API_URL}/donation-packets/${selectedPacket.id}`, { credentials: 'include' })
      if (updatedPacketRes.ok) {
        const updatedPacket = await updatedPacketRes.json()
        setSelectedPacket(updatedPacket)
        setPackets(prev => prev.map(p => p.id === updatedPacket.id ? updatedPacket : p))
      }
      
      fetchPacketItems(selectedPacket.id)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteItem = async (itemId) => {
    setActionError(null)
    if (!window.confirm("Deseja realmente remover este item do pacote? A quantidade voltará ao estoque.")) return

    try {
      const response = await fetch(`${API_URL}/donation-items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok || response.status === 204) {
        const updatedPacketRes = await fetch(`${API_URL}/donation-packets/${selectedPacket.id}`, { credentials: 'include' })
        if (updatedPacketRes.ok) {
          const updatedPacket = await updatedPacketRes.json()
          setSelectedPacket(updatedPacket)
          setPackets(prev => prev.map(p => p.id === updatedPacket.id ? updatedPacket : p))
        }
        fetchPacketItems(selectedPacket.id)
      } else {
        throw new Error("Erro ao remover item.")
      }
    } catch (err) {
      setActionError(err.message)
    }
  }

  const handleUpdateStatus = async (newStatus) => {
    setActionError(null)
    if (!window.confirm(`Deseja realmente alterar o status para ${newStatus}?`)) return
    
    try {
      // Caso seja cancelamento, precisamos devolver os itens antes (estorno manual via frontend)
      if (newStatus === 'cancelado' && packetItems.length > 0) {
        setItemsLoading(true)
        for (const item of packetItems) {
          await fetch(`${API_URL}/donation-items/${item.id}`, {
            method: 'DELETE',
            credentials: 'include'
          })
        }
      }

      const response = await fetch(`${API_URL}/donation-packets/${selectedPacket.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setView('list')
        setSelectedPacket(null)
        fetchPackets()
      } else {
        const data = await response.json()
        throw new Error(data.message || 'Erro ao atualizar status.')
      }
    } catch (err) {
      setActionError(err.message)
    } finally {
      setItemsLoading(false)
    }
  }

  const getCategorizedTotals = (items) => {
    return items.reduce((acc, item) => {
      const unit = item.item_unit || 'un'
      const qty = item.quantity_removed || 0
      acc[unit] = (acc[unit] || 0) + qty
      return acc
    }, {})
  }

  if (view === 'manage-items' && selectedPacket) {
    const totals = getCategorizedTotals(packetItems)
    
    return (
      <div className="donations-page">
        <header className="donations-header">
          <div className="donations-header__brand">
            <div className="donations-header__logo" aria-hidden="true">🌱</div>
            <span className="donations-header__brand-name">ONG<span>Conecta</span></span>
          </div>
          <button className="donations-header__back" onClick={() => { setView('list'); setSelectedPacket(null); setPacketItems([]); setActionError(null); fetchPackets(); }}>
            Voltar para Lista
          </button>
        </header>

        <main className="donations-main">
          {actionError && (
            <div className="donations-action-error" onClick={() => setActionError(null)}>
              <span>⚠️</span> {actionError} (clique para fechar)
            </div>
          )}

          <div className="donations-page-header">
            <div>
              <p className="donations-page-header__tag">Preparando Doação para</p>
              <h1 className="donations-page-header__title">{selectedPacket.destination}</h1>
              {selectedPacket.destination_address && (
                <p className="donations-page-header__sub">📍 {selectedPacket.destination_address}</p>
              )}
            </div>
            <div className="donations-page-header__actions">
              {selectedPacket.status === 'preparando' && (
                <button 
                  className="donations-header__new-btn"
                  onClick={() => {
                    setIsItemModalOpen(true);
                    fetchAvailableBatches();
                  }}
                >
                  + Adicionar Alimento
                </button>
              )}
            </div>
          </div>

          {isItemModalOpen && (
            <div className="donation-modal-overlay" onClick={() => { setIsItemModalOpen(false); setFormError(null); }}>
              <div className="donation-modal-content" onClick={e => e.stopPropagation()}>
                <header className="donation-modal-content__header">
                  <h2>Adicionar ao Pacote</h2>
                  <button className="donation-modal-content__close" onClick={() => { setIsItemModalOpen(false); setFormError(null); }}>&times;</button>
                </header>

                <form onSubmit={handleAddItem} className="donation-modal-form">
                  {formError && <div className="donation-modal-form__error">{formError}</div>}

                  <div className="donation-modal-form__group">
                    <label>Selecione o Lote em Estoque *</label>
                    <select 
                      required 
                      value={selectedBatch?.id || ''} 
                      onChange={(e) => {
                        const batch = availableBatches.find(b => b.id === e.target.value);
                        setSelectedBatch(batch);
                      }}
                    >
                      <option value="" disabled>Escolha um alimento válido e disponível</option>
                      {availableBatches.map(batch => (
                        <option key={batch.id} value={batch.id}>
                          {batch.item_name} (Val: {new Date(batch.expiration_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}) - Disp: {batch.current_quantity} {batch.item_unit_of_measure}
                        </option>
                      ))}
                    </select>
                    {batchesLoading && <p className="form-helper">Carregando estoque...</p>}
                  </div>

                  {selectedBatch && (
                    <div className="donation-modal-form__group">
                      <label htmlFor="qty">Quantidade a Retirar ({selectedBatch.item_unit_of_measure}) *</label>
                      <input
                        type="number" id="qty" required min="0.1" step="any"
                        max={selectedBatch.current_quantity}
                        value={quantityToRemove}
                        onChange={(e) => setQuantityToRemove(e.target.value)}
                        placeholder={`Máximo: ${selectedBatch.current_quantity}`}
                      />
                    </div>
                  )}

                  <button type="submit" className="donation-modal-form__submit" disabled={formLoading || !selectedBatch}>
                    {formLoading ? 'Processando...' : 'Adicionar ao Pacote'}
                  </button>
                </form>
              </div>
            </div>
          )}

          <section className="packet-items-section">
            <div className="packet-items-card">
              <header className="packet-items-card__header">
                <h2>Itens no Pacote</h2>
                <div className="packet-items-summary">
                  {Object.entries(totals).length > 0 ? Object.entries(totals).map(([unit, qty]) => (
                    <span key={unit} className="summary-pill">{qty.toFixed(1)} {unit}</span>
                  )) : <span className="summary-pill--empty">Pacote Vazio</span>}
                </div>
              </header>

              {itemsLoading ? (
                <div className="packet-items-loading">Processando itens...</div>
              ) : packetItems.length === 0 ? (
                <div className="packet-items-empty">
                  <p>Este pacote está vazio.</p>
                  {selectedPacket.status === 'preparando' && (
                    <button className="packet-items-empty__btn" onClick={() => { setIsItemModalOpen(true); fetchAvailableBatches(); }}>
                      Clique aqui para adicionar o primeiro item
                    </button>
                  )}
                </div>
              ) : (
                <div className="packet-items-table">
                  <div className="packet-items-table__head">
                    <div className="col-item">Alimento</div>
                    <div className="col-qty">Qtd. Retirada</div>
                    <div className="col-actions"></div>
                  </div>
                  <div className="packet-items-table__body">
                    {packetItems.map(item => (
                      <div key={item.id} className="packet-items-row">
                        <div className="col-item">{item.item_name || 'Item desconhecido'}</div>
                        <div className="col-qty">{item.quantity_removed} {item.item_unit || 'un'}</div>
                        <div className="col-actions">
                          {selectedPacket.status === 'preparando' && (
                            <button className="item-remove-btn" onClick={() => handleDeleteItem(item.id)}>&times;</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPacket.status === 'preparando' && (
                <footer className="packet-items-footer">
                  <button className="btn-cancel" onClick={() => handleUpdateStatus('cancelado')}>Cancelar Pacote</button>
                  <button className="btn-finish" onClick={() => handleUpdateStatus('finalizado')}>Finalizar Doação</button>
                </footer>
              )}
            </div>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="donations-page">
      <header className="donations-header">
        <div className="donations-header__brand" onClick={onViewOverview} style={{ cursor: 'pointer' }}>
          <div className="donations-header__logo" aria-hidden="true">🌱</div>
          <span className="donations-header__brand-name">
            ONG<span>Conecta</span>
          </span>
        </div>
        <nav className="donations-header__nav">
          <button className="donations-header__nav-btn" onClick={onViewOverview}>Overview</button>
          <button className="donations-header__nav-btn" onClick={onViewHistory}>Histórico</button>
          <button className="donations-header__nav-btn donations-header__nav-btn--active" onClick={onViewDonations}>Doações</button>
          <button className="donations-header__nav-btn" onClick={onViewBatches}>Lotes</button>
          <button className="donations-header__nav-btn" onClick={onViewItems}>Itens</button>
        </nav>
        <button className="donations-header__logout" onClick={onLogout}>Sair</button>
      </header>

      <main className="donations-main">
        <div className="donations-page-header">
          <div>
            <p className="donations-page-header__tag">Gestão de Saídas</p>
            <h1 className="donations-page-header__title">Pacotes de Doação</h1>
          </div>
          <button className="donations-header__new-btn" onClick={() => setIsModalOpen(true)}>Novo Pacote</button>
        </div>

        <div className="donations-filters">
          <input 
            type="text" 
            placeholder="Buscar por destino..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="donations-filter-input"
          />
          <input 
            type="date" 
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="donations-filter-date"
            title="Filtrar por data"
          />
          {(searchTerm || filterDate) && (
            <button 
              className="donations-filter-clear"
              onClick={() => { setSearchTerm(''); setFilterDate(''); }}
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {isModalOpen && (
          <div className="donation-modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="donation-modal-content" onClick={e => e.stopPropagation()}>
              <header className="donation-modal-content__header">
                <h2>Registrar Novo Pacote</h2>
                <button className="donation-modal-content__close" onClick={() => setIsModalOpen(false)}>&times;</button>
              </header>
              <form onSubmit={handleCreatePacket} className="donation-modal-form">
                {formError && <div className="donation-modal-form__error">{formError}</div>}
                <div className="donation-modal-form__group">
                  <label htmlFor="destination">Destino / Instituição *</label>
                  <input type="text" id="destination" name="destination" required value={formData.destination} onChange={handleInputChange} />
                </div>
                <div className="donation-modal-form__group">
                  <label htmlFor="destination_address">Endereço (Opcional)</label>
                  <input type="text" id="destination_address" name="destination_address" value={formData.destination_address} onChange={handleInputChange} />
                </div>
                <div className="donation-modal-form__group">
                  <label htmlFor="donation_date">Data Prevista *</label>
                  <input type="date" id="donation_date" name="donation_date" required value={formData.donation_date} onChange={handleInputChange} />
                </div>
                <div className="donation-modal-form__group">
                  <label htmlFor="notes">Observações</label>
                  <textarea id="notes" name="notes" rows="2" value={formData.notes} onChange={handleInputChange} />
                </div>
                <button type="submit" className="donation-modal-form__submit" disabled={formLoading}>Confirmar</button>
              </form>
            </div>
          </div>
        )}

        {loading && <div className="donations-loading">Carregando...</div>}

        <div className="donations-grid">
          {packets
            .filter(p => {
              const matchesSearch = p.destination.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesDate = filterDate ? p.donation_date.startsWith(filterDate) : true;
              return matchesSearch && matchesDate;
            })
            .map(packet => {
              const date = new Date(packet.donation_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
              return (
                <div key={packet.id} className={`packet-card packet-card--${packet.status}`}>
                  <div className="packet-card__header">
                    <span className={`packet-status packet-status--${packet.status}`}>{packet.status}</span>
                    <div className="packet-header-right">
                      <span className="packet-date">{date}</span>
                      {packet.status === 'preparando' && (
                        <button className="packet-delete-btn" onClick={() => handleDeletePacket(packet.id)}>&times;</button>
                      )}
                    </div>
                  </div>
                  <div className="packet-card__body">
                    <h3 className="packet-destination">{packet.destination}</h3>
                    <p className="packet-address">{packet.destination_address || 'Endereço não informado'}</p>
                  </div>
                  <div className="packet-card__footer">
                    <button className="packet-action-btn" onClick={() => { setSelectedPacket(packet); setView('manage-items'); fetchPacketItems(packet.id); }}>
                      {packet.status === 'preparando' ? 'Gerenciar Itens' : 'Ver Detalhes'}
                    </button>
                  </div>
                </div>
              )
            })}
        </div>
      </main>
    </div>
  )
}
