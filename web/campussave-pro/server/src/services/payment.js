/* Paiement en ligne.
   - Konnect (https://konnect.network) quand KONNECT_API_KEY et KONNECT_WALLET_ID sont renseignés : le serveur crée un
     paiement, l'étudiant règle sur la page sécurisée de Konnect (carte bancaire, e-DINAR ou portefeuille), puis le serveur
     INTERROGE Konnect pour confirmer le statut. Le navigateur ne peut donc pas « déclarer » un paiement réussi.
     Par défaut l'URL pointe vers le bac à sable (aucun vrai débit). Pour la production : KONNECT_BASE_URL=https://api.konnect.network/api/v2
   - Sans clés : passerelle SIMULÉE (cartes de test), pour développer et lancer les tests sans compte. */
import { config } from '../config.js'
import { HttpError, badRequest } from '../errors.js'

export const konnectEnabled = config.konnect.enabled

async function konnect(path, init = {}) {
  const res = await fetch(`${config.konnect.baseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'x-api-key': config.konnect.apiKey },
    signal: AbortSignal.timeout(15_000),
  }).catch(e => { console.error('Konnect injoignable :', e.message); return null })
  if (!res) throw new HttpError(502, 'Le service de paiement est injoignable. Réessaie dans un instant.')
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('Konnect a refusé la demande :', res.status, JSON.stringify(data).slice(0, 300))
    throw new HttpError(502, 'Le service de paiement a refusé la demande. Réessaie dans un instant.')
  }
  return data
}

/* Crée un paiement Konnect pour la commande. Montant en millimes (1 TND = 1000). */
export async function initKonnectPayment({ order, user, returnUrl, webhook }) {
  const [firstName, ...rest] = user.name.trim().split(/\s+/)
  const data = await konnect('/payments/init-payment', {
    method: 'POST',
    body: JSON.stringify({
      receiverWalletId: config.konnect.walletId,
      token: 'TND',
      amount: Math.round(order.total * 1000),
      type: 'immediate',
      description: `CampusSave ${order.code} - ${order.shopName}`.slice(0, 120),
      acceptedPaymentMethods: ['wallet', 'bank_card', 'e-DINAR'],
      lifespan: 15, // minutes
      checkoutForm: false,
      addPaymentFeesToAmount: false,
      firstName, lastName: rest.join(' ') || firstName,
      ...(user.phone ? { phoneNumber: user.phone } : {}),
      email: user.email,
      orderId: order.code,
      successUrl: returnUrl, failUrl: returnUrl,
      ...(webhook ? { webhook } : {}),
    }),
  })
  if (!data.payUrl || !data.paymentRef) throw new HttpError(502, 'Réponse inattendue du service de paiement.')
  return { payUrl: data.payUrl, paymentRef: data.paymentRef }
}

/* Interroge Konnect : le paiement est-il réellement terminé ? */
export async function getKonnectPayment(paymentRef) {
  const data = await konnect(`/payments/${encodeURIComponent(paymentRef)}`)
  const p = data.payment || data
  return { completed: String(p.status).toLowerCase() === 'completed', status: p.status }
}

/* ───── Passerelle simulée (mode démo) ───── */
const luhn = n => { let s = 0, alt = false; for (let i = n.length - 1; i >= 0; i--) { let d = +n[i]; if (alt) { d *= 2; if (d > 9) d -= 9 } s += d; alt = !alt } return s % 10 === 0 }

export function authorize({ number, expiry, cvc }) {
  const d = number.replace(/\s/g, '')
  if (!/^\d{16}$/.test(d) || !luhn(d)) throw badRequest('Le numéro de carte est invalide.')
  const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(expiry)
  if (!m || new Date(2000 + Number(m[2]), Number(m[1]), 1) <= new Date()) throw badRequest('La carte a expiré ou la date est invalide.')
  if (!/^\d{3}$/.test(cvc)) throw badRequest('Le code de sécurité doit contenir 3 chiffres.')
  if (d === '4000000000000002') throw new HttpError(402, 'Paiement refusé par ta banque. Essaie une autre carte.')
  return { brand: d[0] === '4' ? 'Visa' : d[0] === '5' || /^2[2-7]/.test(d) ? 'Mastercard' : 'Carte', last4: d.slice(-4) }
}
