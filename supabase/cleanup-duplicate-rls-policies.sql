-- ============================================================================
-- Cleanup duplicate RLS policies created by an earlier baseline draft.
--
-- Keep the existing HSP policy family:
--   *_select_own_company / *_insert_own_company / *_update_own_company /
--   *_delete_own_company, backed by app_private.current_company_id().
--
-- Remove only the duplicate policy family created with private.current_company_id().
-- Run this once in Supabase SQL Editor, then run verify-security-hardening.sql.
-- ============================================================================

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'alerts',
    'cohort_snapshots',
    'customers',
    'debts',
    'goals',
    'inventory_items',
    'marketing_metrics',
    'products',
    'receivables',
    'transactions'
  ]
  loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('drop policy if exists %I on public.%I', table_name || ' authenticated company select', table_name);
      execute format('drop policy if exists %I on public.%I', table_name || ' authenticated company insert', table_name);
      execute format('drop policy if exists %I on public.%I', table_name || ' authenticated company update', table_name);
      execute format('drop policy if exists %I on public.%I', table_name || ' authenticated company delete', table_name);
    end if;
  end loop;
end $$;

do $$
begin
  if to_regclass('public.companies') is not null then
    drop policy if exists "companies authenticated own select" on public.companies;
  end if;

  if to_regclass('public.profiles') is not null then
    drop policy if exists "profiles authenticated own select" on public.profiles;
    drop policy if exists "profiles authenticated own update" on public.profiles;
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'private') then
    drop function if exists private.current_company_id();
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'private')
    and not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'private'
    )
    and not exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'private'
    )
  then
    drop schema private;
  end if;
end $$;
