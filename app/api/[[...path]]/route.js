import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { getStripe, estimateStripeFee } from '@/lib/stripe';
import { sendCustomerOrderConfirmation, sendRestaurantNewOrderAlert } from '@/lib/email';

const ok = (data, status = 200) => NextResponse.json(data, { status });
const err = (message, status = 400) => NextResponse.json({ error: message }, { status });

const FAKE_NAMES = ['Sarah Jones','Tom Williams','Megan Roberts','Owen Davies','Bethan Evans','Rhys Morgan','Carys Hughes','Dylan Thomas'];
const FAKE_ITEMS = [
  { name: 'Cheeseburger', price: 8.5 },
  { name: 'Margherita Pizza', price: 11 },
  { name: 'Chicken Tikka', price: 9.5 },
  { name: 'Loaded Fries', price: 4.5 },
  { name: 'Coke', price: 2.0 },
];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ============ TEST ORDER ============
async function handleTestOrder(body) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Not authenticated', 401);
  const restaurantId = body.restaurant_id;
  if (!restaurantId) return err('restaurant_id required');
  const { data: restaurant } = await supabase.from('restaurants').select('*').eq('id', restaurantId).eq('owner_id', user.id).single();
  if (!restaurant) return err('Restaurant not found', 404);
  const { data: menu = [] } = await supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId).eq('is_available', true).limit(20);
  const pool = (menu && menu.length > 0) ? menu.map(m => ({ name: m.name, price: Number(m.price) })) : FAKE_ITEMS;
  const itemCount = 1 + Math.floor(Math.random() * 3);
  const items = [];
  for (let i = 0; i < itemCount; i++) {
    const it = pick(pool);
    items.push({ name: it.name, price: it.price, quantity: 1 + Math.floor(Math.random() * 2) });
  }
  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const deliveryFee = Math.random() > 0.5 ? 2.5 : 0;
  const total = +(subtotal + deliveryFee).toFixed(2);
  const commissionPct = Number(restaurant.commission_pct || 6);
  const commissionAmount = +(total * (commissionPct / 100)).toFixed(2);
  const stripeFee = estimateStripeFee(total);
  const net = +(total - commissionAmount - stripeFee).toFixed(2);
  const orderNumber = String(1000 + Math.floor(Math.random() * 9000));

  const admin = createAdminClient();
  const { data, error } = await admin.from('orders').insert({
    order_number: orderNumber, restaurant_id: restaurantId,
    customer_name: pick(FAKE_NAMES), customer_email: 'test@pontyeats.local',
    customer_phone: '07' + Math.floor(100000000 + Math.random() * 900000000),
    fulfillment_type: Math.random() > 0.3 ? 'delivery' : 'collection',
    delivery_address: 'Pontypridd test address ' + String(Math.floor(Math.random() * 9)),
    items, subtotal: +subtotal.toFixed(2), delivery_fee: deliveryFee, total,
    commission_pct: commissionPct, commission_amount: commissionAmount,
    net_amount: net,
    status: 'placed', payment_status: 'paid',
  }).select().single();
  if (error) return err(error.message, 500);
  return ok({ order: data });
}

// ============ CHECKOUT SESSION (Customer pays) ============
async function handleCheckoutSession(request, body) {
  const { restaurant_id, items: cartItems, customer, delivery_type, delivery_address, delivery_notes, origin } = body;
  if (!restaurant_id || !Array.isArray(cartItems) || cartItems.length === 0) return err('Invalid checkout payload');
  if (!customer?.email || !customer?.name) return err('Customer name and email required');

  const admin = createAdminClient();
  const { data: restaurant } = await admin.from('restaurants').select('*').eq('id', restaurant_id).single();
  if (!restaurant) return err('Restaurant not found', 404);
  if (!restaurant.is_open || !restaurant.is_approved) return err('Restaurant is not currently accepting orders');

  // Validate items by re-fetching from DB (anti price-manipulation)
  const itemIds = cartItems.map(i => i.id);
  const { data: dbItems = [] } = await admin.from('menu_items').select('*').in('id', itemIds).eq('restaurant_id', restaurant_id);
  if (!dbItems || dbItems.length === 0) return err('No valid items in cart');
  const orderItems = [];
  let subtotal = 0;
  for (const ci of cartItems) {
    const di = dbItems.find(d => d.id === ci.id);
    if (!di || !di.is_available) continue;
    const qty = Math.max(1, Math.min(20, Number(ci.quantity) || 1));
    const price = Number(di.price);
    subtotal += price * qty;
    orderItems.push({ id: di.id, name: di.name, price, quantity: qty });
  }
  if (orderItems.length === 0) return err('No available items');
  if (subtotal < Number(restaurant.min_order_value || 0)) return err(`Minimum order is £${Number(restaurant.min_order_value).toFixed(2)}`);

  const fulfillmentType = delivery_type === 'collection' ? 'collection' : 'delivery';
  const deliveryFee = fulfillmentType === 'delivery' ? 2.5 : 0;
  const total = +(subtotal + deliveryFee).toFixed(2);
  const commissionPct = Number(restaurant.commission_pct || 6);
  const commissionAmount = +(total * (commissionPct / 100)).toFixed(2);
  const stripeFee = estimateStripeFee(total);
  const net = +(total - commissionAmount - stripeFee).toFixed(2);
  const orderNumber = String(1000 + Math.floor(Math.random() * 9000));

  // Create order before redirecting to Stripe; payment is confirmed on return/webhook.
  const { data: order, error: insertErr } = await admin.from('orders').insert({
    order_number: orderNumber, restaurant_id,
    customer_name: customer.name, customer_email: customer.email, customer_phone: customer.phone || null,
    fulfillment_type: fulfillmentType,
    delivery_address: fulfillmentType === 'delivery' ? (delivery_address || null) : null,
    delivery_notes: delivery_notes || null,
    items: orderItems, subtotal: +subtotal.toFixed(2), delivery_fee: deliveryFee, total,
    commission_pct: commissionPct, commission_amount: commissionAmount,
    net_amount: net,
    status: 'placed', payment_status: 'pending',
  }).select().single();
  if (insertErr) return err(insertErr.message, 500);

  const baseUrl = origin || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const success_url = `${baseUrl}/order/${order.id}?session_id={CHECKOUT_SESSION_ID}`;
  const cancel_url = `${baseUrl}/r/${restaurant.slug}`;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      ...orderItems.map(it => ({
        price_data: {
          currency: 'gbp',
          product_data: { name: `${it.name} (×${it.quantity})` },
          unit_amount: Math.round(it.price * 100),
        },
        quantity: it.quantity,
      })),
      ...(deliveryFee > 0 ? [{
        price_data: { currency: 'gbp', product_data: { name: 'Delivery' }, unit_amount: Math.round(deliveryFee * 100) },
        quantity: 1,
      }] : []),
    ],
    customer_email: customer.email,
    success_url, cancel_url,
    metadata: { order_id: order.id, restaurant_id },
  });

  await admin.from('orders').update({ stripe_checkout_session_id: session.id }).eq('id', order.id);
  return ok({ url: session.url, session_id: session.id, order_id: order.id });
}

