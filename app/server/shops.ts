import { createServerFn } from '@tanstack/start'
import { z } from 'zod'
import { eq, avg, count } from 'drizzle-orm'
import { db } from '~/lib/db'
import { shops, reviews } from '~/db/schema'
import { getCurrentUser } from '~/lib/auth'

const shopSchema = z.object({
  name:        z.string().min(2),
  description: z.string().optional(),
  address:     z.string().min(5),
  city:        z.string().min(2),
  state:       z.string().length(2),
  zipCode:     z.string().min(5),
  phone:       z.string().min(10),
})

export const createShopFn = createServerFn({ method: 'POST' })
  .validator(shopSchema)
  .handler(async ({ data }) => {
    const user = await getCurrentUser()
    if (!user || user.role !== 'SHOP') throw new Error('Unauthorized')

    const existing = await db.query.shops.findFirst({ where: eq(shops.userId, user.id) })
    if (existing) throw new Error('Shop profile already exists')

    const [shop] = await db.insert(shops).values({ ...data, userId: user.id }).returning()
    return shop
  })

export const getMyShopFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const user = await getCurrentUser()
    if (!user || user.role !== 'SHOP') throw new Error('Unauthorized')

    return db.query.shops.findFirst({
      where: eq(shops.userId, user.id),
      with: { bids: { with: { job: true } }, reviews: { orderBy: (r, { desc }) => [desc(r.createdAt)] } },
    })
  })

export const updateShopFn = createServerFn({ method: 'POST' })
  .validator(shopSchema)
  .handler(async ({ data }) => {
    const user = await getCurrentUser()
    if (!user || user.role !== 'SHOP') throw new Error('Unauthorized')

    const shop = await db.query.shops.findFirst({ where: eq(shops.userId, user.id) })
    if (!shop) throw new Error('Shop not found')

    const [updated] = await db.update(shops).set(data).where(eq(shops.id, shop.id)).returning()
    return updated
  })

export const getShopFn = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    return db.query.shops.findFirst({
      where: eq(shops.id, data.id),
      with: { reviews: { orderBy: (r, { desc }) => [desc(r.createdAt)], limit: 20 } },
    })
  })

export const submitReviewFn = createServerFn({ method: 'POST' })
  .validator(z.object({ jobId: z.string().uuid(), shopId: z.string().uuid(), rating: z.number().int().min(1).max(5), comment: z.string().optional() }))
  .handler(async ({ data }) => {
    const user = await getCurrentUser()
    if (!user || user.role !== 'CUSTOMER') throw new Error('Unauthorized')

    const [review] = await db.insert(reviews).values(data).returning()

    // Recalculate shop rating
    const allReviews = await db.query.reviews.findMany({ where: eq(reviews.shopId, data.shopId) })
    const newRating = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
    await db.update(shops).set({
      rating: Math.round(newRating * 10) / 10,
      reviewCount: allReviews.length,
    }).where(eq(shops.id, data.shopId))

    return review
  })
