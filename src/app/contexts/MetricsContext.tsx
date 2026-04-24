import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { CalculatedMetrics, Customer, MarketingMetrics, Transaction } from "@shared/types";
import { MetricsCalculator, getMonthStart } from "../lib/metrics";
import {
  mockTransactions, mockCustomers, mockMarketingMetrics,
  mockProducts, mockDebts, mockReceivables, mockInventory, mockGoals,
} from "../lib/mockData";
import { getActiveCompanyId } from "../../utils/company";
import { getSupabaseConfigError, isSupabaseConfigured, supabase } from "../../utils/supabase";

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
  Salaries: "#dc2626",
  Marketing: "#ef4444",
  "Direct Costs": "#3b82f6",
  Operations: "#60a5fa",
  Financing: "#10b981",
  Consulting: "#8b5cf6",
};

function rollbackState<T>(previousState: T, setter: (state: T) => void, message: string) {
  setter(previousState);
  toast.error(message);
}

export function MetricsProvider({ children }: { children: React.ReactNode }) {
  const companyId = useMemo(() => getActiveCompanyId(), []);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [marketingMetrics, setMarketingMetrics] = useState<MarketingMetrics[]>(mockMarketingMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const client = supabase;

      if (!isSupabaseConfigured() || !client) {
        setError(getSupabaseConfigError());
        setLoading(false);
        return;
      }

      try {
        const [txRes, custRes, mktRes] = await Promise.all([
          client
            .from("transactions")
            .select("*")
            .eq("company_id", companyId)
            .order("date", { ascending: true }),
          client
            .from("customers")
            .select("*")
            .eq("company_id", companyId),
          client
            .from("marketing_metrics")
            .select("*")
            .eq("company_id", companyId),
        ]);

        if (txRes.error) {
          throw txRes.error;
        }
        if (custRes.error) {
          throw custRes.error;
        }
        if (mktRes.error) {
          throw mktRes.error;
        }

        if (txRes.data && txRes.data.length > 0) {
          setTransactions(txRes.data as Transaction[]);
        }
        if (custRes.data && custRes.data.length > 0) {
          setCustomers(custRes.data as Customer[]);
        }
        if (mktRes.data && mktRes.data.length > 0) {
          setMarketingMetrics(mktRes.data as MarketingMetrics[]);
        }

        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur Supabase inconnue";
        setError(message);
        toast.error("Impossible de synchroniser les données Supabase.");
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [companyId]);

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

  const monthlyChartData = useMemo((): MonthlyDataPoint[] => {
    const ref = new Date();

    return Array.from({ length: 6 }, (_, i) => {
      const monthsAgo = 5 - i;
      const start = getMonthStart(ref, monthsAgo);
      const end = getMonthStart(ref, monthsAgo - 1);

      return {
        month: start.toLocaleDateString("fr-CH", { month: "short", year: "2-digit" }),
        revenue: calculator.getRevenueForPeriod(start, end),
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

  const getClientForMutation = (): typeof supabase => {
    if (supabase) {
      return supabase;
    }

    const message = getSupabaseConfigError();
    setError(message);
    toast.error(message);
    return null;
  };

  const addTransaction = async (t: Omit<Transaction, "id" | "company_id" | "created_at" | "updated_at">) => {
    const now = new Date().toISOString();
    const previousTransactions = transactions;
    const newTransaction: Transaction = {
      ...t,
      id: crypto.randomUUID(),
      company_id: companyId,
      created_at: now,
      updated_at: now,
    };

    setTransactions(prev => [...prev, newTransaction]);

    const client = getClientForMutation();
    if (!client) {
      return;
    }

    const { error: mutationError } = await client.from("transactions").insert(newTransaction);

    if (mutationError) {
      rollbackState(previousTransactions, setTransactions, "La transaction n’a pas pu être enregistrée.");
      setError(mutationError.message);
      return;
    }

    setError(null);
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const previousTransactions = transactions;
    const updatedAt = new Date().toISOString();

    setTransactions(prev =>
      prev.map(transaction =>
        transaction.id === id ? { ...transaction, ...updates, updated_at: updatedAt } : transaction,
      ),
    );

    const client = getClientForMutation();
    if (!client) {
      return;
    }

    const { error: mutationError } = await client
      .from("transactions")
      .update({ ...updates, updated_at: updatedAt })
      .eq("id", id);

    if (mutationError) {
      rollbackState(previousTransactions, setTransactions, "La transaction n’a pas pu être mise à jour.");
      setError(mutationError.message);
      return;
    }

    setError(null);
  };

  const deleteTransaction = async (id: string) => {
    const previousTransactions = transactions;
    setTransactions(prev => prev.filter(transaction => transaction.id !== id));

    const client = getClientForMutation();
    if (!client) {
      return;
    }

    const { error: mutationError } = await client.from("transactions").delete().eq("id", id);

    if (mutationError) {
      rollbackState(previousTransactions, setTransactions, "La transaction n’a pas pu être supprimée.");
      setError(mutationError.message);
      return;
    }

    setError(null);
  };

  const addCustomer = async (customer: Omit<Customer, "id" | "company_id" | "created_at" | "updated_at">) => {
    const now = new Date().toISOString();
    const previousCustomers = customers;
    const newCustomer: Customer = {
      ...customer,
      id: crypto.randomUUID(),
      company_id: companyId,
      created_at: now,
      updated_at: now,
    };

    setCustomers(prev => [...prev, newCustomer]);

    const client = getClientForMutation();
    if (!client) {
      return;
    }

    const { error: mutationError } = await client.from("customers").insert(newCustomer);

    if (mutationError) {
      rollbackState(previousCustomers, setCustomers, "Le client n’a pas pu être enregistré.");
      setError(mutationError.message);
      return;
    }

    setError(null);
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    const previousCustomers = customers;
    const updatedAt = new Date().toISOString();

    setCustomers(prev =>
      prev.map(customer =>
        customer.id === id ? { ...customer, ...updates, updated_at: updatedAt } : customer,
      ),
    );

    const client = getClientForMutation();
    if (!client) {
      return;
    }

    const { error: mutationError } = await client
      .from("customers")
      .update({ ...updates, updated_at: updatedAt })
      .eq("id", id);

    if (mutationError) {
      rollbackState(previousCustomers, setCustomers, "Le client n’a pas pu être mis à jour.");
      setError(mutationError.message);
      return;
    }

    setError(null);
  };

  const deleteCustomer = async (id: string) => {
    const previousCustomers = customers;
    setCustomers(prev => prev.filter(customer => customer.id !== id));

    const client = getClientForMutation();
    if (!client) {
      return;
    }

    const { error: mutationError } = await client.from("customers").delete().eq("id", id);

    if (mutationError) {
      rollbackState(previousCustomers, setCustomers, "Le client n’a pas pu être supprimé.");
      setError(mutationError.message);
      return;
    }

    setError(null);
  };

  const addMarketingMetric = async (metric: Omit<MarketingMetrics, "id" | "company_id" | "created_at" | "updated_at">) => {
    const now = new Date().toISOString();
    const previousMarketingMetrics = marketingMetrics;
    const newMetric: MarketingMetrics = {
      ...metric,
      id: crypto.randomUUID(),
      company_id: companyId,
      created_at: now,
      updated_at: now,
    };

    setMarketingMetrics(prev => [...prev, newMetric]);

    const client = getClientForMutation();
    if (!client) {
      return;
    }

    const { error: mutationError } = await client.from("marketing_metrics").insert(newMetric);

    if (mutationError) {
      rollbackState(previousMarketingMetrics, setMarketingMetrics, "La métrique marketing n’a pas pu être enregistrée.");
      setError(mutationError.message);
      return;
    }

    setError(null);
  };

  const updateMarketingMetric = async (id: string, updates: Partial<MarketingMetrics>) => {
    const previousMarketingMetrics = marketingMetrics;
    const updatedAt = new Date().toISOString();

    setMarketingMetrics(prev =>
      prev.map(metric =>
        metric.id === id ? { ...metric, ...updates, updated_at: updatedAt } : metric,
      ),
    );

    const client = getClientForMutation();
    if (!client) {
      return;
    }

    const { error: mutationError } = await client
      .from("marketing_metrics")
      .update({ ...updates, updated_at: updatedAt })
      .eq("id", id);

    if (mutationError) {
      rollbackState(previousMarketingMetrics, setMarketingMetrics, "La métrique marketing n’a pas pu être mise à jour.");
      setError(mutationError.message);
      return;
    }

    setError(null);
  };

  const deleteMarketingMetric = async (id: string) => {
    const previousMarketingMetrics = marketingMetrics;
    setMarketingMetrics(prev => prev.filter(metric => metric.id !== id));

    const client = getClientForMutation();
    if (!client) {
      return;
    }

    const { error: mutationError } = await client.from("marketing_metrics").delete().eq("id", id);

    if (mutationError) {
      rollbackState(previousMarketingMetrics, setMarketingMetrics, "La métrique marketing n’a pas pu être supprimée.");
      setError(mutationError.message);
      return;
    }

    setError(null);
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

  if (!ctx) {
    throw new Error("useMetrics must be used inside <MetricsProvider>");
  }

  return ctx;
}
