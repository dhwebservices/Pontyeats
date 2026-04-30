-- ============================================
-- PONTY EATS - Supabase schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text default 'restaurant' check (role in ('customer','restaurant','admin')),
  created_at timestamptz default now()
);

-- Restaurants
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text unique,
  description text,
  cuisine_type text,
  logo_url text,
  banner_url text,
  phone text,
  address_line text,
  city text default 'Pontypridd',
  postal_code text,
  is_open boolean default true,
  is_approved boolean default true,
  delivery_enabled boolean default true,
  collection_enabled boolean default true,
  delivery_radius_miles numeric(4,1) default 3,
  min_order_value numeric(10,2) default 0,
  prep_time_minutes int default 25,
  opening_hours jsonb default '{}'::jsonb,
  commission_pct numeric(5,2) default 6,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Menu categories
create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  name text not null,
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Menu items
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  category_id uuid references public.menu_categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_available boolean default true,
  modifiers jsonb default '[]'::jsonb,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order status enum
do $$ begin
  create type order_status as enum ('pending','accepted','preparing','on_the_way','completed','cancelled');
exception when duplicate_object then null; end $$;

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text,
  customer_email text,
  customer_phone text,
  delivery_type text default 'delivery' check (delivery_type in ('delivery','collection')),
  delivery_address text,
  delivery_notes text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) default 0,
  total numeric(10,2) not null default 0,
  commission_pct numeric(5,2) default 6,
  commission_amount numeric(10,2) default 0,
  stripe_fee_estimate numeric(10,2) default 0,
  net_to_restaurant numeric(10,2) default 0,
  status order_status default 'pending',
  payment_status text default 'pending',
  stripe_session_id text,
  payout_status text default 'pending',
  delay_minutes int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Platform settings
create table if not exists public.platform_settings (
  id int primary key default 1,
  restaurant_signups_enabled boolean default true,
  customer_signups_enabled boolean default false,
  default_commission_pct numeric(5,2) default 6,
  updated_at timestamptz default now()
);
insert into public.platform_settings (id) values (1) on conflict do nothing;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'restaurant')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.platform_settings enable row level security;

-- RLS policies
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select using (id = auth.uid());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (id = auth.uid());

drop policy if exists restaurants_select_public on public.restaurants;
create policy restaurants_select_public on public.restaurants for select using (true);
drop policy if exists restaurants_insert_own on public.restaurants;
create policy restaurants_insert_own on public.restaurants for insert with check (owner_id = auth.uid());
drop policy if exists restaurants_update_own on public.restaurants;
create policy restaurants_update_own on public.restaurants for update using (owner_id = auth.uid());
drop policy if exists restaurants_delete_own on public.restaurants;
create policy restaurants_delete_own on public.restaurants for delete using (owner_id = auth.uid());

drop policy if exists categories_select_public on public.menu_categories;
create policy categories_select_public on public.menu_categories for select using (true);
drop policy if exists categories_modify_owner on public.menu_categories;
create policy categories_modify_owner on public.menu_categories for all using (
  exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
) with check (
  exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
);

drop policy if exists items_select_public on public.menu_items;
create policy items_select_public on public.menu_items for select using (true);
drop policy if exists items_modify_owner on public.menu_items;
create policy items_modify_owner on public.menu_items for all using (
  exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
) with check (
  exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
);

drop policy if exists orders_select_owner_or_customer on public.orders;
create policy orders_select_owner_or_customer on public.orders for select using (
  exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
  or customer_id = auth.uid()
);
drop policy if exists orders_insert_anyone on public.orders;
create policy orders_insert_anyone on public.orders for insert with check (true);
drop policy if exists orders_update_restaurant on public.orders;
create policy orders_update_restaurant on public.orders for update using (
  exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
);

drop policy if exists settings_select_public on public.platform_settings;
create policy settings_select_public on public.platform_settings for select using (true);

-- Realtime publication
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.menu_items;

-- Storage bucket for restaurant assets (public read)
insert into storage.buckets (id, name, public)
  values ('restaurant-assets', 'restaurant-assets', true)
  on conflict (id) do nothing;

drop policy if exists "public read restaurant-assets" on storage.objects;
create policy "public read restaurant-assets" on storage.objects for select using (bucket_id = 'restaurant-assets');
drop policy if exists "auth upload restaurant-assets" on storage.objects;
create policy "auth upload restaurant-assets" on storage.objects for insert to authenticated with check (bucket_id = 'restaurant-assets');
drop policy if exists "auth update restaurant-assets" on storage.objects;
create policy "auth update restaurant-assets" on storage.objects for update to authenticated using (bucket_id = 'restaurant-assets');
drop policy if exists "auth delete restaurant-assets" on storage.objects;
create policy "auth delete restaurant-assets" on storage.objects for delete to authenticated using (bucket_id = 'restaurant-assets');
