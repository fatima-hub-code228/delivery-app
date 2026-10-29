-- =============================================================================
-- VAYORA Shared Abu Dhabi Marketplace Schema & Row Level Security (RLS) Migration
-- Connects:
--   1. Customer App ("Food Delivery App"): github.com/fatima-hub-code228/vayora
--   2. Restaurant App ("Delivery App"):    github.com/fatima-hub-code228/delivery-app
-- Shared Supabase Project: xwbfblwigouidecdukef (https://xwbfblwigouidecdukef.supabase.co)
--
-- SAFETY GUARANTEE:
--   - Uses CREATE TABLE IF NOT EXISTS and ADD COLUMN IF NOT EXISTS.
--   - Does NOT drop, truncate, reset, or overwrite any existing rows.
-- =============================================================================

-- 1. Orders Table (Shared between Customer App & Restaurant Partner Portal)
create table if not exists public.orders (
  id text primary key,
  customer_name text not null default 'Guest Customer',
  vip_tier text default 'Standard',
  status text not null default 'incoming',
  total_aed numeric not null default 0,
  delivery_zone text,
  items jsonb default '[]'::jsonb,
  courier text,
  notes text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists vip_tier text;
alter table public.orders add column if not exists status text default 'incoming';
alter table public.orders add column if not exists total_aed numeric default 0;
alter table public.orders add column if not exists delivery_zone text;
alter table public.orders add column if not exists items jsonb default '[]'::jsonb;
alter table public.orders add column if not exists courier text;
alter table public.orders add column if not exists notes text;
alter table public.orders add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- 2. Menu Inventory Table (Shared Products across all 6 Abu Dhabi Vendors)
create table if not exists public.menu_inventory (
  id text primary key,
  title text not null,
  category text default 'mains',
  stock integer not null default 15,
  price numeric not null default 0,
  is_86 boolean not null default false,
  sku text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.menu_inventory add column if not exists title text;
alter table public.menu_inventory add column if not exists category text default 'mains';
alter table public.menu_inventory add column if not exists stock integer default 15;
alter table public.menu_inventory add column if not exists price numeric default 0;
alter table public.menu_inventory add column if not exists is_86 boolean default false;
alter table public.menu_inventory add column if not exists sku text;
alter table public.menu_inventory add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- 3. Delivery Zones Table (Shared Abu Dhabi Service Area Registry)
create table if not exists public.delivery_zones (
  id text primary key,
  name text not null,
  radius text,
  fee text,
  min_order text,
  is_active boolean not null default true,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.delivery_zones add column if not exists name text;
alter table public.delivery_zones add column if not exists radius text;
alter table public.delivery_zones add column if not exists fee text;
alter table public.delivery_zones add column if not exists min_order text;
alter table public.delivery_zones add column if not exists is_active boolean default true;
alter table public.delivery_zones add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- 4. Partner Actions Audit Log Table
create table if not exists public.partner_actions (
  id uuid default gen_random_uuid() primary key,
  action_type text not null,
  entity_id text,
  details jsonb default '{}'::jsonb,
  operator text default 'Tariq Al Mansoori',
  branch text default 'The Grand Pavilion',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- =============================================================================
-- Row Level Security (RLS) & Access Control Policies
-- =============================================================================

alter table public.orders enable row level security;
alter table public.menu_inventory enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.partner_actions enable row level security;

-- Orders Policies:
-- Allow customers and restaurant terminals (anon + authenticated) to read orders,
-- place new incoming orders, and update order status (incoming -> cooking -> ready_for_pickup -> completed / declined).
drop policy if exists "orders_select_shared_policy" on public.orders;
create policy "orders_select_shared_policy"
  on public.orders for select
  to anon, authenticated
  using (true);

drop policy if exists "orders_insert_customer_policy" on public.orders;
create policy "orders_insert_customer_policy"
  on public.orders for insert
  to anon, authenticated
  with check (
    status in ('incoming', 'cooking', 'ready_for_pickup', 'completed', 'declined')
  );

drop policy if exists "orders_update_partner_policy" on public.orders;
create policy "orders_update_partner_policy"
  on public.orders for update
  to anon, authenticated
  using (true)
  with check (
    status in ('incoming', 'cooking', 'ready_for_pickup', 'completed', 'declined', 'cancelled', 'rejected')
  );

-- Menu Inventory Policies:
drop policy if exists "menu_inventory_select_policy" on public.menu_inventory;
create policy "menu_inventory_select_policy"
  on public.menu_inventory for select
  to anon, authenticated
  using (true);

drop policy if exists "menu_inventory_write_policy" on public.menu_inventory;
create policy "menu_inventory_write_policy"
  on public.menu_inventory for all
  to anon, authenticated
  using (true)
  with check (true);

-- Delivery Zones Policies:
drop policy if exists "delivery_zones_select_policy" on public.delivery_zones;
create policy "delivery_zones_select_policy"
  on public.delivery_zones for select
  to anon, authenticated
  using (true);

drop policy if exists "delivery_zones_write_policy" on public.delivery_zones;
create policy "delivery_zones_write_policy"
  on public.delivery_zones for all
  to anon, authenticated
  using (true)
  with check (true);

-- Partner Actions Policies:
drop policy if exists "partner_actions_select_policy" on public.partner_actions;
create policy "partner_actions_select_policy"
  on public.partner_actions for select
  to anon, authenticated
  using (true);

drop policy if exists "partner_actions_insert_policy" on public.partner_actions;
create policy "partner_actions_insert_policy"
  on public.partner_actions for insert
  to anon, authenticated
  with check (true);
