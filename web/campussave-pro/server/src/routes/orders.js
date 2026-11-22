import { Router } from 'express'
import { config } from '../config.js'
import { store, save, newId, nextOrderSeq } from '../db.js'
import { wrap, badRequest, conflict, notFound, forbidden, HttpError } from '../errors.js'
import { schemas, validate } from '../schemas.js'
import { requireRole } from '../middleware/auth.js'
import { startChallenge, resendChallenge, checkChallenge } from '../services/otp.js'
import { authorize, konnectEnabled, initKonnectPayment, getKonnectPayment } from '../services/payment.js'
import { expirePending, restock, shopOf, publicOffers, finalizePaid } from '../services/orders.js'

const r = Router()
const norm = c => String(c).replace(/\s/g, '').toUpperCase()

const own = req => {
  expirePending()
  const o = store.orders.find(x => x.id === req.params.id)
  if (!o) throw notFound('Commande introuvable.')
  if (o.studentId !== req.user.id) throw forbidden('Cette commande ne t’appartient pas.')
  return o
}
const pendingGuard = o => {
  if (o.status === 'cancelled') throw conflict(o.expired ? 'Ta réservation a expiré. Refais ta commande depuis les offres.' : 'Cette commande a été annulée.')
  if (o.status !== 'pending') throw conflict('Cette commande est déjà payée.')
}

// Commerçant : valider le retrait à partir du code du QR (contrat v1)
r.post('/orders/validate', requireRole('merchant'), validate(schemas.validate), wrap(async (req, res) => {
  const o = store.orders.find(x => norm(x.code) === norm(req.body.code))
  if (!o) throw notFound('Code inconnu.')
  const shop = store.shops.find(s => s.ownerId === req.user.id)
  if (!shop || o.shopId !== shop.id) throw forbidden('Cette commande appartient à un autre commerce.')
  if (o.status === 'picked_up') throw conflict('Cette commande a déjà été récupérée.')
  if (o.status !== 'paid') throw badRequest('Cette commande n’est pas payée.')
  o.status = 'picked_up'; o.pickedUpAt = new Date().toISOString()
  save()
  res.json(o)
}))

