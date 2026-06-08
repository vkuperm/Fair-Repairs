import {
  pgTable, pgEnum, text, timestamp, integer,
  real, boolean, uuid, uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ── Enums ────────────────────────────────────────────────
export const roleEnum       = pgEnum('role',       ['CUSTOMER', 'SHOP', 'ADMIN'])
export const categoryEnum   = pgEnum('category',   ['ENGINE','TRANSMISSION','BRAKES','SUSPENSION','ELECTRICAL','AC_HEATING','EXHAUST','TIRES','BODY_PAINT','OIL_CHANGE','DIAGNOSTICS','OTHER'])
export const urgencyEnum    = pgEnum('urgency',    ['ASAP','THIS_WEEK','STANDARD','FLEXIBLE'])
export const jobStatusEnum  = pgEnum('job_status', ['OPEN','BIDDING','ACCEPTED','IN_PROGRESS','COMPLETED','CANCELLED','EXPIRED'])
export const bidStatusEnum  = pgEnum('bid_status', ['PENDING','ACCEPTED','REJECTED','WITHDRAWN'])

// ── Users ────────────────────────────────────────────────
export const users = pgTable('users', {
  id:        uuid('id').primaryKey().defaultRandom(),
  clerkId:   text('clerk_id').notNull().unique(),
  email:     text('email').notNull().unique(),
  name:      text('name').notNull(),
  phone:     text('phone'),
  role:      roleEnum('role').notNull().default('CUSTOMER'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ── Shops ────────────────────────────────────────────────
export const shops = pgTable('shops', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull().references(() => users.id),
  name:        text('name').notNull(),
  description: text('description'),
  address:     text('address').notNull(),
  city:        text('city').notNull(),
  state:       text('state').notNull(),
  zipCode:     text('zip_code').notNull(),
  phone:       text('phone').notNull(),
  logo:        text('logo'),
  rating:      real('rating').notNull().default(0),
  reviewCount: integer('review_count').notNull().default(0),
  verified:    boolean('verified').notNull().default(false),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
})

// ── Jobs ─────────────────────────────────────────────────
export const jobs = pgTable('jobs', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  customerId:           uuid('customer_id').notNull().references(() => users.id),
  title:                text('title').notNull(),
  description:          text('description').notNull(),
  carMake:              text('car_make').notNull(),
  carModel:             text('car_model').notNull(),
  carYear:              integer('car_year').notNull(),
  carVin:               text('car_vin'),
  category:             categoryEnum('category').notNull(),
  urgency:              urgencyEnum('urgency').notNull().default('STANDARD'),
  status:               jobStatusEnum('status').notNull().default('OPEN'),
  photos:               text('photos'), // JSON array
  zipCode:              text('zip_code').notNull(),
  city:                 text('city').notNull(),
  state:                text('state').notNull(),
  budgetMin:            real('budget_min'),
  budgetMax:            real('budget_max'),
  acceptedBidId:        uuid('accepted_bid_id'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  createdAt:            timestamp('created_at').notNull().defaultNow(),
  updatedAt:            timestamp('updated_at').notNull().defaultNow(),
  expiresAt:            timestamp('expires_at'),
})

// ── Bids ─────────────────────────────────────────────────
export const bids = pgTable('bids', {
  id:            uuid('id').primaryKey().defaultRandom(),
  jobId:         uuid('job_id').notNull().references(() => jobs.id),
  shopId:        uuid('shop_id').notNull().references(() => shops.id),
  amount:        real('amount').notNull(),
  estimatedDays: integer('estimated_days').notNull(),
  notes:         text('notes'),
  status:        bidStatusEnum('status').notNull().default('PENDING'),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
  updatedAt:     timestamp('updated_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('bids_job_shop_idx').on(t.jobId, t.shopId)])

// ── Reviews ──────────────────────────────────────────────
export const reviews = pgTable('reviews', {
  id:        uuid('id').primaryKey().defaultRandom(),
  jobId:     uuid('job_id').notNull().unique().references(() => jobs.id),
  shopId:    uuid('shop_id').notNull().references(() => shops.id),
  rating:    integer('rating').notNull(),
  comment:   text('comment'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ── Relations ────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  shop: one(shops, { fields: [users.id], references: [shops.userId] }),
  jobs: many(jobs),
}))

export const shopsRelations = relations(shops, ({ one, many }) => ({
  user:    one(users, { fields: [shops.userId], references: [users.id] }),
  bids:    many(bids),
  reviews: many(reviews),
}))

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  customer: one(users,  { fields: [jobs.customerId], references: [users.id] }),
  bids:     many(bids),
  review:   one(reviews, { fields: [jobs.id], references: [reviews.jobId] }),
}))

export const bidsRelations = relations(bids, ({ one }) => ({
  job:  one(jobs,  { fields: [bids.jobId],  references: [jobs.id] }),
  shop: one(shops, { fields: [bids.shopId], references: [shops.id] }),
}))

export const reviewsRelations = relations(reviews, ({ one }) => ({
  job:  one(jobs,  { fields: [reviews.jobId],  references: [jobs.id] }),
  shop: one(shops, { fields: [reviews.shopId], references: [shops.id] }),
}))

// ── Types ────────────────────────────────────────────────
export type User    = typeof users.$inferSelect
export type Shop    = typeof shops.$inferSelect
export type Job     = typeof jobs.$inferSelect
export type Bid     = typeof bids.$inferSelect
export type Review  = typeof reviews.$inferSelect
export type NewUser = typeof users.$inferInsert
export type NewShop = typeof shops.$inferInsert
export type NewJob  = typeof jobs.$inferInsert
export type NewBid  = typeof bids.$inferInsert
