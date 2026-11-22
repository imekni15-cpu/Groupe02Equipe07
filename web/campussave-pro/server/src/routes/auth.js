import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { config } from '../config.js'
import { store, save, newId } from '../db.js'
import { wrap, badRequest, unauthorized, forbidden, conflict } from '../errors.js'
import { schemas, validate } from '../schemas.js'
import { signToken, requireAuth } from '../middleware/auth.js'
import { startChallenge, resendChallenge, checkChallenge } from '../services/otp.js'
import * as accounts from '../services/accounts.js'
import { firebaseEnabled } from '../firebase.js'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Trop de tentatives. Réessaie dans quelques minutes.' }, skip: () => !config.rateLimit,
})

export const publicUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, phone: u.phone, university: u.university, emailVerified: u.emailVerified, createdAt: u.createdAt })

const r = Router()

// 1) Inscription (étudiant ou commerçant) → e-mail de confirmation (code à 6 chiffres)
r.post('/register', limiter, validate(schemas.register), wrap(async (req, res) => {
  const { name, email, password, phone = '', university = '', role = 'student', shop } = req.body
  let user = store.users.find(u => u.email === email)
  if (user?.emailVerified) throw conflict('Un compte existe déjà avec cet e-mail. Connecte-toi plutôt.')
  const cred = await accounts.saveCredentials({ existing: user, name, email, password })
  const hash = cred.passwordHash ? { passwordHash: cred.passwordHash } : {}
  if (user) Object.assign(user, { name, role, phone, university, ...hash }) // inscription non terminée : on repart de zéro
  else {
    user = { id: cred.id, name, email, role, ...hash, active: true, emailVerified: false, phone, university, createdAt: new Date().toISOString() }
    store.users.push(user)
  }
  if (role === 'merchant') { // le commerce est créé « en attente » : l'administrateur doit le valider avant publication
    const mine = store.shops.find(s => s.ownerId === user.id)
    const data = { name: shop.name, type: shop.type, address: shop.address, phone, openingHours: shop.openingHours || '' }
    if (mine) Object.assign(mine, data)
    else store.shops.push({ id: newId('s'), ownerId: user.id, ...data, status: 'pending', createdAt: new Date().toISOString() })
  }
  save()
  res.status(201).json(await startChallenge({ user, purpose: 'register' }))
}))

// 2) Connexion : mot de passe correct → code de confirmation envoyé par e-mail
r.post('/login', limiter, validate(schemas.login), wrap(async (req, res) => {
  const { email, password } = req.body
  const found = await accounts.signIn(email, password)
  if (!found) throw unauthorized('E-mail ou mot de passe incorrect.')
  let user = store.users.find(u => u.email === email)
  if (!user) { // compte créé directement dans Firebase (ex. appli mobile) : on crée son profil étudiant
    if (!firebaseEnabled) throw unauthorized('E-mail ou mot de passe incorrect.')
    user = { id: found.uid, name: found.displayName || email.split('@')[0], email, role: 'student', active: true, emailVerified: false, phone: '', university: '', createdAt: new Date().toISOString() }
    store.users.push(user); save()
  }
  if (!user.active) throw forbidden('Ce compte est désactivé. Contacte l’administration.')
  res.json(await startChallenge({ user, purpose: user.emailVerified ? 'login' : 'register' }))
}))

// 3) Vérification du code → session (JWT)
r.post('/verify-otp', limiter, validate(schemas.otp), wrap(async (req, res) => {
  const { challengeId, code } = req.body
  const ch = store.challenges.find(c => c.id === challengeId)
  if (!ch || !['login', 'register'].includes(ch.purpose)) throw badRequest('Cette demande de confirmation est introuvable ou a expiré. Recommence.')
  checkChallenge({ id: challengeId, code, purpose: ch.purpose })
  const user = store.users.find(u => u.id === ch.userId)
  if (!user.active) throw forbidden('Ce compte est désactivé. Contacte l’administration.')
  if (ch.purpose === 'register') { user.emailVerified = true; save(); accounts.markEmailVerified(user) }
  res.json({ token: signToken(user), user: publicUser(user) })
}))

r.post('/resend-otp', limiter, validate(schemas.resend), wrap(async (req, res) => {
  const ch = store.challenges.find(c => c.id === req.body.challengeId && ['login', 'register'].includes(c.purpose))
  if (!ch) throw badRequest('Cette demande a expiré. Recommence depuis le début.')
  res.json(await resendChallenge(ch.id, store.users.find(u => u.id === ch.userId)))
}))

r.get('/me', requireAuth, (req, res) => res.json(publicUser(req.user)))

r.put('/me', requireAuth, validate(schemas.profile), wrap(async (req, res) => {
  const { name, phone = '', university = '' } = req.body
  Object.assign(req.user, { name, phone, university })
  save()
  res.json(publicUser(req.user))
}))

r.put('/password', requireAuth, limiter, validate(schemas.password), wrap(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!(await accounts.signIn(req.user.email, currentPassword))) throw badRequest('Le mot de passe actuel est incorrect.')
  if (currentPassword === newPassword) throw badRequest('Choisis un mot de passe différent de l’actuel.')
  await accounts.setPassword(req.user, newPassword)
  save()
  res.json({ ok: true })
}))

export default r
