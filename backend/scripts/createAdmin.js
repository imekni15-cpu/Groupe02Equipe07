/* Crée (ou promeut) le compte admin.
   Usage :  ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run create-admin
        ou  node scripts/createAdmin.js admin@campussave.tn MotDePasse123
   Les identifiants viennent du .env ou des arguments : rien n'est écrit dans le code. */
const { auth, db, admin } = require('../src/config/firebase')
const { splitName } = require('../src/utils/userDoc')
const { firstError } = require('../src/utils/validators')

const email = process.env.ADMIN_EMAIL || process.argv[2]
const password = process.env.ADMIN_PASSWORD || process.argv[3]
const name = process.env.ADMIN_NAME || 'Admin CampusSave'

;(async () => {
  const err = firstError([['email', email], ['password', password]])
  if (err) { console.error('✖', err, '\n  Renseigne ADMIN_EMAIL et ADMIN_PASSWORD dans .env ou passe-les en arguments.'); process.exit(1) }

  let rec
  try {
    rec = await auth.getUserByEmail(email)
    await auth.updateUser(rec.uid, { password, displayName: name, disabled: false })
    console.log('Compte existant trouvé : mot de passe mis à jour et rôle admin appliqué.')
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e
    rec = await auth.createUser({ email, password, displayName: name })
    console.log('Compte créé.')
  }

  await auth.setCustomUserClaims(rec.uid, { role: 'admin' })
  const ref = db.collection('users').doc(rec.uid)
  const data = { uid: rec.uid, id: rec.uid, name, ...splitName(name), email, role: 'admin', active: true }
  if (!(await ref.get()).exists) data.createdAt = admin.firestore.Timestamp.now()
  await ref.set(data, { merge: true })
  console.log(`✔ Admin prêt : ${email} (uid ${rec.uid})`)
  process.exit(0)
})().catch(e => { console.error('✖', e.message); process.exit(1) })
