import { useEffect, useRef, useState } from 'react'
import { Info, MailCheck } from 'lucide-react'
import { Spinner } from './ui'
import { errMsg, errData } from '../api/http'
import { useNow } from '../hooks'
import { mmss } from '../utils/format'

/* Saisie du code à 6 chiffres reçu par e-mail : cases séparées, collage, saisie auto, compte à rebours, renvoi.
   `onSubmit(code)` doit lever une erreur si le code est refusé. `onResend()` renvoie le nouveau défi. */
export default function OtpForm({ challenge, onSubmit, onResend, onBack, title, cta = 'Confirmer', backLabel = 'Retour' }) {
  const blank = () => Array(6).fill('')
  const [digits, setDigits] = useState(blank)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(false)
  const [wait, setWait] = useState(challenge.resendIn ?? 30)
  const [expAt, setExpAt] = useState(Date.now() + (challenge.expiresIn ?? 600) * 1000)
  const refs = useRef([])
  const now = useNow(1000)
  const left = Math.max(0, expAt - now)

  useEffect(() => { // nouveau code reçu : on repart d'une saisie vide
    setDigits(blank()); setErr(''); setWait(challenge.resendIn ?? 30); setExpAt(Date.now() + (challenge.expiresIn ?? 600) * 1000)
    refs.current[0]?.focus()
  }, [challenge])
  useEffect(() => { if (wait > 0) { const t = setTimeout(() => setWait(w => w - 1), 1000); return () => clearTimeout(t) } }, [wait])

  const fail = e => {
    setErr(errMsg(e)); setDigits(blank()); setBusy(false); setShake(true)
    setTimeout(() => { setShake(false); refs.current[0]?.focus() }, 450)
    if (errData(e).locked || errData(e).expired) setWait(0)
  }
  const submit = async code => {
    if (busy) return
    setBusy(true); setErr(''); setInfo('')
    try { await onSubmit(code) } catch (e) { fail(e) } // en cas de succès, le parent change d'écran
  }
  const setAt = (i, v) => {
    const next = [...digits]; next[i] = v; setDigits(next)
    if (next.every(Boolean)) submit(next.join(''))
  }
  const onChange = i => e => {
    const v = e.target.value.replace(/\D/g, '')
    setAt(i, v.slice(-1))
    if (v && i < 5) refs.current[i + 1]?.focus()
  }
  const onKeyDown = i => e => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) { refs.current[i - 1]?.focus(); setAt(i - 1, '') }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus()
  }
  const onPaste = e => {
    const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!t) return
    e.preventDefault()
    setDigits(Array.from({ length: 6 }, (_, k) => t[k] || ''))
    refs.current[Math.min(t.length, 5)]?.focus()
    if (t.length === 6) submit(t)
  }
  const resend = async () => {
    setErr(''); setInfo('')
    try { await onResend(); setInfo('Un nouveau code vient d’être envoyé.') }
    catch (e) { setErr(errMsg(e)); if (errData(e).retryAfter) setWait(errData(e).retryAfter) }
  }

  return (
    <div className="otp-wrap">
      <span className="otp-ic"><MailCheck size={28} /></span>
      <h2>{title}</h2>
      <p className="mut">Un code à 6 chiffres vient d’être envoyé à <b>{challenge.emailMasked}</b>. Pense à vérifier tes courriers indésirables.</p>

      {challenge.devCode && (
        <div className="devcode">
          <div><b>Mode démo</b>, aucun e-mail réel n’a été envoyé (Gmail non configuré). Ton code :</div>
          <button type="button" onClick={() => submit(challenge.devCode)} className="devcode-btn mono" title="Utiliser ce code">{challenge.devCode}</button>
        </div>
      )}

      <div className={`otp ${shake ? 'shake' : ''}`} onPaste={onPaste}>
        {digits.map((d, i) => (
          <input key={i} ref={el => (refs.current[i] = el)} value={d} onChange={onChange(i)} onKeyDown={onKeyDown(i)} onFocus={e => e.target.select()}
            inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={2} aria-label={`Chiffre ${i + 1} sur 6`} disabled={busy} className={d ? 'filled' : ''} />
        ))}
      </div>

      {err && <div className="alert" role="alert"><Info size={16} />{err}</div>}
      {info && !err && <p className="otp-info" role="status">{info}</p>}
      <p className={`otp-meta ${left === 0 ? 'bad' : ''}`}>{left > 0 ? `Le code expire dans ${mmss(left)}` : 'Ce code a expiré. Demande-en un nouveau.'}</p>

      <button className="btn pri block lg" disabled={busy || digits.some(d => !d) || left === 0} onClick={() => submit(digits.join(''))}>
        {busy ? <Spinner /> : cta}
      </button>
      <div className="row between">
        <button type="button" className="link" disabled={wait > 0} onClick={resend}>{wait > 0 ? `Renvoyer le code (${wait} s)` : 'Renvoyer le code'}</button>
        {onBack && <button type="button" className="link" onClick={onBack}>{backLabel}</button>}
      </div>
    </div>
  )
}
