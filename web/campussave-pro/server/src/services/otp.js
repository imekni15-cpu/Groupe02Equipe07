/* Codes de confirmation à usage unique (connexion, inscription, achat).
   - 6 chiffres générés avec crypto.randomInt, jamais stockés en clair (HMAC-SHA256)
   - expiration 10 min, 5 essais max, renvoi limité (30 s de délai, 5 envois max)
   - un code est lié à un utilisateur ET à un usage (un code d'achat ne peut pas servir à se connecter) */
import crypto from 'node:crypto'
import { config } from '../config.js'
import { store, save, newId } from '../db.js'
import { HttpError, badRequest } from '../errors.js'
import { sendMail } from '../mail/mailer.js'
import { mailEnabled } from '../mail/mailer.js'
import { otpEmail } from '../mail/templates.js'

const { ttlSec, maxAttempts, resendCooldownSec, maxSends } = config.otp
const hashCode = (id, code) => crypto.createHmac('sha256', config.otpSecret).update(`${id}:${code}`).digest('hex')
const newCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
const safeEqual = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))

export const maskEmail = e => {
  const [u, d] = e.split('@')
  return `${u.slice(0, Math.min(2, u.length))}${'•'.repeat(Math.max(2, u.length - 2))}@${d}`
}

const purge = () => { store.challenges = store.challenges.filter(c => c.expiresAt > Date.now() - 3600_000) }
const drop = ch => { store.challenges = store.challenges.filter(c => c.id !== ch.id); save() }

const view = (ch, user, code) => ({
  step: 'otp',
  purpose: ch.purpose,
  challengeId: ch.id,
  emailMasked: maskEmail(user.email),
  expiresIn: ttlSec,
  resendIn: resendCooldownSec,
  // mode démo uniquement : sans SMTP configuré, le code est renvoyé pour tester sans boîte mail
  ...(!mailEnabled && !config.prod ? { devCode: code } : {}),
})

async function deliver(ch, user, order) {
  const code = newCode()
  ch.codeHash = hashCode(ch.id, code)
  ch.expiresAt = Date.now() + ttlSec * 1000
  ch.attempts = 0
  ch.sends += 1
  ch.lastSentAt = Date.now()
  save()
  const mail = otpEmail({ name: user.name, code, purpose: ch.purpose, order, ttlMin: ttlSec / 60 })
  try { await sendMail({ to: user.email, ...mail }) }
  catch (e) {
    console.error('Envoi e-mail impossible :', e.message)
    throw new HttpError(502, 'Impossible d’envoyer l’e-mail de confirmation. Vérifie l’adresse ou réessaie dans un instant.')
  }
  return view(ch, user, code)
}

/* Crée un défi et envoie l'e-mail. `order` rappelle le montant dans l'e-mail d'achat. */
export async function startChallenge({ user, purpose, refId = null, meta = {}, order = null }) {
  purge()
  store.challenges = store.challenges.filter(c => !(c.userId === user.id && c.purpose === purpose && c.refId === refId))
  const ch = { id: newId('ch_'), userId: user.id, purpose, refId, meta, codeHash: '', expiresAt: 0, attempts: 0, sends: 0, lastSentAt: 0 }
  store.challenges.push(ch)
  return deliver(ch, user, order)
}

export async function resendChallenge(id, user, order = null) {
  const ch = store.challenges.find(c => c.id === id && c.userId === user.id)
  if (!ch) throw badRequest('Cette demande a expiré. Recommence depuis le début.')
  const wait = Math.ceil((ch.lastSentAt + resendCooldownSec * 1000 - Date.now()) / 1000)
  if (wait > 0) throw new HttpError(429, `Patiente ${wait} s avant de demander un nouveau code.`, { retryAfter: wait })
  if (ch.sends >= maxSends) throw new HttpError(429, 'Trop de codes demandés. Recommence plus tard.')
  return deliver(ch, user, order)
}

/* Vérifie le code. Retourne le défi consommé, ou lève une erreur explicite. */
export function checkChallenge({ id, code, purpose, refId = null, userId = null }) {
  const ch = store.challenges.find(c => c.id === id && c.purpose === purpose && c.refId === refId && (!userId || c.userId === userId))
  if (!ch) throw badRequest('Cette demande de confirmation est introuvable ou a expiré. Recommence.')
  if (Date.now() > ch.expiresAt) { drop(ch); throw badRequest('Ce code a expiré. Demande-en un nouveau.', { expired: true }) }
  if (ch.attempts >= maxAttempts) { drop(ch); throw new HttpError(429, 'Trop d’essais. Recommence pour recevoir un nouveau code.', { locked: true }) }
  if (!safeEqual(hashCode(ch.id, String(code)), ch.codeHash)) {
    ch.attempts += 1
    save()
    const left = maxAttempts - ch.attempts
    if (left <= 0) { drop(ch); throw new HttpError(429, 'Trop d’essais. Recommence pour recevoir un nouveau code.', { locked: true }) }
    throw badRequest(`Code incorrect. Il te reste ${left} essai${left > 1 ? 's' : ''}.`, { attemptsLeft: left })
  }
  drop(ch) // usage unique
  return ch
}
