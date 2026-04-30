import { createAdminClient } from '@/lib/supabase/admin';
import AdminRestaurantsClient from './restaurants-client';

export const dynamic = 'force-dynamic';

const Page = async () => {
  const admin = createAdminClient();
  const r1 = await admin.from('restaurants').select('*').order('created_at', { ascending: false });
  const restaurants = r1.data || [];
  const r2 = await admin.from('orders').select('restaurant_id, total');
  const orderCounts = r2.data || [];
  const stats = {};
  (orderCounts||[]).forEach(o => {
    if (!stats[o.restaurant_id]) stats[o.restaurant_id] = { count: 0, gross: 0 };
    stats[o.restaurant_id].count += 1;
    stats[o.restaurant_id].gross += Number(o.total || 0);
  });
  return <AdminRestaurantsClient restaurants={restaurants || []} stats={stats} />;
};
export default Page;
