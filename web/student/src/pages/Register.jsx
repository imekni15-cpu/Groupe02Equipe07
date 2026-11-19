import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Info } from 'lucide-react'
import { Field, Spinner, Arch } from '../components/ui'
import { useForm } from '../hooks'
import { rules, passwordScore } from '../utils/validators'
import { UNIVERSITIES } from '../utils/format'
import { authService } from '../services/authService'
import { errMsg } from '../api/http'
import { useAuth, useUi } from '../store'

const LABELS = ['Trop court', 'Faible', 'Moyen', 'Bon', 'Solide']

export default function Register() {
  const setSession = useAuth(s => s.setSession)
  const toast = useUi(s => s.toast)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)
  const f = useForm({ name: '', email: '', university: '', phone: '', password: '', confirm: '', terms: false }, v => ({
    name: rules.name(v.name),
    email: rules.email(v.email),
    phone: rules.phone(v.phone),
    password: rules.password(v.password),
    confirm: !v.confirm ? 'Confirme ton mot de passe.' : v.confirm !== v.password ? 'Les deux mots de passe sont différents.' : '',
    terms: v.terms ? '' : 'Accepte les conditions pour continuer.',
  }))
  const score = passwordScore(f.values.password)

  const go = f.submit(async v => {
    setBusy(true); setErr('')
    try {
      const { token, user } = await authService.register({ name: v.name, email: v.email, password: v.password, phone: v.phone.replace(/\s/g, ''), university: v.university })
      setSession(user, token)
      toast(`Bienvenue sur CampusSave, ${user.name.split(' ')[0]}.`)
    } catch (e) { setErr(errMsg(e)); setBusy(false) }
  })

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={go} noValidate>
        <h1>Créer mon compte</h1>
        <p className="mut">Une minute suffit pour réserver ton premier panier.</p>
        {err && <div className="alert" role="alert"><Info size={16} />{err}</div>}
        <Field label="Nom complet" autoComplete="name" placeholder="Amine Ben Salah" {...f.bind('name')} />
        <Field label="Email" type="email" autoComplete="email" placeholder="toi@fac.tn" {...f.bind('email')} />
        <div className="two">
          <Field as="select" label="Établissement" {...f.bind('university')}>
            <option value="">Choisir</option>
            {UNIVERSITIES.map(u => <option key={u}>{u}</option>)}
          </Field>
          <Field label="Téléphone (facultatif)" inputMode="numeric" placeholder="22 123 456" {...f.bind('phone')} />
        </div>
        <Field label="Mot de passe" type={show ? 'text' : 'password'} autoComplete="new-password" {...f.bind('password')}
          hint="8 caractères minimum, avec une lettre et un chiffre."
          right={<button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? 'Masquer' : 'Afficher'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>} />
        {f.values.password && (
          <div className="meter" data-s={score} aria-live="polite">
            {[0, 1, 2, 3].map(i => <i key={i} className={score > i ? 'on' : ''} />)}
            <small>{LABELS[score]}</small>
          </div>
        )}
        <Field label="Confirmer le mot de passe" type={show ? 'text' : 'password'} autoComplete="new-password" {...f.bind('confirm')} />
        <div>
          <label className="check">
            <input type="checkbox" checked={f.values.terms} onChange={e => f.set('terms', e.target.checked)} />
            J’accepte les conditions d’utilisation et la politique de confidentialité.
          </label>
          {f.touched.terms && f.errors.terms && <p className="err" role="alert">{f.errors.terms}</p>}
        </div>
        <button className="btn pri block lg" disabled={busy}>{busy ? <Spinner /> : 'Créer mon compte'}</button>
        <p className="mut center">Déjà inscrit ? <Link to="/login">Me connecter</Link></p>
      </form>
      <aside className="auth-art" aria-hidden="true"><div className="arch"><Arch size={56} /></div><p>Moins de gaspillage, plus de budget pour toi.</p></aside>
    </div>
  )
}
