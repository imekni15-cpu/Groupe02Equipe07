// Tests d'intégration : parcours complets avec confirmation par e-mail (mode démo, aucun e-mail réel envoyé)
process.env.NODE_ENV = 'test'
process.env.DB_FILE = ':memory:'
process.env.RATE_LIMIT = 'off'
for (const k of ['SMTP_USER', 'SMTP_PASS', 'SMTP_HOST', 'DEMO_EMAIL']) process.env[k] = ''

import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'

const { createApp } = await import('../src/app.js')
const { seed } = await import('../src/seed.js')
const { store } = await import('../src/db.js')
const { outbox } = await import('../src/mail/mailer.js')

let server, base
before(() => { seed(); server = createApp().listen(0); base = `http://localhost:${server.address().port}/api` })
after(() => server.close())

const call = async (method, path, body, token) => {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  return { status: res.status, body: await res.json().catch(() => ({})) }
}
async function login(email, password = 'Campus123') {
  const step1 = await call('POST', '/auth/login', { email, password })
  assert.equal(step1.status, 200)
  const step2 = await call('POST', '/auth/verify-otp', { challengeId: step1.body.challengeId, code: step1.body.devCode })
  assert.equal(step2.status, 200)
  return step2.body.token
}
const CARD = { number: '4242 4242 4242 4242', expiry: '12/39', cvc: '123', holder: 'Amine Ben Salah' }

test('connexion : un mot de passe correct ne donne PAS de session sans le code reçu par e-mail', async () => {
  const bad = await call('POST', '/auth/login', { email: 'amine@essect.tn', password: 'faux-mot-de-passe1' })
  assert.equal(bad.status, 401)
  const step1 = await call('POST', '/auth/login', { email: 'amine@essect.tn', password: 'Campus123' })
  assert.equal(step1.status, 200)
  assert.equal(step1.body.step, 'otp')
  assert.equal(step1.body.token, undefined)
  assert.match(step1.body.emailMasked, /^am•+@essect\.tn$/)
  assert.ok(outbox[0].subject.includes(step1.body.devCode), 'le code est bien dans l’e-mail')
  const wrong = await call('POST', '/auth/verify-otp', { challengeId: step1.body.challengeId, code: step1.body.devCode === '000000' ? '111111' : '000000' })
  assert.equal(wrong.status, 400)
  assert.equal(wrong.body.attemptsLeft, 4)
  const ok = await call('POST', '/auth/verify-otp', { challengeId: step1.body.challengeId, code: step1.body.devCode })
  assert.equal(ok.status, 200)
  assert.ok(ok.body.token)
  const reuse = await call('POST', '/auth/verify-otp', { challengeId: step1.body.challengeId, code: step1.body.devCode })
  assert.equal(reuse.status, 400, 'un code est à usage unique')
})

test('connexion : le défi est verrouillé après 5 mauvais codes', async () => {
  const s = await call('POST', '/auth/login', { email: 'amine@essect.tn', password: 'Campus123' })
  const wrong = s.body.devCode === '123456' ? '654321' : '123456'
  let last
  for (let i = 0; i < 5; i++) last = await call('POST', '/auth/verify-otp', { challengeId: s.body.challengeId, code: wrong })
  assert.equal(last.status, 429)
  const after = await call('POST', '/auth/verify-otp', { challengeId: s.body.challengeId, code: s.body.devCode })
  assert.equal(after.status, 400, 'même le bon code est refusé une fois verrouillé')
})

test('renvoi du code : délai de 30 s imposé', async () => {
  const s = await call('POST', '/auth/login', { email: 'amine@essect.tn', password: 'Campus123' })
  const again = await call('POST', '/auth/resend-otp', { challengeId: s.body.challengeId })
  assert.equal(again.status, 429)
})

test('inscription : le compte n’est actif qu’après confirmation de l’e-mail', async () => {
  const reg = await call('POST', '/auth/register', { name: 'Nour Test', email: 'nour@gmail.com', password: 'Secret123' })
  assert.equal(reg.status, 201)
  assert.equal(reg.body.purpose, 'register')
  assert.equal(store.users.find(u => u.email === 'nour@gmail.com').emailVerified, false)
  const ok = await call('POST', '/auth/verify-otp', { challengeId: reg.body.challengeId, code: reg.body.devCode })
  assert.equal(ok.status, 200)
  assert.equal(ok.body.user.emailVerified, true)
  const dup = await call('POST', '/auth/register', { name: 'Nour Test', email: 'nour@gmail.com', password: 'Secret123' })
  assert.equal(dup.status, 409)
})

