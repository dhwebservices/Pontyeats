import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRestaurantContext, hasRestaurantPermission } from '@/lib/restaurant-access';

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const restaurantId = body?.restaurant_id;
  if (!restaurantId) {
    return NextResponse.json({ error: 'restaurant_id is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: restaurant, error: restaurantError } = await admin
    .from('restaurants')
    .select('id, owner_id, name, min_order_value, delivery_enabled')
    .eq('id', restaurantId)
    .maybeSingle();

  if (restaurantError || !restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  const context = await getRestaurantContext(supabase, user.id);
  const canManageOrders =
    context?.restaurant?.id === restaurant.id &&
    hasRestaurantPermission(context, 'orders');

  if (!canManageOrders) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: settings } = await admin
    .from('platform_settings')
    .select('default_commission_pct')
    .eq('id', 1)
    .maybeSingle();

  const subtotal = Number(restaurant.min_order_value || 12);
  const deliveryFee = restaurant.delivery_enabled ? 2.5 : 0;
  const serviceFee = 0;
  const total = Number((subtotal + deliveryFee + serviceFee).toFixed(2));
  const commissionPct = Number(settings?.default_commission_pct ?? 6);
  const commissionAmount = Number(((total * commissionPct) / 100).toFixed(2));
  const netAmount = Number((total - commissionAmount).toFixed(2));
  const orderNumber = `PE-${Date.now().toString().slice(-6)}`;

  const payload = {
    restaurant_id: restaurant.id,
    order_number: orderNumber,
    customer_name: 'Ponty Eats Test',
    customer_email: user.email || 'test@pontyeats.local',
    customer_phone: '0000000000',
    items: [
      {
        name: 'Test order',
        quantity: 1,
        price: subtotal,
      },
    ],
    status: 'placed',
    payment_status: 'paid',
    fulfillment_type: restaurant.delivery_enabled ? 'delivery' : 'collection',
    delivery_address: 'Test order generated from the restaurant dashboard',
    delivery_notes: 'This is an automated dashboard test order.',
    subtotal,
    delivery_fee: deliveryFee,
    service_fee: serviceFee,
    total,
    commission_pct: commissionPct,
    commission_amount: commissionAmount,
    net_amount: netAmount,
  };

  const { data: order, error: insertError } = await admin
    .from('orders')
    .insert(payload)
    .select('id, order_number')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, order });
}
