import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Info, Lock, ShieldCheck } from 'lucide-react'
import { Empty, Field, Modal, Spinner } from '../components/ui'
import OtpForm from '../components/OtpForm'
import { useForm, useNow } from '../hooks'
import { rules } from '../utils/validators'
import { orderService, publicService } from '../services'
import { errMsg } from '../api/http'
import { useUi } from '../store'
import { mmss, money } from '../utils/format'

const fmtNum = s => s.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
const fmtExp = s => { const d = s.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }

export default function Pay() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useUi(s => s.toast)
  const now = useNow(1000)
  const [order, setOrder] = useState(null)
  const [loadErr, setLoadErr] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [challenge, setChallenge] = useState(null) // code d'achat envoyé par e-mail (mode démo)
  const [mode, setMode] = useState(null) // 'konnect' (page de paiement Konnect) ou 'demo' (carte simulée + code e-mail)

  const f = useForm({ holder: '', number: '', expiry: '', cvc: '' }, v => ({
    holder: v.holder.trim().length < 3 ? 'Indique le nom inscrit sur la carte.' : '',
    number: rules.card(v.number),
    expiry: rules.expiry(v.expiry),
    cvc: /^\d{3}$/.test(v.cvc) ? '' : 'Le code contient 3 chiffres.',
  }))

  useEffect(() => { publicService.health().then(h => setMode(h.payment)).catch(() => setMode('demo')) }, [])
  useEffect(() => {
    orderService.get(id).then(o => (o.status === 'paid' || o.status === 'picked_up' ? nav(`/orders/${id}`, { replace: true }) : setOrder(o))).catch(e => setLoadErr(errMsg(e)))
  }, [id, nav])

  if (loadErr) return <Empty emoji="🧾" title="Commande introuvable"><p>{loadErr}</p><Link to="/orders" className="btn pri">Mes commandes</Link></Empty>
  if (!order || !mode) return <div className="center"><Spinner /></div>

  const left = order.expiresAt ? Math.max(0, new Date(order.expiresAt) - now) : 0
  if (order.status === 'cancelled' || left === 0)
    return (
      <Empty emoji="⏳" title="Ta réservation a expiré">
        <p>Le panier n’a pas été payé dans les 10 minutes, il est de nouveau disponible pour les autres étudiants.</p>
        <Link to="/offers" className="btn pri">Refaire ma commande</Link>
      </Empty>
    )

  const digits = f.values.number.replace(/\D/g, '')
  const shown = Array.from({ length: 16 }, (_, i) => digits[i] || '•').join('').replace(/(.{4})/g, '$1 ').trim()
  const brand = digits[0] === '4' ? 'VISA' : digits[0] === '5' ? 'Mastercard' : 'Carte bancaire'

  // Étape 1 : le serveur contrôle la carte puis envoie un code de confirmation par e-mail (rien n'est débité)
  const pay = f.submit(async v => {
    setBusy(true); setErr('')
    try {
      const c = await orderService.pay(id, { holder: v.holder, number: v.number, expiry: v.expiry, cvc: v.cvc })
      if (c.expiresAt) setOrder(o => ({ ...o, expiresAt: c.expiresAt }))
      setChallenge(c)
    } catch (e) { setErr(errMsg(e)) } finally { setBusy(false) }
  })
  // Étape 2 : code correct → commande payée, reçu avec QR code envoyé par e-mail
  const confirm = async code => {
    await orderService.confirm(id, { challengeId: challenge.challengeId, code })
    nav(`/orders/${id}`, { replace: true, state: { paid: true } })
  }
  // Konnect : le serveur crée le paiement, puis on envoie l'étudiant sur la page de paiement sécurisée de Konnect
  const payKonnect = async () => {
    setBusy(true); setErr('')
    try { window.location.assign((await orderService.pay(id, undefined)).payUrl) }
    catch (e) { setErr(errMsg(e)); setBusy(false) }
  }
  const cancel = async () => { try { await orderService.cancel(id); toast('Réservation annulée.'); nav('/offers') } catch (e) { toast(errMsg(e), 'bad') } }

  return (
    <>
      <header className="page-head"><h1>Paiement</h1><p className="mut">Commande {order.code} chez {order.shopName}</p></header>
      <div className="split">
        {mode === 'konnect' ? (
          <div className="pay-form">
            {err && <div className="alert" role="alert"><Info size={16} />{err}</div>}
            <p>Tu vas être redirigé vers la page de paiement sécurisée de <b>Konnect</b> : carte bancaire, e-DINAR ou portefeuille Konnect. CampusSave ne voit jamais les informations de ta carte.</p>
            <button className="btn pri block lg" onClick={payKonnect} disabled={busy}>{busy ? <><Spinner /> Redirection…</> : `Payer ${money(order.total)} avec Konnect`}</button>
            <p className="secure"><ShieldCheck size={16} /> Une fois le paiement validé, tu reçois un e-mail de confirmation avec ton QR code.</p>
          </div>
        ) : (
        <form className="pay-form" onSubmit={pay} noValidate>
          <div className="ccard" aria-hidden="true">
            <div className="cc-top"><span className="cc-chip" /><b>{brand}</b></div>
            <div className="cc-num">{shown}</div>
            <div className="cc-bot"><span>{f.values.holder || 'NOM DU TITULAIRE'}</span><span>{f.values.expiry || 'MM/AA'}</span></div>
          </div>
          {err && <div className="alert" role="alert"><Info size={16} />{err}</div>}
          <Field label="Nom sur la carte" autoComplete="cc-name" placeholder="Amine Ben Salah" {...f.bind('holder')} />
          <Field label="Numéro de carte" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" {...f.bind('number')} onChange={e => f.set('number', fmtNum(e.target.value))} />
          <div className="two">
            <Field label="Expiration" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" {...f.bind('expiry')} onChange={e => f.set('expiry', fmtExp(e.target.value))} />
            <Field label="Code (CVC)" inputMode="numeric" autoComplete="cc-csc" placeholder="123" {...f.bind('cvc')} onChange={e => f.set('cvc', e.target.value.replace(/\D/g, '').slice(0, 3))} />
          </div>
          <button className="btn pri block lg" disabled={busy}>{busy ? <><Spinner /> Vérification…</> : `Payer ${money(order.total)}`}</button>
          <p className="secure"><ShieldCheck size={16} /> Avant de débiter ta carte, nous t’envoyons un code de confirmation par e-mail.</p>
          <p className="note"><Lock size={14} /> Paiement simulé pour la démo. Carte de test : 4242 4242 4242 4242, date future, 3 chiffres. La carte 4000 0000 0000 0002 simule un refus.</p>
        </form>
        )}
        <aside className="summary">
          <div className={`timer ${left < 120000 ? 'hot' : ''}`}>
            <span>Panier gardé pendant</span><b>{mmss(left)}</b>
            <div className="bar"><i style={{ width: `${Math.min(100, (left / 600000) * 100)}%` }} /></div>
          </div>
          <h2>Ta commande</h2>
          <ul className="lines">{order.items.map(i => <li key={i.title}><span>{i.qty} × {i.title}</span><b>{money(i.unitPrice * i.qty)}</b></li>)}</ul>
          <dl><div className="sum-total"><dt>Total</dt><dd>{money(order.total)}</dd></div></dl>
          <button className="link" onClick={cancel}>Annuler la réservation</button>
        </aside>
      </div>

      <Modal open={!!challenge} onClose={() => setChallenge(null)} label="Confirmer l’achat">
        {challenge && (
          <OtpForm challenge={challenge} onSubmit={confirm} title={`Confirme ton achat de ${money(order.total)}`} cta={`Valider et payer ${money(order.total)}`}
            onResend={async () => { const n = await orderService.resendOtp(id, challenge.challengeId); setChallenge(n); return n }}
            onBack={() => setChallenge(null)} backLabel="Modifier ma carte" />
        )}
      </Modal>
    </>
  )
}
