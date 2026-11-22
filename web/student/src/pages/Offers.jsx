import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ShoppingBag, SlidersHorizontal } from 'lucide-react'
import { OfferCard, OfferModal } from '../components/OfferCard'
import { Empty, Modal } from '../components/ui'
import { offerService } from '../services/offerService'
import { errMsg } from '../api/http'
import { useCart, useUi, cartCount, cartTotal } from '../store'
import { CATEGORIES, CAT, SHOP_TYPES, money, pct } from '../utils/format'

const SORTS = { best: 'Meilleure remise', price: 'Prix croissant', soon: 'Fin de retrait proche' }

export default function Offers() {
  const [offers, setOffers] = useState(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Tous')
  const [type, setType] = useState('Tous')
  const [max, setMax] = useState(null)
  const [sort, setSort] = useState('best')
  const [avail, setAvail] = useState(false)
  const [open, setOpen] = useState(null)
  const [conflict, setConflict] = useState(null)
  const { add, replaceWith, shop } = useCart()
  const count = useCart(cartCount)
  const total = useCart(s => cartTotal(s.items))
  const toast = useUi(s => s.toast)

  useEffect(() => { offerService.list().then(setOffers).catch(e => setError(errMsg(e))) }, [])

  const ceil = offers ? Math.ceil(Math.max(...offers.map(o => o.discountPrice))) : 10
  const cap = max ?? ceil
  const dirty = q || cat !== 'Tous' || type !== 'Tous' || cap < ceil || avail

  const list = useMemo(() => {
    if (!offers) return []
    const s = q.trim().toLowerCase()
    const by = { best: (a, b) => pct(b) - pct(a), price: (a, b) => a.discountPrice - b.discountPrice, soon: (a, b) => a.pickupEnd.localeCompare(b.pickupEnd) }
    return offers
      .filter(o => (cat === 'Tous' || o.category === cat) && (type === 'Tous' || o.shopType === type) && o.discountPrice <= cap
        && (!avail || o.quantity > 0) && (!s || [o.title, o.shopName, o.description, o.category].join(' ').toLowerCase().includes(s)))
      .sort((a, b) => (a.quantity <= 0) - (b.quantity <= 0) || by[sort](a, b))
  }, [offers, q, cat, type, cap, sort, avail])

  const reset = () => { setQ(''); setCat('Tous'); setType('Tous'); setMax(null); setAvail(false) }

  const handleAdd = (o, qty = 1) => {
    const r = add(o, qty)
    if (r === 'conflict') setConflict({ o, qty })
    else if (r === 'max') toast('Tu as déjà pris tout le stock disponible de cette offre.', 'warn')
    else toast(`${o.title} ajouté au panier.`)
  }

  return (
    <>
      <header className="page-head">
        <h1>Offres du jour</h1>
        <p className="mut">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}. Stock en temps réel.</p>
      </header>

      <div className="toolbar">
        <label className="search">
          <Search size={18} />
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Chercher un plat, un commerce…" aria-label="Rechercher une offre" />
        </label>
        <div className="chips" role="group" aria-label="Catégories">
          {['Tous', ...CATEGORIES].map(c => (
            <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)} aria-pressed={cat === c}>
              {c !== 'Tous' && <span>{CAT[c].emoji}</span>}{c}
            </button>
          ))}
        </div>
        <div className="filters">
          <SlidersHorizontal size={16} aria-hidden="true" />
          <select value={type} onChange={e => setType(e.target.value)} aria-label="Type de commerce">
            <option value="Tous">Tous les commerces</option>
            {SHOP_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <label className="range">Jusqu’à <b>{money(cap)}</b>
            <input type="range" min="1" max={ceil} step="0.5" value={cap} onChange={e => setMax(+e.target.value)} />
          </label>
          <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Trier">
            {Object.entries(SORTS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <label className="switch"><input type="checkbox" checked={avail} onChange={e => setAvail(e.target.checked)} /><span />En stock seulement</label>
          {dirty && <button className="link" onClick={reset}>Réinitialiser</button>}
        </div>
      </div>

      {error && <div className="alert" role="alert">{error}</div>}
      {!offers && !error && <div className="grid">{Array.from({ length: 8 }, (_, i) => <div key={i} className="sk offer-sk" />)}</div>}
      {offers && (
        <>
          <p className="count" aria-live="polite">{list.length} offre{list.length > 1 ? 's' : ''}</p>
          {list.length ? (
            <div className="grid">{list.map(o => <OfferCard key={o.id} o={o} onOpen={setOpen} onAdd={handleAdd} />)}</div>
          ) : (
            <Empty emoji="🔎" title="Aucune offre ne correspond">
              <p>Élargis ta recherche ou retire un filtre.</p>
              <button className="btn pri" onClick={reset}>Réinitialiser les filtres</button>
            </Empty>
          )}
        </>
      )}

      {count > 0 && (
        <Link to="/cart" className="cartbar">
          <ShoppingBag size={20} /><span>{count} article{count > 1 ? 's' : ''} chez {shop?.name}</span><b>{money(total)}</b>
          <span className="btn lime sm">Voir mon panier</span>
        </Link>
      )}

      <OfferModal key={open?.id} o={open} onClose={() => setOpen(null)} onAdd={handleAdd} />

      <Modal open={!!conflict} onClose={() => setConflict(null)} label="Changer de commerce">
        {conflict && (
          <div className="col">
            <h2>Changer de commerce ?</h2>
            <p className="mut">Ton panier contient déjà des articles de <b>{shop?.name}</b>. Une commande ne concerne qu’un seul commerce : on le vide pour ajouter « {conflict.o.title} » de {conflict.o.shopName} ?</p>
            <div className="row">
              <button className="btn ghost" onClick={() => setConflict(null)}>Garder mon panier</button>
              <button className="btn pri" onClick={() => { replaceWith(conflict.o, conflict.qty); toast(`${conflict.o.title} ajouté au panier.`); setConflict(null) }}>Vider et ajouter</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
