import { createServerFn } from '@tanstack/start'
import { z } from 'zod'
import { eq, ne, and } from 'drizzle-orm'
import { db } from '~/lib/db'
import { bids, jobs, shops } from '~/db/schema'
import { getCurrentUser } from '~/lib/auth'

export const placeBidFn = createServerFn({ method: 'POST' })
  .validator(z.object({
    jobId:         z.string().uuid(),
    amount:        z.number().positive(),
    estimatedDays: z.number().int().positive(),
    notes:         z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const user = await getCurrentUser()
    if (!user || user.role !== 'SHOP') throw new Error('Unauthorized')

    const shop = await db.query.shops.findFirst({ where: eq(shops.userId, user.id) })
    if (!shop) throw new Error('Complete your shop profile first')

    const job = await db.query.jobs.findFirst({ where: eq(jobs.id, data.jobId) })
    if (!job || !['OPEN', 'BIDDING'].includes(job.status)) throw new Error('Job not accepting bids')

    // Upsert bid
    const existing = await db.query.bids.findFirst({
      where: and(eq(bids.jobId, data.jobId), eq(bids.shopId, shop.id))
    })

    let bid
    if (existing) {
      ;[bid] = await db.update(bids)
        .set({ amount: data.amount, estimatedDays: data.estimatedDays, notes: data.notes, status: 'PENDING' })
        .where(eq(bids.id, existing.id)).returning()
    } else {
      ;[bid] = await db.insert(bids).values({ jobId: data.jobId, shopId: shop.id, ...data }).returning()
    }

    await db.update(jobs).set({ status: 'BIDDING' }).where(eq(jobs.id, data.jobId))
    return bid
  })

export const acceptBidFn = createServerFn({ method: 'POST' })
  .validator(z.object({ bidId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await getCurrentUser()
    if (!user || user.role !== 'CUSTOMER') throw new Error('Unauthorized')

    const bid = await db.query.bids.findFirst({
      where: eq(bids.id, data.bidId),
      with: { job: true },
    })
    if (!bid || bid.job.customerId !== user.id) throw new Error('Not found')
    if (bid.job.status !== 'BIDDING') throw new Error('Job not in bidding state')

    await db.update(bids).set({ status: 'ACCEPTED' }).where(eq(bids.id, bid.id))
    await db.update(bids).set({ status: 'REJECTED' })
      .where(and(eq(bids.jobId, bid.jobId), ne(bids.id, bid.id)))
    await db.update(jobs).set({ status: 'ACCEPTED', acceptedBidId: bid.id }).where(eq(jobs.id, bid.jobId))

    return { success: true }
  })

export const withdrawBidFn = createServerFn({ method: 'POST' })
  .validator(z.object({ bidId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await getCurrentUser()
    if (!user || user.role !== 'SHOP') throw new Error('Unauthorized')

    const shop = await db.query.shops.findFirst({ where: eq(shops.userId, user.id) })
    const bid = await db.query.bids.findFirst({ where: eq(bids.id, data.bidId) })
    if (!bid || bid.shopId !== shop?.id) throw new Error('Not found')
    if (bid.status !== 'PENDING') throw new Error('Cannot withdraw accepted bid')

    await db.update(bids).set({ status: 'WITHDRAWN' }).where(eq(bids.id, bid.id))
    return { success: true }
  })
