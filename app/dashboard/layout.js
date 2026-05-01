import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardShell from '@/components/dashboard-shell';
import { requireRestaurantContext } from '@/lib/restaurant-access';

const Layout = async ({ children }) => {
  const supabase = await createClient();
  const { user, profile, restaurant, permissions, isAdmin } = await requireRestaurantContext(supabase);

  return (
    <DashboardShell
      restaurant={restaurant}
      userEmail={user.email}
      isAdmin={isAdmin}
      permissions={permissions}
      restaurantRole={profile?.role}
    >
      {children}
    </DashboardShell>
  );
};

export default Layout;
