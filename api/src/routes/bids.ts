import { Hono } from 'hono'
import { z } from 'zod'
import { eq, ne, and } from 'drizzle-orm'
import { db, bids, jobs, shops } from '../db'
import { requireAuth, requireUser } from '../auth'

export const bidRoutes = new Hono()

const placeBidSchema = z.object({
  jobId: z.string().uuid(),
  amount: z.number().positive(),
  estimatedDays: z.number().int().positive(),
  notes: z.string().optional(),
})

// Shop: place (or update) a bid
bidRoutes.post('/bids', requireAuth, requireUser, async (c) => {
  const user = c.get('user')!
  if (user.role !== 'SHOP') return c.json({ error: 'Forbidden' }, 403)
  const parsed = placeBidSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  const data = parsed.data

  const shop = await db.query.shops.findFirst({ where: eq(shops.userId, user.id) })
  if (!shop) return c.json({ error: 'Complete your shop profile first' }, 400)

  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, data.jobId) })
  if (!job || !['OPEN', 'BIDDING'].includes(job.status)) return c.json({ error: 'Job not accepting bids' }, 400)

  const existing = await db.query.bids.findFirst({
    where: and(eq(bids.jobId, data.jobId), eq(bids.shopId, shop.id)),
  })

  let bid
  if (existing) {
    ;[bid] = await db.update(bids)
      .set({ amount: data.amount, estimatedDays: data.estimatedDays, notes: data.notes, status: 'PENDING' })
      .where(eq(bids.id, existing.id)).returning()
  } else {
    ;[bid] = await db.insert(bids)
      .values({ jobId: data.jobId, shopId: shop.id, amount: data.amount, estimatedDays: data.estimatedDays, notes: data.notes })
      .returning()
  }

  await db.update(jobs).set({ status: 'BIDDING' }).where(eq(jobs.id, data.jobId))
  return c.json(bid, 201)
})

// Customer: accept a bid
bidRoutes.post('/bids/:id/accept', requireAuth, requireUser, async (c) => {
  const user = c.get('user')!
  if (user.role !== 'CUSTOMER') return c.json({ error: 'Forbidden' }, 403)
  const bid = await db.query.bids.findFirst({ where: eq(bids.id, c.req.param('id')), with: { job: true } })
  if (!bid || bid.job.customerId !== user.id) return c.json({ error: 'Not found' }, 404)
  if (bid.job.status !== 'BIDDING') return c.json({ error: 'Job not in bidding state' }, 400)

  await db.update(bids).set({ status: 'ACCEPTED' }).where(eq(bids.id, bid.id))
  await db.update(bids).set({ status: 'REJECTED' }).where(and(eq(bids.jobId, bid.jobId), ne(bids.id, bid.id)))
  await db.update(jobs).set({ status: 'ACCEPTED', acceptedBidId: bid.id }).where(eq(jobs.id, bid.jobId))
  return c.json({ success: true })
})

// Shop: withdraw a bid
bidRoutes.post('/bids/:id/withdraw', requireAuth, requireUser, async (c) => {
  const user = c.get('user')!
  if (user.role !== 'SHOP') return c.json({ error: 'Forbidden' }, 403)
  const shop = await db.query.shops.findFirst({ where: eq(shops.userId, user.id) })
  const bid = await db.query.bids.findFirst({ where: eq(bids.id, c.req.param('id')) })
  if (!bid || bid.shopId !== shop?.id) return c.json({ error: 'Not found' }, 404)
  if (bid.status !== 'PENDING') return c.json({ error: 'Cannot withdraw accepted bid' }, 400)
  await db.update(bids).set({ status: 'WITHDRAWN' }).where(eq(bids.id, bid.id))
  return c.json({ success: true })
})
