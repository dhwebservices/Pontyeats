-- Ponty Eats core schema
-- Run this in the Supabase SQL editor.

create extension if not exists pgcrypto;

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'customer' check (role in ('admin', 'restaurant', 'restaurant_owner', 'restaurant_staff', 'customer')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'restaurant', 'restaurant_owner', 'restaurant_staff', 'customer'));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    ),
    false
  );
$$;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null unique,
  cuisine_type text,
  description text,
  phone text,
  address_line text,
  postal_code text,
  city text not null default 'Pontypridd',
  logo_url text,
  banner_url text,
  prep_time_minutes integer not null default 25,
  min_order_value numeric(10,2) not null default 0,
  delivery_radius_miles numeric(10,2) not null default 3,
  delivery_enabled boolean not null default true,
  collection_enabled boolean not null default true,
  is_open boolean not null default false,
  is_approved boolean not null default false,
  commission_pct numeric(5,2) not null default 6,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  category_id uuid references public.menu_categories (id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  image_url text,
  is_available boolean not null default true,
  modifiers jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  order_number text not null unique,
  customer_id uuid references auth.users (id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  items jsonb not null default '[]'::jsonb,
  status text not null default 'placed' check (status in ('placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'rejected', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  fulfillment_type text not null default 'delivery' check (fulfillment_type in ('delivery', 'collection')),
  delivery_address text,
  delivery_notes text,
  delay_minutes integer not null default 0,
  subtotal numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  service_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  commission_pct numeric(5,2) not null default 6,
  commission_amount numeric(10,2) not null default 0,
  net_amount numeric(10,2) not null default 0,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.platform_settings (
  id integer primary key,
  restaurant_signups_enabled boolean not null default true,
  customer_signups_enabled boolean not null default false,
  default_commission_pct numeric(5,2) not null default 6,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.restaurant_user_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  can_manage_orders boolean not null default true,
  can_manage_menu boolean not null default false,
  can_manage_settings boolean not null default false,
  can_manage_billing boolean not null default false,
  can_manage_staff boolean not null default false,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, restaurant_id)
);

insert into public.platform_settings (id, restaurant_signups_enabled, customer_signups_enabled, default_commission_pct)
values (1, true, false, 6)
on conflict (id) do update
set updated_at = timezone('utc', now());

update public.profiles
set role = 'restaurant_owner',
    updated_at = timezone('utc', now())
where role = 'restaurant';

create index if not exists idx_restaurants_owner_id on public.restaurants(owner_id);
create index if not exists idx_restaurants_slug on public.restaurants(slug);
create index if not exists idx_menu_categories_restaurant_id on public.menu_categories(restaurant_id);
create index if not exists idx_menu_items_restaurant_id on public.menu_items(restaurant_id);
create index if not exists idx_menu_items_category_id on public.menu_items(category_id);
create index if not exists idx_orders_restaurant_id on public.orders(restaurant_id);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_restaurant_user_access_user_id on public.restaurant_user_access(user_id);
create index if not exists idx_restaurant_user_access_restaurant_id on public.restaurant_user_access(restaurant_id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'customer')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        role = excluded.role,
        updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.sync_restaurant_owner_access()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.restaurant_user_access (
    user_id,
    restaurant_id,
    role,
    can_manage_orders,
    can_manage_menu,
    can_manage_settings,
    can_manage_billing,
    can_manage_staff,
    status
  )
  values (
    new.owner_id,
    new.id,
    'owner',
    true,
    true,
    true,
    true,
    true,
    'active'
  )
  on conflict (user_id, restaurant_id) do update
    set role = 'owner',
        can_manage_orders = true,
        can_manage_menu = true,
        can_manage_settings = true,
        can_manage_billing = true,
        can_manage_staff = true,
        status = 'active',
        updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.has_restaurant_access(target_restaurant_id uuid, required_permission text default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.is_admin()
    or exists (
      select 1
      from public.restaurants r
      where r.id = target_restaurant_id
        and r.owner_id = auth.uid()
    )
    or exists (
      select 1
      from public.restaurant_user_access rua
      where rua.restaurant_id = target_restaurant_id
        and rua.user_id = auth.uid()
        and rua.status = 'active'
        and (
          required_permission is null
          or rua.role = 'owner'
          or (required_permission = 'orders' and rua.can_manage_orders)
          or (required_permission = 'menu' and rua.can_manage_menu)
          or (required_permission = 'settings' and rua.can_manage_settings)
          or (required_permission = 'billing' and rua.can_manage_billing)
          or (required_permission = 'staff' and rua.can_manage_staff)
        )
    ),
    false
  );
$$;

drop trigger if exists on_auth_user_created_profiles on auth.users;
create trigger on_auth_user_created_profiles
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();

create or replace function public.sync_profile_from_user_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = new.email,
      full_name = coalesce(new.raw_user_meta_data ->> 'full_name', public.profiles.full_name),
      role = coalesce(new.raw_user_meta_data ->> 'role', public.profiles.role),
      updated_at = timezone('utc', now())
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated_profiles on auth.users;
create trigger on_auth_user_updated_profiles
  after update on auth.users
  for each row execute procedure public.sync_profile_from_user_update();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.tg_set_updated_at();

drop trigger if exists set_restaurants_updated_at on public.restaurants;
create trigger set_restaurants_updated_at
  before update on public.restaurants
  for each row execute procedure public.tg_set_updated_at();

drop trigger if exists set_menu_categories_updated_at on public.menu_categories;
create trigger set_menu_categories_updated_at
  before update on public.menu_categories
  for each row execute procedure public.tg_set_updated_at();

drop trigger if exists set_menu_items_updated_at on public.menu_items;
create trigger set_menu_items_updated_at
  before update on public.menu_items
  for each row execute procedure public.tg_set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
  before update on public.orders
  for each row execute procedure public.tg_set_updated_at();

drop trigger if exists set_platform_settings_updated_at on public.platform_settings;
create trigger set_platform_settings_updated_at
  before update on public.platform_settings
  for each row execute procedure public.tg_set_updated_at();

drop trigger if exists set_restaurant_user_access_updated_at on public.restaurant_user_access;
create trigger set_restaurant_user_access_updated_at
  before update on public.restaurant_user_access
  for each row execute procedure public.tg_set_updated_at();

drop trigger if exists sync_restaurant_owner_access_trigger on public.restaurants;
create trigger sync_restaurant_owner_access_trigger
  after insert or update of owner_id on public.restaurants
  for each row execute procedure public.sync_restaurant_owner_access();

insert into public.restaurant_user_access (
  user_id,
  restaurant_id,
  role,
  can_manage_orders,
  can_manage_menu,
  can_manage_settings,
  can_manage_billing,
  can_manage_staff,
  status
)
select
  r.owner_id,
  r.id,
  'owner',
  true,
  true,
  true,
  true,
  true,
  'active'
from public.restaurants r
on conflict (user_id, restaurant_id) do update
set role = 'owner',
    can_manage_orders = true,
    can_manage_menu = true,
    can_manage_settings = true,
    can_manage_billing = true,
    can_manage_staff = true,
    status = 'active',
    updated_at = timezone('utc', now());

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.platform_settings enable row level security;
alter table public.restaurant_user_access enable row level security;

-- profiles
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- restaurants
drop policy if exists "restaurants public approved read" on public.restaurants;
create policy "restaurants public approved read" on public.restaurants
  for select using (is_approved = true or public.has_restaurant_access(id));
drop policy if exists "restaurants owner insert" on public.restaurants;
create policy "restaurants owner insert" on public.restaurants
  for insert with check (owner_id = auth.uid() or public.is_admin());
drop policy if exists "restaurants owner update" on public.restaurants;
create policy "restaurants owner update" on public.restaurants
  for update using (public.has_restaurant_access(id, 'settings'))
  with check (public.has_restaurant_access(id, 'settings'));

-- menu categories
drop policy if exists "menu categories public read" on public.menu_categories;
create policy "menu categories public read" on public.menu_categories
  for select using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id
        and (r.is_approved = true or public.has_restaurant_access(r.id))
    )
  );
drop policy if exists "menu categories owner write" on public.menu_categories;
create policy "menu categories owner write" on public.menu_categories
  for all using (
    public.has_restaurant_access(restaurant_id, 'menu')
  )
  with check (
    public.has_restaurant_access(restaurant_id, 'menu')
  );

-- menu items
drop policy if exists "menu items public read" on public.menu_items;
create policy "menu items public read" on public.menu_items
  for select using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id
        and (r.is_approved = true or public.has_restaurant_access(r.id))
    )
  );
