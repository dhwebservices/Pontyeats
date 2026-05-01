import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TestOrderButton } from './test-order-button';
import { ArrowRight, CheckCircle2, Clock3, EyeOff } from 'lucide-react';
import { requireRestaurantContext, hasRestaurantPermission } from '@/lib/restaurant-access';

const Page = async () => {
  const supabase = await createClient();
  const context = await requireRestaurantContext(supabase);
  const { restaurant, permissions } = context;
  const canManageOrders = hasRestaurantPermission(context, 'orders');

  const ordRes = await supabase
    .from('orders').select('*').eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false }).limit(50);
  const orders = ordRes.data || [];

  const totalRevenue = (orders || []).reduce((s, o) => s + Number(o.total || 0), 0);
  const net = (orders || []).reduce((s, o) => s + Number(o.net_amount || 0), 0);
  const pending = (orders || []).filter(o => ['placed','accepted','preparing','ready','out_for_delivery'].includes(o.status)).length;
  const completed = (orders || []).filter(o => o.status === 'completed').length;
  const awaitingApproval = !restaurant.is_approved;

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto">
      {awaitingApproval && (
        <div className="mb-8 rounded-3xl border border-primary/20 bg-primary/5 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                <Clock3 className="h-3.5 w-3.5" />
                Pending approval
              </div>
              <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-balance">Your restaurant has been submitted for review.</h2>
              <p className="mt-3 text-sm text-muted-foreground md:text-base">
                You can keep setting up your menu and delivery details now, but customers cannot see or order from your restaurant until Ponty Eats approves it.
              </p>
            </div>
            <div className="grid gap-3 rounded-2xl border bg-background p-4 text-sm text-muted-foreground md:min-w-80">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Your account and restaurant profile are live inside your dashboard.</span>
              </div>
              <div className="flex items-start gap-3">
                <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Browse food stays hidden until an admin approves your listing.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Add menu items and final settings now so you are ready to go live immediately after approval.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-10 border-b">
        <div>
          <h1 className="font-display text-4xl md:text-6xl font-semibold leading-[1] text-balance">{restaurant.name}.</h1>
          <p className="text-muted-foreground mt-3 max-w-md">
            {awaitingApproval
              ? "Your listing is waiting for approval. Finish your setup now so you're ready to accept customers the moment you go live."
              : orders.length === 0
                ? "Let's get your first order through. Click below to send a test order."
                : "Here's what's happening at your kitchen today."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManageOrders && <TestOrderButton restaurantId={restaurant.id} />}
          {canManageOrders && <Link href="/dashboard/orders"><Button variant="outline" className="rounded-full">Live orders</Button></Link>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 md:gap-x-12 gap-y-8 py-12 border-b">
        <Stat label="Revenue" value={`£${totalRevenue.toFixed(2)}`} sub={`${orders.length} orders`} />
        <Stat label="Net to you" value={`£${net.toFixed(2)}`} sub="After fees" accent />
        <Stat label="Open orders" value={pending} sub="In progress" />
        <Stat label="Completed" value={completed} sub="Lifetime" />
      </div>

      <div className="py-12">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-3xl font-semibold">Latest orders</h2>
          <Link href="/dashboard/orders" className="text-sm font-semibold inline-flex items-center gap-1 hover:text-primary">All orders <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        {orders.length === 0 ? (
          <div className="border-y py-20 text-center">
            <p className="font-display text-3xl text-muted-foreground italic">No orders yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              {canManageOrders
                ? 'Click "Send test order" to see real-time orders in action.'
                : 'Orders will appear here once your team starts receiving them.'}
            </p>
            {canManageOrders && <div className="mt-6 inline-block"><TestOrderButton restaurantId={restaurant.id} /></div>}
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
                <div className="col-span-2 text-sm text-muted-foreground capitalize">{o.fulfillment_type}</div>
                <div className="col-span-2 text-right font-semibold font-display">£{Number(o.total||0).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="py-12 border-t">
        <div className="grid md:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden">
          {permissions.can_manage_orders && (
            <QuickLink href="/dashboard/orders" title="Live orders" desc="Incoming orders update instantly. Status workflow at a glance." />
          )}
          {permissions.can_manage_menu && (
            <QuickLink
              href="/dashboard/menu"
              title="Menu"
              desc={awaitingApproval
                ? 'Build out categories, items and modifiers now so your menu is ready for approval.'
                : 'Categories, items, photos, modifiers. Toggle availability instantly.'}
            />
          )}
          {permissions.can_manage_settings && (
            <QuickLink
              href="/dashboard/settings"
              title="Settings"
              desc={awaitingApproval
                ? 'Review opening hours, delivery radius and prep time before your listing is made public.'
                : 'Hours, delivery radius, prep time, minimum order. All yours to tune.'}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value, sub, accent }) => (
  <div>
    <div className="text-sm text-muted-foreground">{label}</div>
    <div className={`font-display text-4xl md:text-5xl font-semibold mt-2 leading-none ${accent ? 'text-primary' : ''}`}>{value}</div>
    <div className="text-xs text-muted-foreground mt-2">{sub}</div>
  </div>
);
const QuickLink = ({ href, title, desc }) => (
  <Link href={href} className="group bg-background p-7 hover:bg-muted/50 transition">
    <div className="flex items-start justify-end"><ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary group-hover:translate-x-1" /></div>
    <h3 className="font-display text-2xl font-semibold mt-3">{title}</h3>
    <p className="text-sm text-muted-foreground mt-2">{desc}</p>
  </Link>
);

export default Page;
