import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'

export const Route = createFileRoute('/')({ component: Home })

const categories = [
  { key: 'ENGINE',       icon: '⚙️', label: 'Engine',        desc: 'Diagnostics, rebuild, tune-up' },
  { key: 'BRAKES',       icon: '🛑', label: 'Brakes',         desc: 'Pads, rotors, calipers' },
  { key: 'TRANSMISSION', icon: '🔩', label: 'Transmission',   desc: 'Fluid, rebuild, replacement' },
  { key: 'ELECTRICAL',   icon: '⚡', label: 'Electrical',     desc: 'Battery, wiring, sensors' },
  { key: 'AC_HEATING',   icon: '❄️', label: 'A/C & Heat',     desc: 'Recharge, compressor, heat core' },
  { key: 'TIRES',        icon: '🔄', label: 'Tires & Wheels', desc: 'Mount, balance, alignment' },
  { key: 'BODY_PAINT',   icon: '🎨', label: 'Body & Paint',   desc: 'Dents, collision, paint' },
  { key: 'OIL_CHANGE',   icon: '🛢️', label: 'Oil Change',     desc: 'Full service, filter, flush' },
]

const steps = [
  { icon: '📝', title: 'Post your repair',     desc: 'Describe what your car needs in under 2 minutes.' },
  { icon: '🏪', title: 'Shops compete for you', desc: 'Verified local shops submit their best bids.' },
  { icon: '✅', title: 'Pick the best deal',    desc: 'Compare price, rating & turnaround. You choose.' },
  { icon: '💳', title: 'Pay securely',          desc: 'Funds held safely until you approve the work.' },
]

function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-primary text-white py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 mb-6 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            3,200+ verified shops ready to bid
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5 tracking-tight">
            Car Repair — Let Shops<br />
            <span className="text-red-400">Compete for Your Business</span>
          </h1>
          <p className="text-lg text-white/80 mb-8 max-w-xl leading-relaxed">
            Post your repair job for free. Get bids from verified local shops. Save up to 40% on auto repairs.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold shadow-xl" asChild>
              <Link to="/register">Post a Repair Job</Link>
            </Button>
            <Button size="lg" variant="ghost" className="border-2 border-white/40 text-white hover:bg-white/10 backdrop-blur" asChild>
              <Link to="/register" search={{ role: 'shop' }}>I'm a Repair Shop</Link>
            </Button>
          </div>
          <p className="text-white/50 text-sm mt-4">✓ Free to post · ✓ No obligation · ✓ Bids in minutes</p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b py-7 px-6">
        <div className="container mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['10,000+','Jobs Posted'],['2,500+','Verified Shops'],['4.8 ★','Avg Rating'],['37%','Avg Savings']].map(([n,l]) => (
            <div key={l} className="text-center">
              <div className="text-3xl font-extrabold text-primary tracking-tight">{n}</div>
              <div className="text-sm text-muted-foreground mt-1 font-medium">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-extrabold text-center mb-2 tracking-tight">How can we help today to fix your car?</h2>
          <p className="text-center text-muted-foreground mb-10">Select a category to get targeted bids from specialized shops.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((c) => (
              <Link key={c.key} to="/register" className="group">
                <Card className="h-full hover:border-primary hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-5 flex gap-4 items-start">
                    <span className="text-3xl">{c.icon}</span>
                    <div>
                      <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{c.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{c.desc}</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-extrabold text-center mb-10 tracking-tight">How it works</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <Card key={i} className="text-center hover:-translate-y-1 hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="text-4xl mb-3">{s.icon}</div>
                  <div className="font-bold mb-2">{s.title}</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">{s.desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white/50 text-sm text-center py-7 px-6">
        © 2026 Fair-Repairs. All rights reserved.
      </footer>
    </main>
  )
}
