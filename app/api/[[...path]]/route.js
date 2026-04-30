import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerSupabase } from '@/lib/supabase/server';

// Helpers
const ok = (data, status = 200) => NextResponse.json(data, { status });
const err = (message, status = 400) => NextResponse.json({ error: message }, { status });

const FAKE_NAMES = ['Sarah Jones','Tom Williams','Megan Roberts','Owen Davies','Bethan Evans','Rhys Morgan','Carys Hughes','Dylan Thomas'];
const FAKE_ITEMS = [
  { name: 'Cheeseburger', price: 8.5 },
  { name: 'Margherita Pizza', price: 11 },
  { name: 'Chicken Tikka', price: 9.5 },
  { name: 'Loaded Fries', price: 4.5 },
  { name: 'Coke', price: 2.0 },
  { name: 'Welsh Cake Stack', price: 5.5 },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const computeStripeFee = (totalPence) => Math.round(totalPence * 0.014 + 20); // 1.4% + 20p (UK card)

async function handleTestOrder(request, body) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Not authenticated', 401);
  const restaurantId = body.restaurant_id;
  if (!restaurantId) return err('restaurant_id required');

  // Verify ownership
  const { data: restaurant } = await supabase.from('restaurants').select('*').eq('id', restaurantId).eq('owner_id', user.id).single();
  if (!restaurant) return err('Restaurant not found', 404);

  // Build random order from real menu items if any, else fake items
  const { data: menu = [] } = await supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId).eq('is_available', true).limit(20);
  const pool = (menu && menu.length > 0)
    ? menu.map(m => ({ name: m.name, price: Number(m.price) }))
    : FAKE_ITEMS;

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
  const stripeFee = +(computeStripeFee(Math.round(total * 100)) / 100).toFixed(2);
  const net = +(total - commissionAmount - stripeFee).toFixed(2);
  const orderNumber = String(1000 + Math.floor(Math.random() * 9000));

  // Insert via service role to bypass RLS for test inserts
  const admin = createAdminClient();
  const { data, error } = await admin.from('orders').insert({
    order_number: orderNumber,
    restaurant_id: restaurantId,
    customer_name: pick(FAKE_NAMES),
    customer_email: 'test-customer@pontyeats.local',
    customer_phone: '07' + Math.floor(100000000 + Math.random() * 900000000),
    delivery_type: Math.random() > 0.3 ? 'delivery' : 'collection',
    delivery_address: 'Pontypridd, CF37 ' + String(Math.floor(Math.random() * 9)) + ' ' + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 'X',
    items,
    subtotal: +subtotal.toFixed(2),
    delivery_fee: deliveryFee,
    total,
    commission_pct: commissionPct,
    commission_amount: commissionAmount,
    stripe_fee_estimate: stripeFee,
    net_to_restaurant: net,
    status: 'pending',
    payment_status: 'paid',
  }).select().single();

  if (error) return err(error.message, 500);
  return ok({ order: data });
}

async function handler(request, { params }) {
  const path = (params?.path || []).join('/');
  const method = request.method;

  try {
    if (method === 'GET' && path === 'health') return ok({ status: 'ok', service: 'ponty-eats' });

    if (method === 'POST' && path === 'orders/test') {
      const body = await request.json();
      return handleTestOrder(request, body);
    }

    return err('Not found', 404);
  } catch (e) {
    console.error('API error:', e);
    return err(e.message || 'Server error', 500);
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
