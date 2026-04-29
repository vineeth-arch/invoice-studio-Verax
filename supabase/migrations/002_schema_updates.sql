alter table public.profiles
add column if not exists default_signatory_name text,
add column if not exists default_terms text,
add column if not exists default_declaration text,
add column if not exists default_invoice_prefix text default 'INV',
add column if not exists default_po_prefix text default 'PO',
add column if not exists logo_base64 text,
add column if not exists signature_base64 text,
add column if not exists default_notes text;

alter table public.invoices
add column if not exists share_token text unique,
add column if not exists logo_image_base64 text,
add column if not exists irn_qr_image_base64 text,
add column if not exists signature_image_base64 text;

alter table public.purchase_orders
add column if not exists share_token text unique,
add column if not exists signature_image_base64 text;

create table if not exists public.email_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_name text,
  from_email text,
  email_signature text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.email_settings enable row level security;

drop policy if exists "Users manage own email settings" on public.email_settings;
create policy "Users manage own email settings"
on public.email_settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists email_settings_user_id_idx
on public.email_settings(user_id);

create index if not exists invoices_share_token_idx
on public.invoices(share_token)
where share_token is not null;

create index if not exists purchase_orders_share_token_idx
on public.purchase_orders(share_token)
where share_token is not null;

drop trigger if exists set_email_settings_updated_at on public.email_settings;
create trigger set_email_settings_updated_at
before update on public.email_settings
for each row
execute function public.set_updated_at();

grant select, insert, update, delete on table public.email_settings to authenticated;

create or replace function public.get_invoice_by_share_token(
  p_token text
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select full_data
  from public.invoices
  where share_token = p_token
  limit 1;
$$;

create or replace function public.get_po_by_share_token(
  p_token text
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select full_data
  from public.purchase_orders
  where share_token = p_token
  limit 1;
$$;

grant execute on function public.get_invoice_by_share_token to anon, authenticated;
grant execute on function public.get_po_by_share_token to anon, authenticated;
