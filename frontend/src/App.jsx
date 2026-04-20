import { useState } from 'react'
import LoginPage from './LoginPage'
import StockOverview from './StockOverview'
import ItemsPage from './ItemsPage'
import AddBatchPage from './AddBatchPage'
import BatchesPage from './BatchesPage'

export default function App() {
  const [page, setPage] = useState('login')

  if (page === 'stock') {
    return <StockOverview 
      onLogout={() => setPage('login')} 
      onViewItems={() => setPage('items')} 
      onViewBatches={() => setPage('batches')}
      onAddBatch={() => setPage('add-batch')}
    />
  }

  if (page === 'items') {
    return <ItemsPage onBack={() => setPage('stock')} />
  }

  if (page === 'add-batch') {
    return <AddBatchPage onBack={() => setPage('stock')} />
  }

  if (page === 'batches') {
    return <BatchesPage onBack={() => setPage('stock')} />
  }

  return <LoginPage onLogin={() => setPage('stock')} />
}
