import { createServerFn } from '@tanstack/start'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '~/lib/db'
import { users } from '~/db/schema'
import { getClerkUserId, clerkClient } from '~/lib/auth'

/** Lightweight auth state for route guards: is there a Clerk session, and is the user onboarded? */
export const getAuthStateFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const clerkId = await getClerkUserId()
    if (!clerkId) return { signedIn: false, onboarded: false, role: null as string | null }

    const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
    return { signedIn: true, onboarded: !!user, role: user?.role ?? null }
  })

/** Returns the current user (with shop relation) from the DB, or null. */
export const getMeFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const clerkId = await getClerkUserId()
    if (!clerkId) return null

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
      with: { shop: true },
    })
    return user ?? null
  })

/**
 * Called from the onboarding page after Clerk sign-up.
 * Creates the local DB user and sets the role in Clerk publicMetadata.
 */
export const completeOnboardingFn = createServerFn({ method: 'POST' })
  .validator(z.object({
    role: z.enum(['CUSTOMER', 'SHOP']),
    name: z.string().min(1),
    phone: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const clerkId = await getClerkUserId()
    if (!clerkId) throw new Error('Unauthorized')

    // Idempotent: if already onboarded, just return the existing record
    const existing = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
    if (existing) return { user: existing }

    // Pull the verified email from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkId)
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''

    const [user] = await db.insert(users).values({
      clerkId,
      email,
      name: data.name,
      phone: data.phone,
      role: data.role,
    }).returning()

    // Mirror role into Clerk publicMetadata so the client can read it without a DB call
    await clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: { role: data.role, dbId: user.id },
    })

    return { user }
  })
