import { useMemo } from "react";
import { useMetrics } from "../../../contexts/MetricsContext";
import { useCurrency } from "../../../contexts/CurrencyContext";
import type { Transaction } from "@shared/types";

export const TRANSACTION_CATEGORIES = [
  "Subscriptions",
  "Consulting",
  "Revenue",
  "Marketing",
  "Salaries",
  "Direct Costs",
  "Operations",
  "Financing",
];

export const EMPTY_TRANSACTION_FORM = {
  type: "expense" as Transaction["type"],
  label: "",
  category: "Operations",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  payment_status: "completed" as Transaction["payment_status"],
  recurring: false,
};

export type TransactionFormState = typeof EMPTY_TRANSACTION_FORM;

export function toTransactionForm(transaction: Transaction): TransactionFormState {
  return {
    type: transaction.type,
    label: transaction.label,
    category: transaction.category,
    amount: String(transaction.amount),
    date: transaction.date,
    payment_status: transaction.payment_status,
    recurring: transaction.recurring,
  };
}

export function buildTransactionPayload(form: TransactionFormState) {
  return {
    type: form.type,
    label: form.label.trim(),
    category: form.category,
    amount: parseFloat(form.amount),
    date: form.date,
    payment_status: form.payment_status,
    recurring: form.recurring,
    currency: "CHF",
  };
}

export function useTransactionsData(searchTerm: string, filterType: string, filterCategory: string) {
  const metricsApi = useMetrics();
  const { format } = useCurrency();
  const { transactions } = metricsApi;

  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .sort((left, right) => right.date.localeCompare(left.date))
      .filter((transaction) => {
        const query = searchTerm.toLowerCase();
        const matchSearch =
          !query ||
          transaction.label.toLowerCase().includes(query) ||
          transaction.category.toLowerCase().includes(query);
        const matchType =
          filterType === "Tous les types" ||
          (filterType === "Revenu" && transaction.type === "income") ||
          (filterType === "Depense" && transaction.type === "expense");
        const matchCategory =
          filterCategory === "Toutes categories" || transaction.category === filterCategory;

        return matchSearch && matchType && matchCategory;
      });
  }, [transactions, searchTerm, filterType, filterCategory]);

  const filteredRevenue = filteredTransactions
    .filter((transaction) => transaction.type === "income" && transaction.payment_status === "completed")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const filteredExpenses = filteredTransactions
    .filter((transaction) => transaction.type === "expense" && transaction.payment_status === "completed")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    ...metricsApi,
    format,
    filteredTransactions,
    filteredRevenue,
    filteredExpenses,
    difference: filteredRevenue - filteredExpenses,
  };
}
