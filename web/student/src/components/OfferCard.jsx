import { useState } from 'react'
import { Clock, MapPin, Minus, Plus } from 'lucide-react'
import { Modal } from './ui'
import { CAT, money, pct } from '../utils/format'

const stockLabel = q => (q <= 0 ? 'Épuisé' : q <= 3 ? `Plus que ${q}` : `${q} disponibles`)

export function OfferCard({ o, onOpen, onAdd }) {
  const c = CAT[o.category] || CAT.Autre
  const out = o.quantity <= 0
  return (
    <article className={`offer ${out ? 'out' : ''}`} onClick={() => onOpen(o)} tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpen(o)} aria-label={`${o.title}, ${money(o.discountPrice)}`}>
      <div className="offer-art" style={{ '--h': c.hue }}>
        {o.photoUrl ? <img src={o.photoUrl} alt="" /> : <span className="emoji">{c.emoji}</span>}
        <span className="sticker">−{pct(o)}%</span>
      </div>
      <div className="offer-body">
        <span className={`stock ${o.quantity > 0 && o.quantity <= 3 ? 'low' : ''}`}>{stockLabel(o.quantity)}</span>
        <h3>{o.title}</h3>
        <p className="shop"><MapPin size={13} /> {o.shopName}</p>
        <p className="meta"><Clock size={13} /> Retrait de {o.pickupStart} à {o.pickupEnd}</p>
        <div className="price-row">
          <div className="price"><strong>{money(o.discountPrice)}</strong><s>{money(o.originalPrice)}</s></div>
          <button className="add" disabled={out} aria-label={`Ajouter ${o.title} au panier`}
            onClick={e => { e.stopPropagation(); onAdd(o, 1) }}><Plus size={20} /></button>
        </div>
      </div>
    </article>
  )
}

export function OfferModal({ o, onClose, onAdd }) {
  const [qty, setQty] = useState(1)
  if (!o) return null
  const c = CAT[o.category] || CAT.Autre
  return (
    <Modal open onClose={onClose} label={o.title}>
      <div className="modal-art" style={{ '--h': c.hue }}>
        {o.photoUrl ? <img src={o.photoUrl} alt="" /> : <span>{c.emoji}</span>}
        <span className="sticker">−{pct(o)}%</span>
      </div>
      <span className="chip static">{o.category}</span>
      <h2>{o.title}</h2>
      <p className="mut">{o.description}</p>
      <ul className="facts">
        <li><MapPin size={16} /><span><b>{o.shopName}</b><small>{o.shopType}, {o.shopAddress}</small></span></li>
        <li><Clock size={16} /><span><b>Retrait de {o.pickupStart} à {o.pickupEnd}</b><small>{stockLabel(o.quantity)}</small></span></li>
      </ul>
      <div className="buy">
        <div className="stepper">
          <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Moins"><Minus size={16} /></button>
          <b>{qty}</b>
          <button onClick={() => setQty(q => Math.min(o.quantity, q + 1))} aria-label="Plus"><Plus size={16} /></button>
        </div>
        <button className="btn pri lg grow" disabled={o.quantity <= 0} onClick={() => { onAdd(o, qty); onClose() }}>
          Ajouter, {money(o.discountPrice * qty)}
        </button>
      </div>
    </Modal>
  )
}
