import { config } from './config.js'
import { initStore } from './db.js'
import { provisionSeedAccounts } from './services/accounts.js'
import { firebaseEnabled } from './firebase.js'
import { konnectEnabled } from './services/payment.js'
import { createApp } from './app.js'
import { seed } from './seed.js'
import { expirePending, rebaseDemoWindows } from './services/orders.js'
import { mailEnabled, verifyMailer } from './mail/mailer.js'

await initStore() // mode Firebase : charge les données depuis Firestore
if (seed()) console.log('🌱 Base de démonstration créée (comptes : voir README).')
if (firebaseEnabled) {
  const n = await provisionSeedAccounts('Campus123')
  if (n) console.log(`🔥 ${n} compte(s) de démonstration créé(s) dans Firebase Authentication.`)
}
if (!config.prod) rebaseDemoWindows() // démo : créneaux de retrait recalés sur l'heure actuelle
setInterval(expirePending, 30_000).unref()

const app = createApp()
app.listen(config.port, async () => {
  console.log(`\n🚀 CampusSave API  http://localhost:${config.port}/api/health`)
  console.log(firebaseEnabled ? '🔥 Firebase : Authentication + Firestore actifs.' : '💾 Firebase non configuré : données dans un fichier JSON local (voir server/.env.example).')
  console.log(konnectEnabled ? `💳 Paiement : Konnect (${config.konnect.baseUrl}).` : '💳 Paiement : MODE DÉMO (cartes de test). Renseigne KONNECT_API_KEY et KONNECT_WALLET_ID pour Konnect.')
  if (!mailEnabled) console.log('✉️  E-mail : MODE DÉMO (SMTP non configuré). Les codes s’affichent dans l’interface. Voir server/.env.example pour Gmail.')
  else {
    const v = await verifyMailer()
    console.log(v.ok ? `✉️  E-mail : SMTP prêt (${config.mail.user || config.mail.host}). Les codes partent vraiment par e-mail.` : `⚠️  E-mail : connexion SMTP impossible (${v.reason}). Vérifie SMTP_USER / SMTP_PASS (mot de passe d'application).`)
  }
})
