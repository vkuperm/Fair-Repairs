import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useUser } from '@clerk/clerk-react'
import { useState } from 'react'
import { getAuthStateFn, completeOnboardingFn } from '~/server/auth'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async () => {
    const { signedIn, onboarded, role } = await getAuthStateFn()
    if (!signedIn) throw redirect({ to: '/login' })
    // Already onboarded → send to the right dashboard
    if (onboarded && role === 'CUSTOMER') throw redirect({ to: '/dashboard' })
    if (onboarded && role === 'SHOP') throw redirect({ to: '/shop/dashboard' })
  },
  component: Onboarding,
})

function Onboarding() {
  const { user } = useUser()
  const router = useRouter()
  const [role, setRole] = useState<'CUSTOMER' | 'SHOP'>('CUSTOMER')
  const [name, setName] = useState(user?.fullName ?? '')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await completeOnboardingFn({ data: { role, name, phone: phone || undefined } })
      // Refresh the Clerk session so publicMetadata.role is available to the client immediately
      await user?.reload()
      await router.invalidate()
      router.navigate({ to: role === 'SHOP' ? '/shop/setup' : '/dashboard' })
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Fair-Repairs!</CardTitle>
          <CardDescription>Tell us a bit about yourself to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Role toggle */}
          <div className="flex bg-muted rounded-lg p-1 mb-6">
            {(['CUSTOMER', 'SHOP'] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                  role === r ? 'bg-white shadow text-primary' : 'text-muted-foreground'
                }`}
              >
                {r === 'CUSTOMER' ? '🚗 Car Owner' : '🔧 Repair Shop'}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Phone (optional)</Label>
              <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 555-5555" />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !name}>
              {loading ? 'Setting up…' : `Continue as ${role === 'SHOP' ? 'Repair Shop' : 'Car Owner'}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
