import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { getAuthStateFn } from '~/server/auth'
import { getOpenJobsFn } from '~/server/jobs'
import { placeBidFn } from '~/server/bids'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Card, CardContent } from '~/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { formatCurrency, formatDate, getStatusColor } from '~/lib/utils'

const CATEGORIES = ['ALL','ENGINE','TRANSMISSION','BRAKES','SUSPENSION','ELECTRICAL','AC_HEATING','EXHAUST','TIRES','BODY_PAINT','OIL_CHANGE','DIAGNOSTICS','OTHER']

export const Route = createFileRoute('/shop/browse')({
  validateSearch: z.object({ category: z.string().optional() }),
  beforeLoad: async () => {
    const { signedIn, onboarded, role } = await getAuthStateFn()
    if (!signedIn) throw redirect({ to: '/login' })
    if (!onboarded) throw redirect({ to: '/onboarding' })
    if (role !== 'SHOP') throw redirect({ to: '/dashboard' })
  },
  loader: async ({ location }) => {
    const category = new URLSearchParams(location.search).get('category') ?? undefined
    return getOpenJobsFn({ data: { category } })
  },
  component: BrowseJobs,
})

function BrowseJobs() {
  const jobs = Route.useLoaderData()
  const [bidModal, setBidModal] = useState<string | null>(null)
  const [bidForm, setBidForm] = useState({ amount: '', estimatedDays: '', notes: '' })
  const [bidLoading, setBidLoading] = useState(false)
  const [bidSuccess, setBidSuccess] = useState(false)
  const [bidError, setBidError] = useState('')

  const submitBid = async (e: React.FormEvent) => {
    e.preventDefault()
    setBidError('')
    setBidLoading(true)
    try {
      await placeBidFn({
        data: {
          jobId: bidModal!,
          amount: Number(bidForm.amount),
          estimatedDays: Number(bidForm.estimatedDays),
          notes: bidForm.notes || undefined,
        }
      })
      setBidSuccess(true)
      setTimeout(() => { setBidModal(null); setBidSuccess(false); setBidForm({ amount: '', estimatedDays: '', notes: '' }) }, 1600)
    } catch (err: any) {
      setBidError(err.message ?? 'Failed to submit bid')
    } finally {
      setBidLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-10 px-4">
      <h1 className="text-2xl font-extrabold mb-1 tracking-tight">Browse Open Jobs</h1>
      <p className="text-muted-foreground mb-6">Find repair jobs in your area and place competitive bids.</p>

      {jobs.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-muted-foreground">No open jobs found. Check back soon!</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <Card key={job.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold">{job.title}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                      {job.urgency === 'ASAP' && <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">🚨 ASAP</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {job.carYear} {job.carMake} {job.carModel} · {job.category.replace('_',' ')} · 📍 {job.city}, {job.state}
                    </p>
                    <p className="text-sm text-foreground/80 line-clamp-2">{job.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>🕐 {formatDate(job.createdAt)}</span>
                      <span>💬 {job.bids.length} bids</span>
                      {job.bids.length > 0 && <span>💰 from {formatCurrency(Math.min(...job.bids.map(b => b.amount)))}</span>}
                    </div>
                  </div>
                  <Button size="sm" className="shrink-0" onClick={() => { setBidModal(job.id); setBidError(''); setBidSuccess(false) }}>
                    Place Bid
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bid Modal */}
      {bidModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold">Place Your Bid</h2>
                <button onClick={() => setBidModal(null)} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
              </div>
              {bidSuccess ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="font-semibold text-emerald-600">Bid submitted successfully!</p>
                </div>
              ) : (
                <form onSubmit={submitBid} className="space-y-4">
                  {bidError && <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg">{bidError}</div>}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Your Price ($) *</Label>
                      <Input type="number" value={bidForm.amount} onChange={e => setBidForm(f => ({ ...f, amount: e.target.value }))} required min={1} placeholder="350" />
                    </div>
                    <div className="space-y-2">
                      <Label>Est. Days *</Label>
                      <Input type="number" value={bidForm.estimatedDays} onChange={e => setBidForm(f => ({ ...f, estimatedDays: e.target.value }))} required min={1} placeholder="3" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes to Customer</Label>
                    <Textarea rows={3} value={bidForm.notes} onChange={e => setBidForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Describe your approach, experience…" />
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setBidModal(null)}>Cancel</Button>
                    <Button type="submit" disabled={bidLoading}>{bidLoading ? 'Submitting…' : '🏆 Submit Bid'}</Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
