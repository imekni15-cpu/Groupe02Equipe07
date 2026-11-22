import { useEffect, useMemo, useState } from 'react'
import { Check, Info, ScanLine, Store } from 'lucide-react'
import { Spinner, StatusBadge, Thumb } from '../components/ui'
import MerchantOffers from '../components/MerchantOffers'
import { orderService, shopService } from '../services'
import { errMsg } from '../api/http'
import { useUi } from '../store'
import { fmtTime, money } from '../utils/format'

/* Console commerçant : valide le retrait en saisissant (ou en scannant) le code du QR de l'étudiant */
export default function Merchant() {
  const toast = useUi(s => s.toast)
  const [shop, setShop] = useState(null)
  const [orders, setOrders] = useState(null)
  const [code, setCode] = useState('')
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState('paid')
  const [view, setView] = useState('orders') // 'orders' | 'offers'

  const load = () => { shopService.mine().then(setShop).catch(() => {}); orderService.mine().then(setOrders).catch(() => setOrders([])) }
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t) }, [])

  const validate = async c => {
    if (!c.trim() || busy) return
    setBusy(true); setRes(null)
    try {
      const o = await orderService.validate(c)
      setRes({ ok: true, msg: `${o.code} validée. À remettre à ${o.studentName} : ${o.items.map(i => `${i.qty} × ${i.title}`).join(', ')}` })
      setCode(''); toast('Retrait validé.'); load()
    } catch (e) { setRes({ ok: false, msg: errMsg(e) }) } finally { setBusy(false) }
  }

  const s = useMemo(() => {
    const l = orders || []
    return { toPick: l.filter(o => o.status === 'paid').length, done: l.filter(o => o.status === 'picked_up').length, revenue: l.filter(o => o.status === 'picked_up').reduce((n, o) => n + o.total, 0) }
  }, [orders])
  const list = (orders || []).filter(o => (tab === 'paid' ? o.status === 'paid' : o.status === 'picked_up')).slice(0, 30)

  return (
    <>
      <header className="page-head">
        <h1>Console commerçant</h1>
        <p className="mut"><Store size={15} className="inl" /> {shop ? `${shop.name}, ${shop.address}` : 'Chargement…'}</p>
      </header>

      {shop && shop.status !== 'approved' && (
        <div className="alert" role="status"><Info size={16} />{shop.status === 'rejected' ? 'Ton commerce a été refusé par l’administration.' : 'Ton commerce est en attente de validation par l’administration. Tu pourras publier des offres dès qu’il sera validé.'}</div>
      )}
      <div className="tabs" role="tablist">
        {[['orders', 'Commandes'], ['offers', 'Mes offres']].map(([k, l]) => <button key={k} role="tab" aria-selected={view === k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>{l}</button>)}
      </div>
      {view === 'offers' ? <MerchantOffers canPublish={shop?.status === 'approved'} /> : (
      <>
      <div className="m-grid">
        <section className="validate">
          <h2><ScanLine size={22} /> Valider un retrait</h2>
          <p className="mut">Demande le QR code à l’étudiant et saisis le code qu’il affiche (ex. CS-1008).</p>
          <form onSubmit={e => { e.preventDefault(); validate(code) }} className="vform">
            <input className="vcode mono" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="CS-1008" aria-label="Code de la commande" autoComplete="off" autoFocus />
            <button className="btn pri lg" disabled={busy || !code.trim()}>{busy ? <Spinner /> : 'Valider'}</button>
          </form>
          {res && <div className={`result ${res.ok ? 'ok' : 'bad'}`} role="alert">{res.ok ? <Check size={18} /> : <Info size={18} />}<span>{res.msg}</span></div>}
        </section>

        <section className="m-stats">
          <div><strong>{s.toPick}</strong><span>à récupérer</span></div>
          <div><strong>{s.done}</strong><span>récupérées</span></div>
          <div><strong>{money(s.revenue)}</strong><span>encaissé</span></div>
        </section>
      </div>

      <div className="tabs" role="tablist">
        {[['paid', 'À récupérer'], ['done', 'Récupérées']].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {!orders && <div className="center"><Spinner /></div>}
      {orders && !list.length && <p className="mut">Aucune commande dans cette liste.</p>}
      <ul className="col">
        {list.map(o => (
          <li key={o.id} className="order static">
            <Thumb item={o.items[0]} />
            <div className="o-main">
              <div className="o-top"><b className="mono">{o.code}</b><StatusBadge o={o} /></div>
              <p>{o.studentName}, {o.items.map(i => `${i.qty} × ${i.title}`).join(', ')}</p>
              <small>Commandée à {fmtTime(o.createdAt)}, retrait {o.pickupStart} à {o.pickupEnd}</small>
            </div>
            <div className="o-end"><strong>{money(o.total)}</strong>{o.status === 'paid' && <button className="mini-cta" onClick={() => validate(o.code)}>Valider</button>}</div>
          </li>
        ))}
      </ul>
    </>
      )}
    </>
  )
}
