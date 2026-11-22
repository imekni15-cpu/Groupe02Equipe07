import { useEffect, useState } from 'react'
import { Info, Pencil, Plus, Trash2 } from 'lucide-react'
import { Field, Spinner, Thumb } from './ui'
import { offerService } from '../services'
import { errMsg } from '../api/http'
import { useUi } from '../store'
import { CATEGORIES, PHOTOS, money } from '../utils/format'

const blank = { title: '', category: CATEGORIES[0], description: '', originalPrice: '', discountPrice: '', quantity: '5', pickupStart: '12:00', pickupEnd: '14:00', photoUrl: '/photos/sandwiches.jpg', active: true }
const num = v => Number(String(v).replace(',', '.'))

/* Commerçant : publier, modifier et supprimer les offres de son commerce */
export default function MerchantOffers({ canPublish }) {
  const toast = useUi(s => s.toast)
  const [offers, setOffers] = useState(null)
  const [form, setForm] = useState(null) // null = liste ; sinon formulaire (id présent = modification)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => offerService.mine().then(setOffers).catch(() => setOffers([]))
  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const edit = o => { setErr(''); setForm({ ...o, originalPrice: String(o.originalPrice), discountPrice: String(o.discountPrice), quantity: String(o.quantity) }) }

  const submit = async e => {
    e.preventDefault()
    setBusy(true); setErr('')
    const body = {
      title: form.title, category: form.category, description: form.description, photoUrl: form.photoUrl, active: form.active,
      originalPrice: num(form.originalPrice), discountPrice: num(form.discountPrice), quantity: num(form.quantity),
      pickupStart: form.pickupStart, pickupEnd: form.pickupEnd,
    }
    try {
      form.id ? await offerService.update(form.id, body) : await offerService.create(body)
      toast(form.id ? 'Offre modifiée.' : 'Offre publiée.')
      setForm(null); load()
    } catch (e2) { setErr(errMsg(e2)) } finally { setBusy(false) }
  }
  const remove = async o => {
    if (!window.confirm(`Supprimer « ${o.title} » ?`)) return
    try { await offerService.remove(o.id); toast('Offre supprimée.'); load() } catch (e) { toast(errMsg(e), 'bad') }
  }

  if (form)
    return (
      <form className="offer-form" onSubmit={submit} noValidate>
        <h2>{form.id ? 'Modifier l’offre' : 'Nouvelle offre'}</h2>
        {err && <div className="alert" role="alert"><Info size={16} />{err}</div>}
        <Field label="Titre" placeholder="Panier sandwichs" value={form.title} onChange={e => set('title', e.target.value)} />
        <div className="two">
          <Field as="select" label="Catégorie" value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </Field>
          <Field as="select" label="Photo" value={form.photoUrl} onChange={e => set('photoUrl', e.target.value)}>
            {PHOTOS.map(([k, l]) => <option key={k} value={`/photos/${k}.jpg`}>{l}</option>)}
          </Field>
        </div>
        <Field as="textarea" rows={3} label="Description (facultatif)" maxLength={300} value={form.description} onChange={e => set('description', e.target.value)} />
        <div className="two">
          <Field label="Prix initial (TND)" inputMode="decimal" value={form.originalPrice} onChange={e => set('originalPrice', e.target.value)} />
          <Field label="Prix réduit (TND)" inputMode="decimal" value={form.discountPrice} onChange={e => set('discountPrice', e.target.value)} />
        </div>
        <div className="two">
          <Field label="Retrait dès" type="time" value={form.pickupStart} onChange={e => set('pickupStart', e.target.value)} />
          <Field label="Retrait jusqu’à" type="time" value={form.pickupEnd} onChange={e => set('pickupEnd', e.target.value)} />
        </div>
        <Field label="Quantité disponible" inputMode="numeric" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
        <label className="check"><input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} /> Offre visible par les étudiants</label>
        <div className="row-actions">
          <button className="btn pri" disabled={busy}>{busy ? <Spinner /> : form.id ? 'Enregistrer' : 'Publier l’offre'}</button>
          <button type="button" className="btn ghost" onClick={() => setForm(null)}>Annuler</button>
        </div>
      </form>
    )

  return (
    <>
      <div className="row-actions">
        <button className="btn pri" onClick={() => { setErr(''); setForm(blank) }} disabled={!canPublish}><Plus size={16} /> Nouvelle offre</button>
        {!canPublish && <small className="mut">Disponible dès que l’administration a validé ton commerce.</small>}
      </div>
      {!offers && <div className="center"><Spinner /></div>}
      {offers && !offers.length && <p className="mut">Aucune offre pour le moment.</p>}
      <ul className="col">
        {(offers || []).map(o => (
          <li key={o.id} className="order static">
            <Thumb item={o} />
            <div className="o-main">
              <div className="o-top"><b>{o.title}</b>{!o.active && <small className="mut">masquée</small>}{o.active && o.quantity === 0 && <small className="mut">épuisée</small>}</div>
              <p>{o.category}, stock {o.quantity}, retrait {o.pickupStart} à {o.pickupEnd}</p>
              <small><s>{money(o.originalPrice)}</s> {money(o.discountPrice)}</small>
            </div>
            <div className="o-end">
              <button className="mini-cta" onClick={() => edit(o)} aria-label={`Modifier ${o.title}`}><Pencil size={14} /></button>
              <button className="mini-cta" onClick={() => remove(o)} aria-label={`Supprimer ${o.title}`}><Trash2 size={14} /></button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
