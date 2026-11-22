import { Router } from 'express'
import { store, save, newId } from '../db.js'
import { wrap, notFound, forbidden, conflict } from '../errors.js'
import { schemas, validate } from '../schemas.js'
import { requireRole } from '../middleware/auth.js'
import { expirePending, offerView, publicOffers } from '../services/orders.js'

const r = Router()

// Catalogue public (lecture seule) : seules les offres des commerces `approved` sont visibles
r.get('/offers', (req, res) => { expirePending(); res.json(publicOffers().map(offerView)) })

// ───── Commerçant : gérer les offres de son commerce ─────
const shopOf = req => {
  const s = store.shops.find(x => x.ownerId === req.user.id)
  if (!s) throw notFound('Aucun commerce rattaché à ce compte.')
  return s
}
const approved = shop => {
  if (shop.status !== 'approved') throw forbidden(shop.status === 'rejected' ? 'Ton commerce a été refusé par l’administration.' : 'Ton commerce doit être validé par l’administration avant de publier des offres.')
}
const mine = (req, shop) => {
  const o = store.offers.find(x => x.id === req.params.id)
  if (!o || o.shopId !== shop.id) throw notFound('Offre introuvable.')
  return o
}
const view = o => ({ ...offerView(o), active: o.active })

// (déclarée avant /offers/:id pour ne pas être prise pour un identifiant)
r.get('/offers/mine', requireRole('merchant'), (req, res) => {
  expirePending()
  const shop = shopOf(req)
  res.json(store.offers.filter(o => o.shopId === shop.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(view))
})

r.post('/offers', requireRole('merchant'), validate(schemas.offer), wrap(async (req, res) => {
  const shop = shopOf(req)
  approved(shop)
  const { active = true, ...data } = req.body
  const offer = { id: newId('of'), shopId: shop.id, ...data, active, createdAt: new Date().toISOString() }
  store.offers.push(offer)
  save()
  res.status(201).json(view(offer))
}))

r.put('/offers/:id', requireRole('merchant'), validate(schemas.offer), wrap(async (req, res) => {
  expirePending()
  const shop = shopOf(req)
  approved(shop)
  const o = mine(req, shop)
  const { active = o.active, ...data } = req.body
  Object.assign(o, data, { active })
  delete o.demoSlot // l'offre n'est plus un exemple : ses horaires ne sont plus recalés automatiquement
  save()
  res.json(view(o))
}))

r.delete('/offers/:id', requireRole('merchant'), wrap(async (req, res) => {
  expirePending()
  const shop = shopOf(req)
  const o = mine(req, shop)
  if (store.orders.some(x => (x.status === 'pending' || x.status === 'paid') && x.items.some(i => i.offerId === o.id)))
    throw conflict('Des commandes sont en cours pour cette offre. Mets le stock à 0 ou désactive-la, puis supprime-la après les retraits.')
  store.offers = store.offers.filter(x => x.id !== o.id) // l'historique des commandes garde sa propre copie des lignes
  save()
  res.json({ ok: true })
}))

r.get('/offers/:id', (req, res, next) => {
  expirePending()
  const o = publicOffers().find(x => x.id === req.params.id)
  return o ? res.json(offerView(o)) : next(notFound('Cette offre n’existe plus.'))
})

// Favoris (étudiant)
r.get('/favorites', requireRole('student'), (req, res) => res.json(store.favorites[req.user.id] || []))
r.post('/favorites/:offerId', requireRole('student'), wrap(async (req, res) => {
  if (!store.offers.some(o => o.id === req.params.offerId)) throw notFound('Cette offre n’existe plus.')
  const cur = new Set(store.favorites[req.user.id] || [])
  cur.has(req.params.offerId) ? cur.delete(req.params.offerId) : cur.add(req.params.offerId)
  store.favorites[req.user.id] = [...cur]
  save()
  res.json(store.favorites[req.user.id])
}))

export default r
