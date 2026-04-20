// User and Authentication
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  business_model?: string;
  currency: string;
  created_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  created_at: string;
}

// Financial Data
export interface Transaction {
  id: string;
  company_id: string;
  date: string;
  type: "income" | "expense";
  category: string;
  subcategory?: string;
  amount: number;
  tax_amount?: number;
  currency: string;
  payment_status: "pending" | "completed" | "cancelled";
  label: string;
  description?: string;
  source?: string;
  linked_channel?: string;
  linked_customer?: string;
  linked_invoice_id?: string;
  linked_product?: string;
  recurring: boolean;
  recurring_frequency?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  invoice_number: string;
  vendor_name: string;
  issue_date: string;
  due_date: string;
  paid_date?: string;
  status: "draft" | "issued" | "paid" | "overdue" | "cancelled";
  amount_excl_tax: number;
  tax_amount: number;
  amount_incl_tax: number;
  currency: string;
  category: string;
  subcategory?: string;
  cost_center?: string;
  department?: "marketing" | "sales" | "ops" | "tech" | "admin" | "finance" | "hr";
  linked_channel?: string;
  linked_customer?: string;
  linked_project?: string;
  description?: string;
  attachment_url?: string;
  payment_method?: string;
  is_recurring: boolean;
  recurring_frequency?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  created_at: string;
  updated_at: string;
}

// Customer and Marketing
export interface Customer {
  id: string;
  company_id: string;
  name: string;
  segment?: string;
  acquisition_date: string;
  acquisition_channel?: string;
  status: "active" | "churned" | "paused";
  monthly_revenue: number;
  total_revenue: number;
  gross_margin_percent: number;
  direct_costs: number;
  churn_date?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketingChannel {
  id: string;
  company_id: string;
  name: string;
  type: "organic" | "paid" | "direct" | "referral";
  created_at: string;
}

export interface MarketingCampaign {
  id: string;
  company_id: string;
  channel_id: string;
  name: string;
  start_date: string;
  end_date?: string;
  budget: number;
  created_at: string;
  updated_at: string;
}

export interface MarketingMetrics {
  id: string;
  company_id: string;
  channel_id?: string;
  campaign_id?: string;
  period_start: string;
  period_end: string;
  spend: number;
  impressions?: number;
  clicks?: number;
  leads?: number;
  mql?: number;
  sql?: number;
  customers_acquired: number;
  revenue_generated: number;
  mrr_generated?: number;
  created_at: string;
  updated_at: string;
}

// Forecasts
export interface Forecast {
  id: string;
  company_id: string;
  scenario_name: "conservative" | "base" | "ambitious" | "custom";
  forecast_month: string;
  projected_revenue: number;
  projected_cashflow: number;
  projected_burn: number;
  projected_runway: number;
  projected_active_customers: number;
  projected_new_customers: number;
  projected_churned_customers: number;
  projected_arpu?: number;
  projected_cac?: number;
  projected_mrr?: number;
  created_at: string;
  updated_at: string;
}

// Metrics Snapshots
export interface MetricSnapshot {
  id: string;
  company_id: string;
  period_start: string;
  period_end: string;
  cash: number;
  revenue: number;
  expenses: number;
  gross_margin: number;
  gross_margin_percent: number;
  burn_rate: number;
  runway: number;
  cac?: number;
  ltv?: number;
  ltv_cac_ratio?: number;
  payback_period?: number;
  churn_rate?: number;
  arpu?: number;
  mrr?: number;
  created_at: string;
}

// Products, Debts, Inventory, Receivables, Goals
export interface Product {
  id: string;
  name: string;
  unit_cost: number;
  units_sold?: number;
}

export interface Debt {
  id: string;
  label: string;
  remaining_amount: number;
  monthly_repayment: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit_cost: number;
}

export interface Receivable {
  id: string;
  customer_id: string;
  amount: number;
  due_date: string;
}

export interface Goal {
  id: string;
  metric_name: string;
  target_value: number;
  current_value: number;
}

// Calculated Metrics
export interface CalculatedMetrics {
  cash: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netCashflow: number;
  burnRate: number;
  runway: number;
  grossMargin: number;
  grossMarginPercent: number;
  ebitda: number;
  totalDebt: number;
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  paybackPeriod: number;
  arpu: number;
  mrr: number;
  churnRate: number;
  activeCustomers: number;
  newCustomersMonth: number;
  conversionRate?: number;
  marketingROI?: number;
  revenueGrowth?: number;
  cashRisk?: { risk: "low" | "medium" | "high"; message: string };
}
