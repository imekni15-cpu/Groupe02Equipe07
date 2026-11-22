/* Identifiants des comptes. Deux implémentations derrière la même interface :
   - Firebase Authentication (si Firebase est configuré) : création via le SDK Admin, vérification du mot de passe
     via l'API REST d'Identity Toolkit. Aucun mot de passe n'est stocké par l'application.
   - Local (démo, tests) : mots de passe hachés avec bcrypt dans la base JSON. */
import bcrypt from 'bcryptjs'
import { config } from '../config.js'
import { store, newId } from '../db.js'
import { firebaseEnabled, getFirebase } from '../firebase.js'
import { HttpError, conflict, forbidden } from '../errors.js'

const rounds = config.test ? 4 : 10
const DUMMY_HASH = bcrypt.hashSync('dummy-password-1', rounds) // temps de réponse constant même si l'e-mail est inconnu
export const authBackend = firebaseEnabled ? 'firebase' : 'local'

/* Crée les identifiants d'une inscription (ou les remplace si l'inscription précédente n'a pas été confirmée).
   Retourne { id, passwordHash? } : `id` est l'uid Firebase en mode Firebase. */
export async function saveCredentials({ existing, name, email, password }) {
  if (!firebaseEnabled) return { id: existing?.id ?? newId('u'), passwordHash: await bcrypt.hash(password, rounds) }
  const { auth } = await getFirebase()
  if (existing) {
    try { await auth.updateUser(existing.id, { password, displayName: name }) }
    catch (e) {
      if (e.code !== 'auth/user-not-found') throw e
      await auth.createUser({ uid: existing.id, email, password, displayName: name })
    }
    return { id: existing.id }
  }
  try {
    const u = await auth.createUser({ email, password, displayName: name })
    return { id: u.uid }
  } catch (e) {
    if (e.code === 'auth/email-already-exists') throw conflict('Un compte existe déjà avec cet e-mail. Connecte-toi plutôt.')
    throw e
  }
}

/* Vérifie e-mail + mot de passe. Retourne { uid, displayName? } ou null si les identifiants sont faux. */
export async function signIn(email, password) {
  if (!firebaseEnabled) {
    const user = store.users.find(u => u.email === email)
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)
    return user && ok ? { uid: user.id } : null
  }
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(config.firebase.webApiKey)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null)
  if (!res) throw new HttpError(502, 'Service d’authentification injoignable. Réessaie dans un instant.')
  const data = await res.json().catch(() => ({}))
  if (res.ok) return { uid: data.localId, displayName: data.displayName }
  const code = String(data.error?.message || '')
  if (/INVALID_LOGIN_CREDENTIALS|EMAIL_NOT_FOUND|INVALID_PASSWORD|INVALID_EMAIL/.test(code)) return null
  if (/USER_DISABLED/.test(code)) throw forbidden('Ce compte est désactivé. Contacte l’administration.')
  if (/TOO_MANY_ATTEMPTS/.test(code)) throw new HttpError(429, 'Trop de tentatives. Réessaie dans quelques minutes.')
  console.error('Firebase signIn :', code)
  throw new HttpError(502, 'Service d’authentification indisponible. Réessaie dans un instant.')
}

export async function setPassword(user, password) {
  if (!firebaseEnabled) { user.passwordHash = await bcrypt.hash(password, rounds); return }
  const { auth } = await getFirebase()
  await auth.updateUser(user.id, { password })
}

export async function markEmailVerified(user) {
  if (!firebaseEnabled) return
  try { (await getFirebase()).auth.updateUser(user.id, { emailVerified: true }).catch(() => {}) } catch { /* non bloquant */ }
}

/* Démarrage en mode Firebase : crée les comptes Firebase Authentication des utilisateurs de démonstration
   (ils portent encore un mot de passe haché local) puis efface ce hachage : il ne doit jamais aller dans Firestore. */
export async function provisionSeedAccounts(password) {
  if (!firebaseEnabled) return 0
  const { auth } = await getFirebase()
  let n = 0
  for (const u of store.users.filter(x => x.passwordHash)) {
    try { await auth.createUser({ uid: u.id, email: u.email, password, displayName: u.name, emailVerified: true }); n++ }
    catch (e) { if (!/already-exists/.test(e.code || '')) throw e }
    delete u.passwordHash
  }
  return n
}
