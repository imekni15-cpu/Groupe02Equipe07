import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, LogOut, MailCheck, ShieldCheck } from 'lucide-react'
import { Field, Spinner } from '../components/ui'
import { useForm } from '../hooks'
import { rules } from '../utils/validators'
import { UNIVERSITIES, fmtDate } from '../utils/format'
import { authService } from '../services'
import { errMsg } from '../api/http'
import { useAuth, useCart, useUi } from '../store'
import { useFav } from '../favStore'

export default function Profile() {
  const { user, setUser, logout } = useAuth()
  const toast = useUi(s => s.toast)
  const nav = useNavigate()
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState({ info: '', pw: '' })

  const info = useForm({ name: user.name, phone: user.phone || '', university: user.university || '' }, v => ({
    name: rules.name(v.name), phone: rules.phone(v.phone),
  }))
  const pw = useForm({ current: '', next: '', confirm: '' }, v => ({
    current: v.current ? '' : 'Indique ton mot de passe actuel.',
    next: rules.password(v.next) || (v.next === v.current ? 'Choisis un mot de passe différent de l’actuel.' : ''),
    confirm: v.confirm === v.next ? '' : 'Les deux mots de passe sont différents.',
  }))

  const saveInfo = info.submit(async v => {
    setBusy('info'); setErr(e => ({ ...e, info: '' }))
    try {
      setUser(await authService.updateProfile({ name: v.name.trim(), phone: v.phone.replace(/\s/g, ''), university: v.university }))
      toast('Profil mis à jour.')
    } catch (e) { setErr(x => ({ ...x, info: errMsg(e) })) } finally { setBusy('') }
  })
  const savePw = pw.submit(async v => {
    setBusy('pw'); setErr(e => ({ ...e, pw: '' }))
    try { await authService.changePassword({ current: v.current, next: v.next }); pw.reset(); toast('Mot de passe modifié.') }
    catch (e) { setErr(x => ({ ...x, pw: errMsg(e) })) } finally { setBusy('') }
  })

  return (
    <>
      <header className="page-head"><h1>Mon profil</h1></header>
      <div className="profile">
        <aside className="id-card">
          <span className="avatar xl">{user.name[0]}</span>
          <h2>{user.name}</h2>
          <p className="mut">{user.email}</p>
          <span className="chip static">Étudiant{user.university ? `, ${user.university}` : ''}</span>
          {user.emailVerified && <span className="status ok"><i />E-mail confirmé</span>}
          {user.createdAt && <small>Membre depuis le {fmtDate(user.createdAt)}</small>}
          <button className="btn ghost block" onClick={() => { logout(); useCart.getState().clear(); useFav.getState().clear(); nav('/') }}><LogOut size={17} /> Me déconnecter</button>
        </aside>

        <div className="col">
          <section className="panel secure-panel">
            <h2>Sécurité du compte</h2>
            <ul className="sec-list">
              <li><MailCheck size={18} /><span><b>Confirmation par e-mail à chaque connexion</b><small>Un code à 6 chiffres est envoyé à {user.email}. Actif.</small></span></li>
              <li><ShieldCheck size={18} /><span><b>Confirmation par e-mail à chaque achat</b><small>Aucun paiement n’est validé sans ton code. Actif.</small></span></li>
            </ul>
          </section>

          <form className="panel" onSubmit={saveInfo} noValidate>
            <h2>Mes informations</h2>
            {err.info && <div className="alert" role="alert"><Info size={16} />{err.info}</div>}
            <Field label="Nom complet" autoComplete="name" {...info.bind('name')} />
            <Field label="Email" value={user.email} readOnly hint="L’email sert d’identifiant, il ne peut pas être modifié." />
            <div className="two">
              <Field as="select" label="Établissement" {...info.bind('university')}>
                <option value="">Choisir</option>
                {UNIVERSITIES.map(u => <option key={u}>{u}</option>)}
              </Field>
              <Field label="Téléphone" inputMode="numeric" placeholder="22 123 456" {...info.bind('phone')} />
            </div>
            <button className="btn pri" disabled={busy === 'info'}>{busy === 'info' ? <Spinner /> : 'Enregistrer les modifications'}</button>
          </form>

          <form className="panel" onSubmit={savePw} noValidate>
            <h2>Mot de passe</h2>
            {err.pw && <div className="alert" role="alert"><Info size={16} />{err.pw}</div>}
            <Field label="Mot de passe actuel" type="password" autoComplete="current-password" {...pw.bind('current')} />
            <div className="two">
              <Field label="Nouveau mot de passe" type="password" autoComplete="new-password" hint="8 caractères, une lettre et un chiffre." {...pw.bind('next')} />
              <Field label="Confirmation" type="password" autoComplete="new-password" {...pw.bind('confirm')} />
            </div>
            <button className="btn pri" disabled={busy === 'pw'}>{busy === 'pw' ? <Spinner /> : 'Changer le mot de passe'}</button>
          </form>
        </div>
      </div>
    </>
  )
}
