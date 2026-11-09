-- Porția: the shared product database.
-- Barcodes people filled in from a label and chose to share. A product counts as confirmed once
-- people on at least two different networks sent values that agree.
-- Only the server function reads or writes, through the SQL functions below and the service role.
-- The public keys see nothing: row level security is on and there are no policies.

create table if not exists public.shared_products (
  code          text primary key check (code ~ '^[0-9]{8,14}$'),
  name          text not null check (char_length(name) between 2 and 80),
  unit          text not null check (unit in ('g', 'ml')),
  kcal          numeric(6,1) not null check (kcal between 0 and 900),
  protein       numeric(5,1) not null check (protein between 0 and 100),
  carbs         numeric(5,1) not null check (carbs between 0 and 100),
  fat           numeric(5,1) not null check (fat between 0 and 100),
  serving       integer check (serving between 1 and 5000),
  pack          integer check (pack between 1 and 20000),
  status        text not null check (status in ('pending', 'verified')),
  confirmations integer not null default 1,
  updated_at    timestamptz not null default now()
);

-- One row per product and install. install_hash and net_hash are one-way hashes made with a server-side pepper:
-- they only tell whether two contributions came from different installs and different networks.
create table if not exists public.product_contributions (
  id           bigint generated always as identity primary key,
  code         text not null check (code ~ '^[0-9]{8,14}$'),
  install_hash text not null check (install_hash ~ '^[0-9a-f]{64}$'),
  net_hash     text not null check (net_hash ~ '^[0-9a-f]{64}$'),
  name         text not null check (char_length(name) between 2 and 80),
  unit         text not null check (unit in ('g', 'ml')),
  kcal         numeric(6,1) not null check (kcal between 0 and 900),
  protein      numeric(5,1) not null check (protein between 0 and 100),
  carbs        numeric(5,1) not null check (carbs between 0 and 100),
  fat          numeric(5,1) not null check (fat between 0 and 100),
  serving      integer check (serving between 1 and 5000),
  pack         integer check (pack between 1 and 20000),
  created_at   timestamptz not null default clock_timestamp(),
  unique (code, install_hash)
);
create index if not exists product_contributions_by_code on public.product_contributions (code, created_at desc);
create index if not exists product_contributions_by_install on public.product_contributions (install_hash);

-- Counters for rate limits; each row lives for at most an hour or a day.
create table if not exists public.rate_hits (
  bucket     text primary key,
  n          integer not null,
  expires_at timestamptz not null
);

alter table public.shared_products enable row level security;
alter table public.product_contributions enable row level security;
alter table public.rate_hits enable row level security;
revoke all on table public.shared_products, public.product_contributions, public.rate_hits from anon, authenticated;

-- Two readings of the same label agree when the calories differ by at most 5% (or 8 kcal)
-- and each macronutrient by at most 10% (or 1 g)
create or replace function public.portia_agree(a_unit text, a_kcal numeric, a_protein numeric, a_carbs numeric, a_fat numeric,
                                               b_unit text, b_kcal numeric, b_protein numeric, b_carbs numeric, b_fat numeric)
returns boolean language sql immutable set search_path = public as $$
  select a_unit = b_unit
     and abs(a_kcal - b_kcal) <= greatest(8, 0.05 * greatest(a_kcal, b_kcal))
     and abs(a_protein - b_protein) <= greatest(1, 0.1 * greatest(a_protein, b_protein))
     and abs(a_carbs - b_carbs) <= greatest(1, 0.1 * greatest(a_carbs, b_carbs))
     and abs(a_fat - b_fat) <= greatest(1, 0.1 * greatest(a_fat, b_fat))
$$;

