import { createMiddleware } from 'hono/factory'
import { createClerkClient, verifyToken } from '@clerk/backend'
import { eq } from 'drizzle-orm'
import { db, users } from './db'

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

export type AppUser = typeof users.$inferSelect

// Hono context variables added by the auth middleware.
type AuthVars = {
  clerkId: string
  user: AppUser | null
}

declare module 'hono' {
  interface ContextVariableMap extends AuthVars {}
}

/**
 * Verifies the Clerk session token from the Authorization: Bearer <token> header.
 * The Expo client obtains this token via Clerk's getToken().
 * Sets `clerkId` and (if onboarded) `user` on the context. 401 if missing/invalid.
 */
export const requireAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  let clerkId: string
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    })
    clerkId = payload.sub
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  c.set('clerkId', clerkId)
  c.set('user', user ?? null)
  await next()
})

/** Like requireAuth, but also requires the user to be onboarded (exists in DB). */
export const requireUser = createMiddleware(async (c, next) => {
  const user = c.get('user')
  if (!user) return c.json({ error: 'Onboarding required' }, 403)
  await next()
})
