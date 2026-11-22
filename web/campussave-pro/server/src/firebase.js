/* Connexion à Firebase (SDK Admin). Chargé à la demande : sans clé de compte de service, l'application
   reste en mode local (fichier JSON + mots de passe bcrypt) et firebase-admin n'est même pas importé. */
import fs from 'node:fs'
import { config } from './config.js'

export const firebaseEnabled = config.firebase.enabled
let cached

export async function getFirebase() {
  if (!firebaseEnabled) throw new Error('Firebase n’est pas configuré (voir server/.env.example).')
  if (cached) return cached
  const [{ initializeApp, cert, getApps }, { getAuth }, { getFirestore }] = await Promise.all([
    import('firebase-admin/app'), import('firebase-admin/auth'), import('firebase-admin/firestore'),
  ])
  const raw = config.firebase.serviceAccountJson || fs.readFileSync(config.firebase.serviceAccountFile, 'utf8')
  const app = getApps()[0] || initializeApp({ credential: cert(JSON.parse(raw)) })
  const db = getFirestore(app)
  db.settings({ ignoreUndefinedProperties: true })
  cached = { auth: getAuth(app), db }
  return cached
}
