import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Info } from 'lucide-react'
import { Field, Spinner, Arch } from '../components/ui'
import { useForm } from '../hooks'
import { rules } from '../utils/validators'
import { authService } from '../services/authService'
import { errMsg } from '../api/http'
import { useAuth, useUi } from '../store'

const DEMOS = [['🎓 Étudiant', 'amine@essect.tn'], ['🏪 Commerçant', 'm@cafe.tn'], ['🛡️ Admin', 'admin@campussave.tn']]

export default function Login() {
  const setSession = useAuth(s => s.setSession)
  const toast = useUi(s => s.toast)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)
  const f = useForm({ email: '', password: '' }, v => ({
    email: rules.email(v.email),
    password: v.password ? '' : 'Indique ton mot de passe.',
  }))

  // Après setSession, <GuestOnly> redirige vers la page d'origine ou l'accueil du rôle
  const go = f.submit(async v => {
    setBusy(true); setErr('')
    try {
      const { token, user } = await authService.login(v)
      setSession(user, token)
      toast(`Content de te revoir, ${user.name.split(' ')[0]}.`)
    } catch (e) { setErr(errMsg(e)); setBusy(false) }
  })

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={go} noValidate>
        <h1>Connexion</h1>
        <p className="mut">Retrouve tes réservations et ton QR code.</p>
        {err && <div className="alert" role="alert"><Info size={16} />{err}</div>}
        <Field label="Email" type="email" autoComplete="email" placeholder="toi@fac.tn" {...f.bind('email')} />
        <Field label="Mot de passe" type={show ? 'text' : 'password'} autoComplete="current-password" {...f.bind('password')}
          right={<button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>} />
        <button className="btn pri block lg" disabled={busy}>{busy ? <Spinner /> : 'Me connecter'}</button>
        <div className="demo">
          <small>Comptes de démonstration (mot de passe Campus123)</small>
          <div className="chips">
            {DEMOS.map(([l, m]) => <button type="button" key={m} className="chip" onClick={() => { f.set('email', m); f.set('password', 'Campus123') }}>{l}</button>)}
          </div>
        </div>
        <p className="mut center">Pas encore de compte ? <Link to="/register">Créer un compte</Link></p>
      </form>
      <aside className="auth-art" aria-hidden="true"><div className="arch"><Arch size={56} /></div><p>Ton repas t’attend, il suffit de le réserver.</p></aside>
    </div>
  )
}
