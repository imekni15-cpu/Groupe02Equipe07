const router = require('express').Router()
const { auth, db } = require('../config/firebase')
const { verifyToken, requireRole } = require('../middlewares/auth')
const { HttpError, ah } = require('../utils/httpError')
const { toUser } = require('../utils/userDoc')

// Toutes les routes /admin exigent un compte admin
router.use(verifyToken, requireRole('admin'))

const SHOP_STATUSES = ['pending', 'approved', 'rejected', 'suspended']
const ROLES = ['student', 'merchant', 'admin']
const withId = d => ({ id: d.id, ...d.data() })
const newestFirst = (a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))

/* GET /api/admin/shops?status=pending */
router.get('/shops', ah(async (req, res) => {
  const { status } = req.query
  if (status && !SHOP_STATUSES.includes(status)) throw new HttpError(400, 'Statut invalide.')
  const snap = await (status ? db.collection('shops').where('status', '==', status) : db.collection('shops')).get()
  const shops = snap.docs.map(withId)
  // Ajoute le nom et l'email du propriétaire pour l'écran admin
  const owners = await Promise.all([...new Set(shops.map(s => s.ownerId).filter(Boolean))].map(id => db.collection('users').doc(id).get()))
  const byId = Object.fromEntries(owners.filter(o => o.exists).map(o => [o.id, o.data()]))
  res.json(shops.map(s => ({ ...s, ownerName: byId[s.ownerId]?.name || null, ownerEmail: byId[s.ownerId]?.email || null })).sort(newestFirst))
}))

/* PUT /api/admin/shops/:id/status  { status, reason? } */
router.put('/shops/:id/status', ah(async (req, res) => {
  const { status, reason = '' } = req.body || {}
  if (!SHOP_STATUSES.includes(status)) throw new HttpError(400, `Statut invalide (${SHOP_STATUSES.join(', ')}).`)
  const ref = db.collection('shops').doc(req.params.id)
  if (!(await ref.get()).exists) throw new HttpError(404, 'Commerce introuvable.')
  await ref.update({ status, statusReason: String(reason).trim(), reviewedBy: req.user.id, updatedAt: new Date().toISOString() })
  res.json(withId(await ref.get()))
}))

/* GET /api/admin/users?role=student&active=false */
router.get('/users', ah(async (req, res) => {
  const { role, active } = req.query
  if (role && !ROLES.includes(role)) throw new HttpError(400, 'Rôle invalide.')
  const snap = await (role ? db.collection('users').where('role', '==', role) : db.collection('users')).get()
  let users = snap.docs.map(d => toUser(d.id, d.data()))
  if (active === 'true' || active === 'false') users = users.filter(u => u.active === (active === 'true'))
  res.json(users.sort(newestFirst))
}))

/* GET /api/admin/users/:id */
router.get('/users/:id', ah(async (req, res) => {
  const snap = await db.collection('users').doc(req.params.id).get()
  if (!snap.exists) throw new HttpError(404, 'Utilisateur introuvable.')
  res.json(toUser(snap.id, snap.data()))
}))

/* PATCH|PUT /api/admin/users/:id  { active: boolean } : activer / désactiver un compte */
const setActive = ah(async (req, res) => {
  const { active } = req.body || {}
  if (typeof active !== 'boolean') throw new HttpError(400, 'Le champ « active » (true/false) est requis.')
  if (req.params.id === req.user.id) throw new HttpError(400, 'Tu ne peux pas désactiver ton propre compte.')
  const ref = db.collection('users').doc(req.params.id)
  if (!(await ref.get()).exists) throw new HttpError(404, 'Utilisateur introuvable.')
  await auth.updateUser(req.params.id, { disabled: !active })
  if (!active) await auth.revokeRefreshTokens(req.params.id)
  await ref.update({ active, updatedAt: new Date().toISOString() })
  res.json(toUser(req.params.id, (await ref.get()).data()))
})
router.patch('/users/:id', setActive)
router.put('/users/:id', setActive)

/* DELETE /api/admin/users/:id : supprime le compte (Auth + profil) */
router.delete('/users/:id', ah(async (req, res) => {
  if (req.params.id === req.user.id) throw new HttpError(400, 'Tu ne peux pas supprimer ton propre compte.')
  const ref = db.collection('users').doc(req.params.id)
  if (!(await ref.get()).exists) throw new HttpError(404, 'Utilisateur introuvable.')
  await auth.deleteUser(req.params.id).catch(e => { if (e.code !== 'auth/user-not-found') throw e })
  await ref.delete()
  res.json({ ok: true })
}))

/* GET /api/admin/stats */
router.get('/stats', ah(async (_req, res) => {
  const count = async q => (await q.count().get()).data().count
  const col = n => db.collection(n)
  const ORDER_STATUSES = ['pending', 'paid', 'picked_up', 'cancelled']

  const [usersTotal, byRole, shopsTotal, byShop, offers, ordersTotal, byOrder, paidOrders] = await Promise.all([
    count(col('users')),
    Promise.all(ROLES.map(r => count(col('users').where('role', '==', r)))),
    count(col('shops')),
    Promise.all(SHOP_STATUSES.map(s => count(col('shops').where('status', '==', s)))),
    count(col('offers')),
    count(col('orders')),
    Promise.all(ORDER_STATUSES.map(s => count(col('orders').where('status', '==', s)))),
    col('orders').where('status', 'in', ['paid', 'picked_up']).get(),
  ])

  let revenue = 0, savings = 0
  paidOrders.forEach(d => {
    const o = d.data()
    revenue += Number(o.total) || 0
    ;(o.items || []).forEach(i => { savings += ((Number(i.originalPrice) || 0) - (Number(i.unitPrice) || 0)) * (Number(i.qty) || 0) })
  })
  const round = n => Math.round(n * 100) / 100

  res.json({
    users: { total: usersTotal, ...Object.fromEntries(ROLES.map((r, i) => [r + 's', byRole[i]])) },
    shops: { total: shopsTotal, ...Object.fromEntries(SHOP_STATUSES.map((s, i) => [s, byShop[i]])) },
    offers: { total: offers },
    orders: { total: ordersTotal, ...Object.fromEntries(ORDER_STATUSES.map((s, i) => [s, byOrder[i]])) },
    revenue: round(revenue),        // commandes payées + récupérées (TND)
    studentSavings: round(savings), // économies réalisées par les étudiants (TND)
  })
}))

module.exports = router
