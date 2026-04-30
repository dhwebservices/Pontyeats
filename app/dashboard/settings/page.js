import { createClient } from '@/lib/supabase/server';
import SettingsClient from './settings-client';

const Page = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: restaurant } = await supabase.from('restaurants').select('*').eq('owner_id', user.id).single();
  return <SettingsClient restaurant={restaurant} />;
};

export default Page;
