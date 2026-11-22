/* Stockage des données. Toutes les écritures passent par `save()`.
   - Mode local (par défaut) : fichier JSON, zéro configuration.
   - Mode Firebase (clé de compte de service fournie) : les données vivent dans Firestore.
     Elles sont chargées en mémoire au démarrage (`initStore`), puis chaque `save()` envoie à Firestore
     uniquement les documents modifiés ou supprimés. Les routes n'ont pas besoin de le savoir.
   Collections Firestore : users, shops, offers, orders, favorites (un document par étudiant), meta/counters.
   Les mots de passe ne sont jamais écrits dans Firestore : ils sont gérés par Firebase Authentication.
   Les codes de confirmation (challenges) restent en mémoire : ils expirent au bout de 10 minutes. */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { config } from './config.js'
import { firebaseEnabled, getFirebase } from './firebase.js'

const empty = () => ({ meta: { orderSeq: 1001 }, users: [], shops: [], offers: [], orders: [], challenges: [], favorites: {} })
export const store = empty()
const memory = config.dbFile === ':memory:'
const COLLECTIONS = ['users', 'shops', 'offers', 'orders']

if (!memory && !firebaseEnabled && fs.existsSync(config.dbFile)) {
  try { Object.assign(store, JSON.parse(fs.readFileSync(config.dbFile, 'utf8'))) }
  catch (e) { console.error('⚠️  Base illisible, démarrage à vide :', e.message) }
}

/* ───────── Firestore ───────── */
const snapshot = new Map() // chemin du document → JSON déjà envoyé

function documents() {
  const out = new Map()
  for (const name of COLLECTIONS) {
    for (const d of store[name]) {
      const data = JSON.parse(JSON.stringify(d)) // retire les `undefined`
      delete data.passwordHash
      out.set(`${name}/${d.id}`, data)
    }
  }
  for (const [uid, offerIds] of Object.entries(store.favorites)) out.set(`favorites/${uid}`, { offerIds })
  out.set('meta/counters', { ...store.meta })
  return out
}

export async function initStore() {
  if (!firebaseEnabled) return
  const { db } = await getFirebase()
  const [users, shops, offers, orders, favs, meta] = await Promise.all([
    ...COLLECTIONS.map(n => db.collection(n).get()),
    db.collection('favorites').get(),
    db.doc('meta/counters').get(),
  ])
  const rows = snap => snap.docs.map(d => ({ ...d.data(), id: d.id }))
  Object.assign(store, { users: rows(users), shops: rows(shops), offers: rows(offers), orders: rows(orders) })
  store.favorites = Object.fromEntries(favs.docs.map(d => [d.id, d.data().offerIds || []]))
  if (meta.exists) store.meta = { ...store.meta, ...meta.data() }
  snapshot.clear()
  for (const [p, data] of documents()) snapshot.set(p, JSON.stringify(data))
}

let chain = Promise.resolve()
async function pushToFirestore() {
  const { db } = await getFirebase()
  const next = documents()
  const changes = []
  for (const [p, data] of next) {
    const json = JSON.stringify(data)
    if (snapshot.get(p) !== json) changes.push({ p, data, json })
  }
  for (const p of snapshot.keys()) if (!next.has(p)) changes.push({ p, del: true })
  for (let i = 0; i < changes.length; i += 400) { // une écriture groupée Firestore accepte 500 opérations au maximum
    const batch = db.batch()
    const part = changes.slice(i, i + 400)
    for (const c of part) c.del ? batch.delete(db.doc(c.p)) : batch.set(db.doc(c.p), c.data)
    await batch.commit()
    for (const c of part) c.del ? snapshot.delete(c.p) : snapshot.set(c.p, c.json)
  }
}
const syncRemote = () => (chain = chain.then(pushToFirestore).catch(e => console.error('⚠️  Synchronisation Firestore échouée :', e.message)))

/* ───────── API commune ───────── */
export function flush() {
  if (firebaseEnabled) return syncRemote()
  if (memory) return
  fs.mkdirSync(path.dirname(config.dbFile), { recursive: true })
  const tmp = `${config.dbFile}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(store))
  fs.renameSync(tmp, config.dbFile) // écriture atomique
}
let timer
export const save = () => { if (!memory || firebaseEnabled) { clearTimeout(timer); timer = setTimeout(flush, firebaseEnabled ? 120 : 40) } }
export const resetStore = () => Object.assign(store, empty())
process.on('exit', () => { if (!firebaseEnabled) flush() })

export const newId = prefix => prefix + crypto.randomBytes(5).toString('hex')
export const nextOrderSeq = () => store.meta.orderSeq++
