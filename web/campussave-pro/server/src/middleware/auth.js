import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { store, save } from '../db.js'
import { firebaseEnabled, getFirebase } from '../firebase.js'
import { unauthorized, forbidden } from '../errors.js'

export const signToken = u => jwt.sign({ sub: u.id, role: u.role }, config.jwtSecret, { expiresIn: '7d' })

/* 1) jeton de session émis après la confirmation par e-mail ; 2) en option (FIREBASE_ID_TOKEN_AUTH=true),
   un ID token Firebase envoyé directement par l'appli mobile : dans ce cas le code e-mail n'est pas demandé. */
async function userFromToken(token) {
  try { return store.users.find(u => u.id === jwt.verify(token, config.jwtSecret).sub) || null } catch { /* pas un jeton de session */ }
  if (!firebaseEnabled || !config.firebase.idTokenAuth) return null
  try {
    const dec = await (await getFirebase()).auth.verifyIdToken(token)
    let user = store.users.find(u => u.id === dec.uid)
    if (!user) { // premier appel d'un compte créé depuis l'appli mobile : profil étudiant
      user = { id: dec.uid, name: dec.name || dec.email?.split('@')[0] || 'Étudiant', email: dec.email, role: 'student', active: true, emailVerified: Boolean(dec.email_verified), phone: '', university: '', createdAt: new Date().toISOString() }
      store.users.push(user); save()
    }
    return user
  } catch { return null }
}

export async function requireAuth(req, res, next) {
  try {
    const h = req.headers.authorization || ''
    const token = h.startsWith('Bearer ') ? h.slice(7) : null
    if (!token) return next(unauthorized())
    const user = await userFromToken(token)
    if (!user) return next(unauthorized('Session expirée, reconnecte-toi.'))
    if (!user.active) return next(forbidden('Ce compte est désactivé. Contacte l’administration.'))
    req.user = user
    next()
  } catch (e) { next(e) }
}

export const requireRole = (...roles) => [
  requireAuth,
  (req, res, next) => (roles.includes(req.user.role) ? next() : next(forbidden('Cet espace n’est pas accessible avec ton rôle.'))),
]
