import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Moon, Search } from 'lucide-react'
import { useAuth, useUi } from '../store'
import { offerService } from '../services'
import { CAT, money } from '../utils/format'

/* Palette de commandes (Ctrl/⌘ + K) : navigation et recherche d'offres au clavier */
export default function CommandPalette() {
  const { paletteOpen: open, setPalette, toggleTheme } = useUi()
  const user = useAuth(s => s.user)
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [offers, setOffers] = useState([])
  const [i, setI] = useState(0)

  useEffect(() => {
    const k = e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(!useUi.getState().paletteOpen) } }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [setPalette])
  useEffect(() => {
    if (!open) return
    setQ(''); setI(0)
    offerService.list().then(setOffers).catch(() => {})
  }, [open])

  const items = useMemo(() => {
    const go = to => () => nav(to)
    const pages = [
      { id: 'p-offers', label: 'Voir les offres du jour', hint: 'Page', run: go('/offers') },
      { id: 'p-cart', label: 'Ouvrir mon panier', hint: 'Page', run: go('/cart') },
      ...(user?.role === 'student' ? [
        { id: 'p-orders', label: 'Mes commandes', hint: 'Page', run: go('/orders') },
        { id: 'p-dash', label: 'Mon bilan anti-gaspi', hint: 'Page', run: go('/dashboard') },
        { id: 'p-profile', label: 'Mon profil et sécurité', hint: 'Page', run: go('/profile') },
      ] : user ? [] : [
        { id: 'p-login', label: 'Me connecter', hint: 'Compte', run: go('/login') },
        { id: 'p-reg', label: 'Créer un compte', hint: 'Compte', run: go('/register') },
      ]),
      { id: 'p-theme', label: 'Changer de thème (clair / sombre)', hint: 'Action', icon: <Moon size={16} />, run: toggleTheme },
    ]
    const s = q.trim().toLowerCase()
    const found = offers.filter(o => s && [o.title, o.shopName, o.category].join(' ').toLowerCase().includes(s)).slice(0, 6)
      .map(o => ({ id: `o${o.id}`, label: o.title, hint: `${o.shopName}, ${money(o.discountPrice)}`, emoji: CAT[o.category]?.emoji, run: go(`/offers?open=${o.id}`) }))
    return [...found, ...pages.filter(p => !s || p.label.toLowerCase().includes(s))]
  }, [q, offers, user, nav, toggleTheme])

  if (!open) return null
  const close = () => setPalette(false)
  const pick = it => { close(); it?.run() }
  const onKey = e => {
    if (e.key === 'Escape') close()
    if (e.key === 'ArrowDown') { e.preventDefault(); setI(x => Math.min(items.length - 1, x + 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setI(x => Math.max(0, x - 1)) }
    if (e.key === 'Enter') pick(items[i])
  }

  return (
    <div className="modal-back top" onMouseDown={e => e.target === e.currentTarget && close()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Palette de commandes">
        <label className="palette-in"><Search size={18} />
          <input autoFocus value={q} onChange={e => { setQ(e.target.value); setI(0) }} onKeyDown={onKey} placeholder="Chercher une offre ou une page…" aria-label="Rechercher" />
          <kbd>Échap</kbd>
        </label>
        <ul role="listbox">
          {items.map((it, k) => (
            <li key={it.id} role="option" aria-selected={k === i}>
              <button className={k === i ? 'on' : ''} onMouseEnter={() => setI(k)} onClick={() => pick(it)}>
                <span className="pi">{it.emoji || it.icon || <CornerDownLeft size={16} />}</span>
                <span className="grow">{it.label}</span><small>{it.hint}</small>
              </button>
            </li>
          ))}
          {!items.length && <li className="palette-empty">Aucun résultat pour « {q} »</li>}
        </ul>
      </div>
    </div>
  )
}
