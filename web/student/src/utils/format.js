export const CATEGORIES = ['Sandwich', 'Plat chaud', 'Salade', 'Pâtisserie', 'Boisson', 'Autre']
export const SHOP_TYPES = ['Restaurant', 'Cafétéria', 'Boulangerie', 'Fast-food']
export const UNIVERSITIES = ['ESSECT', 'ENIT', 'INSAT', 'ISG Tunis', 'FST', 'FSEGT', 'ESPRIT', 'Autre']

export const CAT = {
  Sandwich: { emoji: '🥪', hue: 32 },
  'Plat chaud': { emoji: '🍲', hue: 10 },
  Salade: { emoji: '🥗', hue: 140 },
  'Pâtisserie': { emoji: '🥐', hue: 44 },
  Boisson: { emoji: '🧋', hue: 195 },
  Autre: { emoji: '🍕', hue: 270 },
}
export const itemEmoji = i => i?.emoji || '🍽️'

export const STATUS = {
  pending: { label: 'À payer', tone: 'warn' },
  paid: { label: 'À récupérer', tone: 'ok' },
  picked_up: { label: 'Récupérée', tone: 'done' },
  cancelled: { label: 'Annulée', tone: 'bad' },
}

const pad = n => String(n).padStart(2, '0')

export const money = n => {
  const v = Number(n) || 0
  return `${(Number.isInteger(v) ? String(v) : v.toFixed(2)).replace('.', ',')} DT`
}
export const pct = o => Math.round((1 - o.discountPrice / o.originalPrice) * 100)

export const dur = ms => {
  const m = Math.max(0, Math.round(ms / 60000))
  const h = Math.floor(m / 60)
  return h ? `${h} h ${pad(m % 60)}` : `${m} min`
}
export const mmss = ms => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
}

export const fmtDate = iso =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
export const fmtTime = iso =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

/* État du créneau de retrait d'une commande (le retrait a lieu le jour de la réservation) */
export function slotState(order, now = Date.now()) {
  const at = hhmm => {
    const [h, m] = hhmm.split(':').map(Number)
    const d = new Date(order.createdAt)
    d.setHours(h, m, 0, 0)
    return d.getTime()
  }
  const s = at(order.pickupStart)
  const e = at(order.pickupEnd)
  if (now < s) return { phase: 'before', label: `Le retrait ouvre dans ${dur(s - now)}` }
  if (now <= e) return { phase: 'open', label: `Retrait ouvert, il reste ${dur(e - now)}` }
  return { phase: 'over', label: 'Le créneau de retrait est terminé' }
}
