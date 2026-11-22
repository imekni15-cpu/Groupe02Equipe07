// Paiement Konnect : le serveur Konnect est simulé (aucun appel réseau réel). Vérifie surtout que la commande
// n'est jamais marquée « payée » sans que Konnect ait confirmé le paiement.
process.env.NODE_ENV = 'test'
process.env.DB_FILE = ':memory:'
process.env.RATE_LIMIT = 'off'
for (const k of ['SMTP_USER', 'SMTP_PASS', 'SMTP_HOST', 'DEMO_EMAIL']) process.env[k] = ''
Object.assign(process.env, { KONNECT_API_KEY: 'test-key', KONNECT_WALLET_ID: 'wallet-test', KONNECT_BASE_URL: 'https://konnect.test/api/v2' })

import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'

const realFetch = globalThis.fetch
const statuses = new Map() // paymentRef → statut côté « Konnect »
const inits = []
let n = 0
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
globalThis.fetch = async (url, init) => {
  const u = String(url)
  if (!u.startsWith('https://konnect.test')) return realFetch(url, init)
  if (u.endsWith('/payments/init-payment')) {
    const ref = `REF${String(++n).padStart(9, '0')}`
    statuses.set(ref, 'pending')
    inits.push({ headers: init.headers, body: JSON.parse(init.body) })
    return json({ payUrl: `https://gateway.test/pay?payment_ref=${ref}`, paymentRef: ref })
  }
  const m = /\/payments\/(REF\d+)$/.exec(u)
  return m && statuses.has(m[1]) ? json({ payment: { status: statuses.get(m[1]) } }) : json({}, 404)
}

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
  const s1 = await call('POST', '/auth/login', { email, password })
  return (await call('POST', '/auth/verify-otp', { challengeId: s1.body.challengeId, code: s1.body.devCode })).body.token
}

test('santé : l’API annonce le mode de paiement Konnect', async () => {
  assert.equal((await call('GET', '/health')).body.payment, 'konnect')
})

test('Konnect : redirection, vérification côté serveur, puis reçu avec QR code', async () => {
  const token = await login('amine@essect.tn')
  const created = await call('POST', '/orders', { items: [{ offerId: '6', qty: 1 }] }, token)
  const id = created.body.id

  const pay = await call('POST', `/orders/${id}/pay`, {}, token) // aucune carte : la saisie se fait chez Konnect
  assert.equal(pay.status, 200)
  assert.equal(pay.body.step, 'redirect')
  assert.match(pay.body.payUrl, /^https:\/\/gateway\.test\/pay\?payment_ref=REF/)
  assert.equal(inits.at(-1).headers['x-api-key'], 'test-key')
  assert.equal(inits.at(-1).body.amount, 4000, 'montant en millimes : 4 TND')
  assert.equal(inits.at(-1).body.receiverWalletId, 'wallet-test')
  const ref = store.orders.find(o => o.id === id).konnectRef

  const again = await call('POST', `/orders/${id}/pay`, {}, token)
  assert.equal(again.body.payUrl, pay.body.payUrl, 'un seul paiement Konnect par réservation')
  assert.equal(inits.length, 1)

  assert.equal((await call('POST', `/orders/${id}/confirm-payment`, { paymentRef: 'REF999999999' }, token)).status, 400, 'référence étrangère refusée')
  const early = await call('POST', `/orders/${id}/confirm-payment`, { paymentRef: ref }, token)
  assert.equal(early.status, 402, 'paiement encore en attente chez Konnect')
  assert.equal(store.orders.find(o => o.id === id).status, 'pending')

  statuses.set(ref, 'completed')
  const done = await call('POST', `/orders/${id}/confirm-payment`, { paymentRef: ref }, token)
  assert.equal(done.status, 200)
  assert.equal(done.body.status, 'paid')
  assert.equal(done.body.payment.brand, 'Konnect')
  assert.equal(outbox[0].hasQr, true, 'le reçu avec QR code est envoyé par e-mail')
  assert.equal((await call('POST', `/orders/${id}/confirm-payment`, { paymentRef: ref }, token)).status, 200, 'idempotent')
})

test('Konnect : le webhook valide la commande même si l’étudiant ferme son navigateur', async () => {
  const token = await login('amine@essect.tn')
  const created = await call('POST', '/orders', { items: [{ offerId: '9', qty: 1 }] }, token)
  await call('POST', `/orders/${created.body.id}/pay`, {}, token)
  const ref = store.orders.find(o => o.id === created.body.id).konnectRef
  assert.equal((await call('GET', '/payments/konnect/webhook?payment_ref=REF000000000')).status, 404)
  await call('GET', `/payments/konnect/webhook?payment_ref=${ref}`) // pas encore payé : rien ne change
  assert.equal(store.orders.find(o => o.id === created.body.id).status, 'pending')
  statuses.set(ref, 'completed')
  assert.equal((await call('GET', `/payments/konnect/webhook?payment_ref=${ref}`)).status, 200)
  assert.equal(store.orders.find(o => o.id === created.body.id).status, 'paid')
})
