import { createClient } from '@/lib/supabase/server';
import OrdersClient from './orders-client';
import { requireRestaurantContext } from '@/lib/restaurant-access';

const Page = async () => {
  const supabase = await createClient();
  const { restaurant } = await requireRestaurantContext(supabase, { requirePermission: 'orders' });
  const initRes = await supabase
    .from('orders').select('*').eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false }).limit(100);
  return <OrdersClient restaurant={restaurant} initialOrders={initRes.data || []} />;
};

export default Page;
