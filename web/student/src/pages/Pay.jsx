import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Info, Lock } from 'lucide-react'
import { Empty, Field, Spinner } from '../components/ui'
import { useForm, useNow } from '../hooks'
import { rules } from '../utils/validators'
import { orderService } from '../services/orderService'
import { errMsg } from '../api/http'
import { useUi } from '../store'
import { USE_MOCK } from '../api/http'
import { mmss, money } from '../utils/format'

const fmtNum = s => s.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
const fmtExp = s => { const d = s.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }

export default function Pay() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useUi(s => s.toast)
  const now = useNow(1000)
  const [order, setOrder] = useState(null)
  const [loadErr, setLoadErr] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const f = useForm({ holder: '', number: '', expiry: '', cvc: '' }, v => ({
    holder: v.holder.trim().length < 3 ? 'Indique le nom inscrit sur la carte.' : '',
    number: rules.card(v.number),
    expiry: rules.expiry(v.expiry),
    cvc: /^\d{3}$/.test(v.cvc) ? '' : 'Le code contient 3 chiffres.',
  }))

  useEffect(() => {
    orderService.get(id).then(o => (o.status === 'paid' || o.status === 'picked_up' ? nav(`/orders/${id}`, { replace: true }) : setOrder(o))).catch(e => setLoadErr(errMsg(e)))
  }, [id, nav])

  if (loadErr) return <Empty emoji="🧾" title="Commande introuvable"><p>{loadErr}</p><Link to="/orders" className="btn pri">Mes commandes</Link></Empty>
  if (!order) return <div className="center"><Spinner /></div>

  const left = order.expiresAt ? Math.max(0, new Date(order.expiresAt) - now) : 0
  if (order.status === 'cancelled' || left === 0)
    return (
      <Empty emoji="⏳" title="Ta réservation a expiré">
        <p>Le panier n’a pas été payé dans les 10 minutes, il est de nouveau disponible pour les autres étudiants.</p>
        <Link to="/offers" className="btn pri">Refaire ma commande</Link>
      </Empty>
    )

  const digits = f.values.number.replace(/\D/g, '')
  const shown = Array.from({ length: 16 }, (_, i) => digits[i] || '•').join('').replace(/(.{4})/g, '$1 ').trim()
  const brand = digits[0] === '4' ? 'VISA' : digits[0] === '5' ? 'Mastercard' : 'Carte bancaire'

  const pay = f.submit(async v => {
    setBusy(true); setErr('')
    try {
      await orderService.pay(id, { number: v.number })
      nav(`/orders/${id}`, { replace: true, state: { paid: true } })
    } catch (e) { setErr(errMsg(e)); setBusy(false) }
  })
  const cancel = async () => { try { await orderService.cancel(id); toast('Réservation annulée.'); nav('/offers') } catch (e) { toast(errMsg(e), 'bad') } }

  return (
    <>
      <header className="page-head"><h1>Paiement</h1><p className="mut">Commande {order.code} chez {order.shopName}</p></header>
      <div className="split">
        <form className="pay-form" onSubmit={pay} noValidate>
          <div className="ccard" aria-hidden="true">
            <div className="cc-top"><span className="cc-chip" /><b>{brand}</b></div>
            <div className="cc-num">{shown}</div>
            <div className="cc-bot"><span>{f.values.holder || 'NOM DU TITULAIRE'}</span><span>{f.values.expiry || 'MM/AA'}</span></div>
          </div>
          {err && <div className="alert" role="alert"><Info size={16} />{err}</div>}
          <Field label="Nom sur la carte" autoComplete="cc-name" placeholder="Amine Ben Salah" {...f.bind('holder')} />
          <Field label="Numéro de carte" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" {...f.bind('number')} onChange={e => f.set('number', fmtNum(e.target.value))} />
          <div className="two">
            <Field label="Expiration" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" {...f.bind('expiry')} onChange={e => f.set('expiry', fmtExp(e.target.value))} />
            <Field label="Code (CVC)" inputMode="numeric" autoComplete="cc-csc" placeholder="123" {...f.bind('cvc')} onChange={e => f.set('cvc', e.target.value.replace(/\D/g, '').slice(0, 3))} />
          </div>
          <button className="btn pri block lg" disabled={busy}>{busy ? <><Spinner /> Paiement en cours…</> : `Payer ${money(order.total)}`}</button>
          <p className="note"><Lock size={14} /> Paiement sécurisé. {USE_MOCK && 'Mode démo : utilise la carte 4242 4242 4242 4242, n’importe quelle date future et 3 chiffres. La carte 4000 0000 0000 0002 simule un refus.'}</p>
        </form>

        <aside className="summary">
          <div className={`timer ${left < 120000 ? 'hot' : ''}`}>
            <span>Panier gardé pendant</span><b>{mmss(left)}</b>
            <div className="bar"><i style={{ width: `${(left / 600000) * 100}%` }} /></div>
          </div>
          <h2>Ta commande</h2>
          <ul className="lines">{order.items.map(i => <li key={i.title}><span>{i.qty} × {i.title}</span><b>{money(i.unitPrice * i.qty)}</b></li>)}</ul>
          <dl><div className="sum-total"><dt>Total</dt><dd>{money(order.total)}</dd></div></dl>
          <button className="link" onClick={cancel}>Annuler la réservation</button>
        </aside>
      </div>
    </>
  )
}
