import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Info } from 'lucide-react'
import { Field, Spinner, Arch } from '../components/ui'
import OtpForm from '../components/OtpForm'
import { useForm } from '../hooks'
import { rules, passwordScore } from '../utils/validators'
import { UNIVERSITIES, SHOP_TYPES } from '../utils/format'
import { authService } from '../services'
import { errMsg } from '../api/http'
import { useAuth, useUi } from '../store'

const LABELS = ['Trop court', 'Faible', 'Moyen', 'Bon', 'Solide']

export default function Register() {
  const setSession = useAuth(s => s.setSession)
  const toast = useUi(s => s.toast)
  const [challenge, setChallenge] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)
  const f = useForm({ role: 'student', shopName: '', shopType: '', shopAddress: '', name: '', email: '', university: '', phone: '', password: '', confirm: '', terms: false }, v => ({
    shopName: v.role === 'merchant' && v.shopName.trim().length < 2 ? 'Indique le nom de ton commerce.' : '',
    shopType: v.role === 'merchant' && !v.shopType ? 'Choisis le type de commerce.' : '',
    shopAddress: v.role === 'merchant' && v.shopAddress.trim().length < 5 ? 'Indique l’adresse de ton commerce.' : '',
    name: rules.name(v.name),
    email: rules.email(v.email),
    phone: rules.phone(v.phone),
    password: rules.password(v.password),
    confirm: !v.confirm ? 'Confirme ton mot de passe.' : v.confirm !== v.password ? 'Les deux mots de passe sont différents.' : '',
    terms: v.terms ? '' : 'Accepte les conditions pour continuer.',
  }))
  const score = passwordScore(f.values.password)

  // Le compte est créé mais reste inactif tant que l'adresse e-mail n'est pas confirmée
  const go = f.submit(async v => {
    setBusy(true); setErr('')
    try {
      const body = { name: v.name, email: v.email, password: v.password, phone: v.phone.replace(/\s/g, ''), university: v.university, role: v.role }
      if (v.role === 'merchant') body.shop = { name: v.shopName.trim(), type: v.shopType, address: v.shopAddress.trim() }
      setChallenge(await authService.register(body))
    } catch (e) { setErr(errMsg(e)) } finally { setBusy(false) }
  })
  const verify = async code => {
    const { token, user } = await authService.verifyOtp({ challengeId: challenge.challengeId, code })
    setSession(user, token)
    toast(`Bienvenue sur CampusSave, ${user.name.split(' ')[0]}. Ton e-mail est confirmé.`)
  }

  return (
    <div className="auth">
      <div className="auth-card">
        {challenge ? (
          <OtpForm challenge={challenge} onSubmit={verify} title="Confirme ton adresse e-mail" cta="Activer mon compte"
            onResend={async () => { const n = await authService.resendOtp(challenge.challengeId); setChallenge(n); return n }}
            onBack={() => setChallenge(null)} backLabel="Modifier mes informations" />
        ) : (
          <form onSubmit={go} noValidate className="col">
            <h1>Créer mon compte</h1>
            <p className="mut">{f.values.role === 'merchant' ? 'Propose tes invendus aux étudiants. Ton commerce sera validé par l’administration.' : 'Une minute suffit pour réserver ton premier panier.'}</p>
            <div className="role-switch" role="group" aria-label="Type de compte">
              {[['student', 'Je suis étudiant'], ['merchant', 'Je suis commerçant']].map(([k, l]) => <button key={k} type="button" className={f.values.role === k ? 'on' : ''} aria-pressed={f.values.role === k} onClick={() => f.set('role', k)}>{l}</button>)}
            </div>
            {err && <div className="alert" role="alert"><Info size={16} />{err}</div>}
            <Field label="Nom complet" autoComplete="name" placeholder="Amine Ben Salah" {...f.bind('name')} />
            <Field label="Email" type="email" autoComplete="email" placeholder="toi@gmail.com" hint="Un code de confirmation sera envoyé à cette adresse." {...f.bind('email')} />
            {f.values.role === 'merchant' ? (
              <>
                <div className="two">
                  <Field label="Nom du commerce" placeholder="Café Campus" {...f.bind('shopName')} />
                  <Field as="select" label="Type de commerce" {...f.bind('shopType')}>
                    <option value="">Choisir</option>
                    {SHOP_TYPES.map(t => <option key={t}>{t}</option>)}
                  </Field>
                </div>
                <Field label="Adresse du commerce" placeholder="Avenue de l’Université, Tunis" {...f.bind('shopAddress')} />
                <Field label="Téléphone (facultatif)" inputMode="numeric" placeholder="22 123 456" {...f.bind('phone')} />
              </>
            ) : (
              <div className="two">
                <Field as="select" label="Établissement" {...f.bind('university')}>
                  <option value="">Choisir</option>
                  {UNIVERSITIES.map(u => <option key={u}>{u}</option>)}
                </Field>
                <Field label="Téléphone (facultatif)" inputMode="numeric" placeholder="22 123 456" {...f.bind('phone')} />
              </div>
            )}
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
            <p className="mut center">Déjà inscrit ? <Link to="/login" className="link">Me connecter</Link></p>
          </form>
        )}
      </div>
      <aside className="auth-art" aria-hidden="true"><div className="arch"><Arch size={56} /></div><p>Moins de gaspillage, plus de budget pour toi.</p></aside>
    </div>
  )
}
