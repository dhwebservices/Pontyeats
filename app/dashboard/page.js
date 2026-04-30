import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TestOrderButton } from './test-order-button';
import { ArrowRight } from 'lucide-react';

const Page = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: restaurant } = await supabase.from('restaurants').select('*').eq('owner_id', user.id).single();

  const { data: orders = [] } = await supabase
    .from('orders').select('*').eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false }).limit(50);

  const totalRevenue = (orders || []).reduce((s, o) => s + Number(o.total || 0), 0);
  const commission = (orders || []).reduce((s, o) => s + Number(o.commission_amount || 0), 0);
  const stripeFees = (orders || []).reduce((s, o) => s + Number(o.stripe_fee_estimate || 0), 0);
  const net = (orders || []).reduce((s, o) => s + Number(o.net_to_restaurant || 0), 0);
  const pending = (orders || []).filter(o => ['pending','accepted','preparing','on_the_way'].includes(o.status)).length;
  const completed = (orders || []).filter(o => o.status === 'completed').length;

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-10 border-b">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Welcome back</span>
          <h1 className="font-display text-4xl md:text-6xl font-semibold mt-2 leading-[1] text-balance">{restaurant.name}.</h1>
          <p className="text-muted-foreground mt-3 max-w-md">{orders.length === 0 ? "Let's set up your first orders. Click below to send a test order through." : "Here's what's happening at your kitchen today."}</p>
        </div>
        <div className="flex items-center gap-2">
          <TestOrderButton restaurantId={restaurant.id} />
          <Link href="/dashboard/orders"><Button variant="outline" className="rounded-full">Live orders</Button></Link>
        </div>
      </div>

      {/* Editorial stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 md:gap-x-12 gap-y-8 py-12 border-b">
        <Stat label="Revenue" value={`£${totalRevenue.toFixed(2)}`} sub={`${orders.length} orders`} />
        <Stat label="Net to you" value={`£${net.toFixed(2)}`} sub="After fees" accent />
        <Stat label="Open orders" value={pending} sub="In progress now" />
        <Stat label="Completed" value={completed} sub="Lifetime" />
      </div>

      {/* Recent orders */}
      <div className="py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent activity</span>
            <h2 className="font-display text-3xl font-semibold mt-1">Latest orders</h2>
          </div>
          <Link href="/dashboard/orders" className="text-sm font-semibold inline-flex items-center gap-1 hover:text-primary">All orders <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        {orders.length === 0 ? (
          <div className="border-y py-20 text-center">
            <p className="font-display text-3xl text-muted-foreground italic">No orders yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Click "Send test order" to see real-time orders in action.</p>
            <div className="mt-6 inline-block"><TestOrderButton restaurantId={restaurant.id} /></div>
          </div>
        ) : (
          <div className="divide-y border-y">
            {orders.slice(0, 6).map(o => (
              <div key={o.id} className="py-4 grid grid-cols-12 items-center gap-4">
                <div className="col-span-1 font-mono text-xs text-muted-foreground">#{o.order_number || o.id.slice(0,4)}</div>
                <div className="col-span-4">
                  <div className="font-semibold">{o.customer_name || 'Customer'}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                </div>
                <div className="col-span-3 text-sm text-muted-foreground capitalize">{(o.status||'').replace('_',' ')}</div>
                <div className="col-span-2 text-sm text-muted-foreground capitalize">{o.delivery_type}</div>
                <div className="col-span-2 text-right font-semibold font-display">£{Number(o.total||0).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="py-12 border-t">
        <div className="grid md:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden">
          <QuickLink href="/dashboard/orders" n="01" title="Live orders" desc="See incoming orders update instantly. Status workflow at a glance." />
          <QuickLink href="/dashboard/menu" n="02" title="Menu" desc="Categories, items, photos, modifiers. Toggle availability instantly." />
          <QuickLink href="/dashboard/settings" n="03" title="Settings" desc="Hours, delivery radius, prep time, minimum order. All yours to tune." />
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value, sub, accent }) => (
  <div>
    <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
    <div className={`font-display text-4xl md:text-5xl font-semibold mt-2 leading-none ${accent ? 'text-primary' : ''}`}>{value}</div>
    <div className="text-xs text-muted-foreground mt-2">{sub}</div>
  </div>
);

const QuickLink = ({ href, n, title, desc }) => (
  <Link href={href} className="group bg-background p-7 hover:bg-muted/50 transition">
    <div className="flex items-start justify-between">
      <span className="font-mono text-xs text-muted-foreground">{n}</span>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary group-hover:translate-x-1" />
    </div>
    <h3 className="font-display text-2xl font-semibold mt-3">{title}</h3>
    <p className="text-sm text-muted-foreground mt-2">{desc}</p>
  </Link>
);

export default Page;
