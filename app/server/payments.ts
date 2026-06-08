import { createServerFn } from '@tanstack/start'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '~/lib/db'
import { jobs, bids } from '~/db/schema'
import { getCurrentUser } from '~/lib/auth'
import { getStripe, stripeConfigured } from '~/lib/stripe'

/** Expose the publishable key + configured flag to the client. */
export const getStripeConfigFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    return {
      configured: stripeConfigured,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? '',
    }
  })

/**
 * Customer initiates payment for the accepted bid on a job.
 * Creates a Stripe PaymentIntent and returns its client secret.
 */
export const createPaymentIntentFn = createServerFn({ method: 'POST' })
  .validator(z.object({ jobId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await getCurrentUser()
    if (!user || user.role !== 'CUSTOMER') throw new Error('Unauthorized')

    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, data.jobId),
      with: { bids: { where: eq(bids.status, 'ACCEPTED') } },
    })
    if (!job || job.customerId !== user.id) throw new Error('Job not found')
    if (job.status !== 'ACCEPTED') throw new Error('No accepted bid on this job')

    const acceptedBid = job.bids[0]
    if (!acceptedBid) throw new Error('Accepted bid not found')

    const stripe = getStripe()
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(acceptedBid.amount * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { jobId: job.id, bidId: acceptedBid.id },
    })

    await db.update(jobs)
      .set({ stripePaymentIntentId: intent.id })
      .where(eq(jobs.id, job.id))

    return { clientSecret: intent.client_secret, amount: acceptedBid.amount }
  })

/**
 * Confirm the payment succeeded (called after Stripe confirms client-side),
 * move the job into IN_PROGRESS.
 */
export const confirmPaymentFn = createServerFn({ method: 'POST' })
  .validator(z.object({ jobId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await getCurrentUser()
    if (!user || user.role !== 'CUSTOMER') throw new Error('Unauthorized')

    const job = await db.query.jobs.findFirst({ where: eq(jobs.id, data.jobId) })
    if (!job || job.customerId !== user.id) throw new Error('Not found')
    if (!job.stripePaymentIntentId) throw new Error('No payment intent for this job')

    // Verify with Stripe that the intent actually succeeded
    const stripe = getStripe()
    const intent = await stripe.paymentIntents.retrieve(job.stripePaymentIntentId)
    if (intent.status !== 'succeeded') {
      throw new Error(`Payment not completed (status: ${intent.status})`)
    }

    await db.update(jobs).set({ status: 'IN_PROGRESS' }).where(eq(jobs.id, job.id))
    return { success: true }
  })

/**
 * Customer marks an in-progress job as completed (releases the work as done).
 */
export const markCompleteFn = createServerFn({ method: 'POST' })
  .validator(z.object({ jobId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await getCurrentUser()
    if (!user || user.role !== 'CUSTOMER') throw new Error('Unauthorized')

    const job = await db.query.jobs.findFirst({ where: eq(jobs.id, data.jobId) })
    if (!job || job.customerId !== user.id) throw new Error('Not found')
    if (job.status !== 'IN_PROGRESS') throw new Error('Job is not in progress')

    await db.update(jobs).set({ status: 'COMPLETED' }).where(eq(jobs.id, job.id))
    return { success: true }
  })
