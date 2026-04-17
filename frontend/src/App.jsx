import { useState } from 'react'
import LoginPage from './LoginPage'
import StockOverview from './StockOverview'

export default function App() {
  const [page, setPage] = useState('login')

  if (page === 'stock') {
    return <StockOverview onLogout={() => setPage('login')} />
  }

  return <LoginPage onLogin={() => setPage('stock')} />
}
