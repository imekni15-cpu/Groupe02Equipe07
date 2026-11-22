import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingBag, Sun, Moon, LogOut, Store, Ticket, LayoutDashboard, User } from 'lucide-react'
import { useAuth, useCart, useUi, cartCount } from '../store'
import { Arch, Toasts } from './ui'
import { roleHome } from './Guards'

const LINKS = [['/offers', 'Offres', Store], ['/orders', 'Commandes', Ticket], ['/dashboard', 'Bilan', LayoutDashboard]]
const TABS = [['/offers', 'Offres', Store], ['/cart', 'Panier', ShoppingBag], ['/orders', 'Commandes', Ticket], ['/dashboard', 'Bilan', LayoutDashboard], ['/profile', 'Profil', User]]

export default function Layout() {
  const { user, logout } = useAuth()
  const count = useCart(cartCount)
  const { theme, toggleTheme } = useUi()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const student = user?.role === 'student'

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  const out = () => { logout(); useCart.getState().clear(); nav('/') }

  return (
    <div className="app">
      <a className="skip" href="#main">Aller au contenu</a>
      <header className="nav">
        <Link to={user ? roleHome(user.role) : '/'} className="brand">
          <span className="mark"><Arch size={18} /></span>
          Campus<b>Save</b>
        </Link>

        {student && (
          <nav className="nav-links" aria-label="Navigation principale">
            {LINKS.map(([to, l]) => <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'on' : '')}>{l}</NavLink>)}
          </nav>
        )}

        <div className="nav-end">
          <button className="icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {student && (
            <Link to="/cart" className="icon-btn" aria-label={`Panier, ${count} article${count > 1 ? 's' : ''}`}>
              <ShoppingBag size={18} />
              {count > 0 && <span className="badge" key={count}>{count}</span>}
            </Link>
          )}
          {user ? (
            <>
              <Link to={student ? '/profile' : roleHome(user.role)} className="avatar" title={user.name}>{user.name[0]}</Link>
              <button className="icon-btn" onClick={out} aria-label="Se déconnecter"><LogOut size={18} /></button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn ghost sm">Connexion</Link>
              <Link to="/register" className="btn pri sm">Créer un compte</Link>
            </>
          )}
        </div>
      </header>

      <main id="main" className="page"><Outlet /></main>

      {student && (
        <nav className="tabbar" aria-label="Navigation mobile">
          {TABS.map(([to, l, Icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'on' : '')}>
              <span className="tab-ic"><Icon size={20} />{to === '/cart' && count > 0 && <span className="badge">{count}</span>}</span>
              {l}
            </NavLink>
          ))}
        </nav>
      )}
      <Toasts />
    </div>
  )
}
