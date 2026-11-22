import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { RequireRole, GuestOnly } from './components/Guards'
import { Spinner } from './components/ui'
import { useAuth, useUi } from './store'
import { authService } from './services'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Offers from './pages/Offers'
import Cart from './pages/Cart'
import { NotFound, Handoff } from './pages/Misc'

// Pages privées chargées à la demande (démarrage plus rapide)
const Pay = lazy(() => import('./pages/Pay'))
const PayReturn = lazy(() => import('./pages/PayReturn'))
const Orders = lazy(() => import('./pages/Orders'))
const OrderDetail = lazy(() => import('./pages/OrderDetail'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const Merchant = lazy(() => import('./pages/Merchant'))

export default function App() {
  const theme = useUi(s => s.theme)
  const token = useAuth(s => s.token)

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  // Au chargement : on revalide la session auprès du serveur (compte désactivé, jeton expiré…)
  useEffect(() => {
    if (!token) return
    authService.me().then(useAuth.getState().setUser).catch(() => {})
  }, [token])

  return (
    <Suspense fallback={<div className="center"><Spinner /></div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/cart" element={<Cart />} />

          <Route element={<GuestOnly />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<RequireRole roles={['student']} />}>
            <Route path="/pay/:id" element={<Pay />} />
            <Route path="/pay/:id/return" element={<PayReturn />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route element={<RequireRole roles={['merchant']} />}>
            <Route path="/merchant" element={<Merchant />} />
          </Route>
          <Route element={<RequireRole roles={['admin']} />}>
            <Route path="/admin/*" element={<Handoff role="admin" />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
