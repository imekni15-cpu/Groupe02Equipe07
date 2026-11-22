import QRCode from 'qrcode'
import { store, save } from '../db.js'
import { sendMail } from '../mail/mailer.js'
import { orderEmail } from '../mail/templates.js'

export const shopOf = id => store.shops.find(s => s.id === id)

export const offerView = o => {
  const s = shopOf(o.shopId)
  return {
    id: o.id, title: o.title, category: o.category, description: o.description,
    originalPrice: o.originalPrice, discountPrice: o.discountPrice, quantity: o.quantity,
    pickupStart: o.pickupStart, pickupEnd: o.pickupEnd, photoUrl: o.photoUrl, createdAt: o.createdAt,
    shopId: s.id, shopName: s.name, shopType: s.type, shopAddress: s.address,
  }
}
export const publicOffers = () => store.offers.filter(o => o.active && shopOf(o.shopId)?.status === 'approved')

export const restock = order => {
  for (const i of order.items) { const o = store.offers.find(x => x.id === i.offerId); if (o) o.quantity += i.qty }
}

/* Passe la commande à « payée » (une seule fois) et envoie le reçu avec le QR code. Appelée après le code e-mail (mode démo)
   ou après la confirmation de Konnect. Si la réservation avait expiré entre-temps, on reprend le stock quand il reste. */
export async function finalizePaid(order, user, payment) {
  if (order.status === 'paid' || order.status === 'picked_up') return order
  if (order.status === 'cancelled') {
    const lacking = order.items.some(i => (store.offers.find(o => o.id === i.offerId)?.quantity ?? 0) < i.qty)
    if (lacking) { console.error(`⚠️  Paiement reçu pour ${order.code} mais le stock est épuisé : remboursement manuel à prévoir.`); return order }
    for (const i of order.items) store.offers.find(o => o.id === i.offerId).quantity -= i.qty
    delete order.expired
  }
  Object.assign(order, { status: 'paid', paidAt: new Date().toISOString(), payment })
  delete order.expiresAt
  save()
  try { // l'e-mail de reçu ne doit jamais bloquer l'achat
    const qr = await QRCode.toBuffer(order.code, { margin: 1, width: 360, color: { dark: '#0A1747', light: '#ffffff' } })
    await sendMail({ to: user.email, ...orderEmail({ name: user.name, order }), attachments: [{ filename: `${order.code}.png`, content: qr, cid: 'qr-ticket' }] })
  } catch (e) { console.error('Reçu non envoyé :', e.message) }
  return order
}

/* Réservations non payées : annulées et remises en stock à l'expiration (appelé avant chaque lecture + toutes les 30 s) */
export function expirePending() {
  const now = Date.now()
  let dirty = false
  for (const o of store.orders) {
    if (o.status === 'pending' && new Date(o.expiresAt).getTime() < now) {
      o.status = 'cancelled'; o.expired = true; restock(o); dirty = true
    }
  }
  if (dirty) save()
}

const hhmm = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
/* Démo : recale les créneaux de retrait des offres d'exemple par rapport à l'heure actuelle */
export function rebaseDemoWindows() {
  const t = new Date()
  const base = Math.min(Math.ceil((t.getHours() * 60 + t.getMinutes() + 15) / 15) * 15, 21 * 60)
  for (const o of store.offers) {
    if (!o.demoSlot) continue
    const s = Math.min(base + o.demoSlot[0], 22 * 60)
    o.pickupStart = hhmm(s)
    o.pickupEnd = hhmm(Math.min(s + o.demoSlot[1], 23 * 60 + 59))
  }
  save()
}
