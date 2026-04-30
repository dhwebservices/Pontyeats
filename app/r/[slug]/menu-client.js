'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShoppingBag, Plus, Minus, ArrowLeft, Clock, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const MenuClient = ({ restaurant, categories, items }) => {
  const [cart, setCart] = useState([]); // [{id, name, price, quantity}]
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [delivery, setDelivery] = useState({
    name: '', email: '', phone: '',
    type: restaurant.delivery_enabled ? 'delivery' : 'collection',
    address: '', notes: '',
  });

  const grouped = useMemo(() => {
    const map = new Map();
    categories.forEach(c => map.set(c.id, { category: c, items: [] }));
    map.set(null, { category: { id: null, name: 'More' }, items: [] });
    items.forEach(i => {
      const k = i.category_id || null;
      if (!map.has(k)) map.set(k, { category: { id: k, name: 'More' }, items: [] });
      map.get(k).items.push(i);
    });
    return Array.from(map.values()).filter(g => g.items.length > 0);
  }, [categories, items]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === item.id);
      if (existing) return prev.map(p => p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, { id: item.id, name: item.name, price: Number(item.price), quantity: 1 }];
    });
    toast.success(`Added ${item.name}`, { duration: 1200 });
  };
  const updateQty = (id, delta) => {
    setCart(prev => prev.map(p => p.id === id ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p).filter(p => p.quantity > 0));
  };

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const deliveryFee = delivery.type === 'delivery' ? 2.5 : 0;
  const total = subtotal + deliveryFee;
  const minOrderShortfall = Math.max(0, Number(restaurant.min_order_value || 0) - subtotal);

  const submitCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (minOrderShortfall > 0) { toast.error(`Add £${minOrderShortfall.toFixed(2)} more to meet min order`); return; }
    if (!delivery.name || !delivery.email) { toast.error('Name and email required'); return; }
    if (delivery.type === 'delivery' && !delivery.address) { toast.error('Delivery address required'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          items: cart.map(c => ({ id: c.id, quantity: c.quantity })),
          customer: { name: delivery.name, email: delivery.email, phone: delivery.phone },
          delivery_type: delivery.type,
          delivery_address: delivery.type === 'delivery' ? delivery.address : null,
          delivery_notes: delivery.notes,
          origin: window.location.origin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout session');
      // Save cart context for the success page (optional)
      sessionStorage.setItem('lastOrderId', data.order_id);
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Banner */}
      <div className="relative h-56 md:h-72 bg-muted">
        {restaurant.banner_url ? (
          <img src={restaurant.banner_url} alt={restaurant.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-orange-300/30 to-amber-200/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
        <div className="absolute top-0 left-0 right-0 px-4 py-4 flex items-center justify-between">
          <Link href="/restaurants" className="inline-flex items-center gap-2 text-sm text-white bg-black/40 backdrop-blur px-3 py-1.5 rounded-full hover:bg-black/60"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
          <CartButton count={cart.length} onClick={() => setCartOpen(true)} mobile />
        </div>
      </div>

      <div className="container -mt-12 relative z-10 pb-8">
        <div className="flex items-end gap-4">
          {restaurant.logo_url ? (
            <img src={restaurant.logo_url} alt="" className="h-20 w-20 rounded-2xl object-cover ring-4 ring-background shadow-lg" />
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-card ring-4 ring-background shadow-lg flex items-center justify-center text-3xl">🍽️</div>
          )}
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-semibold mt-4 text-balance">{restaurant.name}</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">{restaurant.description || `${restaurant.cuisine_type || ''} restaurant in Pontypridd`}</p>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {restaurant.prep_time_minutes || 25} min</span>
          {restaurant.address_line && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {restaurant.address_line}</span>}
          {Number(restaurant.min_order_value) > 0 && <span>Min order £{Number(restaurant.min_order_value).toFixed(2)}</span>}
          {!restaurant.is_open && <span className="text-red-600 font-semibold">Currently closed</span>}
        </div>
      </div>

      <div className="container grid lg:grid-cols-[1fr_360px] gap-8">
        {/* MENU */}
        <div className="space-y-12">
          {grouped.length === 0 ? (
            <div className="py-24 text-center border-y">
              <p className="font-display text-2xl italic text-muted-foreground">Menu coming soon.</p>
            </div>
          ) : grouped.map(({ category, items: catItems }) => (
            <section key={category.id || 'more'}>
              <h2 className="font-display text-3xl font-semibold mb-5 pb-3 border-b">{category.name}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {catItems.map(item => (
                  <button key={item.id} onClick={() => restaurant.is_open && addToCart(item)} disabled={!restaurant.is_open}
                    className="text-left rounded-xl border bg-card p-4 hover:border-primary/40 hover:shadow-md transition flex gap-4 disabled:opacity-50">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{item.name}</div>
                      {item.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                      <div className="font-display text-lg font-semibold mt-2">£{Number(item.price).toFixed(2)}</div>
                    </div>
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="h-20 w-20 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-muted shrink-0 flex items-center justify-center text-2xl">🍽️</div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CART (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-2xl border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h3 className="font-display text-xl font-semibold flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Your basket</h3>
            </div>
            <CartContents cart={cart} updateQty={updateQty} subtotal={subtotal} deliveryFee={deliveryFee} total={total} delivery={delivery} setDelivery={setDelivery} restaurant={restaurant} minOrderShortfall={minOrderShortfall} onCheckout={() => setCheckoutOpen(true)} />
          </div>
        </aside>
      </div>

      {/* Mobile sticky cart */}
      <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
        {cart.length > 0 && (
          <button onClick={() => setCartOpen(true)} className="flex items-center gap-3 bg-primary text-primary-foreground rounded-full px-5 py-3 shadow-2xl shadow-primary/40">
            <ShoppingBag className="h-4 w-4" />
            <span className="font-medium">{cart.reduce((s,c)=>s+c.quantity,0)} item{cart.reduce((s,c)=>s+c.quantity,0)===1?'':'s'}</span>
            <span className="font-bold">£{total.toFixed(2)}</span>
          </button>
        )}
      </div>

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col">
          <SheetHeader><SheetTitle className="font-display text-2xl">Your basket</SheetTitle></SheetHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            <CartContents cart={cart} updateQty={updateQty} subtotal={subtotal} deliveryFee={deliveryFee} total={total} delivery={delivery} setDelivery={setDelivery} restaurant={restaurant} minOrderShortfall={minOrderShortfall} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-2xl">Almost there.</DialogTitle></DialogHeader>
          <form onSubmit={submitCheckout} className="space-y-4">
            {restaurant.delivery_enabled && restaurant.collection_enabled && (
              <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-muted">
                {[{ k: 'delivery', l: 'Delivery' }, { k: 'collection', l: 'Collection' }].map(opt => (
                  <button key={opt.k} type="button" onClick={() => setDelivery({ ...delivery, type: opt.k })}
                    className={`py-2 rounded-full text-sm font-medium transition ${delivery.type === opt.k ? 'bg-background shadow' : 'text-muted-foreground'}`}>{opt.l}</button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Your name *</Label><Input required value={delivery.name} onChange={(e) => setDelivery({...delivery, name: e.target.value})} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={delivery.phone} onChange={(e) => setDelivery({...delivery, phone: e.target.value})} /></div>
            </div>
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" required value={delivery.email} onChange={(e) => setDelivery({...delivery, email: e.target.value})} placeholder="For your receipt" /></div>
            {delivery.type === 'delivery' && (
              <div className="space-y-1.5"><Label>Delivery address *</Label><Textarea required rows={2} value={delivery.address} onChange={(e) => setDelivery({...delivery, address: e.target.value})} placeholder="Street, postcode, flat #..." /></div>
            )}
            <div className="space-y-1.5"><Label>Notes for the kitchen</Label><Textarea rows={2} value={delivery.notes} onChange={(e) => setDelivery({...delivery, notes: e.target.value})} placeholder="Allergies, doorbell, etc." /></div>

            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>£{subtotal.toFixed(2)}</span></div>
              {deliveryFee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>£{deliveryFee.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold pt-1 border-t"><span>Total</span><span>£{total.toFixed(2)}</span></div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-full text-base" disabled={submitting || cart.length === 0}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Pay £{total.toFixed(2)} →</>}
            </Button>
            <p className="text-xs text-muted-foreground text-center">Secure payment by Stripe. We don't store your card.</p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const CartButton = ({ count, onClick, mobile }) => (
  <button onClick={onClick} className={`inline-flex items-center gap-2 bg-black/40 backdrop-blur text-white px-3 py-1.5 rounded-full hover:bg-black/60 ${mobile ? '' : ''}`}>
    <ShoppingBag className="h-4 w-4" />
    {count > 0 && <span className="text-xs font-bold bg-primary px-2 py-0.5 rounded-full">{count}</span>}
  </button>
);

const CartContents = ({ cart, updateQty, subtotal, deliveryFee, total, restaurant, minOrderShortfall, onCheckout }) => (
  <div className="flex flex-col h-full">
    {cart.length === 0 ? (
      <div className="py-12 text-center text-muted-foreground text-sm">Your basket is empty.<br/>Pick something delicious.</div>
    ) : (
      <>
        <div className="divide-y">
          {cart.map(item => (
            <div key={item.id} className="py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{item.name}</div>
                <div className="text-xs text-muted-foreground">£{(item.price * item.quantity).toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(item.id, -1)} className="h-7 w-7 rounded-full border flex items-center justify-center hover:bg-muted"><Minus className="h-3 w-3" /></button>
                <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                <button onClick={() => updateQty(item.id, 1)} className="h-7 w-7 rounded-full border flex items-center justify-center hover:bg-muted"><Plus className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>£{subtotal.toFixed(2)}</span></div>
          {deliveryFee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>£{deliveryFee.toFixed(2)}</span></div>}
          <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span className="font-display">£{total.toFixed(2)}</span></div>
        </div>
        {minOrderShortfall > 0 && (
          <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Add £{minOrderShortfall.toFixed(2)} more to reach minimum order.</div>
        )}
        <Button onClick={onCheckout} disabled={cart.length === 0 || !restaurant.is_open || minOrderShortfall > 0} className="mt-4 w-full h-11 rounded-full">
          {!restaurant.is_open ? 'Restaurant closed' : 'Checkout'}
        </Button>
      </>
    )}
  </div>
);

export default MenuClient;
