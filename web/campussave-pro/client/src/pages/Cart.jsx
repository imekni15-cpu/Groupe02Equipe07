import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Info, Lock, Minus, Plus, Trash2 } from 'lucide-react'
import { Empty, Spinner, Thumb } from '../components/ui'
import { orderService } from '../services'
import { errMsg, errData } from '../api/http'
import { useAuth, useCart, cartTotal } from '../store'
import { money } from '../utils/format'

export default function Cart() {
  const { items, shop, setQty, remove, clear } = useCart()
  const user = useAuth(s => s.user)
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [pendingId, setPendingId] = useState(null)

  if (!items.length)
    return (
      <Empty emoji="🛒" title="Ton panier est vide">
        <p>Les paniers du jour t’attendent, il suffit d’en choisir un.</p>
        <Link to="/offers" className="btn pri">Voir les offres</Link>
      </Empty>
    )

  const total = cartTotal(items)
  const original = items.reduce((n, i) => n + i.originalPrice * i.qty, 0)
  const start = items.map(i => i.pickupStart).sort()[0]
  const end = items.map(i => i.pickupEnd).sort().at(-1)

  // Réservation : le serveur bloque le stock 10 min (commande `pending`), puis paiement + code e-mail
  const reserve = async () => {
    if (!user) return nav('/login', { state: { from: '/cart' } })
    setBusy(true); setErr(''); setPendingId(null)
    try {
      const o = await orderService.create(items.map(i => ({ offerId: i.offerId, qty: i.qty })))
      clear()
      nav(`/pay/${o.id}`)
    } catch (e) { setErr(errMsg(e)); setPendingId(errData(e).orderId || null); setBusy(false) }
  }

  return (
    <>
      <header className="page-head"><h1>Mon panier</h1><p className="mut">Commande chez {shop?.name}</p></header>
      <div className="split">
        <ul className="cart-list">
          {items.map(i => (
            <li key={i.offerId} className="cart-item">
              <Thumb item={i} className="thumb" />
              <div className="ci-main">
                <b>{i.title}</b>
                <small>{money(i.unitPrice)} l’unité, retrait de {i.pickupStart} à {i.pickupEnd}</small>
                <div className="stepper sm">
                  <button onClick={() => setQty(i.offerId, i.qty - 1)} disabled={i.qty <= 1} aria-label="Moins"><Minus size={14} /></button>
                  <b>{i.qty}</b>
                  <button onClick={() => setQty(i.offerId, i.qty + 1)} disabled={i.qty >= i.max} aria-label="Plus"><Plus size={14} /></button>
                </div>
              </div>
              <div className="ci-end">
                <strong>{money(i.unitPrice * i.qty)}</strong>
                <button className="icon-btn" onClick={() => remove(i.offerId)} aria-label={`Retirer ${i.title}`}><Trash2 size={17} /></button>
              </div>
            </li>
          ))}
        </ul>

        <aside className="summary">
          <h2>Récapitulatif</h2>
          <dl>
            <div><dt>Prix en magasin</dt><dd><s>{money(original)}</s></dd></div>
            <div><dt>Tu économises</dt><dd className="good">{money(original - total)}</dd></div>
            <div><dt>Retrait aujourd’hui</dt><dd>{start} à {end}</dd></div>
            <div className="sum-total"><dt>Total</dt><dd>{money(total)}</dd></div>
          </dl>
          {err && <div className="alert" role="alert"><Info size={16} /><span>{err} {pendingId && <Link className="link" to={`/pay/${pendingId}`}>Reprendre le paiement</Link>}</span></div>}
          <button className="btn pri block lg" onClick={reserve} disabled={busy}>
            {busy ? <Spinner /> : user ? `Réserver et payer, ${money(total)}` : 'Me connecter pour réserver'}
          </button>
          <p className="note"><Lock size={14} /> Ton panier est gardé 10 minutes une fois réservé. Le paiement est confirmé par un code envoyé à ton e-mail.</p>
        </aside>
      </div>
    </>
  )
}
