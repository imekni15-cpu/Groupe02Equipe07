/* Faux back-end : tout est stocké dans localStorage. Même format que le contrat d'API. */
import { CAT } from '../utils/format'

const K = { users: 'cs_users', orders: 'cs_orders', seq: 'cs_seq' }
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))
export const delay = (ms = 350) => new Promise(r => setTimeout(r, ms))
export class ApiError extends Error {
  constructor(message, status = 400) { super(message); this.status = status }
}

const pad = n => String(n).padStart(2, '0')
const hhmm = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
const short = n => { const p = n.trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0] }

/* ───────── Offres : créneaux calculés par rapport à l'heure actuelle ───────── */
const t = new Date()
const base = Math.min(Math.ceil((t.getHours() * 60 + t.getMinutes() + 15) / 15) * 15, 21 * 60)
const slot = (off, len) => {
  const s = Math.min(base + off, 22 * 60)
  return [hhmm(s), hhmm(Math.min(s + len, 23 * 60 + 59))]
}

const SHOPS = {
  s1: { shopId: 's1', shopName: 'Café Campus', shopType: 'Cafétéria', shopAddress: "Avenue de l'Université, Tunis" },
  s2: { shopId: 's2', shopName: 'Le Fournil', shopType: 'Boulangerie', shopAddress: 'Rue Ibn Khaldoun, Tunis' },
  s3: { shopId: 's3', shopName: 'Chez Hedi', shopType: 'Restaurant', shopAddress: 'Rue de Marseille, Tunis' },
  s4: { shopId: 's4', shopName: 'Burger Lab', shopType: 'Fast-food', shopAddress: 'Avenue Habib Bourguiba, Tunis' },
  s5: { shopId: 's5', shopName: 'Green Bowl', shopType: 'Restaurant', shopAddress: 'Rue de Palestine, Tunis' },
  s6: { shopId: 's6', shopName: 'Sweet Médina', shopType: 'Boulangerie', shopAddress: 'Souk El Attarine, Tunis' },
}
const mk = (id, shop, title, category, description, originalPrice, discountPrice, quantity, off, len) => {
  const [pickupStart, pickupEnd] = slot(off, len)
  return { id, ...SHOPS[shop], title, category, description, originalPrice, discountPrice, quantity, pickupStart, pickupEnd, photoUrl: null }
}
const OFFERS = [
  mk('1', 's1', 'Panier sandwichs', 'Sandwich', '3 sandwichs variés du jour, préparés ce matin.', 12, 5, 6, 0, 90),
  mk('2', 's3', 'Couscous du jour', 'Plat chaud', 'Couscous agneau et légumes, portion généreuse.', 10, 4.5, 4, 15, 90),
  mk('3', 's5', 'Bowl poulet César', 'Salade', 'Poulet grillé, croûtons, parmesan et sauce maison.', 14, 6, 5, 0, 120),
  mk('4', 's2', 'Assortiment de viennoiseries', 'Pâtisserie', 'Croissants, pains au chocolat et chaussons.', 9, 3.5, 8, 30, 60),
  mk('5', 's4', 'Burger et frites', 'Plat chaud', 'Burger bœuf, cheddar, frites maison.', 15, 7, 3, 15, 90),
  mk('6', 's3', 'Makloub poulet', 'Sandwich', 'Makloub poulet et fromage, harissa à part.', 7, 3, 7, 0, 90),
  mk('7', 's1', 'Café et croissant', 'Boisson', 'Un café crème et un croissant pur beurre.', 6, 2.5, 10, 0, 120),
  mk('8', 's5', 'Jus pressé minute', 'Boisson', 'Orange, citron ou fraise, pressé à la commande.', 5, 2, 6, 30, 90),
  mk('9', 's6', 'Plateau makroudh et baklawa', 'Pâtisserie', '12 pièces de pâtisseries tunisiennes.', 12, 5, 5, 45, 75),
  mk('10', 's3', 'Lablabi du soir', 'Plat chaud', 'Le classique tunisien : pain, œuf et harissa.', 6, 2.5, 9, 30, 90),
  mk('11', 's4', 'Pizza, 2 parts', 'Autre', 'Deux parts de pizza au choix.', 8, 3.5, 0, 0, 90),
  mk('12', 's2', 'Tarte aux fruits', 'Pâtisserie', 'Tarte du jour aux fruits de saison.', 8, 3, 4, 45, 75),
]

