import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminShell from '@/components/admin-shell';

const Layout = async ({ children }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const effectiveRole = profile?.role || user.user_metadata?.role || user.app_metadata?.role;
  if (effectiveRole !== 'admin') redirect('/dashboard');

  return <AdminShell userEmail={user.email}>{children}</AdminShell>;
};

export default Layout;
