import { useState } from 'react'
import LoginPage from './LoginPage'
import StockOverview from './StockOverview'
import ItemsPage from './ItemsPage'
import BatchesPage from './BatchesPage'
import DonationsPage from './DonationsPage'
import HistoryPage from './HistoryPage'

export default function App() {
  const [page, setPage] = useState('login')

  if (page === 'stock') {
    return <StockOverview 
      onLogout={() => setPage('login')} 
      onViewItems={() => setPage('items')} 
      onViewBatches={() => setPage('batches')}
      onViewDonations={() => setPage('donations')}
      onViewHistory={() => setPage('history')}
    />
  }

  if (page === 'items') {
    return <ItemsPage onBack={() => setPage('stock')} />
  }

  if (page === 'batches') {
    return <BatchesPage onBack={() => setPage('stock')} />
  }

  if (page === 'donations') {
    return <DonationsPage onBack={() => setPage('stock')} />
  }

  if (page === 'history') {
    return <HistoryPage onBack={() => setPage('stock')} />
  }

  return <LoginPage onLogin={() => setPage('stock')} />
}