/* ───────── Comptes ───────── */
const SEED_USERS = [
  { id: 'u1', name: 'Amine Ben Salah', email: 'amine@essect.tn', password: 'Campus123', role: 'student', active: true, phone: '22123456', university: 'ESSECT' },
  { id: 'u4', name: 'Mohamed Azizi', email: 'm@cafe.tn', password: 'Campus123', role: 'merchant', active: true },
  { id: 'u9', name: 'Admin CampusSave', email: 'admin@campussave.tn', password: 'Campus123', role: 'admin', active: true },
]
const users = () => {
  let u = read(K.users)
  if (!u) { u = SEED_USERS.map(x => ({ ...x, createdAt: new Date(Date.now() - 40 * 864e5).toISOString() })); write(K.users, u) }
  return u
}
const pub = ({ password, ...u }) => u
const sameMail = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()

export async function login(email, password) {
  await delay()
  const u = users().find(x => sameMail(x.email, email))
  if (!u || u.password !== password) throw new ApiError('Email ou mot de passe incorrect.', 401)
  if (!u.active) throw new ApiError('Ce compte est désactivé. Contacte l’administration.', 403)
  return { token: 'mock.' + u.id, user: pub(u) }
}
export async function register({ name, email, password, phone, university }) {
  await delay()
  const all = users()
  if (all.some(x => sameMail(x.email, email))) throw new ApiError('Un compte existe déjà avec cet email. Connecte-toi plutôt.', 409)
  const u = { id: 'u' + (Date.now() % 1e6), name: name.trim(), email: email.trim(), password, role: 'student', active: true, phone: phone || '', university: university || '', createdAt: new Date().toISOString() }
  write(K.users, [...all, u])
  return pub(u)
}
export async function me(token) {
  await delay(150)
  const u = users().find(x => 'mock.' + x.id === token)
  if (!u) throw new ApiError('Session expirée.', 401)
  return pub(u)
}
export async function updateProfile(uid, { name, phone, university }) {
  await delay()
  const all = users()
  const i = all.findIndex(u => u.id === uid)
  all[i] = { ...all[i], name, phone, university }
  write(K.users, all)
  return pub(all[i])
}
export async function changePassword(uid, current, next) {
  await delay()
  const all = users()
  const i = all.findIndex(u => u.id === uid)
  if (all[i].password !== current) throw new ApiError('Le mot de passe actuel est incorrect.', 400)
  all[i].password = next
  write(K.users, all)
  return { ok: true }
}

/* ───────── Commandes ───────── */
const mkItem = (offerId, title, qty, unitPrice, originalPrice, emoji) => ({ offerId, title, qty, unitPrice, originalPrice, emoji })
function mkOrder(seq, user, shopId, items, status, createdAt, ps, pe, extra = {}) {
  const s = SHOPS[shopId]
  return {
    id: 'o' + seq, code: 'CS-' + seq, userId: user.id, studentName: short(user.name),
    shopId, shopName: s.shopName, shopAddress: s.shopAddress, items,
    total: items.reduce((n, i) => n + i.unitPrice * i.qty, 0),
    status, createdAt: new Date(createdAt).toISOString(), pickupStart: ps, pickupEnd: pe, ...extra,
  }
}
function seedOrders() {
  const u = SEED_USERS[0]
  const at = (d, h) => { const x = new Date(); x.setDate(x.getDate() - d); x.setHours(h, 5, 0, 0); return x.getTime() }
  const hist = [
    [6, 12, 's1', [mkItem(null, 'Panier sandwichs', 1, 5, 12, '🥪')]],
    [5, 13, 's3', [mkItem(null, 'Couscous du jour', 1, 4.5, 10, '🍲')]],
    [4, 18, 's2', [mkItem(null, 'Assortiment de viennoiseries', 2, 3.5, 9, '🥐')]],
    [3, 12, 's5', [mkItem(null, 'Bowl poulet César', 1, 6, 14, '🥗')]],
    [2, 19, 's4', [mkItem(null, 'Burger et frites', 1, 7, 15, '🍲')]],
    [2, 8, 's1', [mkItem(null, 'Café et croissant', 1, 2.5, 6, '🧋')]],
    [1, 13, 's3', [mkItem(null, 'Makloub poulet', 2, 3, 7, '🥪')]],
  ]
  const list = hist.map(([d, h, shop, items], i) =>
    mkOrder(1001 + i, u, shop, items, 'picked_up', at(d, h), `${pad(h)}:00`, `${pad(h + 1)}:30`))
  const [ps, pe] = slot(0, 120)
  list.push(mkOrder(1008, u, 's1', [mkItem(null, 'Panier sandwichs', 1, 5, 12, '🥪')], 'paid', Date.now() - 20 * 60000, ps, pe))
  write(K.seq, 1009)
  return list
}
function all() {
  let list = read(K.orders)
  if (!list) { list = seedOrders(); write(K.orders, list) }
  let dirty = false
  list = list.map(o => {
    if (o.status === 'pending' && new Date(o.expiresAt) < Date.now()) { dirty = true; return { ...o, status: 'cancelled', expired: true } }
    return o
  })
  if (dirty) write(K.orders, list)
  return list
}

