-- Setup completo JDJ: donaciones + tienda.
-- SQL Editor de Supabase → New query → pegar este archivo → Run.
-- Si ya corriste donations.sql, basta con ejecutar store.sql.

-- === Donaciones ===

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

alter table public.donations
  alter column dui set default '';

alter table public.donations
  alter column dui drop not null;

alter table public.donations
  alter column phone set default '';

alter table public.donations
  alter column phone drop not null;

create index if not exists donations_status_idx
  on public.donations (status);

alter table public.donations enable row level security;

revoke all on public.donations from anon, authenticated;
grant all on public.donations to service_role;

-- === Tienda: stock y pedidos ===

create table if not exists public.store_stock (
  product_id text not null,
  variant_id text not null,
  stock integer not null check (stock >= 0),
  updated_at timestamptz not null default now(),
  primary key (product_id, variant_id)
);

create table if not exists public.store_orders (
  id text primary key,
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text not null,
  product_id text not null,
  product_title text not null,
  variant_id text not null,
  size text not null default '',
  color text not null default '',
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null,
  total numeric(10, 2) not null,
  payment text not null default 'Transferencia',
  note text not null default '',
  status text not null default 'nuevo'
    check (status in ('nuevo', 'atendido', 'cancelado'))
);

create index if not exists store_orders_created_at_idx
  on public.store_orders (created_at desc);

create index if not exists store_orders_status_idx
  on public.store_orders (status);

alter table public.store_stock enable row level security;
alter table public.store_orders enable row level security;

revoke all on public.store_stock from anon, authenticated;
revoke all on public.store_orders from anon, authenticated;
grant all on public.store_stock to service_role;
grant all on public.store_orders to service_role;

create or replace function public.ensure_store_stock(p_rows jsonb)
returns void
language plpgsql
as $$
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    return;
  end if;

  insert into public.store_stock (product_id, variant_id, stock)
  select
    r->>'product_id',
    r->>'variant_id',
    greatest(coalesce((r->>'stock')::integer, 0), 0)
  from jsonb_array_elements(p_rows) as r
  where coalesce(r->>'product_id', '') <> ''
    and coalesce(r->>'variant_id', '') <> ''
  on conflict (product_id, variant_id) do nothing;
end;
$$;

create or replace function public.place_store_order(p_order jsonb, p_seed integer)
returns jsonb
language plpgsql
as $$
declare
  v_id text := p_order->>'id';
  v_product_id text := p_order->>'product_id';
  v_variant_id text := p_order->>'variant_id';
  v_qty integer := coalesce((p_order->>'quantity')::integer, 0);
  v_stock integer;
begin
  if v_id is null or v_product_id is null or v_variant_id is null or v_qty < 1 then
    raise exception 'ORDER_INVALID';
  end if;

  insert into public.store_stock (product_id, variant_id, stock)
  values (v_product_id, v_variant_id, greatest(coalesce(p_seed, 0), 0))
  on conflict (product_id, variant_id) do nothing;

  select stock into v_stock
  from public.store_stock
  where product_id = v_product_id and variant_id = v_variant_id
  for update;

  if v_stock is null then
    raise exception 'STOCK_NOT_FOUND';
  end if;

  if v_stock < v_qty then
    raise exception 'STOCK_INSUFFICIENT:%', v_stock;
  end if;

  update public.store_stock
  set stock = stock - v_qty, updated_at = now()
  where product_id = v_product_id and variant_id = v_variant_id
  returning stock into v_stock;

  insert into public.store_orders (
    id, created_at, name, email, phone, product_id, product_title,
    variant_id, size, color, quantity, unit_price, total, payment, note, status
  ) values (
    v_id,
    coalesce((p_order->>'created_at')::timestamptz, now()),
    coalesce(p_order->>'name', ''),
    coalesce(p_order->>'email', ''),
    coalesce(p_order->>'phone', ''),
    v_product_id,
    coalesce(p_order->>'product_title', ''),
    v_variant_id,
    coalesce(p_order->>'size', ''),
    coalesce(p_order->>'color', ''),
    v_qty,
    coalesce((p_order->>'unit_price')::numeric, 0),
    coalesce((p_order->>'total')::numeric, 0),
    coalesce(p_order->>'payment', 'Transferencia'),
    coalesce(p_order->>'note', ''),
    coalesce(p_order->>'status', 'nuevo')
  );

  return jsonb_build_object('stock', v_stock);
end;
$$;

create or replace function public.update_store_order_status(p_id text, p_status text)
returns public.store_orders
language plpgsql
as $$
declare
  v_order public.store_orders;
  v_stock integer;
begin
  if p_status not in ('nuevo', 'atendido', 'cancelado') then
    raise exception 'ORDER_INVALID';
  end if;

  select * into v_order
  from public.store_orders
  where id = p_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.status = p_status then
    return v_order;
  end if;

  if p_status = 'cancelado' and v_order.status <> 'cancelado' then
    update public.store_stock
    set stock = stock + v_order.quantity, updated_at = now()
    where product_id = v_order.product_id and variant_id = v_order.variant_id;
  elsif v_order.status = 'cancelado' and p_status <> 'cancelado' then
    insert into public.store_stock (product_id, variant_id, stock)
    values (v_order.product_id, v_order.variant_id, 0)
    on conflict (product_id, variant_id) do nothing;

    select stock into v_stock
    from public.store_stock
    where product_id = v_order.product_id and variant_id = v_order.variant_id
    for update;

    if v_stock is null or v_stock < v_order.quantity then
      raise exception 'STOCK_INSUFFICIENT:%', coalesce(v_stock, 0);
    end if;

    update public.store_stock
    set stock = stock - v_order.quantity, updated_at = now()
    where product_id = v_order.product_id and variant_id = v_order.variant_id;
  end if;

  update public.store_orders
  set status = p_status
  where id = p_id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.ensure_store_stock(jsonb) from public, anon, authenticated;
revoke all on function public.place_store_order(jsonb, integer) from public, anon, authenticated;
revoke all on function public.update_store_order_status(text, text) from public, anon, authenticated;
grant execute on function public.ensure_store_stock(jsonb) to service_role;
grant execute on function public.place_store_order(jsonb, integer) to service_role;
grant execute on function public.update_store_order_status(text, text) to service_role;
