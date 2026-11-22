import { Component, useEffect, useId, useMemo } from 'react'
import { X } from 'lucide-react'
import { useUi } from '../store'
import { STATUS, itemEmoji } from '../utils/format'

/* Logo : l'arche des portes de Sidi Bou Saïd */
export const Arch = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 22V11a8 8 0 0 1 16 0v11z" fill="currentColor" />
    <circle cx="12" cy="13" r="2.4" fill="var(--citron)" />
  </svg>
)

export const Spinner = () => <span className="spin" role="status" aria-label="Chargement" />

export function Field({ label, error, hint, right, as: Tag = 'input', children, ...p }) {
  const id = useId()
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="control">
        <Tag id={id} aria-invalid={!!error} aria-describedby={error || hint ? `${id}-m` : undefined} {...p}>
          {children}
        </Tag>
        {right}
      </div>
      {error ? <p id={`${id}-m`} className="err" role="alert">{error}</p> : hint ? <p id={`${id}-m`} className="hint">{hint}</p> : null}
    </div>
  )
}

export function Modal({ open, onClose, label, children }) {
  useEffect(() => {
    if (!open) return
    const k = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-back" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={label}>
        <button className="icon-btn modal-x" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        {children}
      </div>
    </div>
  )
}

export function Toasts() {
  const { toasts, dismiss } = useUi()
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map(t => (
        <button key={t.id} className={`toast ${t.type}`} onClick={() => dismiss(t.id)}>
          <span>{t.type === 'ok' ? '✅' : t.type === 'warn' ? '⚠️' : '⛔'}</span>{t.message}
        </button>
      ))}
    </div>
  )
}

export const StatusBadge = ({ o }) => {
  const s = STATUS[o.status] || STATUS.cancelled
  return <span className={`status ${s.tone}`}><i />{o.status === 'cancelled' && o.expired ? 'Expirée' : s.label}</span>
}

export function Confetti() {
  const bits = useMemo(
    () => Array.from({ length: 42 }, (_, i) => ({
      left: Math.random() * 100, delay: Math.random() * 0.6, dur: 1.8 + Math.random() * 1.6,
      x: (Math.random() - 0.5) * 200, r: Math.random() * 720, c: ['#2447F5', '#FFD23F', '#FF4A2E', '#B9F0D8'][i % 4],
    })),
    []
  )
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <i key={i} style={{ left: `${b.left}%`, background: b.c, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`, '--x': `${b.x}px`, '--r': `${b.r}deg` }} />
      ))}
    </div>
  )
}

export const Empty = ({ emoji, title, children }) => (
  <div className="empty">
    <span className="empty-emoji">{emoji}</span>
    <h2>{title}</h2>
    <div>{children}</div>
  </div>
)

/* Miniature d'une ligne de commande : vraie photo si disponible, sinon emoji */
export const Thumb = ({ item, className = 'o-emoji' }) => (
  <span className={className}>{item?.photoUrl ? <img src={item.photoUrl} alt="" loading="lazy" decoding="async" /> : itemEmoji(item)}</span>
)

export class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error) { console.error(error) }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="page"><Empty emoji="🛠️" title="Oups, quelque chose s’est mal passé">
        <p>Une erreur inattendue est survenue. Tes données sont en sécurité : recharge la page pour continuer.</p>
        <button className="btn pri" onClick={() => window.location.reload()}>Recharger la page</button>
      </Empty></div>
    )
  }
}
