import { createFileRoute, redirect, useRouter, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getMeFn } from '~/server/auth'
import { getJobFn } from '~/server/jobs'
import { acceptBidFn } from '~/server/bids'
import { createPaymentIntentFn, confirmPaymentFn, markCompleteFn, getStripeConfigFn } from '~/server/payments'
import { submitReviewFn } from '~/server/shops'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { formatCurrency, formatDate, getStatusColor, stars } from '~/lib/utils'

export const Route = createFileRoute('/jobs/$jobId')({
  beforeLoad: async () => {
    const user = await getMeFn()
    if (!user) throw redirect({ to: '/login' })
    return { user }
  },
  loader: async ({ params, context }) => {
    const [job, stripeCfg] = await Promise.all([
      getJobFn({ data: { id: params.jobId } }),
      getStripeConfigFn(),
    ])
    return { job, stripeCfg, user: context.user }
  },
  component: JobDetail,
})

function CheckoutForm({ jobId, onPaid }: { jobId: string; onPaid: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [err, setErr] = useState('')

  const pay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    setErr('')
    const { error } = await stripe.confirmPayment({ elements, redirect: 'if_required' })
    if (error) {
      setErr(error.message ?? 'Payment failed')
      setPaying(false)
      return
    }
    await confirmPaymentFn({ data: { jobId } })
    onPaid()
  }

  return (
    <form onSubmit={pay} className="space-y-4 mt-4">
      <PaymentElement />
      {err && <p className="text-sm text-destructive">{err}</p>}
      <Button type="submit" variant="default" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={paying || !stripe}>
        {paying ? 'Processing…' : 'Pay & Confirm Job'}
      </Button>
    </form>
  )
}

