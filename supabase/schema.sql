create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_name text,
  legal_name text,
  gstin text,
  pan text,
  email text,
  phone text,
  website text,
  address jsonb,
  bank_details jsonb,
  logo_url text null,
  signature_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  gstin text,
  email text,
  phone text,
  address jsonb,
  place_of_supply text,
  state_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_number text not null,
  status text not null,
  issue_date date,
  due_date date,
  buyer jsonb,
  seller jsonb,
  line_items jsonb not null default '[]'::jsonb,
  totals jsonb,
  notes text,
  terms text,
  full_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, invoice_number)
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  po_number text not null,
  status text not null,
  issue_date date,
  vendor jsonb,
  buyer jsonb,
  line_items jsonb not null default '[]'::jsonb,
  totals jsonb,
  notes text,
  terms text,
  full_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, po_number)
);

create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_numbering (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at
before update on public.clients
for each row
execute function public.set_updated_at();

drop trigger if exists set_invoices_updated_at on public.invoices;
create trigger set_invoices_updated_at
before update on public.invoices
for each row
execute function public.set_updated_at();

drop trigger if exists set_purchase_orders_updated_at on public.purchase_orders;
create trigger set_purchase_orders_updated_at
before update on public.purchase_orders
for each row
execute function public.set_updated_at();

drop trigger if exists set_settings_updated_at on public.settings;
create trigger set_settings_updated_at
before update on public.settings
for each row
execute function public.set_updated_at();

drop trigger if exists set_document_numbering_updated_at on public.document_numbering;
create trigger set_document_numbering_updated_at
before update on public.document_numbering
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.settings enable row level security;
alter table public.document_numbering enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles
for delete
using (auth.uid() = id);

drop policy if exists "clients_select_own" on public.clients;
create policy "clients_select_own"
on public.clients
for select
using (auth.uid() = user_id);

drop policy if exists "clients_insert_own" on public.clients;
create policy "clients_insert_own"
on public.clients
for insert
with check (auth.uid() = user_id);

drop policy if exists "clients_update_own" on public.clients;
create policy "clients_update_own"
on public.clients
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "clients_delete_own" on public.clients;
create policy "clients_delete_own"
on public.clients
for delete
using (auth.uid() = user_id);

drop policy if exists "invoices_select_own" on public.invoices;
create policy "invoices_select_own"
on public.invoices
for select
using (auth.uid() = user_id);

drop policy if exists "invoices_insert_own" on public.invoices;
create policy "invoices_insert_own"
on public.invoices
for insert
with check (auth.uid() = user_id);

drop policy if exists "invoices_update_own" on public.invoices;
create policy "invoices_update_own"
on public.invoices
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "invoices_delete_own" on public.invoices;
create policy "invoices_delete_own"
on public.invoices
for delete
using (auth.uid() = user_id);

drop policy if exists "purchase_orders_select_own" on public.purchase_orders;
create policy "purchase_orders_select_own"
on public.purchase_orders
for select
using (auth.uid() = user_id);

drop policy if exists "purchase_orders_insert_own" on public.purchase_orders;
create policy "purchase_orders_insert_own"
on public.purchase_orders
for insert
with check (auth.uid() = user_id);

drop policy if exists "purchase_orders_update_own" on public.purchase_orders;
create policy "purchase_orders_update_own"
on public.purchase_orders
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "purchase_orders_delete_own" on public.purchase_orders;
create policy "purchase_orders_delete_own"
on public.purchase_orders
for delete
using (auth.uid() = user_id);

drop policy if exists "settings_select_own" on public.settings;
create policy "settings_select_own"
on public.settings
for select
using (auth.uid() = user_id);

drop policy if exists "settings_insert_own" on public.settings;
create policy "settings_insert_own"
on public.settings
for insert
with check (auth.uid() = user_id);

drop policy if exists "settings_update_own" on public.settings;
create policy "settings_update_own"
on public.settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "settings_delete_own" on public.settings;
create policy "settings_delete_own"
on public.settings
for delete
using (auth.uid() = user_id);

drop policy if exists "document_numbering_select_own" on public.document_numbering;
create policy "document_numbering_select_own"
on public.document_numbering
for select
using (auth.uid() = user_id);

drop policy if exists "document_numbering_insert_own" on public.document_numbering;
create policy "document_numbering_insert_own"
on public.document_numbering
for insert
with check (auth.uid() = user_id);

drop policy if exists "document_numbering_update_own" on public.document_numbering;
create policy "document_numbering_update_own"
on public.document_numbering
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "document_numbering_delete_own" on public.document_numbering;
create policy "document_numbering_delete_own"
on public.document_numbering
for delete
using (auth.uid() = user_id);
