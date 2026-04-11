import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('nivo_owner_token')
    const role  = localStorage.getItem('nivo_owner_role')
    const phone = localStorage.getItem('nivo_owner_phone')
    const store = JSON.parse(localStorage.getItem('nivo_owner_store') || 'null')
    if (token && (role === 'store_owner' || role === 'super_admin')) {
      setUser({ token, role, phone, store })
    }
    setLoading(false)
  }, [])

  const login = async (phone, password) => {
    const res = await api.post('/api/admin/login', { phone, password })
    const { token, role, store } = res.data
    if (!['store_owner','super_admin'].includes(role)) throw new Error('Access denied.')
    localStorage.setItem('nivo_owner_token', token)
    localStorage.setItem('nivo_owner_role',  role)
    localStorage.setItem('nivo_owner_phone', phone)
    localStorage.setItem('nivo_owner_store', JSON.stringify(store))
    setUser({ token, role, phone, store })
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('nivo_owner_token')
    localStorage.removeItem('nivo_owner_role')
    localStorage.removeItem('nivo_owner_phone')
    localStorage.removeItem('nivo_owner_store')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return context
}

export default AuthContext