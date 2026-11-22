import nodemailer from 'nodemailer'
import { config } from '../config.js'

const { mail } = config
const transporter = mail.enabled
  ? nodemailer.createTransport(
      mail.host
        ? { host: mail.host, port: mail.port, secure: mail.secure, auth: mail.user ? { user: mail.user, pass: mail.pass } : undefined }
        : { service: 'gmail', auth: { user: mail.user, pass: mail.pass } }
    )
  : null

export const mailEnabled = Boolean(transporter)
export const outbox = [] // mode démo : derniers e-mails "envoyés" (consultables via /api/dev/outbox hors production)

export async function sendMail({ to, subject, html, text, attachments }) {
  const msg = { from: mail.from, to, subject, html, text, attachments }
  if (!transporter) {
    outbox.unshift({ to, subject, text, at: new Date().toISOString(), hasQr: Boolean(attachments?.length) })
    outbox.length = Math.min(outbox.length, 25)
    if (!config.test) console.log(`✉️  [mode démo] e-mail pour ${to} : ${subject}`)
    return { delivered: false }
  }
  await transporter.sendMail(msg)
  return { delivered: true }
}

export async function verifyMailer() {
  if (!transporter) return { ok: false, reason: 'non configuré' }
  try { await transporter.verify(); return { ok: true } } catch (e) { return { ok: false, reason: e.message } }
}