test('achat : la commande n’est payée qu’après le code reçu par e-mail, puis un reçu avec QR est envoyé', async () => {
  const token = await login('amine@essect.tn')
  const stockBefore = store.offers.find(o => o.id === '4').quantity
  const created = await call('POST', '/orders', { items: [{ offerId: '4', qty: 2 }] }, token)
  assert.equal(created.status, 201)
  assert.equal(created.body.status, 'pending')
  assert.equal(store.offers.find(o => o.id === '4').quantity, stockBefore - 2, 'stock bloqué pendant la réservation')
  const id = created.body.id

  const declined = await call('POST', `/orders/${id}/pay`, { card: { ...CARD, number: '4000 0000 0000 0002' } }, token)
  assert.equal(declined.status, 402)

  const pay = await call('POST', `/orders/${id}/pay`, { card: CARD }, token)
  assert.equal(pay.status, 200)
  assert.equal(pay.body.step, 'otp')
  assert.equal(store.orders.find(o => o.id === id).status, 'pending', 'rien n’est débité avant la confirmation')
  assert.ok(outbox[0].text.includes('CS-'), 'l’e-mail d’achat rappelle la commande')

  const wrong = await call('POST', `/orders/${id}/confirm`, { challengeId: pay.body.challengeId, code: pay.body.devCode === '000000' ? '111111' : '000000' }, token)
  assert.equal(wrong.status, 400)
  assert.equal(store.orders.find(o => o.id === id).status, 'pending')

  const confirmed = await call('POST', `/orders/${id}/confirm`, { challengeId: pay.body.challengeId, code: pay.body.devCode }, token)
  assert.equal(confirmed.status, 200)
  assert.equal(confirmed.body.status, 'paid')
  assert.equal(confirmed.body.payment.last4, '4242')
  assert.equal(outbox[0].hasQr, true, 'le reçu contient le QR code')

  // le commerçant valide le retrait : 403 si autre commerce, 200 puis 409
  const merchant = await login('m@cafe.tn')
  const other = store.orders.find(o => o.shopId !== 's1' && o.status === 'paid')
  assert.equal((await call('POST', '/orders/validate', { code: other.code }, merchant)).status, 403)
  assert.equal((await call('POST', '/orders/validate', { code: 'CS-0000' }, merchant)).status, 404)
  const v = await call('POST', '/orders/validate', { code: confirmed.body.code.toLowerCase() }, merchant)
  assert.equal(v.status, 200)
  assert.equal(v.body.status, 'picked_up')
  assert.equal((await call('POST', '/orders/validate', { code: confirmed.body.code }, merchant)).status, 409)
})

test('un code d’achat ne peut pas servir à se connecter (et inversement)', async () => {
  const token = await login('amine@essect.tn')
  const o = await call('POST', '/orders', { items: [{ offerId: '9', qty: 1 }] }, token)
  const pay = await call('POST', `/orders/${o.body.id}/pay`, { card: CARD }, token)
  const hijack = await call('POST', '/auth/verify-otp', { challengeId: pay.body.challengeId, code: pay.body.devCode })
  assert.equal(hijack.status, 400)
  await call('POST', `/orders/${o.body.id}/cancel`, {}, token)
})

test('réservation expirée : annulée automatiquement et stock restitué', async () => {
  const token = await login('amine@essect.tn')
  const before = store.offers.find(o => o.id === '10').quantity
  const o = await call('POST', '/orders', { items: [{ offerId: '10', qty: 3 }] }, token)
  assert.equal(store.offers.find(x => x.id === '10').quantity, before - 3)
  store.orders.find(x => x.id === o.body.id).expiresAt = new Date(Date.now() - 1000).toISOString()
  const mine = await call('GET', '/orders/mine', null, token)
  assert.equal(mine.body.find(x => x.id === o.body.id).status, 'cancelled')
  assert.equal(store.offers.find(x => x.id === '10').quantity, before)
  const pay = await call('POST', `/orders/${o.body.id}/pay`, { card: CARD }, token)
  assert.equal(pay.status, 409)
})

