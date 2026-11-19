import { http, USE_MOCK } from '../api/http'
import * as db from '../api/mockDb'
import { useAuth } from '../store'

const me = () => useAuth.getState().user

export const orderService = {
  // GET /orders/mine (rôle student : mes commandes)
  mine: async () => (USE_MOCK ? db.listMine(me().id) : (await http.get('/orders/mine')).data),

  // GET /orders/:id
  get: async id => (USE_MOCK ? db.getOrder(me().id, id) : (await http.get(`/orders/${id}`)).data),

  // POST /orders { items: [{ offerId, qty }] } → commande `pending` (réservation 10 min)
  create: async items => (USE_MOCK ? db.createOrder(me(), items) : (await http.post('/orders', { items })).data),

  // POST /orders/:id/pay → commande `paid`. On n'envoie jamais le numéro de carte complet à notre API :
  // en production, il faut passer par la passerelle de paiement (jeton) puis envoyer ce jeton.
  pay: async (id, card) =>
    USE_MOCK
      ? db.payOrder(me().id, id, card)
      : (await http.post(`/orders/${id}/pay`, { method: 'card', last4: card.number.replace(/\s/g, '').slice(-4) })).data,

  // POST /orders/:id/cancel
  cancel: async id => (USE_MOCK ? db.cancelOrder(me().id, id) : (await http.post(`/orders/${id}/cancel`)).data),

  // Démo uniquement : simule le scan du QR par le commerçant (POST /orders/validate côté merchant)
  simulatePickup: async id => db.simulatePickup(me().id, id),
}
