-- ============================================================================
-- HSP OS Database Schema
-- Run this in Supabase SQL Editor to set up the entire database
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Authentication & Users
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  business_model VARCHAR(100),
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, user_id)
);

-- ============================================================================
-- Financial Data
-- ============================================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  amount DECIMAL(15, 2) NOT NULL,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'cancelled')),
  label VARCHAR(255) NOT NULL,
  description TEXT,
  source VARCHAR(100),
  linked_channel VARCHAR(100),
  linked_customer UUID,
  linked_invoice_id UUID,
  recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100) NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'overdue', 'cancelled')),
  amount_excl_tax DECIMAL(15, 2) NOT NULL,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  amount_incl_tax DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  cost_center VARCHAR(100),
  department VARCHAR(20) CHECK (department IN ('marketing', 'sales', 'ops', 'tech', 'admin', 'finance', 'hr')),
  linked_channel VARCHAR(100),
  linked_customer UUID,
  linked_project VARCHAR(100),
  description TEXT,
  attachment_url VARCHAR(500),
  payment_method VARCHAR(100),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Customer & Marketing
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  segment VARCHAR(100),
  acquisition_date DATE NOT NULL,
  acquisition_channel VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'churned', 'paused')),
  monthly_revenue DECIMAL(15, 2) DEFAULT 0,
  total_revenue DECIMAL(15, 2) DEFAULT 0,
  gross_margin_percent DECIMAL(5, 2) DEFAULT 0,
  direct_costs DECIMAL(15, 2) DEFAULT 0,
  churn_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketing_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('organic', 'paid', 'direct', 'referral')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES marketing_channels(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  budget DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketing_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES marketing_channels(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  spend DECIMAL(15, 2) NOT NULL,
  impressions BIGINT,
  clicks BIGINT,
  leads INTEGER,
  mql INTEGER,
  sql INTEGER,
  customers_acquired INTEGER DEFAULT 0,
  revenue_generated DECIMAL(15, 2) DEFAULT 0,
  mrr_generated DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Forecasts & Metrics Snapshots
-- ============================================================================

CREATE TABLE IF NOT EXISTS forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  scenario_name VARCHAR(50) NOT NULL CHECK (scenario_name IN ('conservative', 'base', 'ambitious', 'custom')),
  forecast_month DATE NOT NULL,
  projected_revenue DECIMAL(15, 2) NOT NULL,
  projected_cashflow DECIMAL(15, 2) NOT NULL,
  projected_burn DECIMAL(15, 2) NOT NULL,
  projected_runway DECIMAL(10, 2) NOT NULL,
  projected_active_customers INTEGER,
  projected_new_customers INTEGER,
  projected_churned_customers INTEGER,
  projected_arpu DECIMAL(15, 2),
  projected_cac DECIMAL(15, 2),
  projected_mrr DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS metric_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  cash DECIMAL(15, 2) NOT NULL,
  revenue DECIMAL(15, 2) NOT NULL,
  expenses DECIMAL(15, 2) NOT NULL,
  gross_margin DECIMAL(15, 2),
  gross_margin_percent DECIMAL(5, 2),
  burn_rate DECIMAL(15, 2),
  runway DECIMAL(10, 2),
  cac DECIMAL(15, 2),
  ltv DECIMAL(15, 2),
  ltv_cac_ratio DECIMAL(10, 2),
  payback_period DECIMAL(10, 2),
  churn_rate DECIMAL(5, 2),
  arpu DECIMAL(15, 2),
  mrr DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Indexes for performance
-- ============================================================================

CREATE INDEX idx_company_members_company_id ON company_members(company_id);
CREATE INDEX idx_company_members_user_id ON company_members(user_id);
CREATE INDEX idx_transactions_company_id ON transactions(company_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_marketing_channels_company_id ON marketing_channels(company_id);
CREATE INDEX idx_marketing_metrics_company_id ON marketing_metrics(company_id);
CREATE INDEX idx_marketing_metrics_period ON marketing_metrics(period_start, period_end);
CREATE INDEX idx_forecasts_company_id ON forecasts(company_id);
CREATE INDEX idx_metric_snapshots_company_id ON metric_snapshots(company_id);

-- ============================================================================
-- Row Level Security (RLS)
-- Enable per-company data isolation
-- ============================================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_snapshots ENABLE ROW LEVEL SECURITY;

-- Note: Full RLS policies should be created after Supabase Auth is configured
-- This schema provides the foundation for multi-tenant architecture