function JobDetail() {
  const { job: initial, stripeCfg, user } = Route.useLoaderData()
  const router = useRouter()
  const [job, setJob] = useState(initial)
  const [busy, setBusy] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [review, setReview] = useState({ rating: 5, comment: '' })
  const [reviewed, setReviewed] = useState(false)

  const isOwner = user.role === 'CUSTOMER'
  const photos = job.photos ? JSON.parse(job.photos) : []
  const acceptedBid = job.bids.find((b: any) => b.status === 'ACCEPTED' || b.id === job.acceptedBidId)

  const refresh = async () => {
    const fresh = await getJobFn({ data: { id: job.id } })
    setJob(fresh)
  }

  const acceptBid = async (bidId: string) => {
    setBusy(bidId)
    await acceptBidFn({ data: { bidId } })
    await refresh()
    setBusy('')
  }

  const startPayment = async () => {
    setBusy('pay')
    const { clientSecret } = await createPaymentIntentFn({ data: { jobId: job.id } })
    setClientSecret(clientSecret!)
    setBusy('')
  }

  const markComplete = async () => {
    setBusy('complete')
    await markCompleteFn({ data: { jobId: job.id } })
    await refresh()
    setBusy('')
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptedBid) return
    await submitReviewFn({ data: { jobId: job.id, shopId: acceptedBid.shop.id, rating: review.rating, comment: review.comment } })
    setReviewed(true)
    await refresh()
  }

  const stripePromise = stripeCfg.configured ? loadStripe(stripeCfg.publishableKey) : null

  return (
    <div className="container mx-auto max-w-4xl py-10 px-4">
      <Button variant="outline" size="sm" className="mb-5" onClick={() => router.history.back()}>← Back</Button>

      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        {/* Main */}
        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-xl font-extrabold">{job.title}</h1>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${getStatusColor(job.status)}`}>
                  {job.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {job.carYear} {job.carMake} {job.carModel}{job.carVin ? ` · VIN: ${job.carVin}` : ''} · {job.category.replace('_', ' ')} · {job.urgency.replace('_', ' ')}
              </p>
              <p className="leading-relaxed mb-4">{job.description}</p>
              <div className="text-sm text-muted-foreground">📍 {job.city}, {job.state} {job.zipCode} · Posted {formatDate(job.createdAt)}</div>
              {(job.budgetMin || job.budgetMax) && (
                <div className="mt-2 text-sm font-semibold">Budget: {job.budgetMin ? formatCurrency(job.budgetMin) : '?'} – {job.budgetMax ? formatCurrency(job.budgetMax) : '?'}</div>
              )}
            </CardContent>
          </Card>

          {photos.length > 0 && (
            <Card><CardContent className="p-6">
              <h3 className="font-bold mb-3">Photos</h3>
              <div className="flex gap-2 flex-wrap">
                {photos.map((p: string, i: number) => <img key={i} src={p} className="w-28 h-20 object-cover rounded-lg" />)}
              </div>
            </CardContent></Card>
          )}

          {/* Bids */}
          <Card>
            <CardHeader><CardTitle>{job.bids.length} Bid{job.bids.length !== 1 ? 's' : ''}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {job.bids.length === 0 && <p className="text-muted-foreground text-sm">No bids yet.</p>}
              {job.bids.map((bid: any) => (
                <div key={bid.id} className={`border-2 rounded-xl p-4 ${bid.status === 'ACCEPTED' ? 'border-emerald-500 bg-emerald-50' : 'border-border'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-bold">{bid.shop.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        <span className="text-amber-500">{stars(bid.shop.rating)}</span> ({bid.shop.reviewCount}) · {bid.shop.city}
                      </div>
                      {bid.notes && <p className="text-sm mt-2">{bid.notes}</p>}
                      <p className="text-xs text-muted-foreground mt-1.5">Est. {bid.estimatedDays} day{bid.estimatedDays !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-extrabold text-primary">{formatCurrency(bid.amount)}</div>
                      {bid.status === 'ACCEPTED' && <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Accepted</span>}
                      {bid.status === 'REJECTED' && <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">Rejected</span>}
                    </div>
                  </div>
                  {isOwner && job.status === 'BIDDING' && bid.status === 'PENDING' && (
                    <Button size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700" disabled={busy === bid.id} onClick={() => acceptBid(bid.id)}>
                      {busy === bid.id ? 'Accepting…' : '✓ Accept this bid'}
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Payment */}
          {isOwner && job.status === 'ACCEPTED' && !clientSecret && (
            <Card><CardContent className="p-6">
              <h3 className="font-bold mb-2">Ready to proceed?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You accepted <strong>{acceptedBid?.shop?.name}</strong>'s bid of <strong>{formatCurrency(acceptedBid?.amount ?? 0)}</strong>.
              </p>
              {stripeCfg.configured ? (
                <Button className="w-full" disabled={busy === 'pay'} onClick={startPayment}>
                  {busy === 'pay' ? 'Loading…' : '💳 Pay Now'}
                </Button>
              ) : (
                <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg">
                  ⚠️ Stripe not configured. Add your test keys to <code>.env</code> to enable payments.
                </p>
              )}
            </CardContent></Card>
          )}

          {clientSecret && stripePromise && (
            <Card><CardContent className="p-6">
              <h3 className="font-bold">Complete Payment</h3>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm jobId={job.id} onPaid={refresh} />
              </Elements>
            </CardContent></Card>
          )}

          {isOwner && job.status === 'IN_PROGRESS' && (
            <Card><CardContent className="p-6">
              <h3 className="font-bold mb-2">Job in Progress</h3>
              <p className="text-sm text-muted-foreground mb-4">Once the repair is done, mark it complete.</p>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={busy === 'complete'} onClick={markComplete}>
                {busy === 'complete' ? 'Updating…' : '✅ Mark as Completed'}
              </Button>
            </CardContent></Card>
          )}

          {isOwner && job.status === 'COMPLETED' && !job.review && !reviewed && acceptedBid && (
            <Card><CardContent className="p-6">
              <h3 className="font-bold mb-3">Leave a Review</h3>
              <form onSubmit={submitReview} className="space-y-3">
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <Select value={String(review.rating)} onValueChange={v => setReview(r => ({ ...r, rating: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[5,4,3,2,1].map(n => <SelectItem key={n} value={String(n)}>{n} ★</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Comment</Label>
                  <Textarea rows={3} value={review.comment} onChange={e => setReview(r => ({ ...r, comment: e.target.value }))} placeholder="How was your experience?" />
                </div>
                <Button type="submit" className="w-full">Submit Review</Button>
              </form>
            </CardContent></Card>
          )}

          <Card><CardContent className="p-6">
            <h3 className="font-bold mb-3">Job Summary</h3>
            <div className="space-y-2 text-sm">
              <Row label="Category" value={job.category.replace('_', ' ')} />
              <Row label="Urgency" value={job.urgency.replace('_', ' ')} />
              <Row label="Bids" value={String(job.bids.length)} />
              {job.bids.length > 0 && <Row label="Lowest bid" value={formatCurrency(Math.min(...job.bids.map((b: any) => b.amount)))} accent />}
            </div>
          </CardContent></Card>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${accent ? 'text-emerald-600' : ''}`}>{value}</span>
    </div>
  )
}
