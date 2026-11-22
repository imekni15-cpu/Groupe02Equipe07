import axios from 'axios'
import { useAuth } from '../store'

export const http = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 15000 })

http.interceptors.request.use(cfg => {
  const token = useAuth.getState().token
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Session expirée ou compte désactivé : on déconnecte proprement
http.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && useAuth.getState().token) {
      useAuth.getState().logout()
      window.location.assign('/login')
    }
    return Promise.reject(err)
  }
)

// Le champ `message` de l'API est affiché tel quel (cf. contrat)
export const errMsg = e =>
  e?.response?.data?.message ||
  (e?.code === 'ERR_NETWORK' ? 'Le serveur est injoignable. Vérifie que l’API tourne (npm run dev à la racine) puis réessaie.' : e?.message) ||
  'Une erreur est survenue. Réessaie dans un instant.'
export const errData = e => e?.response?.data || {}
