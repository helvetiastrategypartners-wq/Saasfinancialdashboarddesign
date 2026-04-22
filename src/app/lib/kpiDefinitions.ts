// KPI Master List — centralized definition of all Key Performance Indicators.
// Each definition specifies label, format, thresholds, and how it responds to DateRange.

export type KpiFormat      = "currency" | "percent" | "number" | "months" | "ratio" | "days";
export type KpiCategory    = "financial" | "saas" | "marketing" | "operations" | "growth";
export type DateRangeMode  = "period" | "snapshot" | "trailing";
// period   — aggregated over the selected date range (sum or average of transactions)
// snapshot — current state, date range has no effect
// trailing — rolling N-month window ending at range.to

export interface KpiThreshold {
  warning:   number;
  critical:  number;
  /** "above" = bad when value exceeds threshold; "below" = bad when it falls below */
  direction: "above" | "below";
}

export interface KpiDefinition {
  id:            string;
  label:         string;
  description:   string;
  category:      KpiCategory;
  format:        KpiFormat;
  threshold?:    KpiThreshold;
  dateRangeMode: DateRangeMode;
  unit?:         string;
}

export const KML_DEFINITIONS: Record<string, KpiDefinition> = {

  // ── FINANCIAL ───────────────────────────────────────────────────────────────

  cash: {
    id:            "cash",
    label:         "Cash disponible",
    description:   "Solde de trésorerie cumulé de toutes les transactions complètes",
    category:      "financial",
    format:        "currency",
    threshold:     { warning: 50_000, critical: 20_000, direction: "below" },
    dateRangeMode: "snapshot",
  },

  burnRate: {
    id:            "burnRate",
    label:         "Burn Rate",
    description:   "Moyenne mensuelle des dépenses sur la période sélectionnée",
    category:      "financial",
    format:        "currency",
    threshold:     { warning: 30_000, critical: 50_000, direction: "above" },
    dateRangeMode: "trailing",
  },

  runway: {
    id:            "runway",
    label:         "Runway",
    description:   "Cash disponible / Burn rate — mois avant épuisement des fonds",
    category:      "financial",
    format:        "months",
    threshold:     { warning: 6, critical: 3, direction: "below" },
    dateRangeMode: "snapshot",
  },

  monthlyRevenue: {
    id:            "monthlyRevenue",
    label:         "Revenu mensuel",
    description:   "Total des revenus (transactions complètes) sur la période",
    category:      "financial",
    format:        "currency",
    dateRangeMode: "period",
  },

  monthlyExpenses: {
    id:            "monthlyExpenses",
    label:         "Dépenses mensuelles",
    description:   "Total des dépenses (transactions complètes) sur la période",
    category:      "financial",
    format:        "currency",
    dateRangeMode: "period",
  },

  netCashflow: {
    id:            "netCashflow",
    label:         "Cashflow net",
    description:   "Revenus − Dépenses sur la période sélectionnée",
    category:      "financial",
    format:        "currency",
    threshold:     { warning: 0, critical: -10_000, direction: "below" },
    dateRangeMode: "period",
  },

  grossMarginPercent: {
    id:            "grossMarginPercent",
    label:         "Marge brute %",
    description:   "(Revenus − Coûts directs) / Revenus — sur la période",
    category:      "financial",
    format:        "percent",
    threshold:     { warning: 30, critical: 15, direction: "below" },
    dateRangeMode: "period",
  },

  ebitda: {
    id:            "ebitda",
    label:         "EBITDA",
    description:   "Bénéfice avant intérêts, impôts, dépréciation et amortissement",
    category:      "financial",
    format:        "currency",
    dateRangeMode: "period",
  },

  leverageRatio: {
    id:            "leverageRatio",
    label:         "Leverage Ratio",
    description:   "Dette totale / EBITDA — mesure le risque d'endettement",
    category:      "financial",
    format:        "ratio",
    threshold:     { warning: 2, critical: 4, direction: "above" },
    dateRangeMode: "snapshot",
  },

  totalDebt: {
    id:            "totalDebt",
    label:         "Dette totale",
    description:   "Encours total des dettes enregistrées",
    category:      "financial",
    format:        "currency",
    dateRangeMode: "snapshot",
  },

  // ── SAAS ────────────────────────────────────────────────────────────────────

  mrr: {
    id:            "mrr",
    label:         "MRR",
    description:   "Monthly Recurring Revenue — revenus récurrents mensuels",
    category:      "saas",
    format:        "currency",
    dateRangeMode: "snapshot",
  },

  arpu: {
    id:            "arpu",
    label:         "ARPU",
    description:   "Average Revenue Per User — revenu moyen par client actif",
    category:      "saas",
    format:        "currency",
    dateRangeMode: "trailing",
  },

  churnRate: {
    id:            "churnRate",
    label:         "Churn Rate",
    description:   "Taux de perte clients mensuel",
    category:      "saas",
    format:        "percent",
    threshold:     { warning: 3, critical: 7, direction: "above" },
    dateRangeMode: "trailing",
  },

  activeCustomers: {
    id:            "activeCustomers",
    label:         "Clients actifs",
    description:   "Nombre de clients avec statut actif",
    category:      "saas",
    format:        "number",
    dateRangeMode: "snapshot",
  },

  newCustomersMonth: {
    id:            "newCustomersMonth",
    label:         "Nouveaux clients",
    description:   "Clients acquis sur la période sélectionnée",
    category:      "saas",
    format:        "number",
    dateRangeMode: "period",
  },

  // ── MARKETING ───────────────────────────────────────────────────────────────

  cac: {
    id:            "cac",
    label:         "CAC",
    description:   "Coût d'Acquisition Client — dépenses marketing / nouveaux clients sur la période",
    category:      "marketing",
    format:        "currency",
    threshold:     { warning: 1_000, critical: 2_000, direction: "above" },
    dateRangeMode: "period",
  },

  ltv: {
    id:            "ltv",
    label:         "LTV",
    description:   "Lifetime Value — ARPU × marge brute × durée de vie estimée",
    category:      "marketing",
    format:        "currency",
    dateRangeMode: "snapshot",
  },

  ltvCacRatio: {
    id:            "ltvCacRatio",
    label:         "LTV / CAC",
    description:   "Rapport LTV/CAC — seuil sain ≥ 3x",
    category:      "marketing",
    format:        "ratio",
    threshold:     { warning: 3, critical: 1.5, direction: "below" },
    dateRangeMode: "snapshot",
  },

  paybackPeriod: {
    id:            "paybackPeriod",
    label:         "Payback Period",
    description:   "Nombre de mois pour récupérer le CAC",
    category:      "marketing",
    format:        "months",
    threshold:     { warning: 18, critical: 36, direction: "above" },
    dateRangeMode: "snapshot",
  },

  conversionRate: {
    id:            "conversionRate",
    label:         "Taux de conversion",
    description:   "Leads → Clients sur la période sélectionnée",
    category:      "marketing",
    format:        "percent",
    threshold:     { warning: 5, critical: 2, direction: "below" },
    dateRangeMode: "period",
  },

  marketingROI: {
    id:            "marketingROI",
    label:         "ROI Marketing",
    description:   "(Revenus générés − Dépenses marketing) / Dépenses marketing",
    category:      "marketing",
    format:        "percent",
    threshold:     { warning: 50, critical: 0, direction: "below" },
    dateRangeMode: "period",
  },

  // ── OPERATIONS ──────────────────────────────────────────────────────────────

  dso: {
    id:            "dso",
    label:         "DSO",
    description:   "Days Sales Outstanding — créances clients / revenu journalier",
    category:      "operations",
    format:        "days",
    threshold:     { warning: 45, critical: 90, direction: "above" },
    dateRangeMode: "snapshot",
  },

  dio: {
    id:            "dio",
    label:         "DIO",
    description:   "Days Inventory Outstanding — valeur stock / COGS journalier",
    category:      "operations",
    format:        "days",
    threshold:     { warning: 60, critical: 120, direction: "above" },
    dateRangeMode: "snapshot",
  },

  dpo: {
    id:            "dpo",
    label:         "DPO",
    description:   "Days Payable Outstanding — dettes fournisseurs / COGS journalier",
    category:      "operations",
    format:        "days",
    dateRangeMode: "snapshot",
  },

  cashConversionCycle: {
    id:            "cashConversionCycle",
    label:         "Cash Conversion Cycle",
    description:   "DSO + DIO − DPO — jours entre décaissement et encaissement",
    category:      "operations",
    format:        "days",
    threshold:     { warning: 60, critical: 120, direction: "above" },
    dateRangeMode: "snapshot",
  },
};

// ── HELPERS ──────────────────────────────────────────────────────────────────

/** Returns all KPI definitions for a given category. */
export function getKpisByCategory(category: KpiCategory): KpiDefinition[] {
  return Object.values(KML_DEFINITIONS).filter(k => k.category === category);
}

/** Returns the alert level for a KPI value ("ok" | "warning" | "critical"). */
export function getKpiAlertLevel(
  kpiId: string,
  value: number,
): "ok" | "warning" | "critical" {
  const def = KML_DEFINITIONS[kpiId];
  if (!def?.threshold) return "ok";
  const { warning, critical, direction } = def.threshold;
  if (direction === "above") {
    if (value >= critical) return "critical";
    if (value >= warning)  return "warning";
  } else {
    if (value <= critical) return "critical";
    if (value <= warning)  return "warning";
  }
  return "ok";
}
