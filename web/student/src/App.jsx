import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { RequireRole, GuestOnly } from './components/Guards'
import { useAuth, useUi } from './store'
import { authService } from './services/authService'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Offers from './pages/Offers'
import Cart from './pages/Cart'
import Pay from './pages/Pay'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import { NotFound, Handoff } from './pages/Misc'

export default function App() {
  const theme = useUi(s => s.theme)
  const token = useAuth(s => s.token)
  const { setUser, logout } = useAuth.getState()

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])

  // Au chargement : on revalide la session (compte désactivé, token expiré…)
  useEffect(() => {
    if (!token) return
    authService.me().then(setUser).catch(e => { if ((e.status ?? e.response?.status) === 401) logout() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />

        <Route element={<GuestOnly />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<RequireRole roles={['student']} />}>
          <Route path="/offers" element={<Offers />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/pay/:id" element={<Pay />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route element={<RequireRole roles={['merchant']} />}>
          <Route path="/merchant/*" element={<Handoff role="merchant" />} />
        </Route>
        <Route element={<RequireRole roles={['admin']} />}>
          <Route path="/admin/*" element={<Handoff role="admin" />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
