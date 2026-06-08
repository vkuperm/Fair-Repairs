import { Hono } from 'hono'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, users } from '../db'
import { requireAuth, clerkClient } from '../auth'

export const meRoutes = new Hono()

// Auth state + current user (with shop). Returns onboarding status for routing.
meRoutes.get('/me', requireAuth, async (c) => {
  const clerkId = c.get('clerkId')
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
    with: { shop: true },
  })
  return c.json({
    signedIn: true,
    onboarded: !!user,
    role: user?.role ?? null,
    user: user ?? null,
  })
})

const onboardingSchema = z.object({
  role: z.enum(['CUSTOMER', 'SHOP']),
  name: z.string().min(1),
  phone: z.string().optional(),
})

// Create the local DB user after Clerk sign-up and mirror role into publicMetadata.
meRoutes.post('/onboarding', requireAuth, async (c) => {
  const clerkId = c.get('clerkId')
  const body = await c.req.json().catch(() => ({}))
  const parsed = onboardingSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)

  const existing = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (existing) return c.json({ user: existing })

  const clerkUser = await clerkClient.users.getUser(clerkId)
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''

  const [user] = await db
    .insert(users)
    .values({ clerkId, email, name: parsed.data.name, phone: parsed.data.phone, role: parsed.data.role })
    .returning()

  await clerkClient.users.updateUserMetadata(clerkId, {
    publicMetadata: { role: parsed.data.role, dbId: user.id },
  })

  return c.json({ user }, 201)
})
