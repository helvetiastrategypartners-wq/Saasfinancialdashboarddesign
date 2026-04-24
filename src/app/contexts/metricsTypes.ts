import type { CalculatedMetrics, Customer, MarketingMetrics, Transaction } from "@shared/types";
import type { MetricsCalculator } from "../lib/metrics";

export interface MonthlyDataPoint {
  month: string;
  revenue: number;
  expenses: number;
}

export interface MetricsContextType {
  metrics: CalculatedMetrics;
  calculator: MetricsCalculator;
  transactions: Transaction[];
  customers: Customer[];
  marketingMetrics: MarketingMetrics[];
  monthlyChartData: MonthlyDataPoint[];
  expensesByCategory: { name: string; value: number; color: string }[];
  loading: boolean;
  error: string | null;
  addTransaction: (t: Omit<Transaction, "id" | "company_id" | "created_at" | "updated_at">) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCustomer: (c: Omit<Customer, "id" | "company_id" | "created_at" | "updated_at">) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addMarketingMetric: (m: Omit<MarketingMetrics, "id" | "company_id" | "created_at" | "updated_at">) => Promise<void>;
  updateMarketingMetric: (id: string, updates: Partial<MarketingMetrics>) => Promise<void>;
  deleteMarketingMetric: (id: string) => Promise<void>;
}

export interface MetricsBaseState {
  transactions: Transaction[];
  customers: Customer[];
  marketingMetrics: MarketingMetrics[];
}
