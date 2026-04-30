import { createAdminClient } from '@/lib/supabase/admin';
import AdminSettingsClient from './settings-client';

export const dynamic = 'force-dynamic';

const Page = async () => {
  const admin = createAdminClient();
  const { data: settings } = await admin.from('platform_settings').select('*').eq('id', 1).maybeSingle();
  return <AdminSettingsClient initial={settings || {}} />;
};
export default Page;
