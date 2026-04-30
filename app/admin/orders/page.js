import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const Page = async () => {
  const admin = createAdminClient();
  const res = await admin.from('orders').select('*, restaurants(name)').order('created_at', { ascending: false }).limit(200);
  const orders = res.data || [];
  return (
    <div className="p-6 md:p-12 max-w-7xl">
      <h1 className="font-display text-4xl md:text-5xl font-semibold">All orders</h1>
      <p className="text-muted-foreground mt-2">{orders.length} orders</p>
      <div className="mt-8 border-y divide-y">
        {orders.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground italic font-display text-2xl">No orders yet.</div>
        ) : orders.map(o => (
          <div key={o.id} className="py-3 grid grid-cols-12 items-center gap-4 text-sm">
            <div className="col-span-1 font-mono text-xs text-muted-foreground">#{o.order_number}</div>
            <div className="col-span-3 truncate">{o.restaurants?.name || '—'}</div>
            <div className="col-span-2 truncate">{o.customer_name}</div>
            <div className="col-span-2 capitalize text-muted-foreground">{(o.status||'').replace('_',' ')}</div>
            <div className="col-span-2 capitalize text-muted-foreground text-xs">{o.payment_status} · {o.delivery_type}</div>
            <div className="col-span-2 text-right font-display font-semibold">£{Number(o.total||0).toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Page;
