const utc = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/* Télécharge un fichier .ics : le retrait s'ajoute à Google / Apple / Outlook Agenda avec un rappel 15 min avant */
export function downloadIcs(o) {
  const at = hhmm => { const [h, m] = hhmm.split(':').map(Number); const d = new Date(o.createdAt); d.setHours(h, m, 0, 0); return d }
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CampusSave//FR', 'BEGIN:VEVENT',
    `UID:${o.code}@campussave`, `DTSTAMP:${utc(new Date())}`, `DTSTART:${utc(at(o.pickupStart))}`, `DTEND:${utc(at(o.pickupEnd))}`,
    `SUMMARY:Retrait CampusSave ${o.code}`, `LOCATION:${(o.shopName || '') + (o.shopAddress ? `, ${o.shopAddress}` : '')}`,
    `DESCRIPTION:${o.items.map(i => `${i.qty} x ${i.title}`).join(', ')}. Présente le QR code ${o.code}.`,
    'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', 'DESCRIPTION:Retrait CampusSave dans 15 minutes', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR',
  ]
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: `${o.code}.ics` })
  a.click()
  URL.revokeObjectURL(url)
}