drop policy if exists "menu items owner write" on public.menu_items;
create policy "menu items owner write" on public.menu_items
  for all using (
    public.has_restaurant_access(restaurant_id, 'menu')
  )
  with check (
    public.has_restaurant_access(restaurant_id, 'menu')
  );

-- orders
drop policy if exists "orders restaurant read" on public.orders;
create policy "orders restaurant read" on public.orders
  for select using (
    public.has_restaurant_access(restaurant_id, 'orders')
  );
drop policy if exists "orders restaurant update" on public.orders;
create policy "orders restaurant update" on public.orders
  for update using (
    public.has_restaurant_access(restaurant_id, 'orders')
  )
  with check (
    public.has_restaurant_access(restaurant_id, 'orders')
  );

-- restaurant user access
drop policy if exists "restaurant user access self read" on public.restaurant_user_access;
create policy "restaurant user access self read" on public.restaurant_user_access
  for select using (
    user_id = auth.uid()
    or public.is_admin()
    or public.has_restaurant_access(restaurant_id, 'staff')
  );
drop policy if exists "restaurant user access admin manage" on public.restaurant_user_access;
create policy "restaurant user access admin manage" on public.restaurant_user_access
  for all using (public.is_admin())
  with check (public.is_admin());

-- platform settings
drop policy if exists "platform settings read" on public.platform_settings;
create policy "platform settings read" on public.platform_settings
  for select using (true);
