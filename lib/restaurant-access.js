import { redirect } from 'next/navigation';
import { isPlatformAdmin } from '@/lib/roles';

export const FULL_RESTAURANT_PERMISSIONS = {
  can_manage_orders: true,
  can_manage_menu: true,
  can_manage_settings: true,
  can_manage_billing: true,
  can_manage_staff: true,
};

function buildAccessPermissions(access, isOwner = false) {
  if (isOwner) return { ...FULL_RESTAURANT_PERMISSIONS };
  return {
    can_manage_orders: !!access?.can_manage_orders,
    can_manage_menu: !!access?.can_manage_menu,
    can_manage_settings: !!access?.can_manage_settings,
    can_manage_billing: !!access?.can_manage_billing,
    can_manage_staff: !!access?.can_manage_staff,
  };
}

export function hasRestaurantPermission(context, permission) {
  if (!context?.restaurant) return false;
  if (!permission) return true;
  if (context.isOwner) return true;
  return !!context.permissions?.[`can_manage_${permission}`];
}

export async function getRestaurantContext(supabase, userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', userId)
    .maybeSingle();

  const { data: ownedRestaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle();

  if (ownedRestaurant) {
    return {
      profile,
      restaurant: ownedRestaurant,
      access: {
        role: 'owner',
        status: 'active',
        ...FULL_RESTAURANT_PERMISSIONS,
      },
      permissions: { ...FULL_RESTAURANT_PERMISSIONS },
      isOwner: true,
      isAdmin: isPlatformAdmin(profile?.role),
    };
  }

  const { data: access } = await supabase
    .from('restaurant_user_access')
    .select(`
      id,
      role,
      status,
      can_manage_orders,
      can_manage_menu,
      can_manage_settings,
      can_manage_billing,
      can_manage_staff,
      restaurant:restaurants (*)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    profile,
    restaurant: access?.restaurant || null,
    access: access || null,
    permissions: buildAccessPermissions(access, false),
    isOwner: false,
    isAdmin: isPlatformAdmin(profile?.role),
  };
}

export async function requireRestaurantContext(supabase, options = {}) {
  const { requirePermission, missingRedirect = '/dashboard' } = options;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const context = await getRestaurantContext(supabase, user.id);

  if (!context.restaurant) {
    if (context.profile?.role === 'restaurant_staff') redirect('/login');
    redirect('/onboarding');
  }

  if (requirePermission && !hasRestaurantPermission(context, requirePermission)) {
    redirect(missingRedirect);
  }

  return { user, ...context };
}

