import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowUpRight, MapPin, Search, Star } from 'lucide-react';

const FOOD_IMAGES = {
  burger: 'https://images.unsplash.com/photo-1700513970028-d8a630d21c6e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwYnVyZ2VyfGVufDB8fHxvcmFuZ2V8MTc3NzU0MTkxMXww&ixlib=rb-4.1.0&q=85&w=900',
  burger2: 'https://images.unsplash.com/photo-1648580852350-3098af89f110?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwyfHxnb3VybWV0JTIwYnVyZ2VyfGVufDB8fHxvcmFuZ2V8MTc3NzU0MTkxMXww&ixlib=rb-4.1.0&q=85&w=900',
  burger3: 'https://images.pexels.com/photos/31138240/pexels-photo-31138240.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  burger4: 'https://images.pexels.com/photos/29368033/pexels-photo-29368033.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  pizza: 'https://images.unsplash.com/photo-1700513971573-4f941ab7d282?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxuZWFwb2xpdGFuJTIwcGl6emF8ZW58MHx8fG9yYW5nZXwxNzc3NTQxOTE3fDA&ixlib=rb-4.1.0&q=85&w=900',
  pizza2: 'https://images.pexels.com/photos/32449727/pexels-photo-32449727.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  curry: 'https://images.pexels.com/photos/31029754/pexels-photo-31029754.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  curry2: 'https://images.pexels.com/photos/31653130/pexels-photo-31653130.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
};

const CUISINES = [
  { label: 'Burgers', img: FOOD_IMAGES.burger, count: 'Smashed, stacked, sauced' },
  { label: 'Pizza', img: FOOD_IMAGES.pizza, count: 'Wood-fired & late-night slices' },
  { label: 'Indian', img: FOOD_IMAGES.curry, count: 'Tandoori, biryani, balti' },
  { label: 'Welsh & British', img: FOOD_IMAGES.burger3, count: 'Pies, cawl, Sunday roasts' },
  { label: 'Late night', img: FOOD_IMAGES.burger2, count: 'Open when you need it' },
  { label: 'Sweet things', img: FOOD_IMAGES.pizza2, count: 'Bakeries, ice cream, treats' },
];

