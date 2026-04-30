'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TestOrderButton } from '../test-order-button';
import { Clock, CheckCircle2, Bike, Flame, X, ChefHat, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const STATUSES = [
  { key: 'pending', label: 'New', icon: AlertCircle, tone: 'bg-orange-100 text-orange-700 border-orange-200' },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle2, tone: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, tone: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'on_the_way', label: 'On the way', icon: Bike, tone: 'bg-purple-100 text-purple-700 border-purple-200' },
  { key: 'completed', label: 'Completed', icon: Flame, tone: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'cancelled', label: 'Cancelled', icon: X, tone: 'bg-red-100 text-red-700 border-red-200' },
];

const OrdersClient = ({ restaurant, initialOrders }) => {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState('active'); // active|all|status
  const [recentlyAdded, setRecentlyAdded] = useState(new Set());
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`orders:${restaurant.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders((prev) => [payload.new, ...prev.filter(o => o.id !== payload.new.id)]);
          setRecentlyAdded((s) => new Set(s).add(payload.new.id));
          setTimeout(() => setRecentlyAdded((s) => { const n = new Set(s); n.delete(payload.new.id); return n; }), 6000);
          toast.success('New order!', { description: `#${payload.new.order_number || payload.new.id.slice(0,6)} · £${Number(payload.new.total||0).toFixed(2)}` });
          if (typeof window !== 'undefined') {
            try {
              const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
              audio.play().catch(()=>{});
            } catch {}
          }
        } else if (payload.eventType === 'UPDATE') {
          setOrders((prev) => prev.map(o => o.id === payload.new.id ? payload.new : o));
        } else if (payload.eventType === 'DELETE') {
          setOrders((prev) => prev.filter(o => o.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurant.id]);

  const filtered = useMemo(() => {
    if (filter === 'active') return orders.filter(o => ['pending','accepted','preparing','on_the_way'].includes(o.status));
    if (filter === 'all') return orders;
    return orders.filter(o => o.status === filter);
  }, [orders, filter]);

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error(error.message);
    else toast.success(`Order ${status.replace('_',' ')}`);
  };

  const addDelay = async (id, currentDelay = 0) => {
    const newDelay = (currentDelay || 0) + 10;
    const { error } = await supabase.from('orders').update({ delay_minutes: newDelay, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error(error.message);
    else toast.success(`Added 10 min delay (total: ${newDelay} min)`);
  };

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Live orders
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Live
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">New orders appear instantly. No refresh needed.</p>
        </div>
        <TestOrderButton restaurantId={restaurant.id} />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterPill active={filter==='active'} onClick={() => setFilter('active')}>Active ({orders.filter(o=>['pending','accepted','preparing','on_the_way'].includes(o.status)).length})</FilterPill>
        <FilterPill active={filter==='all'} onClick={() => setFilter('all')}>All ({orders.length})</FilterPill>
        {STATUSES.map(s => (
          <FilterPill key={s.key} active={filter===s.key} onClick={() => setFilter(s.key)}>{s.label}</FilterPill>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card p-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <Clock className="h-6 w-6" />
          </div>
          <h3 className="font-semibold">No orders here yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Try sending a test order to see the live dashboard in action.</p>
          <div className="mt-4 inline-block"><TestOrderButton restaurantId={restaurant.id} /></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(o => (
            <OrderCard key={o.id} order={o} onUpdate={updateStatus} onDelay={addDelay} fresh={recentlyAdded.has(o.id)} />
          ))}
        </div>
      )}
    </div>
  );
};

const FilterPill = ({ active, children, onClick }) => (
  <button onClick={onClick} className={`px-3.5 py-1.5 rounded-full text-sm border transition ${active ? 'bg-foreground text-background border-foreground' : 'bg-background hover:bg-muted'}`}>{children}</button>
);

const OrderCard = ({ order, onUpdate, onDelay, fresh }) => {
  const status = STATUSES.find(s => s.key === order.status) || STATUSES[0];
  const Icon = status.icon;
  const items = Array.isArray(order.items) ? order.items : [];
  const next = {
    pending: 'accepted',
    accepted: 'preparing',
    preparing: order.delivery_type === 'delivery' ? 'on_the_way' : 'completed',
    on_the_way: 'completed',
  }[order.status];
  const nextLabel = {
    pending: 'Accept',
    accepted: 'Start preparing',
    preparing: order.delivery_type === 'delivery' ? 'Mark on the way' : 'Mark ready',
    on_the_way: 'Mark completed',
  }[order.status];

  return (
    <div className={`rounded-2xl border bg-card p-5 transition ${fresh ? 'pulse-new ring-2 ring-primary/40' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-lg">#{order.order_number || order.id.slice(0,6)}</span>
            <Badge variant="outline" className={`gap-1 ${status.tone}`}><Icon className="h-3 w-3" /> {status.label}</Badge>
            {order.delay_minutes > 0 && <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">+{order.delay_minutes} min</Badge>}
          </div>
          <div className="text-sm text-muted-foreground mt-1">{order.customer_name || 'Customer'} · {new Date(order.created_at).toLocaleTimeString()}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">£{Number(order.total || 0).toFixed(2)}</div>
          <div className="text-xs text-muted-foreground capitalize">{order.delivery_type || 'delivery'}</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-muted/40 p-3 text-sm space-y-1">
        {items.length === 0 ? (
          <div className="text-muted-foreground italic">No items</div>
        ) : items.map((it, i) => (
          <div key={i} className="flex justify-between">
            <span><span className="text-muted-foreground">{it.quantity}×</span> {it.name}</span>
            <span className="text-muted-foreground">£{(Number(it.price||0) * Number(it.quantity||1)).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {(order.delivery_address || order.delivery_notes) && (
        <div className="mt-3 text-sm text-muted-foreground space-y-1">
          {order.delivery_address && <div>📍 {order.delivery_address}</div>}
          {order.delivery_notes && <div>📝 {order.delivery_notes}</div>}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {next && <Button size="sm" onClick={() => onUpdate(order.id, next)}>{nextLabel}</Button>}
        {['pending','accepted','preparing'].includes(order.status) && (
          <Button size="sm" variant="outline" onClick={() => onDelay(order.id, order.delay_minutes)}>+10 min delay</Button>
        )}
        {['pending','accepted','preparing'].includes(order.status) && (
          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onUpdate(order.id, 'cancelled')}>Reject</Button>
        )}
      </div>
    </div>
  );
};

export default OrdersClient;
