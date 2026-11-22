import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const env = process.env
const prod = env.NODE_ENV === 'production'
const test = env.NODE_ENV === 'test'
if (prod && (!env.JWT_SECRET || !env.OTP_SECRET)) throw new Error('JWT_SECRET et OTP_SECRET sont obligatoires en production.')

const here = path.dirname(fileURLToPath(import.meta.url))
const user = env.SMTP_USER?.trim()
const pass = env.SMTP_PASS?.replace(/\s/g, '') // les mots de passe d'application Google sont souvent copiés avec des espaces

// ───── Firebase (Authentication + Firestore) : activé dès qu'une clé de compte de service est fournie ─────
const fbFile = env.FIREBASE_SERVICE_ACCOUNT?.trim()
const fbJson = env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
const fbPath = fbFile ? path.resolve(here, '..', fbFile) : ''
if (fbPath && !fbJson && !fs.existsSync(fbPath)) console.warn(`⚠️  Firebase ignoré : fichier introuvable (${fbPath}). Mode local activé.`)
const firebase = {
  enabled: !test && Boolean(fbJson || (fbPath && fs.existsSync(fbPath))),
  serviceAccountFile: fbPath,
  serviceAccountJson: fbJson || '',
  webApiKey: env.FIREBASE_WEB_API_KEY?.trim() || '', // « Clé API Web » du projet (publique), sert à vérifier un mot de passe
  idTokenAuth: env.FIREBASE_ID_TOKEN_AUTH === 'true', // accepte directement un ID token Firebase (appli mobile Flutter)
}
if (firebase.enabled && !firebase.webApiKey) throw new Error('FIREBASE_WEB_API_KEY est obligatoire quand Firebase est activé (Console Firebase > Paramètres du projet > Général).')

// ───── Konnect : paiement en ligne (bac à sable par défaut) ─────
const konnect = {
  apiKey: env.KONNECT_API_KEY?.trim() || '',
  walletId: env.KONNECT_WALLET_ID?.trim() || '',
  baseUrl: (env.KONNECT_BASE_URL?.trim() || 'https://api.sandbox.konnect.network/api/v2').replace(/\/$/, ''),
  apiPublicUrl: env.PUBLIC_API_URL?.trim().replace(/\/$/, '') || '', // URL publique de l'API (webhook) ; vide en local
}
konnect.enabled = Boolean(konnect.apiKey && konnect.walletId)

export const config = {
  prod,
  test,
  port: Number(env.PORT) || 5000,
  clientOrigin: env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: env.JWT_SECRET || 'dev-jwt-secret-not-for-production',
  otpSecret: env.OTP_SECRET || 'dev-otp-secret-not-for-production',
  dbFile: env.DB_FILE || fileURLToPath(new URL('../data/db.json', import.meta.url)),
  rateLimit: env.RATE_LIMIT !== 'off',
  demoEmail: env.DEMO_EMAIL?.trim() || '',
  otp: { ttlSec: 600, maxAttempts: 5, resendCooldownSec: 30, maxSends: 5 },
  holdSec: 600, // durée de garde d'une réservation non payée
  firebase,
  konnect,
  mail: {
    enabled: Boolean((user && pass) || env.SMTP_HOST),
    host: env.SMTP_HOST, port: Number(env.SMTP_PORT) || 587, secure: env.SMTP_SECURE === 'true',
    user, pass,
    from: env.MAIL_FROM || (user ? `CampusSave <${user}>` : 'CampusSave <no-reply@campussave.local>'),
  },
}
