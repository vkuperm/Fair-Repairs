import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { meRoutes } from './routes/me'
import { jobRoutes } from './routes/jobs'
import { bidRoutes } from './routes/bids'
import { shopRoutes } from './routes/shops'

const app = new Hono()

app.use('*', logger())
app.use('*', cors()) // mobile clients send a Bearer token, not cookies — open CORS is fine

app.get('/', (c) => c.json({ ok: true, service: 'fair-repairs-api' }))
app.get('/health', (c) => c.json({ status: 'ok' }))

// All API routes are mounted under /v1
const v1 = new Hono()
v1.route('/', meRoutes)
v1.route('/', jobRoutes)
v1.route('/', bidRoutes)
v1.route('/', shopRoutes)
app.route('/v1', v1)

const port = Number(process.env.PORT ?? 4000)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`fair-repairs-api listening on http://localhost:${info.port}`)
})
