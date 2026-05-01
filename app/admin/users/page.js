import { createAdminClient } from '@/lib/supabase/admin';
import AdminUsersClient from './users-client';

export const dynamic = 'force-dynamic';

const Page = async () => {
  const admin = createAdminClient();
  const [profilesRes, accessRes, restaurantsRes] = await Promise.all([
    admin.from('profiles').select('*').order('created_at', { ascending: false }),
    admin.from('restaurant_user_access').select(`
      *,
      restaurant:restaurants (id, name, city)
    `),
    admin.from('restaurants').select('id, name, city').order('name', { ascending: true }),
  ]);

  const profiles = profilesRes.data || [];
  const accessRows = accessRes.data || [];
  const restaurants = restaurantsRes.data || [];

  const accessByUser = {};
  accessRows.forEach((row) => {
    if (!accessByUser[row.user_id]) accessByUser[row.user_id] = [];
    accessByUser[row.user_id].push(row);
  });

  const users = profiles.map((profile) => ({
    ...profile,
    access: accessByUser[profile.id]?.[0] || null,
  }));

  return <AdminUsersClient users={users} restaurants={restaurants} />;
};

export default Page;

