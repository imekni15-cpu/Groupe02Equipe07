const notFound = (req, res) => res.status(404).json({ message: 'Route introuvable.' })

// Le front affiche le champ `message` tel quel
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  if (err.status) return res.status(err.status).json({ message: err.message })
  console.error(err)
  res.status(500).json({ message: 'Erreur interne du serveur.' })
}

module.exports = { notFound, errorHandler }
