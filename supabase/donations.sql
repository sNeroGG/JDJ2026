-- Libro de donaciones JDJ. Ejecutar en el SQL Editor de Supabase.
-- El service role (solo servidor) ignora RLS; anon/authenticated no tienen políticas.

create table if not exists public.donations (
  id uuid primary key,
  full_name text not null,
  dui text not null,
  email text not null,
  phone text not null,
  parish text not null,
  amount numeric(10, 2) not null check (amount >= 5 and amount <= 25),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'expired')),
  payment_method text not null default 'Transferencia',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- Si la tabla ya existía con columnas de un procesador de pago, quítalas.
alter table public.donations drop column if exists wompi_enlace_id;
alter table public.donations drop column if exists wompi_transaction_id;
alter table public.donations drop column if exists raw_webhook;

alter table public.donations
  alter column payment_method set default 'Transferencia';

update public.donations
  set payment_method = 'Transferencia'
  where payment_method is null or btrim(payment_method) = '';

alter table public.donations
  alter column payment_method set not null;

create index if not exists donations_created_at_idx
  on public.donations (created_at desc);

create index if not exists donations_status_idx
  on public.donations (status);

alter table public.donations enable row level security;

revoke all on public.donations from anon, authenticated;
grant all on public.donations to service_role;
