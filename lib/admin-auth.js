import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPlatformAdmin } from '@/lib/roles';

export async function requireAdminUser() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated', status: 401 };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!isPlatformAdmin(profile?.role)) {
    return { error: 'Forbidden', status: 403 };
  }

  return { user, profile, supabase, admin: createAdminClient() };
}

