export const PLATFORM_ADMIN_ROLES = ['admin'];

export const RESTAURANT_PROFILE_ROLES = ['restaurant', 'restaurant_owner', 'restaurant_staff'];

export const USER_ROLE_OPTIONS = [
  { value: 'admin', label: 'Platform admin' },
  { value: 'restaurant_owner', label: 'Restaurant owner' },
  { value: 'restaurant_staff', label: 'Restaurant staff' },
  { value: 'customer', label: 'Customer' },
];

export const RESTAURANT_ACCESS_PRESETS = {
  owner: {
    can_manage_orders: true,
    can_manage_menu: true,
    can_manage_settings: true,
    can_manage_billing: true,
    can_manage_staff: true,
  },
  staff: {
    can_manage_orders: true,
    can_manage_menu: false,
    can_manage_settings: false,
    can_manage_billing: false,
    can_manage_staff: false,
  },
};

export function isPlatformAdmin(role) {
  return PLATFORM_ADMIN_ROLES.includes(role);
}

