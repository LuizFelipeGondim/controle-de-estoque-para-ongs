import { useState } from 'react'
import LoginPage from './LoginPage'
import StockOverview from './StockOverview'
import ItemsPage from './ItemsPage'

export default function App() {
  const [page, setPage] = useState('login')

  if (page === 'stock') {
    return <StockOverview 
      onLogout={() => setPage('login')} 
      onViewItems={() => setPage('items')} 
    />
  }

  if (page === 'items') {
    return <ItemsPage onBack={() => setPage('stock')} />
  }

  return <LoginPage onLogin={() => setPage('stock')} />
}
