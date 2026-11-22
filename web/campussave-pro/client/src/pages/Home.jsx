import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { MailCheck, QrCode, ShoppingBasket, Wallet } from 'lucide-react'
import { useAuth } from '../store'
import { useCountUp, useReveal } from '../hooks'
import { offerService, publicService } from '../services'
import { money, pct } from '../utils/format'

/* Le ticket : l'élément signature de CampusSave (même gabarit que le pass de commande) */
function HeroTicket() {
  const ref = useRef(null)
  const tilt = (x, y) => { ref.current.style.setProperty('--ry', `${x}deg`); ref.current.style.setProperty('--rx', `${y}deg`) }
  const move = e => {
    const r = ref.current.getBoundingClientRect()
    tilt(((e.clientX - r.left) / r.width - 0.5) * 16, -((e.clientY - r.top) / r.height - 0.5) * 12)
  }
  return (
    <div className="print">
      <div className="tilt" ref={ref} onPointerMove={move} onPointerLeave={() => tilt(0, 0)}>
        <article className="pass v">
          <div className="pass-main">
            <span className="status ok"><i />À récupérer</span>
            <h3>Panier sandwichs</h3>
            <p className="mut">Café Chez nous, Tunis</p>
            <div className="pass-meta">
              <div><small>Retrait</small><b>17:00 à 18:30</b></div>
              <div><small>Prix</small><b>5 DT <s>12 DT</s></b></div>
            </div>
          </div>
          <div className="pass-qr">
            <div className="qr"><QRCodeSVG value="CS-1001" size={110} bgColor="#ffffff" fgColor="#0A1747" /></div>
            <span className="mono">CS-1001</span>
          </div>
        </article>
      </div>
    </div>
  )
}

const Stat = ({ value, label, suffix = '' }) => {
  const v = useCountUp(value, 1400)
  return <div className="impact-n"><strong>{Math.round(v).toLocaleString('fr-FR')}<em>{suffix}</em></strong><span>{label}</span></div>
}

const STEPS = [
  [ShoppingBasket, 'Choisis ton panier', 'Filtre par prix, catégorie ou commerce autour de ta fac.'],
  [Wallet, 'Réserve et paie', 'Ton panier est gardé 10 minutes pendant que tu règles par carte.'],
  [MailCheck, 'Confirme par e-mail', 'Un code à 6 chiffres arrive dans ta boîte : personne ne peut payer à ta place.'],
  [QrCode, 'Montre ton QR code', 'Le commerçant le scanne pendant le créneau, tu repars avec ton repas.'],
]
const FAQ = [
  ['Pourquoi un code par e-mail à la connexion et à l’achat ?', 'C’est la vérification en deux étapes : même si quelqu’un connaît ton mot de passe, il ne peut ni se connecter ni payer sans accéder à ta boîte e-mail. Chaque code est à usage unique et expire en 10 minutes.'],
  ['Mon panier est-il garanti ?', 'Oui. Dès que tu réserves, le stock est bloqué 10 minutes. Si tu ne paies pas, il est automatiquement remis à disposition des autres étudiants.'],
  ['Que se passe-t-il si je rate le créneau de retrait ?', 'Le commerçant peut remettre le panier en vente. Ajoute le retrait à ton agenda depuis ton ticket : un rappel est prévu 15 minutes avant.'],
  ['Mes données de carte sont-elles stockées ?', 'Non. Pour cette démo le paiement est simulé et seuls la marque et les 4 derniers chiffres sont conservés. En production, un prestataire certifié (Stripe, Konnect…) traite la carte.'],
  ['CampusSave est-il gratuit ?', 'Oui pour les étudiants : tu paies uniquement le panier au prix réduit.'],
]

export default function Home() {
  const user = useAuth(s => s.user)
  const student = user?.role === 'student'
  const [stats, setStats] = useState(null)
  const [picks, setPicks] = useState([])
  useReveal()
  useEffect(() => {
    publicService.stats().then(setStats).catch(() => {})
    offerService.list().then(l => setPicks([...l].filter(o => o.quantity > 0).sort((a, b) => pct(b) - pct(a)).slice(0, 4))).catch(() => {})
  }, [])

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>Les invendus de ta fac, à prix étudiant.</h1>
          <p className="lead">
            Les commerces autour du campus vendent leurs invendus jusqu’à −70 %. Tu réserves, tu paies, tu confirmes par e-mail, tu montres ton QR code.
          </p>
          <div className="row">
            <Link to="/offers" className="btn pri lg">Voir les offres du jour</Link>
            {!user && <Link to="/register" className="btn ghost lg">Créer mon compte</Link>}
          </div>
          <p className="fine">Gratuit pour les étudiants. Chaque panier sauvé évite un repas jeté.</p>
        </div>
        <div className="hero-art">
          <div className="arch" aria-hidden="true" />
          <img className="orb orb1" src="/photos/couscous.jpg" alt="" width="150" height="150" decoding="async" />
          <img className="orb orb2" src="/photos/croissant.jpg" alt="" width="120" height="120" decoding="async" />
          <span className="float-sticker" aria-hidden="true">−58 % ce soir</span>
          <HeroTicket />
        </div>
      </section>

      {stats && (
        <section className="impact reveal" aria-label="Impact de la communauté">
          <Stat value={stats.mealsSaved} label="repas sauvés" />
          <Stat value={stats.moneySaved} label="économisés par les étudiants" suffix=" DT" />
          <Stat value={stats.orders} label="commandes" />
          <Stat value={stats.shops} label="commerces partenaires" />
        </section>
      )}

      {picks.length > 0 && (
        <section className="picks reveal" aria-labelledby="picks-t">
          <div className="row between"><h2 id="picks-t">À saisir aujourd’hui</h2><Link to="/offers" className="link">Toutes les offres</Link></div>
          <ul>
            {picks.map(o => (
              <li key={o.id}>
                <Link to={`/offers?open=${o.id}`} className="pick">
                  <span className="pick-art"><img src={o.photoUrl} alt="" loading="lazy" decoding="async" width="240" height="240" /><span className="sticker">−{pct(o)}%</span></span>
                  <b>{o.title}</b><small>{o.shopName}</small>
                  <span className="price"><strong>{money(o.discountPrice)}</strong><s>{money(o.originalPrice)}</s></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="how reveal" aria-labelledby="how-t">
        <h2 id="how-t">Comment ça marche</h2>
        <ol>
          {STEPS.map(([Icon, t, d], i) => (
            <li key={t}><span className="step-n">{i + 1}</span><Icon size={22} className="step-ic" /><h3>{t}</h3><p>{d}</p></li>
          ))}
        </ol>
      </section>

      <section className="faq reveal" aria-labelledby="faq-t">
        <h2 id="faq-t">Questions fréquentes</h2>
        {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
      </section>

      <section className="band reveal">
        <h2>Les paniers partent vite.</h2>
        <p>Les offres changent chaque jour selon les invendus des commerces.</p>
        <Link to={student ? '/offers' : '/register'} className="btn lime lg">{student ? 'Trouver mon repas' : 'Je m’inscris'}</Link>
      </section>

      <footer className="foot">
        <span>CampusSave, projet étudiant anti-gaspillage.</span>
        <span>Astuce : <kbd>Ctrl</kbd> + <kbd>K</kbd> pour tout rechercher.</span>
      </footer>
    </>
  )
}
