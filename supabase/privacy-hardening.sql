-- ============================================================================
-- Privacy / Security hardening helpers
-- Baseline for Swiss nLPD/FADP and GDPR when applicable.
-- Run this in Supabase SQL Editor.
-- ============================================================================

create extension if not exists "pgcrypto";

-- Logs for sensitive super-admin actions.
-- Do not store passwords, password hashes, access tokens, cookies or full request bodies here.
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

alter table public.admin_audit_logs enable row level security;

revoke all on table public.admin_audit_logs from anon;
revoke all on table public.admin_audit_logs from authenticated;

-- Internal register for privacy/data-subject requests handled by the company.
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

alter table public.privacy_requests enable row level security;

revoke all on table public.privacy_requests from anon;
revoke all on table public.privacy_requests from authenticated;

-- Documentation-in-DB for retention decisions.
create table if not exists public.data_retention_policies (
  id uuid primary key default gen_random_uuid(),
  data_category text not null unique,
  retention_period text not null,
  legal_basis text not null,
  deletion_mode text not null,
  notes text,
  updated_at timestamptz not null default now()
);

alter table public.data_retention_policies enable row level security;

revoke all on table public.data_retention_policies from anon;
revoke all on table public.data_retention_policies from authenticated;

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
