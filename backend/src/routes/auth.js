const router = require('express').Router()
const rateLimit = require('express-rate-limit')
const { auth, db, admin } = require('../config/firebase')
const { verifyToken, publicUser } = require('../middlewares/auth')
const { HttpError, ah } = require('../utils/httpError')
const { rules, firstError } = require('../utils/validators')
const { toUser, splitName } = require('../utils/userDoc')

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Trop de tentatives. Réessaie dans quelques minutes.' } })

// Seuls ces rôles peuvent être choisis à l'inscription. Un admin se crée avec scripts/createAdmin.js
const SELF_REGISTER_ROLES = ['student', 'merchant']

/* POST /api/auth/register  { name, email, password, role?, phone?, university?, shopName?, shopType?, shopAddress? } */
router.post('/register', limiter, ah(async (req, res) => {
  const { name, email, password, phone = '', university = '', role = 'student', shopName, shopType, shopAddress } = req.body || {}
  const err = firstError([['name', name], ['email', email], ['password', password], ['phone', phone]])
  if (err) throw new HttpError(400, err)
  if (!SELF_REGISTER_ROLES.includes(role)) throw new HttpError(403, 'Ce rôle ne peut pas être choisi à l’inscription.')
  if (role === 'merchant' && !String(shopName || '').trim()) throw new HttpError(400, 'Indique le nom de ton commerce.')

  let rec
  try {
    rec = await auth.createUser({ email: email.trim(), password, displayName: name.trim() })
  } catch (e) {
    if (e.code === 'auth/email-already-exists') throw new HttpError(409, 'Un compte existe déjà avec cet email. Connecte-toi plutôt.')
    throw e
  }

  const now = new Date().toISOString()
  const { firstName, lastName } = splitName(name)
  const doc = { uid: rec.uid, id: rec.uid, name: name.trim(), firstName, lastName, email: rec.email, role, active: true, phone: phone.replace(/\s/g, ''), university: university.trim(), createdAt: admin.firestore.Timestamp.now() }
  try {
    await auth.setCustomUserClaims(rec.uid, { role })
    const batch = db.batch()
    batch.set(db.collection('users').doc(rec.uid), doc)
    if (role === 'merchant') {
      batch.set(db.collection('shops').doc(), {
        ownerId: rec.uid, name: shopName.trim(), type: (shopType || '').trim(), address: (shopAddress || '').trim(),
        status: 'pending', createdAt: now, // validé ensuite par l'admin
      })
    }
    await batch.commit()
  } catch (e) {
    await auth.deleteUser(rec.uid).catch(() => {}) // pas de compte à moitié créé
    throw e
  }
  res.status(201).json({ user: toUser(rec.uid, doc) })
}))

/* POST /api/auth/login  { email, password } → { token, user }
   Firebase Admin ne vérifie pas les mots de passe : on passe par l'API REST Firebase Auth. */
router.post('/login', limiter, ah(async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) throw new HttpError(400, 'Indique ton email et ton mot de passe.')
  const key = process.env.FIREBASE_WEB_API_KEY
  if (!key) { console.error('FIREBASE_WEB_API_KEY manquante dans .env'); throw new HttpError(500, 'Configuration serveur incomplète.') }

  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: String(email).trim(), password, returnSecureToken: true }),
  })
  const data = await r.json()
  if (!r.ok) {
    const code = data?.error?.message || ''
    if (code.startsWith('USER_DISABLED')) throw new HttpError(403, 'Ce compte est désactivé. Contacte l’administration.')
    if (code.startsWith('TOO_MANY_ATTEMPTS')) throw new HttpError(429, 'Trop de tentatives. Réessaie plus tard.')
    if (/EMAIL_NOT_FOUND|INVALID_PASSWORD|INVALID_LOGIN_CREDENTIALS/.test(code)) throw new HttpError(401, 'Email ou mot de passe incorrect.')
    console.error('Firebase Auth REST:', code)
    throw new HttpError(502, 'Service d’authentification indisponible.')
  }

  const snap = await db.collection('users').doc(data.localId).get()
  if (!snap.exists) throw new HttpError(403, 'Profil introuvable. Contacte l’administration.')
  const user = toUser(data.localId, snap.data())
  if (!user.active) throw new HttpError(403, 'Ce compte est désactivé. Contacte l’administration.')
  snap.ref.update({ lastLoginAt: admin.firestore.Timestamp.now() }).catch(() => {})
  res.json({ token: data.idToken, refreshToken: data.refreshToken, user })
}))

/* GET /api/auth/me */
router.get('/me', verifyToken, (req, res) => res.json({ user: publicUser(req.user) }))

/* PUT /api/auth/me  { name, phone, university } */
router.put('/me', verifyToken, ah(async (req, res) => {
  const { name, phone = '', university = '' } = req.body || {}
  const err = firstError([['name', name], ['phone', phone]])
  if (err) throw new HttpError(400, err)
  const patch = { name: name.trim(), ...splitName(name), phone: phone.replace(/\s/g, ''), university: university.trim(), updatedAt: new Date().toISOString() }
  await db.collection('users').doc(req.user.id).update(patch)
  await auth.updateUser(req.user.id, { displayName: patch.name })
  res.json({ user: publicUser({ ...req.user, ...patch }) })
}))

/* PUT /api/auth/password  { currentPassword, newPassword } */
router.put('/password', limiter, verifyToken, ah(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {}
  const err = rules.password(newPassword)
  if (err) throw new HttpError(400, err)
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_WEB_API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: req.user.email, password: currentPassword || '', returnSecureToken: false }),
  })
  if (!r.ok) throw new HttpError(400, 'Le mot de passe actuel est incorrect.')
  await auth.updateUser(req.user.id, { password: newPassword })
  res.json({ ok: true })
}))

/* POST /api/auth/fcm-token  { token } : enregistre l'appareil pour les notifications push (FCM) */
router.post('/fcm-token', verifyToken, ah(async (req, res) => {
  const { token } = req.body || {}
  if (!token || typeof token !== 'string') throw new HttpError(400, 'Jeton FCM manquant.')
  await db.collection('users').doc(req.user.id).update({ fcmTokens: admin.firestore.FieldValue.arrayUnion(token) })
  res.json({ ok: true })
}))

module.exports = router
