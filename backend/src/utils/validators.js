// Mêmes règles que le front (campussave-student/src/utils/validators.js)
const rules = {
  name: s =>
    !s || !String(s).trim() ? 'Indique ton nom.'
    : String(s).trim().length < 3 ? 'Ton nom doit faire 3 caractères minimum.'
    : !/^[\p{L}\s.'-]+$/u.test(String(s).trim()) ? 'Utilise uniquement des lettres.' : '',
  email: s =>
    !s || !String(s).trim() ? 'Indique ton email.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s).trim()) ? 'Cet email n’est pas valide.' : '',
  password: s =>
    !s ? 'Choisis un mot de passe.'
    : String(s).length < 8 ? 'Il faut 8 caractères minimum.'
    : !/[A-Za-z]/.test(s) || !/\d/.test(s) ? 'Ajoute au moins une lettre et un chiffre.' : '',
  phone: s => (s && !/^\d{8}$/.test(String(s).replace(/\s/g, '')) ? 'Le numéro doit contenir 8 chiffres.' : ''),
}

// Retourne le premier message d'erreur, ou '' si tout est valide
const firstError = checks => checks.map(([rule, value]) => rules[rule](value)).find(Boolean) || ''

module.exports = { rules, firstError }
