import { Hono } from 'hono'
import { z } from 'zod'
import { eq, desc, and } from 'drizzle-orm'
import { db, jobs } from '../db'
import { requireAuth, requireUser } from '../auth'

export const jobRoutes = new Hono()

const jobSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  carMake: z.string().min(1),
  carModel: z.string().min(1),
  carYear: z.number().int().min(1985).max(2026),
  carVin: z.string().optional(),
  category: z.enum(['ENGINE','TRANSMISSION','BRAKES','SUSPENSION','ELECTRICAL','AC_HEATING','EXHAUST','TIRES','BODY_PAINT','OIL_CHANGE','DIAGNOSTICS','OTHER']),
  urgency: z.enum(['ASAP','THIS_WEEK','STANDARD','FLEXIBLE']).default('STANDARD'),
  zipCode: z.string().min(5),
  city: z.string().min(2),
  state: z.string().length(2),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
})

// Customer: list my jobs
jobRoutes.get('/jobs', requireAuth, requireUser, async (c) => {
  const user = c.get('user')!
  const list = await db.query.jobs.findMany({
    where: eq(jobs.customerId, user.id),
    with: { bids: { columns: { id: true, amount: true, shopId: true, status: true } } },
    orderBy: [desc(jobs.createdAt)],
  })
  return c.json(list)
})

// Shop: list open jobs (optionally filtered by category)
jobRoutes.get('/jobs/open', requireAuth, requireUser, async (c) => {
  const user = c.get('user')!
  if (user.role !== 'SHOP') return c.json({ error: 'Forbidden' }, 403)
  const category = c.req.query('category')
  const conditions = [eq(jobs.status, 'OPEN')]
  if (category && category !== 'ALL') conditions.push(eq(jobs.category, category as any))
  const list = await db.query.jobs.findMany({
    where: and(...conditions),
    with: { customer: { columns: { name: true } }, bids: { columns: { id: true, amount: true } } },
    orderBy: [desc(jobs.createdAt)],
  })
  return c.json(list)
})

// Job detail
jobRoutes.get('/jobs/:id', requireAuth, requireUser, async (c) => {
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, c.req.param('id')),
    with: {
      customer: { columns: { name: true, email: true } },
      bids: {
        with: { shop: { columns: { name: true, rating: true, reviewCount: true, city: true, id: true } } },
        orderBy: (b, { asc }) => [asc(b.amount)],
      },
      review: true,
    },
  })
  if (!job) return c.json({ error: 'Job not found' }, 404)
  return c.json(job)
})

// Customer: create job
jobRoutes.post('/jobs', requireAuth, requireUser, async (c) => {
  const user = c.get('user')!
  if (user.role !== 'CUSTOMER') return c.json({ error: 'Forbidden' }, 403)
  const parsed = jobSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)

  const [job] = await db.insert(jobs).values({
    ...parsed.data,
    customerId: user.id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }).returning()
  return c.json(job, 201)
})

// Customer: cancel job
jobRoutes.post('/jobs/:id/cancel', requireAuth, requireUser, async (c) => {
  const user = c.get('user')!
  if (user.role !== 'CUSTOMER') return c.json({ error: 'Forbidden' }, 403)
  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, c.req.param('id')) })
  if (!job || job.customerId !== user.id) return c.json({ error: 'Not found' }, 404)
  if (!['OPEN', 'BIDDING'].includes(job.status)) return c.json({ error: 'Cannot cancel at this stage' }, 400)
  const [updated] = await db.update(jobs).set({ status: 'CANCELLED' }).where(eq(jobs.id, job.id)).returning()
  return c.json(updated)
})
