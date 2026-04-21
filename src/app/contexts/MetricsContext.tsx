import { createContext, useContext, useMemo, useState, useEffect } from "react";
import type { Transaction, Customer, MarketingMetrics, CalculatedMetrics } from "@shared/types";
import { MetricsCalculator, getMonthStart } from "../lib/metrics";
import {
  mockTransactions, mockCustomers, mockMarketingMetrics,
  mockProducts, mockDebts, mockReceivables, mockInventory, mockGoals,
} from "../lib/mockData";
import { supabase } from "../../utils/supabase";

export interface MonthlyDataPoint {
  month: string;
  revenue: number;
  expenses: number;
}

interface MetricsContextType {
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

const MetricsContext = createContext<MetricsContextType | null>(null);

const CATEGORY_COLORS: Record<string, string> = {
  Salaries:       "#dc2626",
  Marketing:      "#ef4444",
  "Direct Costs": "#3b82f6",
  Operations:     "#60a5fa",
  Financing:      "#10b981",
  Consulting:     "#8b5cf6",
};

const COMPANY_ID = "company-1";

export function MetricsProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions]         = useState<Transaction[]>(mockTransactions);
  const [customers, setCustomers]               = useState<Customer[]>(mockCustomers);
  const [marketingMetrics, setMarketingMetrics] = useState<MarketingMetrics[]>(mockMarketingMetrics);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [txRes, custRes, mktRes] = await Promise.all([
          supabase
            .from("transactions")
            .select("*")
            .eq("company_id", COMPANY_ID)
            .order("date", { ascending: true }),
          supabase
            .from("customers")
            .select("*")
            .eq("company_id", COMPANY_ID),
          supabase
            .from("marketing_metrics")
            .select("*")
            .eq("company_id", COMPANY_ID),
        ]);

        if (txRes.error)   throw txRes.error;
        if (custRes.error) throw custRes.error;
        if (mktRes.error)  throw mktRes.error;

        // Use Supabase data only if tables are populated; fall back to mock otherwise
        if (txRes.data && txRes.data.length > 0) {
          setTransactions(txRes.data as Transaction[]);
        }
        if (custRes.data && custRes.data.length > 0) {
          setCustomers(custRes.data as Customer[]);
        }
        if (mktRes.data && mktRes.data.length > 0) {
          setMarketingMetrics(mktRes.data as MarketingMetrics[]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur Supabase inconnue";
        setError(message);
        // Keep mock data on error
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const calculator = useMemo(() => new MetricsCalculator(
    transactions,
    customers,
    marketingMetrics,
    mockProducts,
    mockDebts,
    mockReceivables,
    mockInventory,
    mockGoals,
  ), [transactions, customers, marketingMetrics]);

  const metrics = useMemo(() => calculator.calculateAll(), [calculator]);

  // 6-month rolling window ending at current month
  const monthlyChartData = useMemo((): MonthlyDataPoint[] => {
    const ref = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const monthsAgo = 5 - i;
      const start = getMonthStart(ref, monthsAgo);
      const end   = getMonthStart(ref, monthsAgo - 1);
      return {
        month:    start.toLocaleDateString("fr-CH", { month: "short", year: "2-digit" }),
        revenue:  calculator.getRevenueForPeriod(start, end),
        expenses: calculator.getExpensesForPeriod(start, end),
      };
    });
  }, [calculator]);

  const expensesByCategory = useMemo(() => {
    const raw = calculator.getExpensesByCategory();
    return Object.entries(raw)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] ?? "#a3a3a3",
      }));
  }, [calculator]);

  const addTransaction = async (t: Omit<Transaction, "id" | "company_id" | "created_at" | "updated_at">) => {
    const now = new Date().toISOString();
    const newTx: Transaction = { ...t, id: crypto.randomUUID(), company_id: COMPANY_ID, created_at: now, updated_at: now };
    setTransactions(prev => [...prev, newTx]);
    const { error } = await supabase.from("transactions").insert(newTx);
    if (error) console.error("insert transaction:", error);
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t));
    const { error } = await supabase.from("transactions").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) console.error("update transaction:", error);
  };

  const deleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) console.error("delete transaction:", error);
  };

  const addCustomer = async (c: Omit<Customer, "id" | "company_id" | "created_at" | "updated_at">) => {
    const now = new Date().toISOString();
    const newC: Customer = { ...c, id: crypto.randomUUID(), company_id: COMPANY_ID, created_at: now, updated_at: now };
    setCustomers(prev => [...prev, newC]);
    void supabase.from("customers").insert(newC);
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c));
    const { error } = await supabase.from("customers").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) console.error("update customer:", error);
  };

  const deleteCustomer = async (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) console.error("delete customer:", error);
  };

  const addMarketingMetric = async (m: Omit<MarketingMetrics, "id" | "company_id" | "created_at" | "updated_at">) => {
    const now = new Date().toISOString();
    const newM: MarketingMetrics = { ...m, id: crypto.randomUUID(), company_id: COMPANY_ID, created_at: now, updated_at: now };
    setMarketingMetrics(prev => [...prev, newM]);
    void supabase.from("marketing_metrics").insert(newM);
  };

  const updateMarketingMetric = async (id: string, updates: Partial<MarketingMetrics>) => {
    setMarketingMetrics(prev => prev.map(m => m.id === id ? { ...m, ...updates, updated_at: new Date().toISOString() } : m));
    const { error } = await supabase.from("marketing_metrics").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) console.error("update marketing_metric:", error);
  };

  const deleteMarketingMetric = async (id: string) => {
    setMarketingMetrics(prev => prev.filter(m => m.id !== id));
    const { error } = await supabase.from("marketing_metrics").delete().eq("id", id);
    if (error) console.error("delete marketing_metric:", error);
  };

  return (
    <MetricsContext.Provider value={{
      metrics,
      calculator,
      transactions,
      customers,
      marketingMetrics,
      monthlyChartData,
      expensesByCategory,
      loading,
      error,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addMarketingMetric,
      updateMarketingMetric,
      deleteMarketingMetric,
    }}>
      {children}
    </MetricsContext.Provider>
  );
}

export function useMetrics(): MetricsContextType {
  const ctx = useContext(MetricsContext);
  if (!ctx) throw new Error("useMetrics must be used inside <MetricsProvider>");
  return ctx;
}
