import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getAuthStateFn } from '~/server/auth'
import { createJobFn } from '~/server/jobs'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import CarSelector from '~/components/CarSelector'

export const Route = createFileRoute('/post-job')({
  beforeLoad: async () => {
    const { signedIn, onboarded, role } = await getAuthStateFn()
    if (!signedIn) throw redirect({ to: '/login' })
    if (!onboarded) throw redirect({ to: '/onboarding' })
    if (role !== 'CUSTOMER') throw redirect({ to: '/shop/dashboard' })
  },
  component: PostJob,
})

const CATEGORIES = ['ENGINE','TRANSMISSION','BRAKES','SUSPENSION','ELECTRICAL','AC_HEATING','EXHAUST','TIRES','BODY_PAINT','OIL_CHANGE','DIAGNOSTICS','OTHER'] as const
const URGENCIES = [['ASAP','ASAP — Emergency'],['THIS_WEEK','This week'],['STANDARD','Standard (2–4 weeks)'],['FLEXIBLE','Flexible']] as const

function PostJob() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', carMake: '', carModel: '', carYear: 0,
    carVin: '', category: 'ENGINE' as typeof CATEGORIES[number],
    urgency: 'STANDARD' as 'ASAP'|'THIS_WEEK'|'STANDARD'|'FLEXIBLE',
    zipCode: '', city: '', state: '', budgetMin: '', budgetMax: '',
  })

  const set = (k: string) => (v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const job = await createJobFn({
        data: {
          ...form,
          carYear: Number(form.carYear),
          budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
          budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
        }
      })
      router.navigate({ to: '/jobs/$jobId', params: { jobId: job.id } })
    } catch (err: any) {
      setError(err.message ?? 'Failed to post job')
    } finally {
      setLoading(false)
    }
  }

  const canGoNext1 = form.carYear > 0 && form.carMake && form.carModel

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-extrabold mb-1 tracking-tight">Post a Repair Job</h1>
      <p className="text-muted-foreground mb-6">Describe your issue and get competitive bids from local shops.</p>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {[1,2,3].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      {error && <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      <form onSubmit={submit}>
        {/* Step 1 */}
        {step === 1 && (
          <Card>
            <CardHeader><CardTitle>Step 1 — Your Vehicle</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <CarSelector
                year={form.carYear ? String(form.carYear) : ''}
                make={form.carMake}
                model={form.carModel}
                onChange={(field, value) => {
                  if (field === 'carYear') set('carYear')(Number(value))
                  else set(field)(value)
                }}
              />
              <div className="space-y-2">
                <Label>VIN <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input value={form.carVin} onChange={e => set('carVin')(e.target.value)} placeholder="17-character VIN" maxLength={17} />
              </div>
              <div className="space-y-2">
                <Label>Repair Category *</Label>
                <Select value={form.category} onValueChange={v => set('category')(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" onClick={() => setStep(2)} disabled={!canGoNext1}>
                Next: Describe the Problem →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <Card>
            <CardHeader><CardTitle>Step 2 — Describe the Problem</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Job Title *</Label>
                <Input value={form.title} onChange={e => set('title')(e.target.value)} required placeholder="e.g. Brakes squealing and grinding noise" />
              </div>
              <div className="space-y-2">
                <Label>Detailed Description *</Label>
                <Textarea rows={5} value={form.description} onChange={e => set('description')(e.target.value)} required
                  placeholder="When did it start? Any warning lights? Describe sounds, symptoms…" />
              </div>
              <div className="space-y-2">
                <Label>Urgency</Label>
                <Select value={form.urgency} onValueChange={v => set('urgency')(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {URGENCIES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>← Back</Button>
                <Button type="button" onClick={() => setStep(3)} disabled={!form.title || !form.description}>
                  Next: Location & Budget →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <Card>
            <CardHeader><CardTitle>Step 3 — Location & Budget</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-1">
                  <Label>City *</Label>
                  <Input value={form.city} onChange={e => set('city')(e.target.value)} required placeholder="Chicago" />
                </div>
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Input value={form.state} onChange={e => set('state')(e.target.value)} required placeholder="IL" maxLength={2} />
                </div>
                <div className="space-y-2">
                  <Label>ZIP *</Label>
                  <Input value={form.zipCode} onChange={e => set('zipCode')(e.target.value)} required placeholder="60601" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Budget range is optional — leaving it blank lets shops bid freely.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Budget Min ($)</Label>
                  <Input type="number" value={form.budgetMin} onChange={e => set('budgetMin')(e.target.value)} placeholder="100" min={0} />
                </div>
                <div className="space-y-2">
                  <Label>Budget Max ($)</Label>
                  <Input type="number" value={form.budgetMax} onChange={e => set('budgetMax')(e.target.value)} placeholder="500" min={0} />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>← Back</Button>
                <Button type="submit" disabled={loading || !form.city || !form.state || !form.zipCode}>
                  {loading ? 'Posting…' : '🚀 Post Job'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  )
}
