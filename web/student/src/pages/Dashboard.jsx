import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, QrCode } from 'lucide-react'
import { StatusBadge } from '../components/ui'
import { useCountUp, useNow } from '../hooks'
import { orderService } from '../services/orderService'
import { offerService } from '../services/offerService'
import { useAuth } from '../store'
import { CAT, fmtDate, itemEmoji, money, slotState } from '../utils/format'

const LEVELS = [[0, 'Graine', '🌱'], [3, 'Pousse', '🌿'], [8, 'Arbuste', '🪴'], [15, 'Arbre', '🌳'], [30, 'Forêt', '🏞️']]
const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function stats(orders) {
  const done = orders.filter(o => o.status === 'picked_up')
  const qty = o => o.items.reduce((n, i) => n + i.qty, 0)
  const meals = done.reduce((n, o) => n + qty(o), 0)
  const saved = done.reduce((n, o) => n + o.items.reduce((m, i) => m + ((i.originalPrice ?? i.unitPrice) - i.unitPrice) * i.qty, 0), 0)
  const today = new Date().toDateString()
  const week = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - k))
    return {
      label: DAYS[d.getDay()], today: d.toDateString() === today,
      value: orders.filter(o => ['paid', 'picked_up'].includes(o.status) && new Date(o.createdAt).toDateString() === d.toDateString()).length,
    }
  })
  let li = 0
  LEVELS.forEach(([t], k) => { if (meals >= t) li = k })
  const cur = LEVELS[li], next = LEVELS[li + 1]
  return { meals, saved, co2: meals, week, level: { cur, next, p: next ? (meals - cur[0]) / (next[0] - cur[0]) : 1 }, active: orders.filter(o => o.status === 'paid') }
}

export default function Dashboard() {
  const user = useAuth(s => s.user)
  const now = useNow(30000)
  const [orders, setOrders] = useState(null)
  const [offers, setOffers] = useState([])
  useEffect(() => {
    orderService.mine().then(setOrders).catch(() => setOrders([]))
    offerService.list().then(setOffers).catch(() => {})
  }, [])

  const s = useMemo(() => stats(orders || []), [orders])
  const meals = useCountUp(s.meals), saved = useCountUp(s.saved), co2 = useCountUp(s.co2)
  const max = Math.max(1, ...s.week.map(w => w.value))
  const next = s.active[0]
  const last = offers.filter(o => o.quantity > 0).sort((a, b) => a.pickupEnd.localeCompare(b.pickupEnd)).slice(0, 4)
  const first = user.name.split(' ')[0]
  const R = 34, C = 2 * Math.PI * R

  if (!orders) return <div className="bento">{Array.from({ length: 6 }, (_, i) => <div key={i} className={`sk tile ${i === 0 ? 's2' : ''}`} style={{ minHeight: 150 }} />)}</div>

  return (
    <div className="bento">
      <section className="tile t-hero s2">
        <h1>Salut {first}.</h1>
        <p>{s.meals > 0 ? `Tu as déjà sauvé ${s.meals} repas${s.active.length ? `, et ${s.active.length} t’attend${s.active.length > 1 ? 'ent' : ''} au retrait.` : '.'}` : 'Ton premier panier anti-gaspi t’attend dans les offres du jour.'}</p>
        <Link to="/offers" className="btn lime">Trouver un repas</Link>
      </section>

      <section className="tile t-blue" aria-label="Repas sauvés">
        <small>Repas sauvés</small><strong>{Math.round(meals)}</strong>
        <span>{orders.filter(o => o.status === 'pending').length ? 'Une réservation attend ton paiement.' : 'Comptés au retrait validé.'}</span>
      </section>

      <section className="tile t-cit" aria-label="Économisé">
        <small>Économisé</small><strong>{saved.toFixed(saved % 1 ? 1 : 0).replace('.', ',')}<em> DT</em></strong>
        <span>Face au prix en magasin.</span>
      </section>

      <section className="tile s2 chart">
        <h2>Tes commandes sur 7 jours</h2>
        <div className="bars" role="img" aria-label={`Commandes par jour : ${s.week.map(w => `${w.label} ${w.value}`).join(', ')}`}>
          {s.week.map(w => (
            <div key={w.label} className={w.today ? 'today' : ''}>
              <span className="v">{w.value || ''}</span>
              <i style={{ '--p': Math.max(0.06, w.value / max) }} />
              <small>{w.label}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="tile t-mint" aria-label="CO₂ évité">
        <small>CO₂ évité (estimation)</small><strong>{Math.round(co2)}<em> kg</em></strong>
        <span>Environ 1 kg par repas sauvé.</span>
      </section>

      <section className="tile level">
        <svg viewBox="0 0 80 80" width="92" height="92" aria-hidden="true">
          <circle cx="40" cy="40" r={R} className="ring-bg" /><circle cx="40" cy="40" r={R} className="ring" strokeDasharray={C} strokeDashoffset={C * (1 - s.level.p)} transform="rotate(-90 40 40)" />
          <text x="40" y="49" textAnchor="middle" fontSize="28">{s.level.cur[2]}</text>
        </svg>
        <div><h2>{s.level.cur[1]}</h2><p>{s.level.next ? `Encore ${s.level.next[0] - s.meals} repas pour devenir ${s.level.next[1]}.` : 'Niveau maximum atteint.'}</p></div>
      </section>

      <section className="tile s2 next">
        <h2>Prochain retrait</h2>
        {next ? (
          <>
            <div className="nx-top"><span className="o-emoji">{itemEmoji(next.items[0])}</span><div><b>{next.shopName}</b><small>{next.items.map(i => `${i.qty} × ${i.title}`).join(', ')}</small></div></div>
            <p className={`slot ${slotState(next, now).phase}`}><Clock size={16} /> {slotState(next, now).label}</p>
            <Link to={`/orders/${next.id}`} className="btn pri"><QrCode size={17} /> Afficher mon QR code</Link>
          </>
        ) : <><p className="mut">Aucun retrait prévu aujourd’hui.</p><Link to="/offers" className="btn ghost">Voir les offres</Link></>}
      </section>

      <section className="tile s2">
        <div className="row between"><h2>Dernières commandes</h2><Link to="/orders" className="link">Tout voir</Link></div>
        <ul className="mini-list">
          {orders.slice(0, 4).map(o => (
            <li key={o.id}><Link to={`/orders/${o.id}`}><span className="o-emoji">{itemEmoji(o.items[0])}</span><span className="grow"><b>{o.shopName}</b><small>{fmtDate(o.createdAt)}</small></span><StatusBadge o={o} /><strong>{money(o.total)}</strong></Link></li>
          ))}
          {!orders.length && <li className="mut">Aucune commande pour l’instant.</li>}
        </ul>
      </section>

      {last.length > 0 && (
        <section className="tile s4 last">
          <div className="row between"><h2>Dernière chance aujourd’hui</h2><Link to="/offers" className="link">Toutes les offres</Link></div>
          <ul className="last-list">
            {last.map(o => (
              <li key={o.id}><Link to="/offers">
                <span className="thumb" style={{ '--h': (CAT[o.category] || CAT.Autre).hue }}>{(CAT[o.category] || CAT.Autre).emoji}</span>
                <span className="grow"><b>{o.title}</b><small>Retrait jusqu’à {o.pickupEnd}</small></span><strong>{money(o.discountPrice)}</strong>
              </Link></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
