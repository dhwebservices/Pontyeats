import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const Page = async () => {
  const admin = createAdminClient();
  const [r1, r2, r3] = await Promise.all([
    admin.from('restaurants').select('*'),
    admin.from('orders').select('*'),
    admin.from('platform_settings').select('*').eq('id', 1).maybeSingle(),
  ]);
  const rests = r1.data || [];
  const orders = r2.data || [];
  const settings = r3.data || {};

  const totalRevenue = (orders||[]).reduce((s,o)=>s+Number(o.total||0),0);
  const totalCommission = (orders||[]).reduce((s,o)=>s+Number(o.commission_amount||0),0);
  const totalNet = (orders||[]).reduce((s,o)=>s+Number(o.net_to_restaurant||0),0);
  const paidOrders = (orders||[]).filter(o => o.payment_status === 'paid');

  return (
    <div className="p-6 md:p-12 max-w-6xl">
      <h1 className="font-display text-4xl md:text-6xl font-semibold leading-[1] text-balance">Platform <span className="italic text-primary">overview</span>.</h1>
      <p className="mt-4 text-muted-foreground">{rests.length} restaurants · {orders.length} orders · {paidOrders.length} paid</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 md:gap-x-12 gap-y-8 py-12 border-b">
        <Stat label="Gross volume" value={`£${totalRevenue.toFixed(2)}`} sub={`${orders.length} orders`} />
        <Stat label="Commission earned" value={`£${totalCommission.toFixed(2)}`} sub={`${settings?.default_commission_pct || 6}% rate`} accent />
        <Stat label="Paid to restaurants (est.)" value={`£${totalNet.toFixed(2)} `} sub="Net of fees" />
        <Stat label="Restaurants" value={rests.length} sub="Total listed" />
      </div>

      <div className="py-12 grid md:grid-cols-2 gap-6">
        <Link href="/admin/orders" className="group rounded-2xl border bg-card p-6 hover:border-primary/40 transition">
          <h3 className="font-display text-2xl font-semibold">All orders →</h3>
          <p className="text-sm text-muted-foreground mt-2">View, filter, and refund every order on the platform.</p>
        </Link>
        <Link href="/admin/restaurants" className="group rounded-2xl border bg-card p-6 hover:border-primary/40 transition">
          <h3 className="font-display text-2xl font-semibold">Restaurants →</h3>
          <p className="text-sm text-muted-foreground mt-2">Approve, disable, or audit every restaurant account.</p>
        </Link>
        <Link href="/admin/settings" className="group rounded-2xl border bg-card p-6 hover:border-primary/40 transition">
          <h3 className="font-display text-2xl font-semibold">Platform settings →</h3>
          <p className="text-sm text-muted-foreground mt-2">Toggle signups, commission rate, and more.</p>
        </Link>
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

export default Page;
