// Compatibilité avec la collection `users` déjà utilisée par le reste de l'équipe :
// anciens documents { uid, firstName, lastName, role, createdAt (Timestamp), lastLoginAt } sans `name` ni `active`.
const iso = v => (v && typeof v.toDate === 'function' ? v.toDate().toISOString() : v)

const splitName = full => {
  const p = String(full).trim().split(/\s+/)
  return { firstName: p[0], lastName: p.slice(1).join(' ') }
}

// Document Firestore → utilisateur renvoyé par l'API (name, active et dates ISO toujours présents, fcmTokens retiré)
const toUser = (id, d) => {
  const { fcmTokens, ...rest } = d
  const name = d.name || [d.firstName, d.lastName].filter(Boolean).join(' ')
  return { ...rest, id, name, active: d.active !== false, createdAt: iso(d.createdAt), lastLoginAt: iso(d.lastLoginAt), updatedAt: iso(d.updatedAt) }
}

module.exports = { toUser, splitName }
