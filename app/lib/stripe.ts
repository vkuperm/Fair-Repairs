import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY

// Lazily instantiate so the app still boots with a placeholder key.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!key || key === 'sk_test_placeholder') {
    throw new Error('Stripe is not configured. Add a real STRIPE_SECRET_KEY to .env')
  }
  if (!_stripe) {
    _stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' })
  }
  return _stripe
}

export const stripeConfigured = !!key && key !== 'sk_test_placeholder'
