import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
// Single source of truth: reuse the web app's Drizzle schema.
import * as schema from '../../app/db/schema'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')

const client = postgres(connectionString)
export const db = drizzle(client, { schema })
export * from '../../app/db/schema'
