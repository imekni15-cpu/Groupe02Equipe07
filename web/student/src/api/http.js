import axios from 'axios'
import { useAuth } from '../store'

// true par défaut : l'application fonctionne sans serveur (données simulées dans localStorage)
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
})

http.interceptors.request.use(cfg => {
  const token = useAuth.getState().token
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

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
  (e?.code === 'ERR_NETWORK' ? 'Le serveur est injoignable. Vérifie ta connexion et réessaie.' : e?.message) ||
  'Une erreur est survenue. Réessaie dans un instant.'
