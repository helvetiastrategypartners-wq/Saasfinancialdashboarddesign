import { createContext, useContext, useMemo, useState } from "react";
import type { Customer, MarketingMetrics, Transaction } from "@shared/types";
import { mockTransactions, mockCustomers, mockMarketingMetrics } from "../lib/mockData";
import { getActiveCompanyId } from "../../utils/company";
import { useMetricsDataSync, useMetricsMutations } from "./metricsData";
import { useMetricsDerivedState } from "./metricsDerived";
import type { MetricsContextType } from "./metricsTypes";

const MetricsContext = createContext<MetricsContextType | null>(null);

export function MetricsProvider({ children }: { children: React.ReactNode }) {
  const companyId = useMemo(() => getActiveCompanyId(), []);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [marketingMetrics, setMarketingMetrics] = useState<MarketingMetrics[]>(mockMarketingMetrics);
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
