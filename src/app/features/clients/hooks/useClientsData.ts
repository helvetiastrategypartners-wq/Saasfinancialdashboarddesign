import { useMemo } from "react";
import { useMetrics } from "../../../contexts/MetricsContext";
import { useCurrency } from "../../../contexts/CurrencyContext";
import type { Customer } from "@shared/types";

export const CLIENT_STATUS_LABEL: Record<Customer["status"], string> = {
  active: "Actif",
  churned: "Churne",
  paused: "En pause",
};

export const CLIENT_STATUS_CLASS: Record<Customer["status"], string> = {
  active: "bg-accent-blue/10 text-accent-blue border border-accent-blue/30",
  churned: "bg-accent-red/10 text-accent-red border border-accent-red/30",
  paused: "bg-muted-foreground/20 text-muted-foreground border border-muted-foreground/30",
};

export const EMPTY_CLIENT_FORM = {
  name: "",
  segment: "",
  acquisition_channel: "",
  acquisition_date: new Date().toISOString().slice(0, 10),
  status: "active" as Customer["status"],
  monthly_revenue: "",
  total_revenue: "",
  gross_margin_percent: "",
  direct_costs: "",
};

export type ClientFormState = typeof EMPTY_CLIENT_FORM;

export function toClientForm(customer: Customer): ClientFormState {
  return {
    name: customer.name,
    segment: customer.segment ?? "",
    acquisition_channel: customer.acquisition_channel ?? "",
    acquisition_date: customer.acquisition_date,
    status: customer.status,
    monthly_revenue: String(customer.monthly_revenue),
    total_revenue: String(customer.total_revenue),
    gross_margin_percent: String(customer.gross_margin_percent),
    direct_costs: String(customer.direct_costs),
  };
}

export function buildCustomerPayload(form: ClientFormState) {
  return {
    name: form.name.trim(),
    segment: form.segment || undefined,
    acquisition_channel: form.acquisition_channel || undefined,
    acquisition_date: form.acquisition_date,
    status: form.status,
    monthly_revenue: parseFloat(form.monthly_revenue) || 0,
    total_revenue: parseFloat(form.total_revenue) || 0,
    gross_margin_percent: parseFloat(form.gross_margin_percent) || 0,
    direct_costs: parseFloat(form.direct_costs) || 0,
  };
}

export function useClientsData(searchTerm: string, statusFilter: string) {
  const metricsApi = useMetrics();
  const { format } = useCurrency();
  const { customers, metrics } = metricsApi;

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const query = searchTerm.toLowerCase();
      const matchSearch =
        customer.name.toLowerCase().includes(query) ||
        (customer.acquisition_channel ?? "").toLowerCase().includes(query) ||
        (customer.segment ?? "").toLowerCase().includes(query);
      const matchStatus =
        statusFilter === "Tous" || CLIENT_STATUS_LABEL[customer.status] === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  const totalRevenue = useMemo(
    () => customers.reduce((sum, customer) => sum + customer.total_revenue, 0),
    [customers],
  );

  const averageRevenue = customers.length > 0 ? totalRevenue / customers.length : 0;

  return {
    ...metricsApi,
    metrics,
    format,
    customers,
    filteredCustomers,
    totalRevenue,
    averageRevenue,
  };
}