test('stock : impossible de réserver plus que disponible ou un produit épuisé', async () => {
  const token = await login('amine@essect.tn')
  assert.equal((await call('POST', '/orders', { items: [{ offerId: '8', qty: 1 }] }, token)).status, 409) // épuisé
  assert.equal((await call('POST', '/orders', { items: [{ offerId: '9', qty: 2 }] }, token)).status, 409) // 1 restant
  assert.equal((await call('POST', '/orders', { items: [{ offerId: '1', qty: 1 }, { offerId: '2', qty: 1 }] }, token)).status, 400) // deux commerces
})

test('contrôle des rôles et des accès', async () => {
  assert.equal((await call('GET', '/orders/mine')).status, 401)
  const student = await login('amine@essect.tn')
  assert.equal((await call('POST', '/orders/validate', { code: 'CS-1001' }, student)).status, 403)
  assert.equal((await call('GET', '/admin/users', null, student)).status, 403)
  const admin = await login('admin@campussave.tn')
  assert.equal((await call('GET', '/admin/stats', null, admin)).body.weekly.length, 7)
  assert.equal((await call('PATCH', '/admin/users/u3', { active: false }, admin)).status, 403)
})

test('compte désactivé : connexion refusée', async () => {
  const admin = await login('admin@campussave.tn')
  await call('PATCH', '/admin/users/u2', { active: false }, admin)
  assert.equal((await call('POST', '/auth/login', { email: 'm@cafe.tn', password: 'Campus123' })).status, 403)
  await call('PATCH', '/admin/users/u2', { active: true }, admin)
})

test('commerçant : inscription → commerce en attente → validation admin → gestion des offres', async () => {
  const reg = await call('POST', '/auth/register', { name: 'Karim Resto', email: 'karim@resto.tn', password: 'Secret123', role: 'merchant', shop: { name: 'Chez Karim', type: 'Restaurant', address: 'Rue de Marseille, Tunis' } })
  assert.equal(reg.status, 201)
  const ok = await call('POST', '/auth/verify-otp', { challengeId: reg.body.challengeId, code: reg.body.devCode })
  assert.equal(ok.status, 200)
  assert.equal(ok.body.user.role, 'merchant')
  const token = ok.body.token
  const shop = store.shops.find(s => s.ownerId === ok.body.user.id)
  assert.equal(shop.status, 'pending')

  const offer = { title: 'Brick au thon', category: 'Plat chaud', description: '', originalPrice: 6, discountPrice: 2.5, quantity: 5, pickupStart: '12:00', pickupEnd: '14:00', photoUrl: '/photos/brick.jpg' }
  assert.equal((await call('POST', '/offers', offer, token)).status, 403, 'pas de publication avant validation')

  const admin = await login('admin@campussave.tn')
  assert.equal((await call('PATCH', `/admin/shops/${shop.id}/status`, { status: 'approved' }, admin)).status, 200)

  assert.equal((await call('POST', '/offers', { ...offer, discountPrice: 7 }, token)).status, 400, 'prix réduit ≥ prix initial refusé')
  assert.equal((await call('POST', '/offers', { ...offer, pickupEnd: '11:00' }, token)).status, 400, 'fin avant début refusée')
  const created = await call('POST', '/offers', offer, token)
  assert.equal(created.status, 201)
  const id = created.body.id
  assert.ok((await call('GET', '/offers')).body.some(o => o.id === id), 'visible dans le catalogue public')
  assert.ok((await call('GET', '/offers/mine', null, token)).body.some(o => o.id === id))

  const updated = await call('PUT', `/offers/${id}`, { ...offer, quantity: 9 }, token)
  assert.equal(updated.status, 200)
  assert.equal(updated.body.quantity, 9)

  const student = await login('amine@essect.tn')
  assert.equal((await call('POST', '/offers', offer, student)).status, 403, 'un étudiant ne publie pas')
  const other = await login('m@cafe.tn')
  assert.equal((await call('PUT', `/offers/${id}`, offer, other)).status, 404, 'un commerçant ne modifie pas l’offre d’un autre')
  assert.equal((await call('DELETE', `/offers/${id}`, null, other)).status, 404)

  assert.equal((await call('DELETE', `/offers/${id}`, null, token)).status, 200)
  assert.ok(!(await call('GET', '/offers')).body.some(o => o.id === id))
})