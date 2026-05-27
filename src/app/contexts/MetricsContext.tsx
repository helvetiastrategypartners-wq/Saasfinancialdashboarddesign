import { createContext, useContext, useMemo, useState } from "react";
import type { Customer, MarketingMetrics, Transaction } from "@shared/types";
import { mockTransactions, mockCustomers, mockMarketingMetrics } from "../lib/mockData";
import { isSupabaseConfigured } from "../../utils/supabase";
import { useAuth } from "./AuthContext";
import { useMetricsDataSync, useMetricsMutations } from "./metricsData";
import { useMetricsDerivedState } from "./metricsDerived";
import type { MetricsContextType } from "./metricsTypes";

const MetricsContext = createContext<MetricsContextType | null>(null);

export function MetricsProvider({ children }: { children: React.ReactNode }) {
  const { companyId } = useAuth();
  const useDemoData = useMemo(() => !isSupabaseConfigured(), []);
  const [transactions, setTransactions] = useState<Transaction[]>(useDemoData ? mockTransactions : []);
  const [customers, setCustomers] = useState<Customer[]>(useDemoData ? mockCustomers : []);
  const [marketingMetrics, setMarketingMetrics] = useState<MarketingMetrics[]>(useDemoData ? mockMarketingMetrics : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useMetricsDataSync({
    companyId,
    setTransactions,
    setCustomers,
    setMarketingMetrics,
    setLoading,
    setError,
  });

  const { calculator, metrics, monthlyChartData, expensesByCategory } = useMetricsDerivedState({
    transactions,
    customers,
    marketingMetrics,
    useDemoData,
  });

  const mutations = useMetricsMutations({
    transactions,
    customers,
    marketingMetrics,
    companyId,
    setTransactions,
    setCustomers,
    setMarketingMetrics,
    setError,
  });

  return (
    <MetricsContext.Provider
      value={{
        metrics,
        calculator,
        transactions,
        customers,
        marketingMetrics,
        monthlyChartData,
        expensesByCategory,
        loading,
        error,
        ...mutations,
      }}
    >
      {children}
    </MetricsContext.Provider>
  );
}

export function useMetrics(): MetricsContextType {
  const context = useContext(MetricsContext);

  if (!context) {
    throw new Error("useMetrics must be used inside <MetricsProvider>");
  }

  return context;
}
