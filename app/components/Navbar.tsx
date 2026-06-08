import { Link, useRouter } from '@tanstack/react-router'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'

export default function Navbar() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  const role = user?.publicMetadata?.role as string | undefined

  const handleLogout = async () => {
    await signOut()
    router.navigate({ to: '/' })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="container mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-red-700 rounded-lg flex items-center justify-center text-white text-sm shadow-md">🔧</div>
          <span className="font-extrabold text-xl tracking-tight">
            <span className="text-primary">Fair-</span><span className="text-secondary">Repairs</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2">
          {isLoaded && !user && (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/login">Log in</Link></Button>
              <Button size="sm" asChild><Link to="/register">Get Started</Link></Button>
            </>
          )}
          {isLoaded && user && !role && (
            <Button size="sm" asChild><Link to="/onboarding">Complete Setup</Link></Button>
          )}
          {role === 'CUSTOMER' && (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/dashboard">My Jobs</Link></Button>
              <Button size="sm" asChild><Link to="/post-job">+ Post a Job</Link></Button>
              <UserAvatar name={user!.fullName ?? user!.firstName ?? 'U'} onLogout={handleLogout} />
            </>
          )}
          {role === 'SHOP' && (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/shop/browse">Browse Jobs</Link></Button>
              <Button variant="ghost" size="sm" asChild><Link to="/shop/dashboard">Dashboard</Link></Button>
              <UserAvatar name={user!.fullName ?? user!.firstName ?? 'U'} onLogout={handleLogout} />
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

function UserAvatar({ name, onLogout }: { name: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative ml-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-red-700 text-white font-bold text-sm flex items-center justify-center cursor-pointer border-0"
      >{name[0].toUpperCase()}</button>
      {open && (
        <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border p-1.5 min-w-[160px] z-50">
          <div className="px-3 py-2 border-b mb-1">
            <p className="font-semibold text-sm truncate">{name}</p>
          </div>
          <button
            onClick={() => { setOpen(false); onLogout() }}
            className="w-full text-left px-3 py-2 text-sm text-destructive font-semibold hover:bg-muted rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
          >Sign out</button>
        </div>
      )}
    </div>
  )
}
