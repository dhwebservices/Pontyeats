import { createClient } from '@/lib/supabase/server';
import OrdersClient from './orders-client';

const Page = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: restaurant } = await supabase.from('restaurants').select('*').eq('owner_id', user.id).single();
  const { data: initialOrders = [] } = await supabase
    .from('orders').select('*').eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false }).limit(100);
  return <OrdersClient restaurant={restaurant} initialOrders={initialOrders || []} />;
};

export default Page;
