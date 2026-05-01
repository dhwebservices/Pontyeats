import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { RESTAURANT_ACCESS_PRESETS } from '@/lib/roles';

const ok = (data, status = 200) => NextResponse.json(data, { status });
const err = (message, status = 400) => NextResponse.json({ error: message }, { status });

function normalizeAccess(role, permissions = {}) {
  if (role === 'owner') return { ...RESTAURANT_ACCESS_PRESETS.owner };
  return {
    can_manage_orders: !!permissions.can_manage_orders,
    can_manage_menu: !!permissions.can_manage_menu,
    can_manage_settings: !!permissions.can_manage_settings,
    can_manage_billing: !!permissions.can_manage_billing,
    can_manage_staff: !!permissions.can_manage_staff,
  };
}

function validateRestaurantRole(role) {
  return role === 'restaurant_owner' || role === 'restaurant_staff';
}

export async function POST(request) {
  const auth = await requireAdminUser();
  if (auth.error) return err(auth.error, auth.status);

  const body = await request.json();
  const {
    email,
    password,
    full_name,
    role,
    restaurant_id,
    restaurant_access_role,
    permissions,
  } = body;

  if (!email || !password || !full_name || !role) return err('Name, email, password, and role are required');
  if (validateRestaurantRole(role) && !restaurant_id) return err('Restaurant access requires a restaurant assignment');

  const createRes = await auth.admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
    app_metadata: { role },
  });

  if (createRes.error) return err(createRes.error.message, 500);

  const user = createRes.data.user;

  await auth.admin
    .from('profiles')
    .upsert({
      id: user.id,
      email,
      full_name,
      role,
      updated_at: new Date().toISOString(),
    });

  if (validateRestaurantRole(role)) {
    const accessRole = restaurant_access_role === 'owner' ? 'owner' : 'staff';
    const access = normalizeAccess(accessRole, permissions);
    const { error: accessError } = await auth.admin
      .from('restaurant_user_access')
      .upsert({
        user_id: user.id,
        restaurant_id,
        role: accessRole,
        status: 'active',
        created_by: auth.user.id,
        ...access,
      }, { onConflict: 'user_id,restaurant_id' });

    if (accessError) return err(accessError.message, 500);
  }

  return ok({ success: true, user_id: user.id });
}

export async function PUT(request) {
  const auth = await requireAdminUser();
  if (auth.error) return err(auth.error, auth.status);

  const body = await request.json();
  const {
    user_id,
    full_name,
    role,
    restaurant_id,
    restaurant_access_role,
    permissions,
    access_status,
  } = body;

  if (!user_id || !role) return err('user_id and role are required');
  if (validateRestaurantRole(role) && !restaurant_id) return err('Restaurant access requires a restaurant assignment');

  const { error: authUpdateError } = await auth.admin.auth.admin.updateUserById(user_id, {
    user_metadata: { full_name, role },
    app_metadata: { role },
  });

  if (authUpdateError) return err(authUpdateError.message, 500);

  const { error: profileError } = await auth.admin
    .from('profiles')
    .update({
      full_name,
      role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user_id);

  if (profileError) return err(profileError.message, 500);

  const { error: clearError } = await auth.admin
    .from('restaurant_user_access')
    .delete()
    .eq('user_id', user_id);

  if (clearError) return err(clearError.message, 500);

  if (validateRestaurantRole(role)) {
    const accessRole = restaurant_access_role === 'owner' ? 'owner' : 'staff';
    const access = normalizeAccess(accessRole, permissions);
    const { error: accessError } = await auth.admin
      .from('restaurant_user_access')
      .insert({
        user_id,
        restaurant_id,
        role: accessRole,
        status: access_status === 'suspended' ? 'suspended' : 'active',
        created_by: auth.user.id,
        ...access,
      });

    if (accessError) return err(accessError.message, 500);
  }

  return ok({ success: true });
}

