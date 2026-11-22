import { http } from '../api/http'

const d = p => p.then(r => r.data)

export const authService = {
  login: body => d(http.post('/auth/login', body)),                 // → { step:'otp', challengeId, emailMasked, devCode? }
  register: body => d(http.post('/auth/register', body)),           // → { step:'otp', purpose:'register', … }
  verifyOtp: body => d(http.post('/auth/verify-otp', body)),        // → { token, user }
  resendOtp: challengeId => d(http.post('/auth/resend-otp', { challengeId })),
  me: () => d(http.get('/auth/me')),
  updateProfile: body => d(http.put('/auth/me', body)),
  changePassword: body => d(http.put('/auth/password', body)),
}
export const offerService = {
  list: () => d(http.get('/offers')),
  // commerçant : gérer les offres de son commerce
  mine: () => d(http.get('/offers/mine')),
  create: body => d(http.post('/offers', body)),
  update: (id, body) => d(http.put(`/offers/${id}`, body)),
  remove: id => d(http.delete(`/offers/${id}`)),
}
export const favService = {
  list: () => d(http.get('/favorites')),
  toggle: id => d(http.post(`/favorites/${id}`)),
}
export const orderService = {
  mine: () => d(http.get('/orders/mine')),
  get: id => d(http.get(`/orders/${id}`)),
  create: items => d(http.post('/orders', { items })),
  pay: (id, card) => d(http.post(`/orders/${id}/pay`, { card })),                       // envoie le code d'achat par e-mail
  resendOtp: (id, challengeId) => d(http.post(`/orders/${id}/resend-otp`, { challengeId })),
  confirm: (id, body) => d(http.post(`/orders/${id}/confirm`, body)),                    // code correct → commande payée
  confirmPayment: (id, paymentRef) => d(http.post(`/orders/${id}/confirm-payment`, { paymentRef })), // retour de Konnect : le serveur vérifie
  cancel: id => d(http.post(`/orders/${id}/cancel`)),
  validate: code => d(http.post('/orders/validate', { code })),                          // commerçant
}
export const shopService = { mine: () => d(http.get('/shops/mine')) }
export const publicService = { stats: () => d(http.get('/public/stats')), health: () => d(http.get('/health')) }
