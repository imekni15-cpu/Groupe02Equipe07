const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const admin = require('firebase-admin')

function credential() {
  const rel = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json'
  const file = path.resolve(__dirname, '../..', rel)
  if (!fs.existsSync(file)) {
    throw new Error(
      `Clé de compte de service introuvable : ${file}\n` +
      'Firebase Console > Paramètres du projet > Comptes de service > Générer une nouvelle clé privée, ' +
      'puis place le fichier dans backend/ sous le nom serviceAccountKey.json (ne jamais le commiter).'
    )
  }
  return admin.credential.cert(JSON.parse(fs.readFileSync(file, 'utf8')))
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: credential(), projectId: process.env.FIREBASE_PROJECT_ID || undefined })
}

module.exports = { admin, auth: admin.auth(), db: admin.firestore() }
