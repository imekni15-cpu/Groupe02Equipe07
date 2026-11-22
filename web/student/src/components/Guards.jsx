import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../store'

export const roleHome = r => ({ student: '/dashboard', merchant: '/merchant', admin: '/admin' }[r] || '/')

/* Protège un groupe de routes par rôle */
export function RequireRole({ roles }) {
  const user = useAuth(s => s.user)
  const loc = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (!roles.includes(user.role)) return <Navigate to={roleHome(user.role)} replace />
  return <Outlet />
}

/* Pages publiques réservées aux visiteurs (login, inscription) */
export function GuestOnly() {
  const user = useAuth(s => s.user)
  const loc = useLocation()
  if (user) return <Navigate to={loc.state?.from && user.role === 'student' ? loc.state.from : roleHome(user.role)} replace />
  return <Outlet />
}
