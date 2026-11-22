const C = { ink: '#0A1747', cobalt: '#2447F5', citron: '#FFD23F', bg: '#F2F5FB', mut: '#55628F' }
const money = n => `${Number.isInteger(n) ? n : n.toFixed(2).replace('.', ',')} DT`

const shell = (title, body) => `<!doctype html><html lang="fr"><body style="margin:0;background:${C.bg};font-family:Arial,Helvetica,sans-serif;color:${C.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#fff;border-radius:24px;overflow:hidden">
<tr><td style="background:${C.cobalt};padding:22px 28px"><span style="display:inline-block;background:${C.citron};color:${C.ink};font-weight:800;border-radius:12px 12px 4px 4px;padding:6px 10px;font-size:16px">C</span>
<span style="color:#fff;font-size:20px;font-weight:700;margin-left:8px;vertical-align:middle">Campus<b style="color:${C.citron}">Save</b></span></td></tr>
<tr><td style="padding:28px"><h1 style="margin:0 0 14px;font-size:22px;line-height:1.25">${title}</h1>${body}</td></tr>
<tr><td style="padding:16px 28px;background:${C.bg};color:${C.mut};font-size:12px">CampusSave, les invendus du campus à prix étudiant. Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre.</td></tr>
</table></td></tr></table></body></html>`

const codeBox = code => `<div style="margin:18px 0;padding:18px;border-radius:16px;background:${C.bg};text-align:center;font-family:'Courier New',monospace;font-size:34px;letter-spacing:10px;font-weight:700;color:${C.cobalt}">${code}</div>`

const PURPOSE = {
  register: { subject: 'confirme ton adresse e-mail', title: 'Bienvenue sur CampusSave', lead: 'Saisis ce code pour confirmer ton adresse e-mail et activer ton compte.' },
  login: { subject: 'connexion', title: 'Confirme ta connexion', lead: 'Quelqu’un (toi, on l’espère) vient de saisir ton mot de passe. Saisis ce code pour terminer la connexion.' },
  purchase: { subject: 'confirmation d’achat', title: 'Confirme ton achat', lead: 'Pour protéger ton compte, saisis ce code afin de valider le paiement de ta commande.' },
}

export function otpEmail({ name, code, purpose, order, ttlMin }) {
  const p = PURPOSE[purpose]
  const recap = order
    ? `<p style="margin:0 0 4px;color:${C.mut};font-size:14px">Commande ${order.code} chez ${order.shopName}</p><p style="margin:0;font-size:20px;font-weight:700">${money(order.total)}</p>` : ''
  const html = shell(p.title, `<p style="margin:0 0 8px;line-height:1.5">Salut ${name.split(' ')[0]},</p><p style="margin:0 0 8px;line-height:1.5">${p.lead}</p>${recap}${codeBox(code)}
    <p style="margin:0 0 6px;color:${C.mut};font-size:13px">Ce code expire dans ${ttlMin} minutes et ne fonctionne qu’une seule fois.</p>
    <p style="margin:0;color:${C.mut};font-size:13px">Si tu n’es pas à l’origine de cette demande, ignore cet e-mail : personne ne peut continuer sans ce code. Ne le communique jamais, même à CampusSave.</p>`)
  const text = `Salut ${name.split(' ')[0]},\n\n${p.lead}\n${order ? `Commande ${order.code} chez ${order.shopName} : ${money(order.total)}\n` : ''}\nTon code : ${code}\n\nIl expire dans ${ttlMin} minutes. Si tu n'es pas à l'origine de cette demande, ignore ce message.`
  return { subject: `${code} est ton code CampusSave (${p.subject})`, html, text }
}

export function orderEmail({ name, order }) {
  const rows = order.items.map(i => `<tr><td style="padding:6px 0">${i.qty} × ${i.title}</td><td align="right" style="padding:6px 0;font-weight:700">${money(i.unitPrice * i.qty)}</td></tr>`).join('')
  const html = shell('Commande confirmée, bon appétit !', `<p style="margin:0 0 12px;line-height:1.5">Merci ${name.split(' ')[0]}, ton paiement est validé. Présente ce QR code au commerçant pendant le créneau de retrait.</p>
    <div style="text-align:center;margin:18px 0"><img src="cid:qr-ticket" width="180" height="180" alt="QR code ${order.code}" style="border-radius:16px;border:8px solid ${C.cobalt}"><div style="font-family:'Courier New',monospace;font-size:20px;font-weight:700;margin-top:10px">${order.code}</div></div>
    <table width="100%" style="border-top:1px dashed #C9D1EA;border-bottom:1px dashed #C9D1EA;font-size:15px">${rows}<tr><td style="padding:8px 0;font-weight:700">Total</td><td align="right" style="padding:8px 0;font-weight:800;font-size:18px">${money(order.total)}</td></tr></table>
    <p style="margin:14px 0 4px"><b>${order.shopName}</b>${order.shopAddress ? `, ${order.shopAddress}` : ''}</p>
    <p style="margin:0;color:${C.mut}">Retrait aujourd’hui de <b style="color:${C.ink}">${order.pickupStart}</b> à <b style="color:${C.ink}">${order.pickupEnd}</b></p>`)
  const text = `Commande ${order.code} confirmée chez ${order.shopName}. Total ${money(order.total)}. Retrait de ${order.pickupStart} à ${order.pickupEnd}. Présente le code ${order.code} (QR en pièce jointe).`
  return { subject: `Commande ${order.code} confirmée, ton QR code`, html, text }
}
