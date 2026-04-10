import axios from 'axios'

const API_URL = 'https://scanit-backend.onrender.com'

const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('nivo_owner_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const hadToken = !!localStorage.getItem('nivo_owner_token')
      localStorage.removeItem('nivo_owner_token')
      localStorage.removeItem('nivo_owner_role')
      // Only redirect if a session existed (expired token), not on login failures
      if (hadToken) window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

export default api