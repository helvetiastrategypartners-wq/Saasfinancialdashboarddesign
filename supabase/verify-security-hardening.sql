-- ============================================================================
-- Verification queries for 20260527103000_security_rls_baseline.sql
-- Run this in Supabase SQL Editor after applying the migration.
-- ============================================================================

-- 1. RLS must be enabled on all existing tenant/privacy tables.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'alerts',
    'cohort_snapshots',
    'companies',
    'customers',
    'debts',
    'goals',
    'inventory_items',
    'marketing_metrics',
    'products',
    'profiles',
    'receivables',
    'transactions',
    'admin_audit_logs',
    'privacy_requests',
    'data_retention_policies'
  )
order by c.relname;

-- 2. anon should have no direct privileges on business/privacy tables.
select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'anon'
  and table_name in (
    'alerts',
    'cohort_snapshots',
    'companies',
    'customers',
    'debts',
    'goals',
    'inventory_items',
    'marketing_metrics',
    'products',
    'profiles',
    'receivables',
    'transactions',
    'admin_audit_logs',
    'privacy_requests',
    'data_retention_policies'
  )
order by table_name, privilege_type;

-- Expected: 0 rows.

-- 3. Policies should exist for authenticated tenant isolation.
select
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'alerts',
    'cohort_snapshots',
    'companies',
    'customers',
    'debts',
    'goals',
    'inventory_items',
    'marketing_metrics',
    'products',
    'profiles',
    'receivables',
    'transactions'
  )
order by tablename, policyname;

-- Expected: one policy set per table using app_private.current_company_id().
-- If rows appear here, the previous private.current_company_id() baseline left duplicates to clean.
select
  tablename,
  policyname
from pg_policies
where schemaname = 'public'
  and policyname in (
    'alerts authenticated company select',
    'alerts authenticated company insert',
    'alerts authenticated company update',
    'alerts authenticated company delete',
    'cohort_snapshots authenticated company select',
    'cohort_snapshots authenticated company insert',
    'cohort_snapshots authenticated company update',
    'cohort_snapshots authenticated company delete',
    'customers authenticated company select',
    'customers authenticated company insert',
    'customers authenticated company update',
    'customers authenticated company delete',
    'debts authenticated company select',
    'debts authenticated company insert',
    'debts authenticated company update',
    'debts authenticated company delete',
    'goals authenticated company select',
    'goals authenticated company insert',
    'goals authenticated company update',
    'goals authenticated company delete',
    'inventory_items authenticated company select',
    'inventory_items authenticated company insert',
    'inventory_items authenticated company update',
    'inventory_items authenticated company delete',
    'marketing_metrics authenticated company select',
    'marketing_metrics authenticated company insert',
    'marketing_metrics authenticated company update',
    'marketing_metrics authenticated company delete',
    'products authenticated company select',
    'products authenticated company insert',
    'products authenticated company update',
    'products authenticated company delete',
    'receivables authenticated company select',
    'receivables authenticated company insert',
    'receivables authenticated company update',
    'receivables authenticated company delete',
    'transactions authenticated company select',
    'transactions authenticated company insert',
    'transactions authenticated company update',
    'transactions authenticated company delete',
    'companies authenticated own select',
    'profiles authenticated own select',
    'profiles authenticated own update'
  )
order by tablename, policyname;

-- Expected: 0 rows.

-- 4. Reporting views should be security_invoker and authenticated SELECT only.
select
  c.relname as view_name,
  c.reloptions
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'v'
  and c.relname in ('v_channel_performance', 'v_monthly_summary', 'v_mrr')
order by c.relname;

select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('v_channel_performance', 'v_monthly_summary', 'v_mrr')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- 5. Temporary-password column should exist.
select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'must_change_password';

-- 6. Tenant helper prerequisites.
select
  'profiles.company_id exists' as check_name,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'company_id'
  ) as ok;

select
  'app_private.current_company_id exists' as check_name,
  to_regprocedure('app_private.current_company_id()') is not null as ok;

select
  'app_private.current_company_id callable' as check_name,
  app_private.current_company_id() is not null as has_company_for_current_user;

-- The callable check returns false in SQL Editor without an authenticated app
-- session because auth.uid() is null. Validate tenant filtering from the app.
