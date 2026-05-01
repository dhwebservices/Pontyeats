import { createClient } from '@/lib/supabase/server';
import SettingsClient from './settings-client';
import { requireRestaurantContext } from '@/lib/restaurant-access';

const Page = async () => {
  const supabase = await createClient();
  const { restaurant } = await requireRestaurantContext(supabase, { requirePermission: 'settings' });
  return <SettingsClient restaurant={restaurant} />;
};

export default Page;