// Étudiant : mes commandes / Commerçant : commandes payées reçues par son commerce
r.get('/orders/mine', requireRole('student', 'merchant'), (req, res) => {
  expirePending()
  if (req.user.role === 'merchant') {
    const shop = store.shops.find(s => s.ownerId === req.user.id)
    return res.json(store.orders.filter(o => shop && o.shopId === shop.id && o.paidAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  }
  res.json(store.orders.filter(o => o.studentId === req.user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
})

r.get('/orders/:id', requireRole('student'), (req, res) => res.json(own(req)))

// 1) Réservation : le stock est bloqué 10 minutes
r.post('/orders', requireRole('student'), validate(schemas.order), wrap(async (req, res) => {
  expirePending()
  const open = store.orders.find(o => o.studentId === req.user.id && o.status === 'pending')
  if (open) throw conflict(`Tu as déjà une réservation en attente de paiement (${open.code}). Termine-la ou annule-la d’abord.`, { orderId: open.id })
  const merged = new Map()
  for (const { offerId, qty } of req.body.items) merged.set(offerId, (merged.get(offerId) || 0) + qty)
  const visible = publicOffers()
  const lines = [...merged].map(([offerId, qty]) => {
    const o = visible.find(x => x.id === offerId)
    if (!o) throw notFound('Une offre de ton panier n’existe plus.')
    if (o.quantity < qty) throw conflict(o.quantity ? `Il ne reste que ${o.quantity} « ${o.title} ». Ajuste ton panier.` : `« ${o.title} » est épuisé.`)
    return { o, qty }
  })
  if (new Set(lines.map(l => l.o.shopId)).size > 1) throw badRequest('Une commande ne peut concerner qu’un seul commerce.')
  const shop = shopOf(lines[0].o.shopId)
  lines.forEach(({ o, qty }) => { o.quantity -= qty })
  const seq = nextOrderSeq()
  const order = {
    id: `o${seq}`, code: `CS-${seq}`, studentId: req.user.id, studentName: req.user.name.split(' ').length > 1 ? `${req.user.name.split(' ')[0]} ${req.user.name.split(' ').at(-1)[0]}.` : req.user.name,
    shopId: shop.id, shopName: shop.name, shopAddress: shop.address,
    items: lines.map(({ o, qty }) => ({ offerId: o.id, title: o.title, qty, unitPrice: o.discountPrice, originalPrice: o.originalPrice, photoUrl: o.photoUrl })),
    total: lines.reduce((n, { o, qty }) => n + o.discountPrice * qty, 0),
    status: 'pending', createdAt: new Date().toISOString(),
    pickupStart: lines.map(l => l.o.pickupStart).sort()[0], pickupEnd: lines.map(l => l.o.pickupEnd).sort().at(-1),
    expiresAt: new Date(Date.now() + config.holdSec * 1000).toISOString(),
  }
  store.orders.push(order)
  save()
  res.status(201).json(order)
}))

// 2) Paiement.
//    Konnect : le serveur crée le paiement et renvoie l'adresse de la page de paiement sécurisée (redirection).
//    Mode démo : la carte est vérifiée, puis un code de confirmation est envoyé par e-mail. Rien n'est débité avant la confirmation.
r.post('/orders/:id/pay', requireRole('student'), validate(schemas.pay), wrap(async (req, res) => {
  const o = own(req)
  pendingGuard(o)
  if (konnectEnabled) {
    if (!o.konnectPayUrl) { // un seul paiement Konnect par réservation : on réutilise le lien tant que la réservation est valide
      const returnUrl = `${config.clientOrigin}/pay/${o.id}/return`
      const webhook = config.konnect.apiPublicUrl ? `${config.konnect.apiPublicUrl}/api/payments/konnect/webhook` : undefined
      const { payUrl, paymentRef } = await initKonnectPayment({ order: o, user: req.user, returnUrl, webhook })
      Object.assign(o, { konnectRef: paymentRef, konnectPayUrl: payUrl })
    }
    o.expiresAt = new Date(Date.now() + 16 * 60_000).toISOString() // plus long que la durée de vie du paiement (15 min)
    save()
    return res.json({ step: 'redirect', payUrl: o.konnectPayUrl, expiresAt: o.expiresAt })
  }
  if (!req.body.card) throw badRequest('Indique les informations de ta carte.')
  const card = authorize(req.body.card)
  const remaining = new Date(o.expiresAt).getTime() - Date.now()
  if (remaining < config.otp.ttlSec * 1000) o.expiresAt = new Date(Date.now() + config.otp.ttlSec * 1000).toISOString() // le temps de lire l'e-mail
  res.json({ ...(await startChallenge({ user: req.user, purpose: 'purchase', refId: o.id, meta: card, order: o })), expiresAt: o.expiresAt })
}))

// Retour de Konnect : le serveur vérifie auprès de Konnect que le paiement est bien terminé avant de valider la commande
r.post('/orders/:id/confirm-payment', requireRole('student'), validate(schemas.confirmPayment), wrap(async (req, res) => {
  const o = own(req)
  if (o.status === 'paid' || o.status === 'picked_up') return res.json(o) // idempotent : un rechargement de page ne casse rien
  if (!konnectEnabled || !o.konnectRef || o.konnectRef !== req.body.paymentRef) throw badRequest('Référence de paiement inconnue pour cette commande.')
  const p = await getKonnectPayment(o.konnectRef)
  if (!p.completed) throw new HttpError(402, 'Le paiement n’a pas abouti. Tu peux réessayer depuis ta commande.', { status: p.status })
  res.json(await finalizePaid(o, req.user, { brand: 'Konnect', ref: o.konnectRef }))
}))

// Notification de Konnect (si PUBLIC_API_URL est renseignée) : valide la commande même si l'étudiant ferme son navigateur après avoir payé
r.get('/payments/konnect/webhook', wrap(async (req, res) => {
  const ref = String(req.query.payment_ref || '')
  const o = konnectEnabled && ref ? store.orders.find(x => x.konnectRef === ref) : null
  if (!o) return res.status(404).json({ ok: false })
  if ((await getKonnectPayment(ref)).completed) await finalizePaid(o, store.users.find(u => u.id === o.studentId) || { email: '', name: o.studentName }, { brand: 'Konnect', ref })
  res.json({ ok: true })
}))

r.post('/orders/:id/resend-otp', requireRole('student'), validate(schemas.resend), wrap(async (req, res) => {
  const o = own(req)
  pendingGuard(o)
  res.json(await resendChallenge(req.body.challengeId, req.user, o))
}))

// 3) Confirmation par code → commande payée + e-mail avec le QR code
r.post('/orders/:id/confirm', requireRole('student'), validate(schemas.confirm), wrap(async (req, res) => {
  const o = own(req)
  pendingGuard(o)
  const ch = checkChallenge({ id: req.body.challengeId, code: req.body.code, purpose: 'purchase', refId: o.id, userId: req.user.id })
  res.json(await finalizePaid(o, req.user, ch.meta))
}))

r.post('/orders/:id/cancel', requireRole('student'), wrap(async (req, res) => {
  const o = own(req)
  if (o.status !== 'pending') throw conflict('Seule une réservation non payée peut être annulée.')
  if (konnectEnabled && o.konnectRef && (await getKonnectPayment(o.konnectRef)).completed) return res.json(await finalizePaid(o, req.user, { brand: 'Konnect', ref: o.konnectRef })) // déjà payée chez Konnect
  o.status = 'cancelled'; restock(o); save()
  res.json(o)
}))

export default r
