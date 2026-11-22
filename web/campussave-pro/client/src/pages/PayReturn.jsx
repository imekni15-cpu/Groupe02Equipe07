import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Empty, Spinner } from '../components/ui'
import { orderService } from '../services'
import { errMsg } from '../api/http'

/* Page de retour de Konnect. Konnect renvoie l'étudiant ici avec ?payment_ref=…
   Le serveur interroge Konnect : seule sa réponse valide la commande (l'URL ne prouve rien). */
export default function PayReturn() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const [err, setErr] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const ref = params.get('payment_ref')
    if (!ref) { setErr('Référence de paiement manquante.'); return }
    orderService.confirmPayment(id, ref)
      .then(() => nav(`/orders/${id}`, { replace: true, state: { paid: true } }))
      .catch(e => setErr(errMsg(e)))
  }, [id, params, nav])

  if (err)
    return (
      <Empty emoji="⚠️" title="Paiement non confirmé">
        <p>{err}</p>
        <Link to={`/pay/${id}`} className="btn pri">Réessayer le paiement</Link>
        <Link to="/orders" className="btn ghost">Mes commandes</Link>
      </Empty>
    )
  return <div className="center"><Spinner /><p className="mut">Vérification de ton paiement auprès de Konnect…</p></div>
}
