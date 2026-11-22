import { Link } from 'react-router-dom'
import { Empty } from '../components/ui'
import { useAuth, useCart } from '../store'

export const NotFound = () => (
  <Empty emoji="🧭" title="Page introuvable">
    <p>Ce lien ne mène nulle part. Retourne à l’accueil pour retrouver ton chemin.</p>
    <Link to="/" className="btn pri">Retour à l’accueil</Link>
  </Empty>
)

/* L'API d'administration est complète (/api/admin/*, contrat v1). L'interface admin est livrée par l'équipe P4. */
export function Handoff() {
  const logout = useAuth(s => s.logout)
  return (
    <Empty emoji="🛡️" title="Espace administration">
      <p>L’API d’administration est prête (commerces, utilisateurs, statistiques). L’interface admin est fournie par l’équipe P4 : connecte-la sur <span className="mono">/api/admin</span>.</p>
      <button className="btn pri" onClick={() => { logout(); useCart.getState().clear() }}>Changer de compte</button>
    </Empty>
  )
}
