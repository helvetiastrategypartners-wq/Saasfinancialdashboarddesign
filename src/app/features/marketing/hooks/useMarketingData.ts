import { useMemo } from "react";
import { useMetrics } from "../../../contexts/MetricsContext";
import { useCurrency } from "../../../contexts/CurrencyContext";
import type { MarketingMetrics } from "@shared/types";

const now = new Date();
const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

export const EMPTY_MARKETING_FORM = {
  channel_id: "",
  period_start: monthStart,
  period_end: monthEnd,
  spend: "",
  revenue_generated: "",
  customers_acquired: "",
  leads: "",
  mql: "",
  sql: "",
};

export type MarketingFormState = typeof EMPTY_MARKETING_FORM;

export function toMarketingForm(metric: MarketingMetrics): MarketingFormState {
  return {
    channel_id: metric.channel_id ?? "",
    period_start: metric.period_start,
    period_end: metric.period_end,
    spend: String(metric.spend),
    revenue_generated: String(metric.revenue_generated),
    customers_acquired: String(metric.customers_acquired),
    leads: String(metric.leads ?? ""),
    mql: String(metric.mql ?? ""),
    sql: String(metric.sql ?? ""),
  };
}

export function buildMarketingPayload(form: MarketingFormState) {
  return {
    channel_id: form.channel_id || undefined,
    period_start: form.period_start,
    period_end: form.period_end,
    spend: parseFloat(form.spend) || 0,
    revenue_generated: parseFloat(form.revenue_generated) || 0,
    customers_acquired: parseInt(form.customers_acquired, 10) || 0,
    leads: form.leads ? parseInt(form.leads, 10) : undefined,
    mql: form.mql ? parseInt(form.mql, 10) : undefined,
    sql: form.sql ? parseInt(form.sql, 10) : undefined,
  };
}

export function useMarketingData() {
  const metricsApi = useMetrics();
  const { format } = useCurrency();
  const { metrics, calculator, marketingMetrics } = metricsApi;

  const lastMonthKey = useMemo(() => {
    const date = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  }, []);

  const monthlyMetrics = useMemo(
    () => marketingMetrics.filter((metric) => metric.period_start?.startsWith(lastMonthKey)),
    [marketingMetrics, lastMonthKey],
  );

  const revenueByChannel = calculator.getRevenueByChannel();
  const cacByChannel = calculator.getCACByChannel();

  const spendVsRevenue = monthlyMetrics.map((metric) => ({
    canal: metric.channel_id ?? "Autre",
    spend: metric.spend,
    revenue: metric.revenue_generated,
  }));

  const roiData = monthlyMetrics.map((metric) => ({
    canal: metric.channel_id ?? "Autre",
    roi: metric.spend > 0 ? Math.round(((metric.revenue_generated - metric.spend) / metric.spend) * 100) : 0,
  }));

  const totals = monthlyMetrics.reduce(
    (accumulator, metric) => {
      accumulator.spend += metric.spend;
      accumulator.revenue += metric.revenue_generated;
      accumulator.customers += metric.customers_acquired;
      accumulator.leads += metric.leads ?? 0;
      accumulator.mql += metric.mql ?? 0;
      accumulator.sql += metric.sql ?? 0;
      return accumulator;
    },
    { spend: 0, revenue: 0, customers: 0, leads: 0, mql: 0, sql: 0 },
  );

  const avgRoas = totals.spend > 0 ? totals.revenue / totals.spend : 0;

  const ltvCacData = useMemo(() => {
    const rows: Array<{ canal: string; ltv: number; cac: number }> = [
      { canal: "Global", ltv: metrics.ltv, cac: metrics.cac },
    ];

    for (const [canal, cac] of Object.entries(cacByChannel)) {
      rows.push({
        canal,
        ltv: Math.round(Number(cac) * metrics.ltvCacRatio),
        cac: Number(cac),
      });
    }

    return rows;
  }, [cacByChannel, metrics]);

  const funnelStages = useMemo(() => {
    const maxValue = Math.max(totals.leads, 1);
    return [
      { label: "Leads", value: totals.leads, color: "#3b82f6", pct: 100 },
      { label: "MQL", value: totals.mql, color: "#8b5cf6", pct: (totals.mql / maxValue) * 100 },
      { label: "SQL", value: totals.sql, color: "#f97316", pct: (totals.sql / maxValue) * 100 },
      { label: "Clients", value: totals.customers, color: "#10b981", pct: (totals.customers / maxValue) * 100 },
    ];
  }, [totals]);

  const monthLabel = new Date(lastMonthKey).toLocaleDateString("fr-CH", {
    month: "long",
    year: "numeric",
  });

  return {
    ...metricsApi,
    format,
    monthlyMetrics,
    revenueByChannel,
    cacByChannel,
    spendVsRevenue,
    roiData,
    totalSpend: totals.spend,
    totalRevenue: totals.revenue,
    totalClients: totals.customers,
    totalLeads: totals.leads,
    totalMql: totals.mql,
    totalSql: totals.sql,
    avgRoas,
    ltvCacData,
    funnelStages,
    monthLabel,
  };
}
