import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../store'

/* Le ticket : l'élément signature de CampusSave (même gabarit que le pass de commande) */
function HeroTicket() {
  const ref = useRef(null)
  const tilt = (x, y) => {
    ref.current.style.setProperty('--ry', `${x}deg`)
    ref.current.style.setProperty('--rx', `${y}deg`)
  }
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
            <p className="mut">Café Campus, Tunis</p>
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

const STEPS = [
  ['Choisis ton panier', 'Sandwichs, plats chauds, pâtisseries : filtre par prix, catégorie ou commerce près de ta fac.'],
  ['Réserve et paie en ligne', 'Ton panier est gardé 10 minutes. Tu paies par carte, sans espèces à sortir.'],
  ['Montre ton QR code', 'Le commerçant le scanne pendant le créneau de retrait. Tu repars avec ton repas.'],
]

export default function Home() {
  const user = useAuth(s => s.user)
  const student = user?.role === 'student'
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>Les invendus de ta fac, à prix étudiant.</h1>
          <p className="lead">
            Les commerces autour du campus vendent leurs invendus jusqu’à −70 %. Tu réserves, tu paies, tu montres ton QR code.
          </p>
          <div className="row">
            <Link to={student ? '/offers' : '/register'} className="btn pri lg">{student ? 'Voir les offres du jour' : 'Créer mon compte'}</Link>
            {!user && <Link to="/login" className="btn ghost lg">Me connecter</Link>}
          </div>
          <p className="fine">Gratuit pour les étudiants. Chaque panier sauvé évite un repas jeté.</p>
        </div>
        <div className="hero-art">
          <div className="arch" aria-hidden="true" />
          <HeroTicket />
        </div>
      </section>

      <section className="how" aria-labelledby="how-t">
        <h2 id="how-t">Comment ça marche</h2>
        <ol>
          {STEPS.map(([t, d], i) => (
            <li key={t}><span className="step-n">{i + 1}</span><h3>{t}</h3><p>{d}</p></li>
          ))}
        </ol>
      </section>

      <section className="band">
        <h2>Les paniers partent vite.</h2>
        <p>Les offres changent chaque jour selon les invendus des commerces.</p>
        <Link to={student ? '/offers' : '/register'} className="btn lime lg">{student ? 'Trouver mon repas' : 'Je m’inscris'}</Link>
      </section>

      <footer className="foot">CampusSave, projet étudiant. Interface étudiant (Personne 3).</footer>
    </>
  )
}