-- Counts one request in a bucket; false once the bucket is over its limit for the window
create or replace function public.portia_hit(p_bucket text, p_limit integer, p_seconds integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare v integer;
begin
  insert into rate_hits as r (bucket, n, expires_at) values (p_bucket, 1, now() + make_interval(secs => p_seconds))
  on conflict (bucket) do update set
    n = case when r.expires_at < now() then 1 else r.n + 1 end,
    expires_at = case when r.expires_at < now() then now() + make_interval(secs => p_seconds) else r.expires_at end
  returning n into v;
  if random() < 0.02 then delete from rate_hits where expires_at < now(); end if;
  return v <= p_limit;
end $$;

create or replace function public.portia_product_get(p_code text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(
    (select jsonb_build_object('status', s.status, 'confirmations', s.confirmations,
       'product', jsonb_build_object('code', s.code, 'name', s.name, 'unit', s.unit,
         'per100', jsonb_build_object('kcal', s.kcal, 'protein', s.protein, 'carbs', s.carbs, 'fat', s.fat),
         'serving', s.serving, 'pack', s.pack))
     from shared_products s where s.code = p_code),
    jsonb_build_object('status', 'none'))
$$;

-- Rebuilds one product from its contributions: the largest group that agrees with one of them,
-- counted in distinct networks (then in contributions), gives the values (the median of the group)
create or replace function public.portia_product_rebuild(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare best record;
begin
  with c as (select * from product_contributions where code = p_code order by created_at desc limit 50),
       g as (select a.id, count(distinct b.net_hash) as nets, count(*) as cnt
               from c a join c b on portia_agree(a.unit, a.kcal, a.protein, a.carbs, a.fat, b.unit, b.kcal, b.protein, b.carbs, b.fat)
              group by a.id)
  select a.*, g.nets into best from c a join g on g.id = a.id order by g.nets desc, g.cnt desc, a.created_at desc limit 1;

  if not found then
    delete from shared_products where code = p_code;
    return jsonb_build_object('status', 'none', 'confirmations', 0);
  end if;

  insert into shared_products as s (code, name, unit, kcal, protein, carbs, fat, serving, pack, status, confirmations, updated_at)
  select p_code, best.name, best.unit,
         round((percentile_cont(0.5) within group (order by m.kcal))::numeric, 1),
         round((percentile_cont(0.5) within group (order by m.protein))::numeric, 1),
         round((percentile_cont(0.5) within group (order by m.carbs))::numeric, 1),
         round((percentile_cont(0.5) within group (order by m.fat))::numeric, 1),
         round(percentile_cont(0.5) within group (order by m.serving))::integer,
         round(percentile_cont(0.5) within group (order by m.pack))::integer,
         case when best.nets >= 2 then 'verified' else 'pending' end,
         best.nets, now()
    from (select * from product_contributions where code = p_code order by created_at desc limit 50) m
   where portia_agree(best.unit, best.kcal, best.protein, best.carbs, best.fat, m.unit, m.kcal, m.protein, m.carbs, m.fat)
  on conflict (code) do update set
    name = excluded.name, unit = excluded.unit, kcal = excluded.kcal, protein = excluded.protein, carbs = excluded.carbs, fat = excluded.fat,
    serving = excluded.serving, pack = excluded.pack, status = excluded.status, confirmations = excluded.confirmations, updated_at = now();

  return jsonb_build_object('status', case when best.nets >= 2 then 'verified' else 'pending' end, 'confirmations', best.nets);
end $$;

-- One contribution: the same hard checks as the app, then the product is rebuilt.
-- Sending again from the same install replaces that install's earlier values.
create or replace function public.portia_product_contribute(p_code text, p_install_hash text, p_net_hash text, p_name text, p_unit text,
                                                            p_kcal numeric, p_protein numeric, p_carbs numeric, p_fat numeric,
                                                            p_serving integer, p_pack integer)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if p_protein + p_carbs + p_fat > 102 then
    raise exception 'protein, carbs and fat add up to more than 100 g' using errcode = '22023';
  end if;
  insert into product_contributions (code, install_hash, net_hash, name, unit, kcal, protein, carbs, fat, serving, pack)
  values (p_code, p_install_hash, p_net_hash, p_name, p_unit, p_kcal, p_protein, p_carbs, p_fat, p_serving, p_pack)
  on conflict (code, install_hash) do update set
    net_hash = excluded.net_hash, name = excluded.name, unit = excluded.unit, kcal = excluded.kcal, protein = excluded.protein,
    carbs = excluded.carbs, fat = excluded.fat, serving = excluded.serving, pack = excluded.pack, created_at = clock_timestamp();
  return portia_product_rebuild(p_code);
end $$;

-- Withdraws everything one install sent, and rebuilds the products it touched
create or replace function public.portia_forget(p_install_hash text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare codes text[]; c text;
begin
  select coalesce(array_agg(distinct code), '{}') into codes from product_contributions where install_hash = p_install_hash;
  delete from product_contributions where install_hash = p_install_hash;
  foreach c in array codes loop perform portia_product_rebuild(c); end loop;
  return jsonb_build_object('removed', coalesce(array_length(codes, 1), 0));
end $$;

-- Only the server function (service role) may call these
revoke all on function public.portia_agree(text, numeric, numeric, numeric, numeric, text, numeric, numeric, numeric, numeric) from public, anon, authenticated;
revoke all on function public.portia_hit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.portia_product_get(text) from public, anon, authenticated;
revoke all on function public.portia_product_rebuild(text) from public, anon, authenticated;
revoke all on function public.portia_product_contribute(text, text, text, text, text, numeric, numeric, numeric, numeric, integer, integer) from public, anon, authenticated;
revoke all on function public.portia_forget(text) from public, anon, authenticated;
grant execute on function public.portia_hit(text, integer, integer) to service_role;
grant execute on function public.portia_product_get(text) to service_role;
grant execute on function public.portia_product_contribute(text, text, text, text, text, numeric, numeric, numeric, numeric, integer, integer) to service_role;
grant execute on function public.portia_forget(text) to service_role;
