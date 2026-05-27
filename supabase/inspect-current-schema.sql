-- ============================================================================
-- Current Supabase schema inspection
-- Run this in Supabase SQL Editor when the expected HSP tables/policies do not
-- match the actual project.
-- ============================================================================

-- 1. Public tables currently present.
select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by table_name;

-- 2. Columns for the auth/tenant profile model.
select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
order by ordinal_position;

-- 3. Expected HSP tables existence check.
with expected(table_name) as (
  values
    ('companies'),
    ('profiles'),
    ('transactions'),
    ('customers'),
    ('marketing_metrics'),
    ('admin_audit_logs'),
    ('privacy_requests'),
    ('data_retention_policies')
)
select
  expected.table_name,
  to_regclass(format('public.%I', expected.table_name)) is not null as exists
from expected
order by expected.table_name;

-- 4. Existing profile policies, useful to avoid fighting another app schema.
select
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'profiles'
order by policyname;

-- 5. Tenant helper functions already present in this project.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as result_type
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
  and (
    p.proname ilike '%tenant%'
    or p.proname ilike '%profile%'
    or p.proname ilike '%company%'
  )
order by n.nspname, p.proname;

-- 6. Public grants on profiles.
select
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'profiles'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;
