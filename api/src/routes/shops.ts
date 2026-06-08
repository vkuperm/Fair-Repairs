import { Hono } from 'hono'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, shops, reviews } from '../db'
import { requireAuth, requireUser } from '../auth'

export const shopRoutes = new Hono()

const shopSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().length(2),
  zipCode: z.string().min(5),
  phone: z.string().min(10),
})

// Shop: my shop profile (with bids + reviews)
shopRoutes.get('/shops/me', requireAuth, requireUser, async (c) => {
  const user = c.get('user')!
  if (user.role !== 'SHOP') return c.json({ error: 'Forbidden' }, 403)
  const shop = await db.query.shops.findFirst({
    where: eq(shops.userId, user.id),
    with: { bids: { with: { job: true } }, reviews: { orderBy: (r, { desc }) => [desc(r.createdAt)] } },
  })
  return c.json(shop ?? null)
})

// Public: shop by id
shopRoutes.get('/shops/:id', async (c) => {
  const shop = await db.query.shops.findFirst({
    where: eq(shops.id, c.req.param('id')),
    with: { reviews: { orderBy: (r, { desc }) => [desc(r.createdAt)], limit: 20 } },
  })
  if (!shop) return c.json({ error: 'Not found' }, 404)
  return c.json(shop)
})

// Shop: create profile
shopRoutes.post('/shops', requireAuth, requireUser, async (c) => {
  const user = c.get('user')!
  if (user.role !== 'SHOP') return c.json({ error: 'Forbidden' }, 403)
  const parsed = shopSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)

  const existing = await db.query.shops.findFirst({ where: eq(shops.userId, user.id) })
  if (existing) return c.json({ error: 'Shop profile already exists' }, 409)

  const [shop] = await db.insert(shops).values({ ...parsed.data, userId: user.id }).returning()
  return c.json(shop, 201)
})

// Shop: update profile
shopRoutes.put('/shops', requireAuth, requireUser, async (c) => {
  const user = c.get('user')!
  if (user.role !== 'SHOP') return c.json({ error: 'Forbidden' }, 403)
  const parsed = shopSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)

  const shop = await db.query.shops.findFirst({ where: eq(shops.userId, user.id) })
  if (!shop) return c.json({ error: 'Shop not found' }, 404)
  const [updated] = await db.update(shops).set(parsed.data).where(eq(shops.id, shop.id)).returning()
  return c.json(updated)
})

const reviewSchema = z.object({
  jobId: z.string().uuid(),
  shopId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

// Customer: submit a review and recompute shop rating
shopRoutes.post('/reviews', requireAuth, requireUser, async (c) => {
  const user = c.get('user')!
  if (user.role !== 'CUSTOMER') return c.json({ error: 'Forbidden' }, 403)
  const parsed = reviewSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  const data = parsed.data

  const [review] = await db.insert(reviews).values(data).returning()
  const all = await db.query.reviews.findMany({ where: eq(reviews.shopId, data.shopId) })
  const newRating = all.reduce((s, r) => s + r.rating, 0) / all.length
  await db.update(shops)
    .set({ rating: Math.round(newRating * 10) / 10, reviewCount: all.length })
    .where(eq(shops.id, data.shopId))
  return c.json(review, 201)
})
