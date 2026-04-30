import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TestOrderButton } from './test-order-button';
import { ClipboardList, BookOpen, Settings, TrendingUp, Coins, Hourglass } from 'lucide-react';

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

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {restaurant.name} 👋</h1>
          <p className="text-muted-foreground mt-1">Here&rsquo;s what&rsquo;s happening at your kitchen today.</p>
        </div>
        <div className="flex items-center gap-2">
          <TestOrderButton restaurantId={restaurant.id} />
          <Link href="/dashboard/orders"><Button variant="outline">View live orders</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total revenue" value={`£${totalRevenue.toFixed(2)}`} sub={`${orders.length} orders`} />
        <StatCard icon={Coins} label="Net to you" value={`£${net.toFixed(2)}`} sub={`After 6% commission + Stripe fees`} accent />
        <StatCard icon={Hourglass} label="Open orders" value={pending} sub="Currently in progress" />
        <StatCard icon={TrendingUp} label="Commission paid" value={`£${commission.toFixed(2)}`} sub={`Stripe fees: £${stripeFees.toFixed(2)}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction href="/dashboard/orders" icon={ClipboardList} title="Live orders" desc="See incoming orders update in real time and progress them through to delivery." />
        <QuickAction href="/dashboard/menu" icon={BookOpen} title="Build your menu" desc="Add categories, items, photos, prices and modifiers. Toggle availability instantly." />
        <QuickAction href="/dashboard/settings" icon={Settings} title="Store settings" desc="Set delivery radius, prep time, opening hours and minimum order." />
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Link href="/dashboard/orders" className="text-sm text-primary hover:underline">See all →</Link>
        </div>
        {orders.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No orders yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Click &ldquo;Send test order&rdquo; above to see the live dashboard in action.</p>
          </div>
        ) : (
          <div className="divide-y">
            {orders.slice(0, 5).map(o => (
              <div key={o.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">#{o.order_number || o.id.slice(0,6)} · {o.customer_name || 'Customer'}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-muted capitalize">{(o.status||'').replace('_',' ')}</span>
                  <span className="font-semibold">£{Number(o.total||0).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, accent }) => (
  <div className={`rounded-2xl border p-5 ${accent ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20' : 'bg-card'}`}>
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <Icon className={`h-4 w-4 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
    </div>
    <div className="mt-2 text-2xl font-bold">{value}</div>
    <div className="text-xs text-muted-foreground mt-1">{sub}</div>
  </div>
);

const QuickAction = ({ href, icon: Icon, title, desc }) => (
  <Link href={href} className="group rounded-2xl border bg-card p-5 hover:border-primary/40 hover:shadow-md transition">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="mt-4 font-semibold">{title}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
  </Link>
);

export default Page;
