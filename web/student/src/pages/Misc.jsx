import { Link } from 'react-router-dom'
import { Empty } from '../components/ui'
import { useAuth, useCart } from '../store'

export const NotFound = () => (
  <Empty emoji="🧭" title="Page introuvable">
    <p>Ce lien ne mène nulle part. Retourne à l’accueil pour retrouver ton chemin.</p>
    <Link to="/" className="btn pri">Retour à l’accueil</Link>
  </Empty>
)

/* Les espaces commerçant et admin sont fournis par l'interface P4 : ici, simple relais protégé par rôle */
export function Handoff({ role }) {
  const logout = useAuth(s => s.logout)
  return (
    <Empty emoji={role === 'merchant' ? '🏪' : '🛡️'} title={role === 'merchant' ? 'Espace commerçant' : 'Espace administration'}>
      <p>Ton compte n’est pas un compte étudiant : cet espace est géré par l’interface {role === 'merchant' ? 'commerçant' : 'administrateur'} (Personne 4).</p>
      <button className="btn pri" onClick={() => { logout(); useCart.getState().clear() }}>Changer de compte</button>
    </Empty>
  )
}
