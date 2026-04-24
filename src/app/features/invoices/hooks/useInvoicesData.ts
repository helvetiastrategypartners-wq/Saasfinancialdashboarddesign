import { useMemo } from "react";
import { useMetrics } from "../../../contexts/MetricsContext";
import { useCurrency } from "../../../contexts/CurrencyContext";
import type { Transaction } from "@shared/types";

export const INVOICE_STATUS_MAP: Record<Transaction["payment_status"], string> = {
  completed: "Payee",
  pending: "Emise",
  cancelled: "Remboursement",
};

export const INVOICE_STATUS_CLASS: Record<string, string> = {
  Payee: "bg-accent-blue/20 text-accent-blue",
  Remboursement: "bg-purple-500/20 text-purple-400",
  Emise: "bg-yellow-500/20 text-yellow-500",
};

export const INVOICE_CATEGORIES = [
  "Salaries",
  "Marketing",
  "Direct Costs",
  "Operations",
  "Financing",
  "Consulting",
  "Autre",
];

export const EMPTY_INVOICE_FORM = {
  label: "",
  category: "Operations",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  payment_status: "pending" as Transaction["payment_status"],
  description: "",
};

export const AI_STEPS = [
  "Analyse du document en cours...",
  "Extraction des donnees fournisseur...",
  "Reconnaissance des montants et dates...",
  "Pre-remplissage du formulaire...",
];

export interface InvoiceRow {
  id: string;
  number: string;
  supplier: string;
  category: string;
  dueDate: string;
  amount: number;
  status: string;
  rawStatus: Transaction["payment_status"];
}

export type InvoiceFormState = typeof EMPTY_INVOICE_FORM;

export function toInvoiceForm(invoice: InvoiceRow): InvoiceFormState {
  return {
    label: invoice.supplier,
    category: invoice.category,
    amount: String(invoice.amount),
    date: invoice.dueDate,
    payment_status: invoice.rawStatus,
    description: "",
  };
}

export function buildInvoicePayload(form: InvoiceFormState) {
  return {
    type: "expense" as const,
    label: form.label.trim(),
    category: form.category,
    amount: parseFloat(form.amount),
    date: form.date,
    payment_status: form.payment_status,
    currency: "CHF",
    recurring: false,
    description: form.description || undefined,
  };
}

export function useInvoicesData(searchTerm: string, statusFilter: string) {
  const metricsApi = useMetrics();
  const { format } = useCurrency();
  const { transactions } = metricsApi;

  const invoices = useMemo<InvoiceRow[]>(() => {
    return transactions
      .filter((transaction) => transaction.type === "expense")
      .map((transaction) => ({
        id: transaction.id,
        number: `TXN-${transaction.id.slice(-6).toUpperCase()}`,
        supplier: transaction.label,
        category: transaction.category,
        dueDate: transaction.date,
        amount: transaction.amount,
        status: INVOICE_STATUS_MAP[transaction.payment_status] ?? "Emise",
        rawStatus: transaction.payment_status,
      }))
      .sort((left, right) => right.dueDate.localeCompare(left.dueDate));
  }, [transactions]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const query = searchTerm.toLowerCase();
      const matchSearch =
        invoice.supplier.toLowerCase().includes(query) ||
        invoice.number.toLowerCase().includes(query) ||
        invoice.category.toLowerCase().includes(query);
      return matchSearch && (statusFilter === "Tous" || invoice.status === statusFilter);
    });
  }, [invoices, searchTerm, statusFilter]);

  const paidAmount = invoices
    .filter((invoice) => invoice.status === "Payee")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const unpaidAmount = invoices
    .filter((invoice) => invoice.status === "Emise")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const refundList = invoices.filter((invoice) => invoice.status === "Remboursement");
  const refundAmount = refundList.reduce((sum, invoice) => sum + invoice.amount, 0);

  return {
    ...metricsApi,
    format,
    invoices,
    filteredInvoices,
    paidAmount,
    unpaidAmount,
    refundList,
    refundAmount,
  };
}