// ============ CHECKOUT STATUS ============
async function handleCheckoutStatus(sessionId) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const admin = createAdminClient();

  const { data: order } = await admin.from('orders').select('*').eq('stripe_checkout_session_id', sessionId).maybeSingle();
  if (!order) return ok({ payment_status: session.payment_status, status: session.status });

  // If paid and order still pending, mark as paid + send emails (idempotent)
  if (session.payment_status === 'paid' && order.payment_status !== 'paid') {
    const { data: updated } = await admin.from('orders').update({
      payment_status: 'paid',
      updated_at: new Date().toISOString(),
    }).eq('id', order.id).select('*').single();

    // Fire emails (best-effort)
    try {
      const { data: restaurant } = await admin.from('restaurants').select('*').eq('id', order.restaurant_id).single();
      const { data: ownerProfile } = await admin.from('profiles').select('email').eq('id', restaurant.owner_id).maybeSingle();
      if (updated && restaurant) {
        await sendCustomerOrderConfirmation({ to: updated.customer_email, order: updated, restaurant });
        if (ownerProfile?.email) {
          await sendRestaurantNewOrderAlert({ to: ownerProfile.email, order: updated, restaurant });
        }
      }
    } catch (e) { console.error('Email dispatch failed', e); }
  }

  return ok({
    payment_status: session.payment_status,
    status: session.status,
    amount_total: session.amount_total,
    currency: session.currency,
    order_id: order.id,
  });
}

// ============ STRIPE WEBHOOK ============
async function handleStripeWebhook(request) {
  // We do polling on the success page; this is a backup.
  const body = await request.text();
  let event;
  try {
    event = JSON.parse(body);
  } catch { return err('Invalid payload', 400); }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.id) {
      try { await handleCheckoutStatus(session.id); } catch (e) { console.error(e); }
    }
  }
  return ok({ received: true });
}

// ============ GET ORDER ============
async function handleGetOrder(orderId) {
  const admin = createAdminClient();
  const { data: order } = await admin.from('orders').select('*').eq('id', orderId).maybeSingle();
  if (!order) return ok({ order: null });
  const { data: restaurant } = await admin.from('restaurants').select('*').eq('id', order.restaurant_id).maybeSingle();
  return ok({ order, restaurant });
}

// ============ DISPATCHER ============
async function handler(request, { params }) {
  const resolvedParams = await params;
  const path = (resolvedParams?.path || []).join('/');
  const method = request.method;

  try {
    if (method === 'GET' && path === 'health') return ok({ status: 'ok', service: 'ponty-eats' });

    if (method === 'POST' && path === 'orders/test') {
      const body = await request.json();
      return handleTestOrder(body);
    }

    if (method === 'POST' && path === 'checkout/session') {
      const body = await request.json();
      return handleCheckoutSession(request, body);
    }

    if (method === 'GET' && path.startsWith('checkout/status/')) {
      const sessionId = path.replace('checkout/status/', '');
      return handleCheckoutStatus(sessionId);
    }

    if (method === 'POST' && path === 'webhook/stripe') {
      return handleStripeWebhook(request);
    }

    if (method === 'GET' && path.startsWith('orders/')) {
      const orderId = path.replace('orders/', '');
      return handleGetOrder(orderId);
    }

    return err('Not found', 404);
  } catch (e) {
    console.error('API error:', e);
    return err(e.message || 'Server error', 500);
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
