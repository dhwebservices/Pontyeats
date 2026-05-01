import { createClient } from '@/lib/supabase/server';
import MenuClient from './menu-client';
import { requireRestaurantContext } from '@/lib/restaurant-access';

const Page = async () => {
  const supabase = await createClient();
  const { restaurant } = await requireRestaurantContext(supabase, { requirePermission: 'menu' });

  const c = await supabase.from('menu_categories').select('*').eq('restaurant_id', restaurant.id).order('sort_order');
  const i = await supabase.from('menu_items').select('*').eq('restaurant_id', restaurant.id).order('sort_order');
  return <MenuClient restaurant={restaurant} initialCategories={c.data || []} initialItems={i.data || []} />;
};

export default Page;