const Page = () => (
  <div className="min-h-screen bg-background">
    {/* NAV */}
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-2xl tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-sans font-bold text-base">P</span>
          Ponty Eats
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <a href="#cuisines" className="text-muted-foreground hover:text-foreground">Browse</a>
          <a href="#partner" className="text-muted-foreground hover:text-foreground">For restaurants</a>
          <a href="#story" className="text-muted-foreground hover:text-foreground">Our story</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:inline-flex"><Button variant="ghost" size="sm">Log in</Button></Link>
          <Link href="/signup"><Button size="sm" className="rounded-full px-5">List your restaurant</Button></Link>
        </div>
      </div>
    </header>

    {/* HERO — editorial, image-led */}
    <section className="relative overflow-hidden">
      {/* Floating food chips */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="absolute left-[6%] top-[18%] float-slow" style={{'--r': '-8deg'}}>
          <img src={FOOD_IMAGES.burger} alt="" className="h-44 w-44 rounded-3xl object-cover shadow-2xl ring-8 ring-background" />
        </div>
        <div className="absolute right-[5%] top-[12%] float-slow" style={{'--r': '6deg', animationDelay: '1.2s'}}>
          <img src={FOOD_IMAGES.curry} alt="" className="h-52 w-52 rounded-3xl object-cover shadow-2xl ring-8 ring-background" />
        </div>
        <div className="absolute right-[12%] bottom-[8%] float-slow" style={{'--r': '-4deg', animationDelay: '2.4s'}}>
          <img src={FOOD_IMAGES.pizza} alt="" className="h-40 w-40 rounded-3xl object-cover shadow-2xl ring-8 ring-background" />
        </div>
        <div className="absolute left-[10%] bottom-[10%] float-slow" style={{'--r': '4deg', animationDelay: '0.6s'}}>
          <img src={FOOD_IMAGES.burger4} alt="" className="h-36 w-36 rounded-3xl object-cover shadow-2xl ring-8 ring-background" />
        </div>
      </div>

      <div className="container relative px-6 pt-12 pb-20 md:pt-20 md:pb-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <MapPin className="h-3 w-3" /> CF37 · Pontypridd
          </div>
          <h1 className="mt-7 font-display text-[clamp(3rem,9vw,7rem)] font-semibold leading-[0.95] text-balance">
            Local food.<br />
            <span className="italic text-primary">Properly</span> local.
          </h1>
          <p className="mt-7 mx-auto max-w-xl text-lg md:text-xl text-muted-foreground text-pretty leading-relaxed">
            Ponty Eats brings together the best kitchens from Taff Street to Treforest — delivered hot to your door, with fair fees that keep your local cafés alive.
          </p>

          {/* Faux address search bar */}
          <div className="mt-10 mx-auto max-w-xl">
            <div className="flex items-center gap-2 rounded-full border bg-card p-1.5 shadow-lg shadow-primary/5">
              <div className="flex items-center gap-2 px-4 flex-1">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Enter your postcode (CF37...)"
                  className="w-full bg-transparent py-3 text-sm placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <Button className="rounded-full h-11 px-6">Find food</Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">First restaurants going live very soon — drop your postcode to get notified.</p>
          </div>
        </div>
      </div>
    </section>

    {/* TICKER */}
    <section className="border-y bg-foreground text-background overflow-hidden py-4">
      <div className="flex gap-12 marquee whitespace-nowrap font-display text-3xl md:text-5xl font-semibold">
        {Array.from({ length: 2 }).map((_, k) => (
          <div key={k} className="flex gap-12 shrink-0">
            {['Burgers', '🍔', 'Pizza', '🍕', 'Curry', '🍛', 'Welsh', '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'Wraps', '🌯', 'Sweet', '🍰', 'Late night', '🌙', 'Brunch', '🥞', 'Italian', '🍝'].map((t, i) => (
              <span key={i} className="opacity-90">{t}</span>
            ))}
          </div>
        ))}
      </div>
    </section>

    {/* CUISINES */}
    <section id="cuisines" className="container py-20 md:py-28">
      <div className="flex items-end justify-between mb-10 md:mb-14 gap-6 flex-wrap">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">01 / Browse</span>
          <h2 className="font-display text-4xl md:text-6xl font-semibold mt-3 max-w-xl text-balance">Pick your craving.</h2>
        </div>
        <p className="max-w-sm text-muted-foreground">From a 2am kebab to a slow-cooked Sunday roast — Pontypridd's kitchens, all in one place.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {CUISINES.map((c, i) => (
          <a href="#" key={c.label} className="group relative overflow-hidden rounded-2xl bg-muted aspect-[4/5] md:aspect-[5/6]">
            <img src={c.img} alt={c.label} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7 text-white">
              <span className="text-xs font-mono opacity-70">0{i + 1}</span>
              <h3 className="font-display text-2xl md:text-4xl font-semibold mt-1">{c.label}</h3>
              <p className="text-sm opacity-80 mt-1">{c.count}</p>
            </div>
            <ArrowUpRight className="absolute top-5 right-5 h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition" />
          </a>
        ))}
      </div>
    </section>

    {/* THE BRIDGE — local story */}
    <section id="story" className="relative">
      <div className="relative h-[60vh] md:h-[80vh] min-h-[480px] overflow-hidden">
        <img src="/pontypridd-bridge.png" alt="The Old Bridge of Pontypridd" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />
        <div className="absolute inset-0 flex items-end">
          <div className="container pb-12 md:pb-20 text-white">
            <span className="text-xs font-semibold uppercase tracking-widest opacity-80">02 / Our story</span>
            <h2 className="font-display text-4xl md:text-7xl font-semibold mt-4 max-w-3xl text-balance leading-[0.95]">
              From <span className="italic">The Old Bridge</span> to your front door.
            </h2>
            <p className="mt-6 max-w-xl text-base md:text-lg opacity-90 leading-relaxed">
              William Edwards built that bridge in 1756 to bring our valley together. Two-hundred-and-seventy years later, we're still in the connecting business — only now, it's hot food, fair fees, and the kitchens you already love.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* COMMITMENTS — editorial 3-col */}
    <section className="container py-20 md:py-32">
      <div className="grid md:grid-cols-12 gap-10 md:gap-16">
        <div className="md:col-span-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">03 / What we promise</span>
          <h2 className="font-display text-4xl md:text-6xl font-semibold mt-3 leading-[0.95] text-balance">A fairer deal for the kitchens we love.</h2>
        </div>
        <div className="md:col-span-8 grid sm:grid-cols-3 gap-8 md:gap-12">
          {[
            { n: '6%', t: 'Flat commission', d: 'Not 25%, not 30% — six. The platforms in London take a quarter of every order. We take a sixth.' },
            { n: '0', t: 'Setup fees', d: 'No subscription, no joining fee, no nonsense. You only pay when you sell.' },
            { n: '24/7', t: 'Real-time orders', d: 'Orders pop in instantly with sound. Accept, prepare, dispatch — straight from one screen.' },
          ].map((b) => (
            <div key={b.t} className="border-t-2 border-foreground pt-6">
              <div className="font-display text-6xl md:text-7xl font-semibold text-primary leading-none">{b.n}</div>
              <h3 className="mt-4 font-semibold text-lg">{b.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* DASHBOARD PREVIEW — paired with food image */}
    <section className="bg-foreground text-background py-20 md:py-28">
      <div className="container grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest opacity-70">04 / The kitchen view</span>
          <h2 className="font-display text-4xl md:text-6xl font-semibold mt-3 leading-[0.95] text-balance">Your dashboard, ready when an order lands.</h2>
          <p className="mt-6 text-lg opacity-80 max-w-md leading-relaxed">A live order screen that doesn't need a refresh. Statuses, delays, modifiers, earnings — all yours, from any device.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 mt-8 group">
            <span className="font-semibold border-b-2 border-primary pb-1">Try it free</span>
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 bg-gradient-to-tr from-primary/30 to-transparent blur-3xl" />
          <div className="relative rounded-2xl bg-background text-foreground overflow-hidden shadow-2xl">
            <div className="border-b px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">P</div>
                <span className="font-medium text-sm">Live orders</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600"><span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Live</span>
            </div>
            <div className="p-5 space-y-3">
              {[
                { n: '#1042', name: 'Sarah J.', status: 'New', total: '£24.50', items: '2× Cheeseburger · 1× Loaded fries', tone: 'bg-primary text-primary-foreground' },
                { n: '#1041', name: 'Tom W.', status: 'Preparing', total: '£18.20', items: '1× Margherita · 1× Coke', tone: 'bg-amber-100 text-amber-700' },
                { n: '#1040', name: 'Megan R.', status: 'On the way', total: '£32.10', items: '1× Tikka Masala · 1× Naan · 1× Rice', tone: 'bg-blue-100 text-blue-700' },
              ].map((o, i) => (
                <div key={o.n} className={`rounded-xl border p-4 ${i === 0 ? 'ring-2 ring-primary/30 bg-primary/5' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{o.n} · {o.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{o.items}</div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${o.tone}`}>{o.status}</span>
                      <div className="font-bold mt-1">{o.total}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* RESTAURANT CTA */}
    <section id="partner" className="relative overflow-hidden">
      <img src={FOOD_IMAGES.burger2} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-primary/85 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-orange-600/90 to-amber-600/85" />
      <div className="container relative py-20 md:py-32 text-center text-primary-foreground">
        <span className="text-xs font-semibold uppercase tracking-widest opacity-90">05 / For restaurants</span>
        <h2 className="font-display text-5xl md:text-8xl font-semibold mt-4 leading-[0.9] text-balance max-w-4xl mx-auto">
          Run a kitchen in Pontypridd?
        </h2>
        <p className="mt-7 max-w-xl mx-auto text-lg md:text-xl opacity-90 leading-relaxed">
          Be one of the first to go live. Set up takes 5 minutes. We handle the orders and the payments — you handle the food.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="h-14 rounded-full px-9 text-base font-semibold">List your restaurant <ArrowRight className="ml-1 h-4 w-4" /></Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="ghost" className="h-14 rounded-full px-9 text-base text-white hover:bg-white/15 hover:text-white">I already have an account</Button>
          </Link>
        </div>
        <div className="mt-10 flex justify-center items-center gap-6 text-xs uppercase tracking-widest opacity-90">
          <span>Just 6%</span>
          <span className="opacity-50">·</span>
          <span>No setup fees</span>
          <span className="opacity-50">·</span>
          <span>Cancel anytime</span>
        </div>
      </div>
    </section>

    {/* FOOTER */}
    <footer className="border-t bg-background">
      <div className="container py-12 md:py-16">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-display text-2xl font-bold">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-sans text-sm">P</span>
              Ponty Eats
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              Built in Pontypridd, for Pontypridd. The local food platform that pays its kitchens fairly.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Customers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#cuisines" className="hover:text-foreground">Browse food</a></li>
              <li><a href="#" className="hover:text-foreground">How it works</a></li>
              <li><a href="#" className="hover:text-foreground">Help</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Restaurants</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/signup" className="hover:text-foreground">List your restaurant</Link></li>
              <li><Link href="/login" className="hover:text-foreground">Log in</Link></li>
              <li><a href="#partner" className="hover:text-foreground">Why us</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Ponty Eats · Made in Pontypridd 🏴󠁧󠁢󠁷󠁬󠁳󠁿</span>
          <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-current text-primary" /> Powered by your local kitchens</span>
        </div>
      </div>
    </footer>
  </div>
);

export default Page;
