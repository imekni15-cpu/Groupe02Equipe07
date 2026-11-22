import { z } from 'zod'

export const CATEGORIES = ['Sandwich', 'Plat chaud', 'Salade', 'Pâtisserie', 'Boisson', 'Autre']
export const SHOP_TYPES = ['Restaurant', 'Cafétéria', 'Boulangerie', 'Fast-food']
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure invalide (format HH:MM).')

const email = z.string().trim().toLowerCase().email('Adresse e-mail invalide.').max(120)
const password = z.string().min(8, 'Le mot de passe doit faire 8 caractères minimum.').max(100)
  .refine(p => /[A-Za-z]/.test(p) && /\d/.test(p), 'Le mot de passe doit contenir une lettre et un chiffre.')

export const schemas = {
  register: z.object({
    name: z.string().trim().min(3, 'Le nom doit faire 3 caractères minimum.').max(80),
    email, password,
    phone: z.string().regex(/^\d{8}$/, 'Le téléphone doit contenir 8 chiffres.').optional().or(z.literal('')),
    university: z.string().max(60).optional(),
    role: z.enum(['student', 'merchant']).optional(),
    shop: z.object({
      name: z.string().trim().min(2, 'Indique le nom de ton commerce.').max(60),
      type: z.enum(SHOP_TYPES, { errorMap: () => ({ message: 'Choisis le type de commerce.' }) }),
      address: z.string().trim().min(5, 'Indique l’adresse de ton commerce.').max(120),
      openingHours: z.string().max(40).optional(),
    }).optional(),
  }).refine(v => v.role !== 'merchant' || v.shop, { message: 'Renseigne les informations de ton commerce.', path: ['shop'] }),
  login: z.object({ email, password: z.string().min(1, 'Indique ton mot de passe.').max(100) }),
  otp: z.object({ challengeId: z.string().min(5).max(40), code: z.string().regex(/^\d{6}$/, 'Le code contient 6 chiffres.') }),
  resend: z.object({ challengeId: z.string().min(5).max(40) }),
  profile: z.object({
    name: z.string().trim().min(3).max(80),
    phone: z.string().regex(/^\d{8}$/, 'Le téléphone doit contenir 8 chiffres.').optional().or(z.literal('')),
    university: z.string().max(60).optional(),
  }),
  password: z.object({ currentPassword: z.string().min(1), newPassword: password }),
  order: z.object({
    items: z.array(z.object({ offerId: z.string().min(1), qty: z.number().int().min(1).max(20) })).min(1, 'Ton panier est vide.').max(12),
  }),
  offer: z.object({
    title: z.string().trim().min(3, 'Le titre doit faire 3 caractères minimum.').max(80),
    category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Choisis une catégorie.' }) }),
    description: z.string().trim().max(300, 'La description est limitée à 300 caractères.').optional().default(''),
    originalPrice: z.number({ invalid_type_error: 'Le prix initial doit être un nombre.' }).positive('Le prix initial doit être positif.').max(500),
    discountPrice: z.number({ invalid_type_error: 'Le prix réduit doit être un nombre.' }).positive('Le prix réduit doit être positif.').max(500),
    quantity: z.number({ invalid_type_error: 'La quantité doit être un nombre.' }).int('La quantité doit être un nombre entier.').min(0).max(200),
    pickupStart: hhmm, pickupEnd: hhmm,
    photoUrl: z.string().regex(/^\/photos\/[a-z0-9-]+\.jpg$/, 'Photo invalide.').optional().default('/photos/sandwiches.jpg'),
    active: z.boolean().optional(),
  }).refine(v => v.discountPrice < v.originalPrice, { message: 'Le prix réduit doit être inférieur au prix initial.', path: ['discountPrice'] })
    .refine(v => v.pickupEnd > v.pickupStart, { message: 'L’heure de fin doit être après l’heure de début.', path: ['pickupEnd'] }),
  pay: z.object({
    card: z.object({ number: z.string().max(25), expiry: z.string().max(7), cvc: z.string().max(4), holder: z.string().trim().min(3, 'Indique le nom sur la carte.').max(60) }).optional(), // absente en mode Konnect
  }),
  confirmPayment: z.object({ paymentRef: z.string().min(8).max(80) }),
  confirm: z.object({ challengeId: z.string().min(5).max(40), code: z.string().regex(/^\d{6}$/, 'Le code contient 6 chiffres.') }),
  validate: z.object({ code: z.string().min(3).max(20) }),
}

export const validate = schema => (req, res, next) => {
  const r = schema.safeParse(req.body ?? {})
  if (!r.success) return next(Object.assign(new Error(r.error.issues[0].message), { status: 400 }))
  req.body = r.data
  next()
}
