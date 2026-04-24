import { useEffect } from "react";
import { toast } from "sonner";
import type { Customer, MarketingMetrics, Transaction } from "@shared/types";
import { getSupabaseConfigError, isSupabaseConfigured, supabase } from "../../utils/supabase";
import type { MetricsBaseState } from "./metricsTypes";

interface MetricsDataParams extends MetricsBaseState {
  companyId: string;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setMarketingMetrics: React.Dispatch<React.SetStateAction<MarketingMetrics[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

function showMutationError(previousState: unknown, setter: (state: unknown) => void, message: string) {
  setter(previousState);
  toast.error(message);
}

export function useMetricsDataSync({
  companyId,
  setTransactions,
  setCustomers,
  setMarketingMetrics,
  setLoading,
  setError,
}: Omit<MetricsDataParams, keyof MetricsBaseState>) {
  useEffect(() => {
    async function fetchData() {
      const client = supabase;

      if (!isSupabaseConfigured() || !client) {
        setError(getSupabaseConfigError());
        setLoading(false);
        return;
      }

      try {
        const [transactionsResponse, customersResponse, marketingResponse] = await Promise.all([
          client.from("transactions").select("*").eq("company_id", companyId).order("date", { ascending: true }),
          client.from("customers").select("*").eq("company_id", companyId),
          client.from("marketing_metrics").select("*").eq("company_id", companyId),
        ]);

        if (transactionsResponse.error) {
          throw transactionsResponse.error;
        }
        if (customersResponse.error) {
          throw customersResponse.error;
        }
        if (marketingResponse.error) {
          throw marketingResponse.error;
        }

        if (transactionsResponse.data && transactionsResponse.data.length > 0) {
          setTransactions(transactionsResponse.data as Transaction[]);
        }
        if (customersResponse.data && customersResponse.data.length > 0) {
          setCustomers(customersResponse.data as Customer[]);
        }
        if (marketingResponse.data && marketingResponse.data.length > 0) {
          setMarketingMetrics(marketingResponse.data as MarketingMetrics[]);
        }

        setError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur Supabase inconnue";
        setError(message);
        toast.error("Impossible de synchroniser les donnees Supabase.");
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [companyId, setCustomers, setError, setLoading, setMarketingMetrics, setTransactions]);
}

function getMutationClient(setError: (value: string | null) => void) {
  if (supabase) {
    return supabase;
  }

  const message = getSupabaseConfigError();
  setError(message);
  toast.error(message);
  return null;
}

interface MetricsMutationsParams extends MetricsBaseState {
  companyId: string;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setMarketingMetrics: React.Dispatch<React.SetStateAction<MarketingMetrics[]>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useMetricsMutations({
  transactions,
  customers,
  marketingMetrics,
  companyId,
  setTransactions,
  setCustomers,
  setMarketingMetrics,
  setError,
}: MetricsMutationsParams) {
  const addTransaction = async (transaction: Omit<Transaction, "id" | "company_id" | "created_at" | "updated_at">) => {
    const now = new Date().toISOString();
    const previousTransactions = transactions;
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      company_id: companyId,
      created_at: now,
      updated_at: now,
    };

    setTransactions(prev => [...prev, newTransaction]);

    const client = getMutationClient(setError);
    if (!client) {
      return;
    }

    const { error } = await client.from("transactions").insert(newTransaction);
    if (error) {
      showMutationError(previousTransactions, setTransactions as (state: unknown) => void, "La transaction n'a pas pu etre enregistree.");
      setError(error.message);
      return;
    }

    setError(null);
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const previousTransactions = transactions;
    const updatedAt = new Date().toISOString();

    setTransactions(prev =>
      prev.map(transaction => (
        transaction.id === id ? { ...transaction, ...updates, updated_at: updatedAt } : transaction
      )),
    );

    const client = getMutationClient(setError);
    if (!client) {
      return;
    }

    const { error } = await client.from("transactions").update({ ...updates, updated_at: updatedAt }).eq("id", id);
    if (error) {
      showMutationError(previousTransactions, setTransactions as (state: unknown) => void, "La transaction n'a pas pu etre mise a jour.");
      setError(error.message);
      return;
    }

    setError(null);
  };

  const deleteTransaction = async (id: string) => {
    const previousTransactions = transactions;
    setTransactions(prev => prev.filter(transaction => transaction.id !== id));

    const client = getMutationClient(setError);
    if (!client) {
      return;
    }

    const { error } = await client.from("transactions").delete().eq("id", id);
    if (error) {
      showMutationError(previousTransactions, setTransactions as (state: unknown) => void, "La transaction n'a pas pu etre supprimee.");
      setError(error.message);
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

    const client = getMutationClient(setError);
    if (!client) {
      return;
    }

    const { error } = await client.from("customers").insert(newCustomer);
    if (error) {
      showMutationError(previousCustomers, setCustomers as (state: unknown) => void, "Le client n'a pas pu etre enregistre.");
      setError(error.message);
      return;
    }

    setError(null);
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    const previousCustomers = customers;
    const updatedAt = new Date().toISOString();

    setCustomers(prev =>
      prev.map(customer => (
        customer.id === id ? { ...customer, ...updates, updated_at: updatedAt } : customer
      )),
    );

    const client = getMutationClient(setError);
    if (!client) {
      return;
    }

    const { error } = await client.from("customers").update({ ...updates, updated_at: updatedAt }).eq("id", id);
    if (error) {
      showMutationError(previousCustomers, setCustomers as (state: unknown) => void, "Le client n'a pas pu etre mis a jour.");
      setError(error.message);
      return;
    }

    setError(null);
  };

  const deleteCustomer = async (id: string) => {
    const previousCustomers = customers;
    setCustomers(prev => prev.filter(customer => customer.id !== id));

    const client = getMutationClient(setError);
    if (!client) {
      return;
    }

    const { error } = await client.from("customers").delete().eq("id", id);
    if (error) {
      showMutationError(previousCustomers, setCustomers as (state: unknown) => void, "Le client n'a pas pu etre supprime.");
      setError(error.message);
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

    const client = getMutationClient(setError);
    if (!client) {
      return;
    }

    const { error } = await client.from("marketing_metrics").insert(newMetric);
    if (error) {
      showMutationError(previousMarketingMetrics, setMarketingMetrics as (state: unknown) => void, "La metrique marketing n'a pas pu etre enregistree.");
      setError(error.message);
      return;
    }

    setError(null);
  };

  const updateMarketingMetric = async (id: string, updates: Partial<MarketingMetrics>) => {
    const previousMarketingMetrics = marketingMetrics;
    const updatedAt = new Date().toISOString();

    setMarketingMetrics(prev =>
      prev.map(metric => (
        metric.id === id ? { ...metric, ...updates, updated_at: updatedAt } : metric
      )),
    );

    const client = getMutationClient(setError);
    if (!client) {
      return;
    }

    const { error } = await client.from("marketing_metrics").update({ ...updates, updated_at: updatedAt }).eq("id", id);
    if (error) {
      showMutationError(previousMarketingMetrics, setMarketingMetrics as (state: unknown) => void, "La metrique marketing n'a pas pu etre mise a jour.");
      setError(error.message);
      return;
    }

    setError(null);
  };

  const deleteMarketingMetric = async (id: string) => {
    const previousMarketingMetrics = marketingMetrics;
    setMarketingMetrics(prev => prev.filter(metric => metric.id !== id));

    const client = getMutationClient(setError);
    if (!client) {
      return;
    }

    const { error } = await client.from("marketing_metrics").delete().eq("id", id);
    if (error) {
      showMutationError(previousMarketingMetrics, setMarketingMetrics as (state: unknown) => void, "La metrique marketing n'a pas pu etre supprimee.");
      setError(error.message);
      return;
    }

    setError(null);
  };

  return {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addMarketingMetric,
    updateMarketingMetric,
    deleteMarketingMetric,
  };
}
