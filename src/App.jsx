import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard  from './pages/Dashboard'
import Orders     from './pages/Orders'
import LiveSessions from './pages/LiveSessions'
import Products   from './pages/Products'
import Analytics  from './pages/Analytics'
import QRCode     from './pages/QRCode'
import Settings   from './pages/Settings'
import Billing    from './pages/Billing'

const PAGES = {
  dashboard:    Dashboard,
  orders:       Orders,
  livesessions: LiveSessions,
  products:     Products,
  analytics:    Analytics,
  qrcode:       QRCode,
  settings:     Settings,
  billing:      Billing,
}

export default function App() {
  const { user, logout, loading } = useAuth()
  const [page, setPage] = useState('dashboard')

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#F0F3FF' }}>
      <div style={{ width:32, height:32, border:'2px solid #E0E7FF', borderTopColor:'#3B56E8', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!user) return <Login />

  const Page = PAGES[page] || Dashboard
  const store = user?.store || null

  return (
    <Layout page={page} setPage={setPage} user={user} store={store} onLogout={logout}>
      <Page setPage={setPage} user={user} store={store} />
    </Layout>
  )
}