// Le stock restant = quantité de départ − commandes non annulées
function offersNow() {
  const used = {}
  all().filter(o => o.status !== 'cancelled').forEach(o => o.items.forEach(i => { if (i.offerId) used[i.offerId] = (used[i.offerId] || 0) + i.qty }))
  return OFFERS.map(x => ({ ...x, quantity: Math.max(0, x.quantity - (used[x.id] || 0)) }))
}
export async function listOffers() { await delay(500); return offersNow() }

export async function listMine(uid) {
  await delay(300)
  return all().filter(o => o.userId === uid).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
export async function getOrder(uid, id) {
  await delay(200)
  const o = all().find(x => x.id === id && x.userId === uid)
  if (!o) throw new ApiError('Commande introuvable.', 404)
  return o
}
export async function createOrder(user, items) {
  await delay(600)
  const cur = offersNow()
  const lines = items.map(({ offerId, qty }) => {
    const of = cur.find(x => x.id === offerId)
    if (!of) throw new ApiError('Cette offre n’existe plus.', 404)
    if (of.quantity < qty) throw new ApiError(`Il ne reste que ${of.quantity} « ${of.title} ». Ajuste ton panier.`, 409)
    return { of, qty }
  })
  if (new Set(lines.map(l => l.of.shopId)).size > 1) throw new ApiError('Une commande ne peut concerner qu’un seul commerce.', 400)
  const seq = read(K.seq, 1009)
  write(K.seq, seq + 1)
  const first = lines[0].of
  const order = mkOrder(
    seq, user, first.shopId,
    lines.map(({ of, qty }) => mkItem(of.id, of.title, qty, of.discountPrice, of.originalPrice, CAT[of.category]?.emoji)),
    'pending', Date.now(),
    lines.map(l => l.of.pickupStart).sort()[0],
    lines.map(l => l.of.pickupEnd).sort().at(-1),
    { expiresAt: new Date(Date.now() + 10 * 60000).toISOString() }
  )
  write(K.orders, [...all(), order])
  return order
}
function patch(uid, id, fn) {
  const list = all()
  const i = list.findIndex(o => o.id === id && o.userId === uid)
  if (i < 0) throw new ApiError('Commande introuvable.', 404)
  list[i] = fn(list[i])
  write(K.orders, list)
  return list[i]
}
export async function payOrder(uid, id, card) {
  await delay(1400)
  return patch(uid, id, o => {
    if (o.status === 'cancelled') throw new ApiError(o.expired ? 'Ta réservation a expiré. Refais ta commande depuis les offres.' : 'Cette commande a été annulée.', 409)
    if (o.status !== 'pending') throw new ApiError('Cette commande est déjà payée.', 409)
    if (card.number.replace(/\s/g, '') === '4000000000000002') throw new ApiError('Paiement refusé par ta banque. Essaie une autre carte.', 402)
    return { ...o, status: 'paid', paidAt: new Date().toISOString(), expiresAt: undefined }
  })
}
export async function cancelOrder(uid, id) {
  await delay(300)
  return patch(uid, id, o => {
    if (o.status !== 'pending') throw new ApiError('Seule une réservation non payée peut être annulée.', 409)
    return { ...o, status: 'cancelled' }
  })
}
export async function simulatePickup(uid, id) {
  await delay(500)
  return patch(uid, id, o => {
    if (o.status !== 'paid') throw new ApiError('Cette commande n’est pas à récupérer.', 409)
    return { ...o, status: 'picked_up', pickedUpAt: new Date().toISOString() }
  })
}
