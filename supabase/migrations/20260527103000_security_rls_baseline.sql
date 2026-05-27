-- ============================================================================
-- Security / RLS baseline for the current HSP OS Supabase schema.
--
-- Assumptions confirmed during the 2026-05-26 audit:
-- - public.profiles.id = auth.users.id / auth.uid()
-- - public.profiles.company_id references public.companies(id)
-- - tenant-owned business tables use a text company_id column
--
-- This migration is intentionally idempotent so it can be pasted in Supabase SQL
-- Editor after manual fixes without failing on existing objects.
-- ============================================================================

create extension if not exists "pgcrypto";

create schema if not exists private;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create or replace function private.current_company_id()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_company_id text;
begin
  if to_regclass('public.profiles') is null then
    return null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'company_id'
  ) then
    execute 'select company_id::text from public.profiles where id = auth.uid() limit 1'
      into current_company_id;

    return current_company_id;
  end if;

  return null;
end
$$;

grant usage on schema private to authenticated;
grant execute on function private.current_company_id() to authenticated;

-- Required by the temporary-password flow.
alter table if exists public.profiles
  add column if not exists must_change_password boolean not null default false;

-- Privacy / security helper tables. Keep permissions server-only.
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_email text not null,
  action text not null,
  target_user_id uuid,
  target_email text,
  target_company_id text,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

create index if not exists admin_audit_logs_actor_email_idx
  on public.admin_audit_logs (actor_email);

create index if not exists admin_audit_logs_target_company_id_idx
  on public.admin_audit_logs (target_company_id);

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  company_id text references public.companies(id) on delete set null,
  requester_email text not null,
  requester_name text,
  request_type text not null check (request_type in ('access', 'rectification', 'erasure', 'restriction', 'portability', 'objection', 'other')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'rejected')),
  received_at timestamptz not null default now(),
  due_at timestamptz not null default now() + interval '30 days',
  completed_at timestamptz,
  notes text,
  created_by uuid,
  updated_at timestamptz not null default now()
);

create index if not exists privacy_requests_company_id_idx
  on public.privacy_requests (company_id);

create index if not exists privacy_requests_status_due_at_idx
  on public.privacy_requests (status, due_at);

create table if not exists public.data_retention_policies (
  id uuid primary key default gen_random_uuid(),
  data_category text not null unique,
  retention_period text not null,
  legal_basis text not null,
  deletion_mode text not null,
  notes text,
  updated_at timestamptz not null default now()
);

insert into public.data_retention_policies (data_category, retention_period, legal_basis, deletion_mode, notes)
values
  ('admin_audit_logs', '12 months rolling', 'legitimate_interest_security', 'delete', 'Logs of sensitive super-admin operations. Never store passwords or tokens.'),
  ('auth_profiles', 'contract duration + legal retention where applicable', 'contract', 'delete_or_anonymize', 'Deleting access is not the same as deleting financial/accounting records.'),
  ('financial_records', 'legal/accounting retention defined by jurisdiction', 'legal_obligation_or_contract', 'archive_then_delete', 'Confirm applicable retention with legal/accounting counsel.'),
  ('privacy_requests', '5 years after closure', 'legal_obligation', 'delete', 'Evidence of privacy/data-subject rights handling.')
on conflict (data_category) do update
set
  retention_period = excluded.retention_period,
  legal_basis = excluded.legal_basis,
  deletion_mode = excluded.deletion_mode,
  notes = excluded.notes,
  updated_at = now();

-- Remove all anonymous access from business/privacy tables.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
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
  ]
  loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('revoke all on table public.%I from anon', table_name);
    end if;
  end loop;
end $$;

-- Tenant-owned tables: authenticated users can only access rows for their profile company.
do $$
declare
  table_name text;
  policy_select text;
  policy_insert text;
  policy_update text;
  policy_delete text;
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
      policy_select := table_name || ' authenticated company select';
      policy_insert := table_name || ' authenticated company insert';
      policy_update := table_name || ' authenticated company update';
      policy_delete := table_name || ' authenticated company delete';

      execute format('alter table public.%I enable row level security', table_name);
      execute format('revoke all on table public.%I from anon', table_name);
      execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);

      execute format('drop policy if exists %I on public.%I', policy_select, table_name);
      execute format('drop policy if exists %I on public.%I', policy_insert, table_name);
      execute format('drop policy if exists %I on public.%I', policy_update, table_name);
      execute format('drop policy if exists %I on public.%I', policy_delete, table_name);

      execute format(
        'create policy %I on public.%I for select to authenticated using (auth.uid() is not null and company_id::text = private.current_company_id())',
        policy_select,
        table_name
      );
      execute format(
        'create policy %I on public.%I for insert to authenticated with check (auth.uid() is not null and company_id::text = private.current_company_id())',
        policy_insert,
        table_name
      );
      execute format(
        'create policy %I on public.%I for update to authenticated using (auth.uid() is not null and company_id::text = private.current_company_id()) with check (auth.uid() is not null and company_id::text = private.current_company_id())',
        policy_update,
        table_name
      );
      execute format(
        'create policy %I on public.%I for delete to authenticated using (auth.uid() is not null and company_id::text = private.current_company_id())',
        policy_delete,
        table_name
      );
    end if;
  end loop;
end $$;

-- Companies are readable only for the user's own company.
do $$
begin
  if to_regclass('public.companies') is not null then
    alter table public.companies enable row level security;
    revoke all on table public.companies from anon;
    grant select on table public.companies to authenticated;

    drop policy if exists "companies authenticated own select" on public.companies;
    create policy "companies authenticated own select"
      on public.companies
      for select
      to authenticated
      using (auth.uid() is not null and id::text = private.current_company_id());
  end if;
end $$;

-- Profiles: users can read/update only their own row.
do $$
begin
  if to_regclass('public.profiles') is not null then
    alter table public.profiles enable row level security;
    revoke all on table public.profiles from anon;
    grant select, update on table public.profiles to authenticated;

    drop policy if exists "profiles authenticated own select" on public.profiles;
    drop policy if exists "profiles authenticated own update" on public.profiles;

    create policy "profiles authenticated own select"
      on public.profiles
      for select
      to authenticated
      using (auth.uid() is not null and id = auth.uid());

    create policy "profiles authenticated own update"
      on public.profiles
      for update
      to authenticated
      using (auth.uid() is not null and id = auth.uid())
      with check (auth.uid() is not null and id = auth.uid());
  end if;
end $$;

-- Server-only privacy tables.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['admin_audit_logs', 'privacy_requests', 'data_retention_policies']
  loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('revoke all on table public.%I from anon', table_name);
      execute format('revoke all on table public.%I from authenticated', table_name);
    end if;
  end loop;
end $$;

-- Existing reporting views must not bypass RLS. Postgres 15+ supports security_invoker.
do $$
declare
  view_name text;
begin
  foreach view_name in array array['v_channel_performance', 'v_monthly_summary', 'v_mrr']
  loop
    if to_regclass(format('public.%I', view_name)) is not null then
      execute format('alter view public.%I set (security_invoker = true)', view_name);
      execute format('revoke all on table public.%I from anon', view_name);
      execute format('revoke all on table public.%I from authenticated', view_name);
      execute format('grant select on table public.%I to authenticated', view_name);
    end if;
  end loop;
end $$;
