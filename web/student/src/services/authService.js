import { http, USE_MOCK } from '../api/http'
import * as db from '../api/mockDb'
import { useAuth } from '../store'

const uid = () => useAuth.getState().user?.id

export const authService = {
  // POST /auth/login → { token, user }
  login: async ({ email, password }) =>
    USE_MOCK ? db.login(email, password) : (await http.post('/auth/login', { email, password })).data,

  // POST /auth/register puis connexion automatique
  register: async ({ name, email, password, phone, university }) => {
    if (USE_MOCK) await db.register({ name, email, password, phone, university })
    else await http.post('/auth/register', { name, email, password, role: 'student', phone, university })
    return authService.login({ email, password })
  },

  // GET /auth/me
  me: async () => {
    if (USE_MOCK) return db.me(useAuth.getState().token)
    const { data } = await http.get('/auth/me')
    return data.user ?? data
  },

  // PUT /auth/me  (proposition, absent du contrat v1)
  updateProfile: async patch => {
    if (USE_MOCK) return db.updateProfile(uid(), patch)
    const { data } = await http.put('/auth/me', patch)
    return data.user ?? data
  },

  // PUT /auth/password  (proposition, absent du contrat v1)
  changePassword: async ({ current, next }) =>
    USE_MOCK ? db.changePassword(uid(), current, next) : (await http.put('/auth/password', { currentPassword: current, newPassword: next })).data,
}
