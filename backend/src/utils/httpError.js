class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status }
}
// Évite les try/catch dans chaque route (Express 4 n'attrape pas les erreurs async)
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
module.exports = { HttpError, ah }
