import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { getMeFn, getAuthStateFn } from '~/server/auth'
import { getMyJobsFn } from '~/server/jobs'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { formatCurrency, formatDate, getStatusColor } from '~/lib/utils'

export const Route = createFileRoute('/dashboard/')({
  beforeLoad: async () => {
    const { signedIn, onboarded, role } = await getAuthStateFn()
    if (!signedIn) throw redirect({ to: '/login' })
    if (!onboarded) throw redirect({ to: '/onboarding' })
    if (role !== 'CUSTOMER') throw redirect({ to: '/shop/dashboard' })
  },
  loader: async () => {
    const [user, jobs] = await Promise.all([getMeFn(), getMyJobsFn()])
    return { user, jobs: jobs ?? [] }
  },
  component: CustomerDashboard,
})

function CustomerDashboard() {
  const { user, jobs } = Route.useLoaderData()

  return (
    <div className="container mx-auto max-w-4xl py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">My Repair Jobs</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name}</p>
        </div>
        <Button asChild>
          <Link to="/post-job">+ Post New Job</Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-5xl mb-4">🔧</div>
            <h2 className="text-xl font-bold mb-2">No jobs yet</h2>
            <p className="text-muted-foreground mb-6">Post your first repair job and get bids from local shops.</p>
            <Button asChild><Link to="/post-job">Post a Job</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Link key={job.id} to="/jobs/$jobId" params={{ jobId: job.id }}>
              <Card className="hover:shadow-md hover:-translate-y-px transition-all cursor-pointer">
                <CardContent className="p-5 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold truncate">{job.title}</span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {job.carYear} {job.carMake} {job.carModel} · {job.category.replace('_', ' ')} · {job.city}, {job.state}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(job.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-extrabold text-primary">{job.bids.length}</div>
                    <div className="text-xs text-muted-foreground">{job.bids.length === 1 ? 'bid' : 'bids'}</div>
                    {job.bids.length > 0 && (
                      <div className="text-xs font-semibold text-emerald-600 mt-1">
                        from {formatCurrency(Math.min(...job.bids.map(b => b.amount)))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
