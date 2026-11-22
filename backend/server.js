require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')

require('./src/config/firebase') // initialise Firebase Admin (échoue tôt si la clé manque)
const { notFound, errorHandler } = require('./src/middlewares/error')

const app = express()
const allowed = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim())

app.use(helmet())
app.use(cors({
  origin: (origin, cb) => (!origin || allowed.includes(origin) ? cb(null, true) : cb(new Error('Origine non autorisée'))),
}))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'campussave-backend' }))
app.use('/api/auth', require('./src/routes/auth'))
app.use('/api/admin', require('./src/routes/admin'))

app.use(notFound)
app.use(errorHandler)

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`CampusSave API : http://localhost:${port}/api`))
