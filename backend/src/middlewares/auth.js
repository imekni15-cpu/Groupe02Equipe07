const { auth, db } = require('../config/firebase')
const { HttpError, ah } = require('../utils/httpError')
const { toUser } = require('../utils/userDoc')

// Retire les champs internes avant d'envoyer l'utilisateur au client
const publicUser = ({ fcmTokens, ...u }) => u

// Vérifie le jeton Firebase (Authorization: Bearer <idToken>) puis charge le profil Firestore
const verifyToken = ah(async (req, _res, next) => {
  const m = (req.headers.authorization || '').match(/^Bearer (.+)$/i)
  if (!m) throw new HttpError(401, 'Connexion requise.')
  let decoded
  try { decoded = await auth.verifyIdToken(m[1]) } catch { throw new HttpError(401, 'Session expirée. Reconnecte-toi.') }
  const snap = await db.collection('users').doc(decoded.uid).get()
  if (!snap.exists) throw new HttpError(401, 'Compte introuvable.')
  const user = toUser(decoded.uid, snap.data())
  if (!user.active) throw new HttpError(403, 'Ce compte est désactivé. Contacte l’administration.')
  req.user = user
  next()
})

// À placer APRÈS verifyToken : requireRole('admin'), requireRole('student', 'merchant')
const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.role) ? next() : next(new HttpError(403, 'Accès refusé pour ton rôle.'))

module.exports = { verifyToken, requireRole, publicUser }
