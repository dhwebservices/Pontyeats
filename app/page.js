import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChefHat, ClipboardList, BarChart3, Zap, ShieldCheck, MapPin } from 'lucide-react';

const Page = () => (
  <div className="min-h-screen bg-background">
    {/* Nav */}
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">P</span>
          <span>Ponty Eats</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
          <Link href="/signup"><Button size="sm" className="rounded-full px-5">Get started</Button></Link>
        </div>
      </div>
    </header>

    {/* Hero */}
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/30 via-orange-200/40 to-amber-100/0 blur-3xl" />
      <div className="container relative pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Now onboarding restaurants in Pontypridd
          </div>
          <h1 className="mt-6 text-balance text-5xl md:text-7xl font-bold tracking-tight">
            The local food platform built for <span className="bg-gradient-to-br from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">Pontypridd</span>.
          </h1>
          <p className="mt-6 text-balance text-lg md:text-xl text-muted-foreground">
            Run your kitchen, manage orders in real time, and grow your business — without the eye-watering 30% commissions.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="h-12 rounded-full px-7 text-base">
                List your restaurant <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-12 rounded-full px-7 text-base">
                I already have an account
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Just 6% commission · No setup fees · Cancel anytime
          </p>
        </div>

        {/* Mock dashboard preview */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="absolute inset-x-10 -top-6 h-12 rounded-full bg-primary/20 blur-2xl" />
          <div className="relative rounded-2xl border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <div className="ml-3 text-xs text-muted-foreground">dashboard.pontyeats.co.uk</div>
            </div>
            <div className="grid md:grid-cols-[220px_1fr]">
              <div className="hidden md:block border-r p-4 space-y-2 bg-muted/20">
                {['Overview','Live orders','Menu','Settings'].map((it,i) => (
                  <div key={it} className={`px-3 py-2 rounded-lg text-sm ${i===1?'bg-primary text-primary-foreground font-medium':'text-muted-foreground'}`}>{it}</div>
                ))}
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Live orders</h3>
                  <span className="inline-flex items-center gap-1.5 text-xs text-green-600"><span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"/> Live</span>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    { n:'#1042', name:'Sarah J.', status:'New', time:'just now', total:'£24.50', tone:'bg-primary/10 text-primary' },
                    { n:'#1041', name:'Tom W.', status:'Preparing', time:'4 min', total:'£18.20', tone:'bg-amber-100 text-amber-700' },
                    { n:'#1040', name:'Megan R.', status:'On the way', time:'12 min', total:'£32.10', tone:'bg-blue-100 text-blue-700' },
                  ].map(o => (
                    <div key={o.n} className="flex items-center justify-between rounded-xl border p-3">
                      <div>
                        <div className="font-medium">{o.n} · {o.name}</div>
                        <div className="text-xs text-muted-foreground">{o.time}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${o.tone}`}>{o.status}</span>
                        <span className="font-semibold">{o.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="border-t bg-card">
      <div className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Everything you need to run a modern kitchen</h2>
          <p className="mt-4 text-muted-foreground">Powerful tools wrapped in a beautiful, simple interface.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { icon: Zap, title: 'Live order dashboard', desc: 'Real-time orders pop in instantly. Accept, prepare, dispatch — all with one click.' },
            { icon: ChefHat, title: 'Effortless menu builder', desc: 'Categories, items, modifiers, photos. Toggle availability in a tap.' },
            { icon: BarChart3, title: 'Transparent earnings', desc: 'See revenue, our 6% commission, Stripe fees and your net payout — every order, every day.' },
            { icon: ClipboardList, title: 'Status workflows', desc: 'Pending → Accepted → Preparing → On the way → Completed. Customers stay in the loop automatically.' },
            { icon: MapPin, title: 'Pontypridd-first', desc: 'A platform built for our town — not a faceless megacorp 200 miles away.' },
            { icon: ShieldCheck, title: 'You stay in control', desc: 'Set delivery radius, prep time, opening hours, minimum order — all yours to tune.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group rounded-2xl border bg-background p-6 transition hover:border-primary/40 hover:shadow-lg">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="container py-24">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-orange-600 px-8 py-16 text-center text-primary-foreground md:px-16">
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <h2 className="relative text-3xl md:text-5xl font-bold">Be one of the first restaurants on Ponty Eats.</h2>
        <p className="relative mt-4 max-w-xl mx-auto opacity-90">Set up takes less than 5 minutes. We'll handle payments and customers — you handle the food.</p>
        <Link href="/signup" className="relative inline-block mt-8">
          <Button size="lg" variant="secondary" className="h-12 rounded-full px-8 text-base">Start onboarding <ArrowRight className="ml-1 h-4 w-4" /></Button>
        </Link>
      </div>
    </section>

    <footer className="border-t py-8">
      <div className="container text-xs text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-2">
        <div>© {new Date().getFullYear()} Ponty Eats · Made in Pontypridd</div>
        <div>Powered by local restaurants</div>
      </div>
    </footer>
  </div>
);

export default Page;
