import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { getAuthStateFn } from '~/server/auth'
import { getMyShopFn } from '~/server/shops'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { formatCurrency, formatDate, stars } from '~/lib/utils'

export const Route = createFileRoute('/shop/dashboard')({
  beforeLoad: async () => {
    const { signedIn, onboarded, role } = await getAuthStateFn()
    if (!signedIn) throw redirect({ to: '/login' })
    if (!onboarded) throw redirect({ to: '/onboarding' })
    if (role !== 'SHOP') throw redirect({ to: '/dashboard' })
  },
  loader: async () => {
    const shop = await getMyShopFn()
    if (!shop) throw redirect({ to: '/shop/setup' })
    return shop
  },
  component: ShopDashboard,
})

function ShopDashboard() {
  const shop = Route.useLoaderData()
  const activeBids = shop.bids.filter(b => b.status === 'PENDING')
  const acceptedBids = shop.bids.filter(b => b.status === 'ACCEPTED')

  return (
    <div className="container mx-auto max-w-4xl py-10 px-4">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{shop.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span className="text-amber-500">{stars(shop.rating)}</span>
            <span>{shop.rating.toFixed(1)} ({shop.reviewCount} reviews)</span>
            {shop.verified && <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">✓ Verified</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild><Link to="/shop/browse">Browse Jobs</Link></Button>
          <Button variant="secondary" size="sm" asChild><Link to="/shop/setup">Edit Profile</Link></Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          ['🏷️', 'Active Bids', activeBids.length, 'text-primary'],
          ['✅', 'Accepted', acceptedBids.length, 'text-emerald-600'],
          ['💬', 'Reviews', shop.reviewCount, 'text-slate-700'],
          ['⭐', 'Rating', shop.rating.toFixed(1), 'text-amber-500'],
        ].map(([icon, label, value, color]) => (
          <Card key={String(label)}>
            <CardContent className="p-5 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active bids */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Active Bids ({activeBids.length})</CardTitle></CardHeader>
        <CardContent>
          {activeBids.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No active bids. <Link to="/shop/browse" className="text-primary font-semibold hover:underline">Browse open jobs →</Link>
            </p>
          ) : activeBids.map(bid => (
            <Link key={bid.id} to="/jobs/$jobId" params={{ jobId: bid.jobId }}>
              <div className="flex items-start justify-between py-3 border-b last:border-0 hover:bg-muted/30 px-2 rounded-lg transition-colors cursor-pointer">
                <div>
                  <div className="font-semibold text-sm">{bid.job.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {bid.job.carYear} {bid.job.carMake} {bid.job.carModel} · {bid.job.category.replace('_', ' ')}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="font-bold text-primary">{formatCurrency(bid.amount)}</div>
                  <div className="text-xs text-muted-foreground">{bid.estimatedDays} days</div>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Reviews */}
      {shop.reviews.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Reviews</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {shop.reviews.slice(0, 5).map(r => (
              <div key={r.id} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-amber-500 text-sm">{stars(r.rating)}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                </div>
                {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
