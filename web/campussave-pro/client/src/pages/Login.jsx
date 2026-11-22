import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Info, ShieldCheck } from 'lucide-react'
import { Field, Spinner, Arch } from '../components/ui'
import OtpForm from '../components/OtpForm'
import { useForm } from '../hooks'
import { rules } from '../utils/validators'
import { authService } from '../services'
import { errMsg } from '../api/http'
import { useAuth, useUi } from '../store'

const DEMOS = [['🎓 Étudiant', 'amine@essect.tn'], ['🏪 Commerçant', 'm@cafe.tn'], ['🛡️ Admin', 'admin@campussave.tn']]

export default function Login() {
  const setSession = useAuth(s => s.setSession)
  const toast = useUi(s => s.toast)
  const [challenge, setChallenge] = useState(null) // étape 2 : code reçu par e-mail
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)
  const f = useForm({ email: '', password: '' }, v => ({
    email: rules.email(v.email),
    password: v.password ? '' : 'Indique ton mot de passe.',
  }))

  // Étape 1 : e-mail + mot de passe → le serveur envoie un code par e-mail (pas encore de session)
  const go = f.submit(async v => {
    setBusy(true); setErr('')
    try { setChallenge(await authService.login(v)) } catch (e) { setErr(errMsg(e)) } finally { setBusy(false) }
  })
  // Étape 2 : code correct → session. <GuestOnly> redirige ensuite vers la page d'origine ou l'accueil du rôle.
  const verify = async code => {
    const { token, user } = await authService.verifyOtp({ challengeId: challenge.challengeId, code })
    setSession(user, token)
    toast(`Content de te revoir, ${user.name.split(' ')[0]}.`)
  }

  return (
    <div className="auth">
      <div className="auth-card">
        {challenge ? (
          <OtpForm challenge={challenge} onSubmit={verify}
            onResend={async () => { const n = await authService.resendOtp(challenge.challengeId); setChallenge(n); return n }}
            onBack={() => { setChallenge(null); f.set('password', '') }} backLabel="Changer de compte"
            title={challenge.purpose === 'register' ? 'Confirme ton adresse e-mail' : 'Confirme ta connexion'}
            cta={challenge.purpose === 'register' ? 'Activer mon compte' : 'Me connecter'} />
        ) : (
          <form onSubmit={go} noValidate className="col">
            <h1>Connexion</h1>
            <p className="mut">Retrouve tes réservations et ton QR code.</p>
            {err && <div className="alert" role="alert"><Info size={16} />{err}</div>}
            <Field label="Email" type="email" autoComplete="email" placeholder="toi@gmail.com" {...f.bind('email')} />
            <Field label="Mot de passe" type={show ? 'text' : 'password'} autoComplete="current-password" {...f.bind('password')}
              right={<button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>} />
            <button className="btn pri block lg" disabled={busy}>{busy ? <Spinner /> : 'Recevoir mon code'}</button>
            <p className="secure"><ShieldCheck size={16} /> Connexion sécurisée : un code de confirmation t’est envoyé par e-mail.</p>
            <div className="demo">
              <small>Comptes de démonstration (mot de passe Campus123)</small>
              <div className="chips">
                {DEMOS.map(([l, m]) => <button type="button" key={m} className="chip" onClick={() => { f.set('email', m); f.set('password', 'Campus123') }}>{l}</button>)}
              </div>
            </div>
            <p className="mut center">Pas encore de compte ? <Link to="/register" className="link">Créer un compte</Link></p>
          </form>
        )}
      </div>
      <aside className="auth-art" aria-hidden="true"><div className="arch"><Arch size={56} /></div><p>Ton repas t’attend, il suffit de le réserver.</p></aside>
    </div>
  )
}