drop policy if exists "platform settings admin update" on public.platform_settings;
create policy "platform settings admin update" on public.platform_settings
  for update using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('restaurant-assets', 'restaurant-assets', true)
on conflict (id) do nothing;

drop policy if exists "restaurant assets public read" on storage.objects;
create policy "restaurant assets public read" on storage.objects
  for select using (bucket_id = 'restaurant-assets');

drop policy if exists "restaurant assets owner write" on storage.objects;
create policy "restaurant assets owner write" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'restaurant-assets'
    and (
      public.is_admin()
      or public.has_restaurant_access(((storage.foldername(name))[1])::uuid, 'menu')
      or public.has_restaurant_access(((storage.foldername(name))[1])::uuid, 'settings')
    )
  );

drop policy if exists "restaurant assets owner update" on storage.objects;
create policy "restaurant assets owner update" on storage.objects
  for update to authenticated using (
    bucket_id = 'restaurant-assets'
    and (
      public.is_admin()
      or public.has_restaurant_access(((storage.foldername(name))[1])::uuid, 'menu')
      or public.has_restaurant_access(((storage.foldername(name))[1])::uuid, 'settings')
    )
  )
  with check (
    bucket_id = 'restaurant-assets'
    and (
      public.is_admin()
      or public.has_restaurant_access(((storage.foldername(name))[1])::uuid, 'menu')
      or public.has_restaurant_access(((storage.foldername(name))[1])::uuid, 'settings')
    )
  );

drop policy if exists "restaurant assets owner delete" on storage.objects;
create policy "restaurant assets owner delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'restaurant-assets'
    and (
      public.is_admin()
      or public.has_restaurant_access(((storage.foldername(name))[1])::uuid, 'menu')
      or public.has_restaurant_access(((storage.foldername(name))[1])::uuid, 'settings')
    )
  );

-- Promote your first admin user after signup:
-- update public.profiles set role = 'admin' where email = 'you@example.com';
