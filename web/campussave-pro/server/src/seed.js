import bcrypt from 'bcryptjs'
import { config } from './config.js'
import { store, save, flush, resetStore, newId, nextOrderSeq } from './db.js'

const short = n => { const p = n.trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0] }
const ph = n => `/photos/${n}.jpg`

export function seed() {
  if (store.users.length) return false
  const rounds = config.test ? 4 : 10
  const hash = bcrypt.hashSync('Campus123', rounds)
  const day = 864e5
  const now = Date.now()

  const U = (id, name, email, role, extra = {}) => ({ id, name, email, role, passwordHash: hash, active: true, emailVerified: true, phone: '', university: '', createdAt: new Date(now - 40 * day).toISOString(), ...extra })
  store.users.push(
    U('u1', 'Amine Ben Salah', config.demoEmail || 'amine@essect.tn', 'student', { phone: '22145678', university: 'ESSECT' }),
    U('u2', 'Mohamed Azizi', 'm@cafe.tn', 'merchant'),
    U('u3', 'Sana Trabelsi', 'admin@campussave.tn', 'admin'),
  )

  const S = (id, name, type, address, ownerId = 'seed') => ({ id, ownerId, name, type, address, phone: '71123456', openingHours: '08:00 - 19:00', status: 'approved', createdAt: new Date(now - 30 * day).toISOString() })
  store.shops.push(
    S('s1', 'Café Chez nous', 'Cafétéria', 'Avenue ali trad, Tunis', 'u2'),
    S('s2', 'Boulangerie montfleury', 'Boulangerie', 'Avenue ali trad, Tunis'),
    S('s3', 'Restaurant montfleury', 'Restaurant', 'Avenue ali trad, Tunis'),
    S('s4', 'fast food montfleury', 'Fast-food', 'Avenue ali trad, Tunis'),
    S('s5', 'fast food montfleury', 'Fast-food', 'Avenue ali trad, Tunis'),
    S('s6', 'cafe chez nous', 'Cafétéria', 'Avenue ali trad, Tunis'),
  )

  // [id, boutique, titre, catégorie, description, prix initial, prix réduit, stock, photo, décalage (min), durée (min)]
  const O = [
    ['1', 's1', 'Panier sandwichs', 'Sandwich', '3 sandwichs variés du jour (poulet, thon, fromage), préparés ce matin.', 12, 5, 6, 'sandwiches', 0, 90],
    ['2', 's3', 'Couscous végétarien', 'Plat chaud', 'Semoule fine, sept légumes, pois chiches et raisins secs. Généreux et parfumé.', 14, 6, 8, 'couscous', 15, 90],
    
    ['3', 's4', 'Pizza du jour', 'Plat chaud', 'Deux parts généreuses, pâte maison et mozzarella fondante.', 13, 5.5, 7, 'pizza', 15, 90],
    ['4', 's1', 'Wrap poulet crudités', 'Sandwich', 'Wrap grillé au poulet mariné, crudités croquantes et sauce yaourt.', 9, 4, 9, 'wrap', 0, 90],
    ['5', 's3', 'Mousli poulet-citron', 'Plat chaud', 'Tajine mijoté au citron confit et olives vertes, avec du pain maison.', 12, 5.5, 6, 'tajine', 30, 90],
    ['6', 's2', 'Croissants et pains au chocolat', 'Pâtisserie', 'Panier de viennoiseries pur beurre de la fournée de l’après-midi.', 10, 4, 8, 'croissant', 30, 60],
    ['7', 's1', 'Café gourmand', 'Boisson', 'Un espresso serré accompagné d’une mignardise du chef.', 7, 3, 12, 'coffee', 0, 120],
    
    ['8', 's3', 'Bricks à la viande ×6', 'Plat chaud', 'Six bricks dorées à la viande hachée, œuf et persil. Croustillantes.', 10, 4, 0, 'brick', 45, 75],
    ['9', 's5', 'Smoothie bowl fruits rouges', 'Autre', 'Bowl onctueux, granola maison et graines de chia.', 11, 4.5, 1, 'smoothie', 30, 90],
    ['10', 's5', 'Bowl légumes rôtis', 'Salade', 'Quinoa, légumes rôtis du marché, avocat et citron beldi.', 12, 5, 7, 'quinoa', 15, 120],
  ]
  for (const [id, shopId, title, category, description, originalPrice, discountPrice, quantity, photo, off, len] of O)
    store.offers.push({ id, shopId, title, category, description, originalPrice, discountPrice, quantity, pickupStart: '12:00', pickupEnd: '14:00', photoUrl: ph(photo), active: true, demoSlot: [off, len], createdAt: new Date(now - Math.random() * 2 * day).toISOString() })

  const item = (offerId, qty) => {
    const o = store.offers.find(x => x.id === offerId)
    return { offerId, title: o.title, qty, unitPrice: o.discountPrice, originalPrice: o.originalPrice, photoUrl: o.photoUrl }
  }
  const mk = (student, items, status, at, extra = {}) => {
    const shopId = store.offers.find(o => o.id === items[0].offerId).shopId
    const shop = store.shops.find(s => s.id === shopId)
    const seq = nextOrderSeq()
    const d = new Date(at)
    store.orders.push({
      id: `o${seq}`, code: `CS-${seq}`, studentId: student.id, studentName: short(student.name),
      shopId, shopName: shop.name, shopAddress: shop.address, items, total: items.reduce((n, i) => n + i.unitPrice * i.qty, 0),
      status, createdAt: d.toISOString(), pickupStart: `${String(d.getHours()).padStart(2, '0')}:30`, pickupEnd: `${String(Math.min(d.getHours() + 2, 23)).padStart(2, '0')}:00`,
      paidAt: d.toISOString(), pickedUpAt: status === 'picked_up' ? d.toISOString() : undefined, payment: { brand: 'Visa', last4: '4242' }, ...extra,
    })
  }
  const at = (d, h) => { const x = new Date(now - d * day); x.setHours(h, 5, 0, 0); return x.getTime() }
  const amine = store.users[0]
  ;[[6, 12, '1', 1], [5, 13, '2', 1], [4, 18, '8', 2], [3, 12, '3', 1], [2, 19, '5', 1], [2, 9, '9', 1], [1, 13, '6', 2]].forEach(([d, h, o, q]) => mk(amine, [item(o, q)], 'picked_up', at(d, h)))
  // une commande payée, à récupérer maintenant (QR code actif pour la démo)
  mk(amine, [item('1', 1)], 'paid', now - 20 * 60000, { pickupStart: '00:00', pickupEnd: '23:59' })

  // activité des autres étudiants (stats publiques et graphique admin crédibles)
  const names = ['Yasmine K.', 'Skander M.', 'Ines R.', 'Wael T.', 'Maram H.', 'Omar B.', 'Rim S.', 'Hedi A.']
  let r = 7
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280
  for (let i = 0; i < 70; i++) {
    const o = store.offers[Math.floor(rnd() * store.offers.length)]
    mk({ id: 'seed', name: names[Math.floor(rnd() * names.length)] }, [item(o.id, 1 + Math.floor(rnd() * 2))], rnd() > 0.1 ? 'picked_up' : 'paid', at(Math.floor(rnd() * 7), 11 + Math.floor(rnd() * 8)))
  }
  save()
  return true
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  if (process.argv.includes('--reset')) resetStore()
  console.log(seed() ? '🌱 Base de démonstration créée.' : 'Base déjà initialisée (utilise --reset pour repartir de zéro).')
  flush()
}
