import { Router } from 'express'
import { store, save } from '../db.js'
import { wrap, notFound, forbidden, badRequest } from '../errors.js'
import { requireRole } from '../middleware/auth.js'
import { mailEnabled, outbox } from '../mail/mailer.js'
import { config } from '../config.js'
import { publicUser } from './auth.js'
import { konnectEnabled } from '../services/payment.js'
import { authBackend } from '../services/accounts.js'

const r = Router()
const done = o => o.status === 'paid' || o.status === 'picked_up'

r.get('/health', (req, res) => res.json({ ok: true, mail: mailEnabled ? 'smtp' : 'demo', payment: konnectEnabled ? 'konnect' : 'demo', auth: authBackend, time: new Date().toISOString() }))

// Chiffres d'impact affichés sur la page d'accueil
r.get('/public/stats', (req, res) => {
  const picked = store.orders.filter(o => o.status === 'picked_up')
  const qty = o => o.items.reduce((n, i) => n + i.qty, 0)
  res.json({
    orders: store.orders.filter(done).length,
    mealsSaved: picked.reduce((n, o) => n + qty(o), 0),
    moneySaved: Math.round(picked.reduce((n, o) => n + o.items.reduce((m, i) => m + (i.originalPrice - i.unitPrice) * i.qty, 0), 0)),
    shops: store.shops.filter(s => s.status === 'approved').length,
  })
})

// Commerçant : son commerce
r.get('/shops/mine', requireRole('merchant'), (req, res, next) => {
  const s = store.shops.find(x => x.ownerId === req.user.id)
  return s ? res.json(s) : next(notFound('Aucun commerce rattaché à ce compte.'))
})

// ───── Administration (contrat v1) ─────
r.get('/admin/shops', requireRole('admin'), (req, res) =>
  res.json(store.shops.map(s => ({ id: s.id, name: s.name, type: s.type, owner: store.users.find(u => u.id === s.ownerId)?.name || '—', address: s.address, status: s.status, createdAt: s.createdAt.slice(0, 10) }))))
r.patch('/admin/shops/:id/status', requireRole('admin'), wrap(async (req, res) => {
  const s = store.shops.find(x => x.id === req.params.id)
  if (!s) throw notFound('Commerce introuvable.')
  if (!['approved', 'rejected'].includes(req.body?.status)) throw badRequest('Statut invalide (approved ou rejected).')
  s.status = req.body.status; save(); res.json(s)
}))
r.get('/admin/users', requireRole('admin'), (req, res) => res.json(store.users.map(publicUser)))
r.patch('/admin/users/:id', requireRole('admin'), wrap(async (req, res) => {
  const u = store.users.find(x => x.id === req.params.id)
  if (!u) throw notFound('Utilisateur introuvable.')
  if (u.role === 'admin') throw forbidden('Un compte administrateur ne peut pas être désactivé.')
  if (typeof req.body?.active !== 'boolean') throw badRequest('Le champ active doit être un booléen.')
  u.active = req.body.active; save(); res.json(publicUser(u))
}))
r.get('/admin/stats', requireRole('admin'), (req, res) => {
  const now = new Date(); const monday = new Date(now); monday.setHours(0, 0, 0, 0); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const weekly = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((label, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    return { label, value: store.orders.filter(o => done(o) && new Date(o.createdAt).toDateString() === d.toDateString()).length }
  })
  res.json({
    orders: store.orders.filter(done).length,
    revenue: Math.round(store.orders.filter(done).reduce((n, o) => n + o.total, 0)),
    mealsSaved: store.orders.filter(o => o.status === 'picked_up').reduce((n, o) => n + o.items.reduce((m, i) => m + i.qty, 0), 0),
    weekly,
  })
})

// Hors production : consulter les e-mails envoyés en mode démo
if (!config.prod) r.get('/dev/outbox', (req, res) => res.json(outbox))

export default r
