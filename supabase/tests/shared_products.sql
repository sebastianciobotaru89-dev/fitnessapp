-- Tests for the shared product database, run by .github/workflows/server.yml on a fresh Postgres
-- after the roles Supabase has (anon, authenticated, service_role) and the migrations.
\set ON_ERROR_STOP on

do $$
declare
  r jsonb;
  i1 text := repeat('a', 64); i2 text := repeat('b', 64); i3 text := repeat('c', 64); i4 text := repeat('d', 64);
  n1 text := repeat('1', 64); n2 text := repeat('2', 64); n3 text := repeat('3', 64);
  code text := '5901234123457';
begin
  r := portia_product_contribute(code, i1, n1, 'Iaurt grecesc', 'g', 73, 9.2, 4, 2, 150, 400);
  assert r->>'status' = 'pending' and (r->>'confirmations')::int = 1, 'one person: pending ' || r::text;

  r := portia_product_contribute(code, i2, n1, 'Iaurt grecesc', 'g', 74, 9.3, 4, 2, 150, 400);
  assert r->>'status' = 'pending' and (r->>'confirmations')::int = 1, 'a second install on the same network does not confirm ' || r::text;

  r := portia_product_contribute(code, i3, n2, 'Iaurt grecesc 2%', 'g', 72, 9.0, 4.1, 2, null, 400);
  assert r->>'status' = 'verified' and (r->>'confirmations')::int = 2, 'two networks confirm ' || r::text;

  r := portia_product_get(code);
  assert (r->'product'->'per100'->>'kcal')::numeric = 73, 'the median of the agreeing values ' || r::text;
  assert r->'product'->>'name' = 'Iaurt grecesc 2%' and (r->'product'->>'pack')::int = 400 and (r->'product'->>'serving')::int = 150, 'name and portions ' || r::text;

  r := portia_product_contribute(code, i4, n3, 'Altceva', 'g', 500, 50, 40, 10, null, null);
  r := portia_product_get(code);
  assert r->>'status' = 'verified' and r->'product'->>'name' <> 'Altceva' and (r->'product'->'per100'->>'kcal')::numeric = 73, 'one wrong reading does not override ' || r::text;

  r := portia_product_contribute(code, i3, n2, 'Iaurt grecesc 2%', 'g', 72, 9.0, 4.1, 2, null, 400);
  assert (select count(*) from product_contributions where code = '5901234123457') = 4, 'sending again replaces, never doubles';

  r := portia_product_contribute('4006381333931', i1, n1, 'Lapte', 'ml', 64, 3.3, 4.8, 3.5, null, 1000);
  r := portia_product_contribute('4006381333931', i3, n2, 'Lapte', 'g', 64, 3.3, 4.8, 3.5, null, 1000);
  assert r->>'status' = 'pending', 'g and ml never agree ' || r::text;

  begin
    perform portia_product_contribute('96385074', i1, n1, 'Imposibil', 'g', 400, 60, 40, 30, null, null);
    raise exception 'macros over 100 g should be refused';
  exception when sqlstate '22023' then null;
  end;
  begin
    perform portia_product_contribute('96385074', i1, n1, 'Imposibil', 'g', 950, 1, 1, 1, null, null);
    raise exception 'over 900 kcal should be refused';
  exception when check_violation then null;
  end;
  begin
    perform portia_product_contribute('12ab', i1, n1, 'Imposibil', 'g', 100, 1, 1, 1, null, null);
    raise exception 'a malformed code should be refused';
  exception when check_violation then null;
  end;

  r := portia_forget(i3);
  assert (r->>'removed')::int = 2, 'forget counts the products ' || r::text;
  r := portia_product_get(code);
  assert r->>'status' = 'pending' and r->'product'->>'name' = 'Iaurt grecesc', 'withdrawing a confirmation makes it pending again, and the larger group still wins ' || r::text;
  perform portia_forget(i1); perform portia_forget(i2); perform portia_forget(i4);
  assert portia_product_get(code)->>'status' = 'none' and (select count(*) from product_contributions) = 0, 'withdrawing everything removes the product';

  assert portia_hit('t', 2, 60) and portia_hit('t', 2, 60) and not portia_hit('t', 2, 60), 'the third request in a window is refused';
  update rate_hits set expires_at = now() - interval '1 second' where bucket = 't';
  assert portia_hit('t', 2, 60), 'a new window starts over';
end $$;

-- the server function's role can call the API functions
set role service_role;
select portia_product_get('5901234123457')->>'status' as service_role_can_read;
reset role;

-- the public roles reach nothing, not even through the functions
set role anon;
do $$ begin
  begin perform 1 from shared_products limit 1; raise exception 'anon read a table'; exception when insufficient_privilege then null; end;
  begin perform 1 from product_contributions limit 1; raise exception 'anon read contributions'; exception when insufficient_privilege then null; end;
  begin perform portia_product_get('5901234123457'); raise exception 'anon called a function'; exception when insufficient_privilege then null; end;
  begin perform portia_forget(repeat('a', 64)); raise exception 'anon called forget'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set role authenticated;
do $$ begin
  begin perform portia_product_contribute('5901234123457', repeat('a', 64), repeat('1', 64), 'X', 'g', 1, 1, 1, 1, null, null); raise exception 'authenticated called contribute'; exception when insufficient_privilege then null; end;
end $$;
reset role;

select 'all database tests passed' as result;
