export const rules = {
  name: s =>
    !s.trim() ? 'Indique ton nom.'
    : s.trim().length < 3 ? 'Ton nom doit faire 3 caractères minimum.'
    : !/^[\p{L}\s.'-]+$/u.test(s.trim()) ? 'Utilise uniquement des lettres.' : '',
  email: s =>
    !s.trim() ? 'Indique ton email.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim()) ? 'Cet email n’est pas valide (ex. toi@fac.tn).' : '',
  password: s =>
    !s ? 'Choisis un mot de passe.'
    : s.length < 8 ? 'Il faut 8 caractères minimum.'
    : !/[A-Za-z]/.test(s) || !/\d/.test(s) ? 'Ajoute au moins une lettre et un chiffre.' : '',
  phone: s => (s && !/^\d{8}$/.test(s.replace(/\s/g, '')) ? 'Le numéro doit contenir 8 chiffres.' : ''),
  card: s => {
    const d = s.replace(/\s/g, '')
    return !d ? 'Indique le numéro de ta carte.' : !/^\d{16}$/.test(d) ? 'Le numéro contient 16 chiffres.' : !luhn(d) ? 'Ce numéro de carte est invalide.' : ''
  },
  expiry: s => {
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(s)) return 'Format attendu : MM/AA.'
    const [m, y] = s.split('/').map(Number)
    return new Date(2000 + y, m, 1) > new Date() ? '' : 'Cette carte a expiré.'
  },
}

export const luhn = n => {
  let sum = 0, alt = false
  for (let i = n.length - 1; i >= 0; i--) {
    let d = +n[i]
    if (alt) { d *= 2; if (d > 9) d -= 9 }
    sum += d
    alt = !alt
  }
  return sum % 10 === 0
}

// 0 à 4
export const passwordScore = p =>
  !p ? 0 : [p.length >= 8, /[a-z]/.test(p) && /[A-Z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p) || p.length >= 12].filter(Boolean).length
