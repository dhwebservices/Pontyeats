'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, Clock, Bike, ChefHat, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const STATUS_STEPS = [
  { key: 'placed', label: 'Order received', icon: Clock },
  { key: 'accepted', label: 'Accepted', icon: Check },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'ready', label: 'Ready', icon: Check },
  { key: 'out_for_delivery', label: 'Out for delivery', icon: Bike },
  { key: 'completed', label: 'Delivered', icon: Check },
];

const OrderClient = ({ orderId, sessionId }) => {
  const [order, setOrder] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polls, setPolls] = useState(0);
  const supabase = createClient();

  // Initial fetch + Stripe status sync
  useEffect(() => {
    let active = true;
    let pollTimer;
    const sync = async () => {
      try {
        if (sessionId) {
          await fetch(`/api/checkout/status/${sessionId}`).catch(() => {});
        }
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (!active) return;
        if (data.order) {
          setOrder(data.order);
          setRestaurant(data.restaurant);
        }
        setLoading(false);
        setPolls(p => p + 1);
      } catch { setLoading(false); }
    };
    sync();
    pollTimer = setInterval(sync, 4000);
    // Stop polling once paid
    return () => { active = false; clearInterval(pollTimer); };
  }, [orderId, sessionId]);

  // Realtime updates from restaurant for status
  useEffect(() => {
    if (!order) return;
    const ch = supabase.channel(`order:${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, (payload) => {
        setOrder((prev) => ({ ...prev, ...payload.new }));
      }).subscribe();
    return () => supabase.removeChannel(ch);
  }, [orderId, order?.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><p className="text-muted-foreground">Order not found.</p><Link href="/restaurants" className="text-primary hover:underline mt-3 inline-block">Back to restaurants</Link></div></div>;

  const isPaid = order.payment_status === 'paid';
  const isCancelled = order.status === 'cancelled';
  const items = Array.isArray(order.items) ? order.items : [];
  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === order.status);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-sans text-sm">P</span>
            Ponty Eats
          </Link>
          <Link href="/restaurants" className="text-sm text-muted-foreground hover:text-foreground">Order again</Link>
        </div>
      </header>

      <div className="container max-w-2xl py-12 md:py-16">
        {!isPaid && !isCancelled ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="font-display text-2xl mt-6">Confirming your payment...</p>
            <p className="text-muted-foreground text-sm mt-2">This usually takes a few seconds. (poll #{polls})</p>
          </div>
        ) : isCancelled ? (
          <div className="text-center py-8">
            <AlertCircle className="h-10 w-10 mx-auto text-red-500" />
            <h1 className="font-display text-3xl mt-4">Order cancelled</h1>
            <p className="text-muted-foreground mt-2">If this is unexpected, please contact the restaurant.</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4"><Check className="h-6 w-6" /></div>
              <h1 className="font-display text-4xl md:text-5xl font-semibold text-balance leading-[1]">Order confirmed.</h1>
              <p className="text-muted-foreground mt-3">{restaurant?.name} are preparing your food now.</p>
              <p className="text-xs text-muted-foreground mt-4 font-mono">Order #{order.order_number || order.id.slice(0,6)}</p>
            </div>

            <div className="mt-12 rounded-2xl border bg-card p-6">
              <h3 className="font-display text-xl font-semibold mb-5">Tracking</h3>
              <div className="space-y-4">
                {STATUS_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const done = idx <= currentStepIdx;
                  const current = idx === currentStepIdx;
                  return (
                    <div key={step.key} className="flex items-center gap-4">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center transition ${done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} ${current ? 'ring-4 ring-primary/20 animate-pulse' : ''}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className={`font-medium ${done ? '' : 'text-muted-foreground'}`}>{step.label}{current && order.delay_minutes > 0 && <span className="ml-2 text-xs text-amber-600">+{order.delay_minutes} min delay</span>}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border bg-card p-6">
              <h3 className="font-display text-xl font-semibold mb-4">Order summary</h3>
              <div className="divide-y text-sm">
                {items.map((it, i) => (
                  <div key={i} className="py-2 flex justify-between">
                    <span><span className="text-muted-foreground">{it.quantity}×</span> {it.name}</span>
                    <span>£{(Number(it.price) * Number(it.quantity)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>£{Number(order.subtotal).toFixed(2)}</span></div>
                {Number(order.delivery_fee) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>£{Number(order.delivery_fee).toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold pt-1 border-t"><span>Total paid</span><span className="font-display">£{Number(order.total).toFixed(2)}</span></div>
              </div>
              {order.delivery_address && <div className="mt-4 pt-4 border-t text-sm text-muted-foreground"><strong className="text-foreground">Delivering to:</strong> {order.delivery_address}</div>}
            </div>

            <div className="mt-8 text-center">
              <Link href="/restaurants"><Button variant="outline" className="rounded-full">Order again</Button></Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderClient;
