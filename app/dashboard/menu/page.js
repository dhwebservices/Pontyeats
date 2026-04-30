import { createClient } from '@/lib/supabase/server';
import MenuClient from './menu-client';

const Page = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: restaurant } = await supabase.from('restaurants').select('*').eq('owner_id', user.id).single();

  const c = await supabase.from('menu_categories').select('*').eq('restaurant_id', restaurant.id).order('sort_order');
  const i = await supabase.from('menu_items').select('*').eq('restaurant_id', restaurant.id).order('sort_order');
  return <MenuClient restaurant={restaurant} initialCategories={c.data || []} initialItems={i.data || []} />;
};

export default Page;
