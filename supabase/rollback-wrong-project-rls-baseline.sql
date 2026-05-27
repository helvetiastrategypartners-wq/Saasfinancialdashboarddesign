-- ============================================================================
-- Rollback targeted at the accidental HSP RLS baseline execution on the wrong
-- Supabase project.
--
-- This removes only objects/policies created by:
-- supabase/migrations/20260527103000_security_rls_baseline.sql
--
-- It intentionally does NOT drop existing salon/tenant policies such as:
-- - profile_self_select
-- - profiles_select
-- - salon_admin_*_staff_profiles
-- ============================================================================

-- 1. Remove HSP policies added to profiles.
do $$
begin
  if to_regclass('public.profiles') is not null then
    drop policy if exists "profiles authenticated own select" on public.profiles;
    drop policy if exists "profiles authenticated own update" on public.profiles;
  end if;
end $$;

-- 2. Remove temporary-password column added by HSP, if it is not part of this project.
alter table if exists public.profiles
  drop column if exists must_change_password;

-- 3. Drop privacy/audit tables added by the HSP baseline.
drop table if exists public.admin_audit_logs cascade;
drop table if exists public.privacy_requests cascade;
drop table if exists public.data_retention_policies cascade;

-- 4. Remove private helper added by the HSP baseline.
drop function if exists private.current_company_id();

-- Drop the private schema only if empty.
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

-- 5. Optional repair grants.
-- Run these ONLY if the wrong app broke because profile grants were revoked.
-- Keep them commented until needed.
--
-- grant select, insert, update, delete on table public.profiles to authenticated;
-- grant select, insert, update on table public.profiles to anon;

-- 6. Check remaining profile policies.
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

-- 7. Check remaining HSP artifacts. Expected: 0 rows.
select
  object_name,
  exists_after_rollback
from (
  values
    ('public.admin_audit_logs', to_regclass('public.admin_audit_logs') is not null),
    ('public.privacy_requests', to_regclass('public.privacy_requests') is not null),
    ('public.data_retention_policies', to_regclass('public.data_retention_policies') is not null),
    ('private.current_company_id()', exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'private'
        and p.proname = 'current_company_id'
    ))
) as checks(object_name, exists_after_rollback)
where exists_after_rollback = true;
