import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

const Page = async () => {
  const admin = createAdminClient();
  const res = await admin
    .from('restaurants').select('*').eq('is_approved', true).order('created_at', { ascending: false });
  const restaurants = res.data || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display font-bold text-2xl tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-sans text-base">P</span>
            Ponty Eats
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm">
            <Link href="/restaurants" className="font-semibold">Browse food</Link>
            <Link href="/signup" className="text-muted-foreground hover:text-foreground">For restaurants</Link>
          </nav>
          <Link href="/login" className="text-sm font-medium hover:text-primary">Sign in</Link>
        </div>
      </header>

      <section className="container py-12 md:py-16">
        <h1 className="font-display text-4xl md:text-6xl font-semibold leading-[1] text-balance">Eat in <span className="italic text-primary">Pontypridd</span>.</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl">{restaurants.length} {restaurants.length === 1 ? 'restaurant' : 'restaurants'} ready to feed you tonight.</p>

        <div className="mt-8 max-w-md">
          <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Search by cuisine or name..." className="flex-1 bg-transparent text-sm focus:outline-none" />
          </div>
        </div>
      </section>

      <section className="container pb-20">
        {restaurants.length === 0 ? (
          <div className="py-24 text-center border-y">
            <p className="font-display text-3xl italic text-muted-foreground">No restaurants live yet.</p>
            <p className="text-muted-foreground mt-3 text-sm">We're onboarding the first kitchens right now. Check back very soon.</p>
            <Link href="/signup" className="inline-block mt-6 text-primary hover:underline font-medium text-sm">Are you a restaurant? List yours →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {restaurants.map(r => (
              <Link key={r.id} href={`/r/${r.slug}`} className="group">
                <div className="relative aspect-[5/3] overflow-hidden rounded-2xl bg-muted">
                  {r.banner_url ? (
                    <img src={r.banner_url} alt={r.name} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-orange-300/40 flex items-center justify-center text-6xl">🍽️</div>
                  )}
                  {!r.is_open && <div className="absolute top-3 right-3 bg-black/85 text-white text-xs font-semibold px-2.5 py-1 rounded-full">Closed</div>}
                </div>
                <div className="mt-4 flex items-start gap-3">
                  {r.logo_url && <img src={r.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover ring-2 ring-background -mt-8 relative shadow" />}
                  <div className="flex-1">
                    <h3 className="font-display text-xl font-semibold leading-tight group-hover:text-primary transition">{r.name}</h3>
                    <p className="text-sm text-muted-foreground">{r.cuisine_type || 'Restaurant'} · {r.prep_time_minutes || 25} min</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      {r.delivery_enabled && <span>Delivery</span>}
                      {r.collection_enabled && <span>Collection</span>}
                      {Number(r.min_order_value) > 0 && <span>Min £{Number(r.min_order_value).toFixed(2)}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t py-6 mt-12">
        <div className="container text-xs text-muted-foreground text-center">© {new Date().getFullYear()} Ponty Eats · Made in Pontypridd</div>
      </footer>
    </div>
  );
};

export default Page;
