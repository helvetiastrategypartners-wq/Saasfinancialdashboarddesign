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
  'private.current_company_id callable' as check_name,
  private.current_company_id() is not null as has_company_for_current_user;
