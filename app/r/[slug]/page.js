import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import MenuClient from './menu-client';

export const dynamic = 'force-dynamic';

const Page = async ({ params }) => {
  const admin = createAdminClient();
  const { data: restaurant } = await admin.from('restaurants').select('*').eq('slug', params.slug).maybeSingle();
  if (!restaurant) notFound();

  const c = await admin.from('menu_categories').select('*').eq('restaurant_id', restaurant.id).order('sort_order');
  const i = await admin.from('menu_items').select('*').eq('restaurant_id', restaurant.id).eq('is_available', true).order('sort_order');
  return <MenuClient restaurant={restaurant} categories={c.data || []} items={i.data || []} />;
};

export default Page;
