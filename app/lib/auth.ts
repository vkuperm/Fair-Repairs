import { createClerkClient } from '@clerk/backend'
import { getWebRequest } from 'vinxi/http'
import { eq } from 'drizzle-orm'
import { db } from '~/lib/db'
import { users } from '~/db/schema'

export type AppUser = typeof users.$inferSelect

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
})

/** Authenticates the incoming request against Clerk and returns the Clerk userId, or null. */
export async function getClerkUserId(): Promise<string | null> {
  const request = getWebRequest()
  if (!request) return null

  const { isSignedIn, toAuth } = await clerkClient.authenticateRequest(request)
  if (!isSignedIn) return null

  return toAuth().userId ?? null
}

/** Returns the local DB user for the current Clerk session, or null. */
export async function getCurrentUser(): Promise<AppUser | null> {
  const clerkId = await getClerkUserId()
  if (!clerkId) return null

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  })
  return user ?? null
}

export { clerkClient }
