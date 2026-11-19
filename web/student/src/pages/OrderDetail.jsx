import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Clock, Copy, Lock, MapPin, X } from 'lucide-react'
import { Confetti, Empty, Spinner, StatusBadge } from '../components/ui'
import { useNow } from '../hooks'
import { orderService } from '../services/orderService'
import { errMsg, USE_MOCK } from '../api/http'
import { useUi } from '../store'
import { fmtDate, itemEmoji, money, slotState } from '../utils/format'

export default function OrderDetail() {
  const { id } = useParams()
  const { state } = useLocation()
  const toast = useUi(s => s.toast)
  const now = useNow(1000)
  const [o, setO] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let on = true
    const load = () => orderService.get(id).then(x => on && setO(x)).catch(e => on && setErr(errMsg(e)))
    load()
    const t = setInterval(load, 8000)
    return () => { on = false; clearInterval(t) }
  }, [id])

  if (err) return <Empty emoji="🧾" title="Commande introuvable"><p>{err}</p><Link to="/orders" className="btn pri">Mes commandes</Link></Empty>
  if (!o) return <div className="center"><Spinner /></div>

  const act = async fn => { try { setO(await fn()) } catch (e) { toast(errMsg(e), 'bad') } }
  const copy = () => { navigator.clipboard?.writeText(o.code); toast('Code copié.') }
  const idx = { pending: 0, paid: 1, picked_up: 2 }[o.status] ?? -1
  const slot = o.status === 'paid' ? slotState(o, now) : null
  const live = o.status === 'paid' || o.status === 'picked_up'

  return (
    <>
      {state?.paid && <Confetti />}
      <header className="page-head">
        <h1>{state?.paid ? 'Paiement confirmé' : `Commande ${o.code}`}</h1>
        <p className="mut">{state?.paid ? 'Présente ce QR code au commerçant pendant le créneau de retrait.' : `Passée le ${fmtDate(o.createdAt)}`}</p>
      </header>

      {idx >= 0 && (
        <ol className="track" aria-label="Suivi de la commande">
          {['Réservée', 'Payée', 'Récupérée'].map((l, i) => (
            <li key={l} className={i <= idx ? 'done' : ''}><span>{i <= idx ? <Check size={14} /> : i + 1}</span>{l}</li>
          ))}
        </ol>
      )}

      <div className="pass-wrap">
        <article className={`pass ${o.status}`}>
          <div className="pass-main">
            <div className="row between"><span className="mono">{o.code}</span><StatusBadge o={o} /></div>
            <h2>{o.shopName || 'Commerce'}</h2>
            {o.shopAddress && <p className="mut addr"><MapPin size={15} /> {o.shopAddress}</p>}
            <ul className="lines">
              {o.items.map(i => <li key={i.title}><span>{itemEmoji(i)} {i.qty} × {i.title}</span><b>{money((i.unitPrice ?? 0) * i.qty)}</b></li>)}
            </ul>
            <div className="pass-meta">
              <div><small>Retrait</small><b>{o.pickupStart} à {o.pickupEnd}</b></div>
              <div><small>Total</small><b>{money(o.total)}</b></div>
              <div><small>Étudiant</small><b>{o.studentName}</b></div>
            </div>
            {slot && <p className={`slot ${slot.phase}`}><Clock size={16} /> {slot.label}</p>}
            {o.status === 'picked_up' && <p className="slot done"><Check size={16} /> Récupérée, bon appétit.</p>}
          </div>
          <div className="pass-qr">
            {live ? (
              <>
                <div className={`qr ${o.status === 'picked_up' ? 'dim' : ''}`}><QRCodeSVG value={o.code} size={168} level="M" bgColor="#ffffff" fgColor="#0A1747" /></div>
                <button className="copy" onClick={copy}><span className="mono">{o.code}</span><Copy size={14} /></button>
              </>
            ) : o.status === 'pending' ? (
              <><Lock size={30} /><p>Le QR code apparaît après le paiement.</p><Link to={`/pay/${o.id}`} className="btn lime">Payer maintenant</Link></>
            ) : (
              <><X size={30} /><p>{o.expired ? 'Réservation expirée.' : 'Commande annulée.'}</p></>
            )}
          </div>
        </article>
      </div>

      <div className="row actions">
        <Link to="/orders" className="btn ghost">Toutes mes commandes</Link>
        {o.status === 'pending' && <button className="btn ghost danger" onClick={() => act(() => orderService.cancel(o.id))}>Annuler la réservation</button>}
        {USE_MOCK && o.status === 'paid' && <button className="btn lime" onClick={() => act(() => orderService.simulatePickup(o.id))}>Démo : simuler le scan du commerçant</button>}
      </div>
    </>
  )
}
