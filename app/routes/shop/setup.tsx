import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getAuthStateFn } from '~/server/auth'
import { getMyShopFn, createShopFn, updateShopFn } from '~/server/shops'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'

export const Route = createFileRoute('/shop/setup')({
  beforeLoad: async () => {
    const { signedIn, onboarded, role } = await getAuthStateFn()
    if (!signedIn) throw redirect({ to: '/login' })
    if (!onboarded) throw redirect({ to: '/onboarding' })
    if (role !== 'SHOP') throw redirect({ to: '/dashboard' })
  },
  loader: async () => getMyShopFn().catch(() => null),
  component: ShopSetup,
})

function ShopSetup() {
  const existing = Route.useLoaderData()
  const router = useRouter()
  const [form, setForm] = useState({
    name: existing?.name ?? '', description: existing?.description ?? '',
    address: existing?.address ?? '', city: existing?.city ?? '',
    state: existing?.state ?? '', zipCode: existing?.zipCode ?? '', phone: existing?.phone ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (existing) await updateShopFn({ data: form })
      else await createShopFn({ data: form })
      router.navigate({ to: '/shop/dashboard' })
    } catch (err: any) {
      setError(err.message ?? 'Failed to save shop profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>{existing ? 'Edit Shop Profile' : 'Set Up Your Shop'}</CardTitle>
          <CardDescription>
            {existing ? 'Update your shop information.' : 'Complete your shop profile to start receiving job requests.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Shop Name *</Label>
              <Input value={form.name} onChange={set('name')} required placeholder="Joe's Auto Repair" />
            </div>
            <div className="space-y-2">
              <Label>About Your Shop</Label>
              <Textarea value={form.description} onChange={set('description')} rows={3}
                placeholder="Specialties, certifications, years in business…" />
            </div>
            <div className="space-y-2">
              <Label>Street Address *</Label>
              <Input value={form.address} onChange={set('address')} required placeholder="123 Main St" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1">
                <Label>City *</Label>
                <Input value={form.city} onChange={set('city')} required placeholder="Chicago" />
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Input value={form.state} onChange={set('state')} required placeholder="IL" maxLength={2} />
              </div>
              <div className="space-y-2">
                <Label>ZIP *</Label>
                <Input value={form.zipCode} onChange={set('zipCode')} required placeholder="60601" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input type="tel" value={form.phone} onChange={set('phone')} required placeholder="(555) 555-5555" />
            </div>
            <div className="flex gap-3">
              {existing && <Button type="button" variant="outline" onClick={() => router.navigate({ to: '/shop/dashboard' })}>Cancel</Button>}
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving…' : existing ? 'Save Changes' : '🚀 Launch My Shop'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
