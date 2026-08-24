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
  wompi_enlace_id bigint,
  wompi_transaction_id text,
  payment_method text,
  paid_at timestamptz,
  raw_webhook jsonb,
  created_at timestamptz not null default now()
);

create index if not exists donations_created_at_idx
  on public.donations (created_at desc);

create index if not exists donations_status_idx
  on public.donations (status);

alter table public.donations enable row level security;
