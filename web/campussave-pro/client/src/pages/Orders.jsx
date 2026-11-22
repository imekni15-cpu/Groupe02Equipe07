import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { QrCode } from 'lucide-react'
import { Empty, StatusBadge, Thumb } from '../components/ui'
import { useNow } from '../hooks'
import { orderService } from '../services'
import { errMsg } from '../api/http'
import { fmtDate, fmtTime, mmss, money } from '../utils/format'

const TABS = [['all', 'Toutes'], ['active', 'En cours'], ['done', 'Récupérées'], ['cancelled', 'Annulées']]
const match = { all: () => true, active: o => ['pending', 'paid'].includes(o.status), done: o => o.status === 'picked_up', cancelled: o => o.status === 'cancelled' }

export default function Orders() {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')
  const now = useNow(1000)

  // Suivi : on rafraîchit toutes les 10 s pour voir le retrait validé par le commerçant
  useEffect(() => {
    let on = true
    const load = () => orderService.mine().then(o => on && setOrders(o)).catch(e => on && setError(errMsg(e)))
    load()
    const t = setInterval(load, 10000)
    return () => { on = false; clearInterval(t) }
  }, [])

  const list = (orders || []).filter(match[tab])

  return (
    <>
      <header className="page-head"><h1>Mes commandes</h1><p className="mut">Le statut se met à jour tout seul.</p></header>
      <div className="tabs" role="tablist">
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {l}{orders && <small>{orders.filter(match[k]).length}</small>}
          </button>
        ))}
      </div>
      {error && <div className="alert" role="alert">{error}</div>}
      {!orders && !error && <div className="col">{[0, 1, 2].map(i => <div key={i} className="sk row-sk" />)}</div>}
      {orders && !list.length && (
        <Empty emoji="🧾" title={tab === 'all' ? 'Aucune commande pour l’instant' : 'Rien dans cette liste'}>
          <p>Ta première commande apparaîtra ici avec son QR code.</p>
          <Link to="/offers" className="btn pri">Voir les offres</Link>
        </Empty>
      )}
      <ul className="col">
        {list.map(o => (
          <li key={o.id}>
            <Link to={o.status === 'pending' ? `/pay/${o.id}` : `/orders/${o.id}`} className="order">
              <Thumb item={o.items[0]} />
              <div className="o-main">
                <div className="o-top"><b>{o.shopName || 'Commerce'}</b><StatusBadge o={o} /></div>
                <p>{o.items.map(i => `${i.qty} × ${i.title}`).join(', ')}</p>
                <small>Commande <span className="mono">{o.code}</span>, le {fmtDate(o.createdAt)} à {fmtTime(o.createdAt)}</small>
              </div>
              <div className="o-end">
                <strong>{money(o.total)}</strong>
                {o.status === 'paid' && <span className="mini-cta"><QrCode size={14} /> Voir le QR</span>}
                {o.status === 'pending' && o.expiresAt && <span className="mini-cta warn">Payer, {mmss(new Date(o.expiresAt) - now)}</span>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
