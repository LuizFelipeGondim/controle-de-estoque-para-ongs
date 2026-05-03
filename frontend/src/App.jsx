import { useState } from 'react'
import LoginPage from './LoginPage'
import StockOverview from './StockOverview'
import ItemsPage from './ItemsPage'
import BatchesPage from './BatchesPage'
import DonationsPage from './DonationsPage'
import HistoryPage from './HistoryPage'

export default function App() {
  const [page, setPage] = useState('login')
  const [selectedBatchId, setSelectedBatchId] = useState(null)

  const navHandlers = {
    onViewOverview: () => setPage('stock'),
    onViewHistory: () => setPage('history'),
    onViewDonations: () => setPage('donations'),
    onViewBatches: (batchId) => {
      setSelectedBatchId(batchId || null)
      setPage('batches')
    },
    onViewItems: () => setPage('items'),
    onLogout: () => setPage('login')
  };

  if (page === 'stock') {
    return <StockOverview {...navHandlers} />
  }

  if (page === 'items') {
    return <ItemsPage onBack={navHandlers.onViewOverview} {...navHandlers} />
  }

  if (page === 'batches') {
    return <BatchesPage 
      initialBatchId={selectedBatchId} 
      onClearInitialBatch={() => setSelectedBatchId(null)}
      onBack={navHandlers.onViewOverview}
      {...navHandlers}
    />
  }

  if (page === 'donations') {
    return <DonationsPage onBack={navHandlers.onViewOverview} {...navHandlers} />
  }

  if (page === 'history') {
    return <HistoryPage onBack={navHandlers.onViewOverview} {...navHandlers} />
  }

  return <LoginPage onLogin={() => setPage('stock')} />
}
