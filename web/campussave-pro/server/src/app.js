import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from './config.js'
import { HttpError } from './errors.js'
import authRoutes from './routes/auth.js'
import offerRoutes from './routes/offers.js'
import orderRoutes from './routes/orders.js'
import miscRoutes from './routes/misc.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'], imgSrc: ["'self'", 'data:', 'blob:'], connectSrc: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"],
      },
    },
  }))
  app.use(cors({ origin: config.clientOrigin }))
  app.use(express.json({ limit: '20kb' }))

  app.use('/api/auth', authRoutes)
  app.use('/api', offerRoutes)
  app.use('/api', orderRoutes)
  app.use('/api', miscRoutes)
  app.use('/api', (req, res) => res.status(404).json({ message: 'Route inconnue.' }))

  // Production : le serveur sert aussi l'application React compilée
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist')
  if (fs.existsSync(dist)) {
    app.use(express.static(dist, { maxAge: '1h', index: false }))
    app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')))
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ message: err.message, ...err.extra })
    if (err.status && err.status < 500) return res.status(err.status).json({ message: err.message })
    if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Requête illisible.' })
    console.error(err)
    res.status(500).json({ message: 'Erreur interne du serveur. Réessaie dans un instant.' })
  })
  return app
}
