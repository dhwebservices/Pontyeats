import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardShell from '@/components/dashboard-shell';

const Layout = async ({ children }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!restaurant) redirect('/onboarding');

  return (
    <DashboardShell restaurant={restaurant} userEmail={user.email}>
      {children}
    </DashboardShell>
  );
};

export default Layout;
