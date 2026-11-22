export class HttpError extends Error {
  constructor(status, message, extra = {}) { super(message); this.status = status; this.extra = extra }
}
export const badRequest = (m, x) => new HttpError(400, m, x)
export const unauthorized = (m = 'Connecte-toi pour continuer.') => new HttpError(401, m)
export const forbidden = (m = 'Tu n’as pas accès à cette ressource.') => new HttpError(403, m)
export const notFound = (m = 'Introuvable.') => new HttpError(404, m)
export const conflict = (m, x) => new HttpError(409, m, x)
export const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
