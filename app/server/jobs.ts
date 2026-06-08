import { createServerFn } from '@tanstack/start'
import { z } from 'zod'
import { eq, desc, and } from 'drizzle-orm'
import { db } from '~/lib/db'
import { jobs, bids } from '~/db/schema'
import { getCurrentUser } from '~/lib/auth'

const jobSchema = z.object({
  title:       z.string().min(5),
  description: z.string().min(10),
  carMake:     z.string().min(1),
  carModel:    z.string().min(1),
  carYear:     z.number().int().min(1985).max(2026),
  carVin:      z.string().optional(),
  category:    z.enum(['ENGINE','TRANSMISSION','BRAKES','SUSPENSION','ELECTRICAL','AC_HEATING','EXHAUST','TIRES','BODY_PAINT','OIL_CHANGE','DIAGNOSTICS','OTHER']),
  urgency:     z.enum(['ASAP','THIS_WEEK','STANDARD','FLEXIBLE']).default('STANDARD'),
  zipCode:     z.string().min(5),
  city:        z.string().min(2),
  state:       z.string().length(2),
  budgetMin:   z.number().optional(),
  budgetMax:   z.number().optional(),
})

export const createJobFn = createServerFn({ method: 'POST' })
  .validator(jobSchema)
  .handler(async ({ data }) => {
    const user = await getCurrentUser()
    if (!user || user.role !== 'CUSTOMER') throw new Error('Unauthorized')

    const [job] = await db.insert(jobs).values({
      ...data,
      customerId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }).returning()
    return job
  })

export const getMyJobsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    return db.query.jobs.findMany({
      where: eq(jobs.customerId, user.id),
      with: { bids: { columns: { id: true, amount: true, shopId: true, status: true } } },
      orderBy: [desc(jobs.createdAt)],
    })
  })

export const getOpenJobsFn = createServerFn({ method: 'GET' })
  .validator(z.object({ category: z.string().optional(), zipCode: z.string().optional() }))
  .handler(async ({ data }) => {
    const user = await getCurrentUser()
    if (!user || user.role !== 'SHOP') throw new Error('Unauthorized')

    const conditions = [eq(jobs.status, 'OPEN')]
    if (data.category && data.category !== 'ALL') {
      conditions.push(eq(jobs.category, data.category as any))
    }

    return db.query.jobs.findMany({
      where: and(...conditions),
      with: { customer: { columns: { name: true } }, bids: { columns: { id: true, amount: true } } },
      orderBy: [desc(jobs.createdAt)],
    })
  })

export const getJobFn = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, data.id),
      with: {
        customer: { columns: { name: true, email: true } },
        bids: {
          with: { shop: { columns: { name: true, rating: true, reviewCount: true, city: true, id: true } } },
          orderBy: (b, { asc }) => [asc(b.amount)],
        },
        review: true,
      },
    })
    if (!job) throw new Error('Job not found')
    return job
  })

export const cancelJobFn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await getCurrentUser()
    if (!user || user.role !== 'CUSTOMER') throw new Error('Unauthorized')

    const job = await db.query.jobs.findFirst({ where: eq(jobs.id, data.id) })
    if (!job || job.customerId !== user.id) throw new Error('Not found')
    if (!['OPEN', 'BIDDING'].includes(job.status)) throw new Error('Cannot cancel at this stage')

    const [updated] = await db.update(jobs).set({ status: 'CANCELLED' }).where(eq(jobs.id, data.id)).returning()
    return updated
  })
