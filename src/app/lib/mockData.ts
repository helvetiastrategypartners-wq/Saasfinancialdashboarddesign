/**
 * Mock data — HSP SaaS Financial Dashboard
 * Reference period: September 2025 – April 2026 (today = 17 Apr 2026)
 * M-1 = March 2026 (last complete month)
 *
 * Key metrics produced:
 *  Cash              ≈ 258 700 CHF
 *  Revenue (Mar)     = 68 000 CHF
 *  Expenses (Mar)    = 62 000 CHF
 *  Gross Margin      = 54 500 CHF (80.1 %)
 *  Burn Rate         ≈ 58 333 CHF/month (avg Jan–Mar)
 *  Runway            ≈ 4.4 months  → "Attention"
 *  CAC               = 1 500 CHF   (12 000 spend / 8 new customers march)
 *  Churn Rate        = 5.66 %       → alert triggered  (3 churned / 53 activeAtStart)
 *  Marketing ROI     = 133 %        (28 000 revenue_generated / 12 000 spend)
 *  newCustomersMonth = 3            (3 customers acquired in April 2026)
 *  Active customers  = 50           (47 existing march + 3 April new)
 *  MRR               = 61 400 CHF   (50 actifs × tarifs)
 *  ARPU              ≈ 1 360 CHF    (68 000 / 50 active)
 */

import type {
  Transaction, Customer, MarketingMetrics,
  Product, Debt, InventoryItem, Receivable, Goal,
} from "@shared/types";

const CO = "company-1";
const ts = (d: string) => `${d}T00:00:00Z`;

// ── TRANSACTIONS ──────────────────────────────────────────────────────────────
export const mockTransactions: Transaction[] = [

  // ── September 2025 – Initial investment ──────────────────────────────
  { id: "t-sep-01", company_id: CO, date: "2025-09-01", type: "income",   category: "Financing",    amount: 200000, currency: "CHF", payment_status: "completed", label: "Levée de fonds initiale",                   recurring: false, created_at: ts("2025-09-01"), updated_at: ts("2025-09-01") },

  // ── October 2025  Income 48 000 / Expenses 44 500 ────────────────────
  { id: "t-oct-01", company_id: CO, date: "2025-10-01", type: "income",   category: "Subscriptions", amount: 42000,  currency: "CHF", payment_status: "completed", label: "Abonnements SaaS — Octobre",                recurring: true,  created_at: ts("2025-10-01"), updated_at: ts("2025-10-01") },
  { id: "t-oct-02", company_id: CO, date: "2025-10-10", type: "income",   category: "Consulting",    amount: 6000,   currency: "CHF", payment_status: "completed", label: "Mission conseil — TechVenture SA",           recurring: false, created_at: ts("2025-10-10"), updated_at: ts("2025-10-10") },
  { id: "t-oct-03", company_id: CO, date: "2025-10-05", type: "expense",  category: "Direct Costs",  amount: 11000,  currency: "CHF", payment_status: "completed", label: "Infrastructure cloud — Octobre",             recurring: true,  created_at: ts("2025-10-05"), updated_at: ts("2025-10-05") },
  { id: "t-oct-04", company_id: CO, date: "2025-10-15", type: "expense",  category: "Salaries",      amount: 26000,  currency: "CHF", payment_status: "completed", label: "Salaires — Octobre",                        recurring: true,  created_at: ts("2025-10-15"), updated_at: ts("2025-10-15") },
  { id: "t-oct-05", company_id: CO, date: "2025-10-20", type: "expense",  category: "Marketing",     amount: 7000,   currency: "CHF", payment_status: "completed", label: "Campagnes Google Ads — Octobre",            recurring: false, linked_channel: "Google Ads", created_at: ts("2025-10-20"), updated_at: ts("2025-10-20") },
  { id: "t-oct-06", company_id: CO, date: "2025-10-25", type: "expense",  category: "Operations",    amount: 500,    currency: "CHF", payment_status: "completed", label: "Licences logiciels — Octobre",              recurring: true,  created_at: ts("2025-10-25"), updated_at: ts("2025-10-25") },

  // ── November 2025  Income 52 000 / Expenses 46 000 ───────────────────
  { id: "t-nov-01", company_id: CO, date: "2025-11-01", type: "income",   category: "Subscriptions", amount: 43000,  currency: "CHF", payment_status: "completed", label: "Abonnements SaaS — Novembre",              recurring: true,  created_at: ts("2025-11-01"), updated_at: ts("2025-11-01") },
  { id: "t-nov-02", company_id: CO, date: "2025-11-15", type: "income",   category: "Consulting",    amount: 9000,   currency: "CHF", payment_status: "completed", label: "Mission stratégique — AlphaGroup SA",       recurring: false, created_at: ts("2025-11-15"), updated_at: ts("2025-11-15") },
  { id: "t-nov-03", company_id: CO, date: "2025-11-05", type: "expense",  category: "Direct Costs",  amount: 11500,  currency: "CHF", payment_status: "completed", label: "Infrastructure cloud — Novembre",           recurring: true,  created_at: ts("2025-11-05"), updated_at: ts("2025-11-05") },
  { id: "t-nov-04", company_id: CO, date: "2025-11-15", type: "expense",  category: "Salaries",      amount: 26500,  currency: "CHF", payment_status: "completed", label: "Salaires — Novembre",                      recurring: true,  created_at: ts("2025-11-15"), updated_at: ts("2025-11-15") },
  { id: "t-nov-05", company_id: CO, date: "2025-11-20", type: "expense",  category: "Marketing",     amount: 7500,   currency: "CHF", payment_status: "completed", label: "Campagnes pub — Novembre",                 recurring: false, created_at: ts("2025-11-20"), updated_at: ts("2025-11-20") },
  { id: "t-nov-06", company_id: CO, date: "2025-11-25", type: "expense",  category: "Operations",    amount: 500,    currency: "CHF", payment_status: "completed", label: "Licences logiciels — Novembre",             recurring: true,  created_at: ts("2025-11-25"), updated_at: ts("2025-11-25") },

  // ── December 2025  Income 55 000 / Expenses 48 000 ───────────────────
  { id: "t-dec-01", company_id: CO, date: "2025-12-01", type: "income",   category: "Subscriptions", amount: 45000,  currency: "CHF", payment_status: "completed", label: "Abonnements SaaS — Décembre",              recurring: true,  created_at: ts("2025-12-01"), updated_at: ts("2025-12-01") },
  { id: "t-dec-02", company_id: CO, date: "2025-12-10", type: "income",   category: "Consulting",    amount: 10000,  currency: "CHF", payment_status: "completed", label: "Audit financier — BetaInvest SA",           recurring: false, created_at: ts("2025-12-10"), updated_at: ts("2025-12-10") },
  { id: "t-dec-03", company_id: CO, date: "2025-12-05", type: "expense",  category: "Direct Costs",  amount: 12000,  currency: "CHF", payment_status: "completed", label: "Infrastructure cloud — Décembre",           recurring: true,  created_at: ts("2025-12-05"), updated_at: ts("2025-12-05") },
  { id: "t-dec-04", company_id: CO, date: "2025-12-15", type: "expense",  category: "Salaries",      amount: 27500,  currency: "CHF", payment_status: "completed", label: "Salaires — Décembre",                      recurring: true,  created_at: ts("2025-12-15"), updated_at: ts("2025-12-15") },
  { id: "t-dec-05", company_id: CO, date: "2025-12-18", type: "expense",  category: "Marketing",     amount: 8000,   currency: "CHF", payment_status: "completed", label: "Campagnes pub — Décembre",                 recurring: false, created_at: ts("2025-12-18"), updated_at: ts("2025-12-18") },
  { id: "t-dec-06", company_id: CO, date: "2025-12-20", type: "expense",  category: "Operations",    amount: 500,    currency: "CHF", payment_status: "completed", label: "Licences et abonnements — Décembre",       recurring: true,  created_at: ts("2025-12-20"), updated_at: ts("2025-12-20") },

  // ── January 2026  Income 58 000 / Expenses 55 000 ────────────────────
  { id: "t-jan-01", company_id: CO, date: "2026-01-01", type: "income",   category: "Subscriptions", amount: 48000,  currency: "CHF", payment_status: "completed", label: "Abonnements SaaS — Janvier",               recurring: true,  created_at: ts("2026-01-01"), updated_at: ts("2026-01-01") },
  { id: "t-jan-02", company_id: CO, date: "2026-01-15", type: "income",   category: "Consulting",    amount: 10000,  currency: "CHF", payment_status: "completed", label: "Consulting stratégique — GammaVentures",    recurring: false, created_at: ts("2026-01-15"), updated_at: ts("2026-01-15") },
  { id: "t-jan-03", company_id: CO, date: "2026-01-05", type: "expense",  category: "Direct Costs",  amount: 12500,  currency: "CHF", payment_status: "completed", label: "Infrastructure cloud — Janvier",            recurring: true,  created_at: ts("2026-01-05"), updated_at: ts("2026-01-05") },
  { id: "t-jan-04", company_id: CO, date: "2026-01-15", type: "expense",  category: "Salaries",      amount: 28000,  currency: "CHF", payment_status: "completed", label: "Salaires — Janvier",                       recurring: true,  created_at: ts("2026-01-15"), updated_at: ts("2026-01-15") },
  { id: "t-jan-05", company_id: CO, date: "2026-01-20", type: "expense",  category: "Marketing",     amount: 10000,  currency: "CHF", payment_status: "completed", label: "Campagnes Google Ads — Janvier",           recurring: false, linked_channel: "Google Ads", created_at: ts("2026-01-20"), updated_at: ts("2026-01-20") },
  { id: "t-jan-06", company_id: CO, date: "2026-01-25", type: "expense",  category: "Operations",    amount: 4500,   currency: "CHF", payment_status: "completed", label: "Outils et logiciels — Janvier",            recurring: true,  created_at: ts("2026-01-25"), updated_at: ts("2026-01-25") },

  // ── February 2026  Income 63 000 / Expenses 58 000 ───────────────────
  { id: "t-feb-01", company_id: CO, date: "2026-02-01", type: "income",   category: "Subscriptions", amount: 51000,  currency: "CHF", payment_status: "completed", label: "Abonnements SaaS — Février",               recurring: true,  created_at: ts("2026-02-01"), updated_at: ts("2026-02-01") },
  { id: "t-feb-02", company_id: CO, date: "2026-02-18", type: "income",   category: "Consulting",    amount: 12000,  currency: "CHF", payment_status: "completed", label: "Consulting — DeltaGroup SA",               recurring: false, created_at: ts("2026-02-18"), updated_at: ts("2026-02-18") },
  { id: "t-feb-03", company_id: CO, date: "2026-02-05", type: "expense",  category: "Direct Costs",  amount: 13000,  currency: "CHF", payment_status: "completed", label: "Infrastructure cloud — Février",            recurring: true,  created_at: ts("2026-02-05"), updated_at: ts("2026-02-05") },
  { id: "t-feb-04", company_id: CO, date: "2026-02-15", type: "expense",  category: "Salaries",      amount: 30000,  currency: "CHF", payment_status: "completed", label: "Salaires — Février",                       recurring: true,  created_at: ts("2026-02-15"), updated_at: ts("2026-02-15") },
  { id: "t-feb-05", company_id: CO, date: "2026-02-20", type: "expense",  category: "Marketing",     amount: 11000,  currency: "CHF", payment_status: "completed", label: "Campagnes pub — Février",                  recurring: false, created_at: ts("2026-02-20"), updated_at: ts("2026-02-20") },
  { id: "t-feb-06", company_id: CO, date: "2026-02-25", type: "expense",  category: "Operations",    amount: 4000,   currency: "CHF", payment_status: "completed", label: "Outils et licences — Février",             recurring: true,  created_at: ts("2026-02-25"), updated_at: ts("2026-02-25") },

  // ── March 2026 (M-1)  Income 68 000 / Expenses 62 000 ────────────────
  { id: "t-mar-01", company_id: CO, date: "2026-03-01", type: "income",   category: "Subscriptions", amount: 40000,  currency: "CHF", payment_status: "completed", label: "Abonnements SaaS — Mars",                  recurring: true,  created_at: ts("2026-03-01"), updated_at: ts("2026-03-01") },
  { id: "t-mar-02", company_id: CO, date: "2026-03-12", type: "income",   category: "Revenue",       amount: 13000,  currency: "CHF", payment_status: "completed", label: "Revenus acquisition Google Ads — Mars",    recurring: false, linked_channel: "Google Ads", created_at: ts("2026-03-12"), updated_at: ts("2026-03-12") },
  { id: "t-mar-03", company_id: CO, date: "2026-03-18", type: "income",   category: "Revenue",       amount: 8000,   currency: "CHF", payment_status: "completed", label: "Revenus acquisition LinkedIn — Mars",      recurring: false, linked_channel: "LinkedIn",   created_at: ts("2026-03-18"), updated_at: ts("2026-03-18") },
  { id: "t-mar-04", company_id: CO, date: "2026-03-25", type: "income",   category: "Revenue",       amount: 7000,   currency: "CHF", payment_status: "completed", label: "Revenus canaux Email — Mars",              recurring: false, linked_channel: "Email",      created_at: ts("2026-03-25"), updated_at: ts("2026-03-25") },
  { id: "t-mar-05", company_id: CO, date: "2026-03-05", type: "expense",  category: "Direct Costs",  amount: 13500,  currency: "CHF", payment_status: "completed", label: "Infrastructure cloud — Mars",              recurring: true,  created_at: ts("2026-03-05"), updated_at: ts("2026-03-05") },
  { id: "t-mar-06", company_id: CO, date: "2026-03-15", type: "expense",  category: "Salaries",      amount: 32000,  currency: "CHF", payment_status: "completed", label: "Salaires — Mars",                          recurring: true,  created_at: ts("2026-03-15"), updated_at: ts("2026-03-15") },
  { id: "t-mar-07", company_id: CO, date: "2026-03-20", type: "expense",  category: "Marketing",     amount: 12000,  currency: "CHF", payment_status: "completed", label: "Dépenses marketing — Mars",                recurring: false, created_at: ts("2026-03-20"), updated_at: ts("2026-03-20") },
  { id: "t-mar-08", company_id: CO, date: "2026-03-28", type: "expense",  category: "Operations",    amount: 4500,   currency: "CHF", payment_status: "completed", label: "Outils et licences — Mars",                recurring: true,  created_at: ts("2026-03-28"), updated_at: ts("2026-03-28") },

  // ── April 2026 (current — partial) ───────────────────────────────────
  { id: "t-apr-01", company_id: CO, date: "2026-04-01", type: "income",   category: "Subscriptions", amount: 42000,  currency: "CHF", payment_status: "completed", label: "Abonnements SaaS — Avril",                 recurring: true,  created_at: ts("2026-04-01"), updated_at: ts("2026-04-01") },
  { id: "t-apr-02", company_id: CO, date: "2026-04-05", type: "expense",  category: "Direct Costs",  amount: 13800,  currency: "CHF", payment_status: "completed", label: "Infrastructure cloud — Avril",             recurring: true,  created_at: ts("2026-04-05"), updated_at: ts("2026-04-05") },
  { id: "t-apr-03", company_id: CO, date: "2026-04-10", type: "expense",  category: "Marketing",     amount: 5000,   currency: "CHF", payment_status: "pending",   label: "Google Ads — Avril (en cours)",            recurring: false, linked_channel: "Google Ads", created_at: ts("2026-04-10"), updated_at: ts("2026-04-10") },
  { id: "t-apr-04", company_id: CO, date: "2026-04-15", type: "expense",  category: "Salaries",      amount: 32000,  currency: "CHF", payment_status: "pending",   label: "Salaires — Avril (en attente)",            recurring: true,  created_at: ts("2026-04-15"), updated_at: ts("2026-04-15") },
];

// ── CUSTOMERS ─────────────────────────────────────────────────────────────────
// 50 active + 3 churned in March 2026 + 2 older churned = 55 total
// 8 have acquisition_date in 2026-03 → CAC March = 12 000 / 8 = 1 500 CHF
// 3 have acquisition_date in 2026-04 → newCustomersMonth = 3

const mkActive = (
  id: string, name: string, segment: string, acq: string, channel: string, rev: number,
): Customer => ({
  id, company_id: CO, name, segment,
  acquisition_date: acq, acquisition_channel: channel,
  status: "active", monthly_revenue: rev,
  total_revenue: rev * 14, gross_margin_percent: 80, direct_costs: rev * 0.2,
  created_at: ts(acq), updated_at: ts("2026-04-01"),
});

const mkChurned = (
  id: string, name: string, segment: string, acq: string, channel: string, rev: number, churn: string,
): Customer => ({
  id, company_id: CO, name, segment,
  acquisition_date: acq, acquisition_channel: channel,
  status: "churned", monthly_revenue: 0,
  total_revenue: rev * 8, gross_margin_percent: 80, direct_costs: rev * 0.2,
  churn_date: churn, created_at: ts(acq), updated_at: ts(churn),
});

export const mockCustomers: Customer[] = [
  // ── Enterprise (10 existing active, 3 000 CHF/month) ──────────────
  mkActive("cust-ent-01", "Acme Corp SA",          "Enterprise", "2024-03-15", "Direct",      3000),
  mkActive("cust-ent-02", "BetaGroup SA",           "Enterprise", "2024-05-20", "LinkedIn",    3000),
  mkActive("cust-ent-03", "GammaVentures SA",       "Enterprise", "2024-07-10", "Direct",      3000),
  mkActive("cust-ent-04", "DeltaConsulting SA",     "Enterprise", "2024-09-01", "Referral",    3000),
  mkActive("cust-ent-05", "Epsilon Technologies",   "Enterprise", "2024-11-15", "Direct",      3000),
  mkActive("cust-ent-06", "Zeta Solutions SA",      "Enterprise", "2025-01-08", "LinkedIn",    3000),
  mkActive("cust-ent-07", "Eta Industries SA",      "Enterprise", "2025-03-22", "Direct",      3000),
  mkActive("cust-ent-08", "Theta Finance SA",       "Enterprise", "2025-06-14", "Referral",    3000),
  mkActive("cust-ent-09", "Iota Digital SA",        "Enterprise", "2025-08-30", "Google Ads",  3000),
  mkActive("cust-ent-10", "Kappa Media SA",         "Enterprise", "2025-10-05", "LinkedIn",    3000),

  // ── Pro (20 existing active, 800 CHF/month) ────────────────────────
  ...Array.from({ length: 20 }, (_, i) => {
    const dates = ["2024-04-10","2024-06-18","2024-08-05","2024-10-22","2024-12-11",
                   "2025-02-03","2025-04-17","2025-06-09","2025-08-14","2025-09-28",
                   "2025-10-07","2025-10-19","2025-11-03","2025-11-21","2025-12-06",
                   "2025-12-18","2026-01-09","2026-01-22","2026-02-05","2026-02-19"];
    const channels = ["Google Ads","LinkedIn","Email","Referral","Direct"];
    return mkActive(`cust-pro-${String(i+1).padStart(2,"0")}`, `Pro Client ${i+1} SA`, "Pro", dates[i], channels[i%5], 800);
  }),

  // ── Starter (9 existing active, 200 CHF/month) ─────────────────────
  ...Array.from({ length: 9 }, (_, i) => {
    const dates = ["2024-09-15","2024-11-20","2025-01-08","2025-03-14","2025-05-25",
                   "2025-07-11","2025-09-03","2025-11-17","2026-01-28"];
    const channels = ["Google Ads","Email","Direct","Google Ads","Email","Direct","Referral","Email","Google Ads"];
    return mkActive(`cust-str-${String(i+1).padStart(2,"0")}`, `Starter Client ${i+1}`, "Starter", dates[i], channels[i], 200);
  }),

  // ── 8 new customers acquired in March 2026 (used for CAC calc) ────
  mkActive("cust-new-01", "Lambda Cloud SA",    "Enterprise", "2026-03-05", "Google Ads", 3000),
  mkActive("cust-new-02", "Mu Retail SA",       "Enterprise", "2026-03-08", "LinkedIn",   3000),
  mkActive("cust-new-03", "Nu Health SA",       "Enterprise", "2026-03-12", "Google Ads", 3000),
  mkActive("cust-new-04", "Xi Logistics SA",    "Pro",        "2026-03-15", "LinkedIn",   800),
  mkActive("cust-new-05", "Omicron SaaS",       "Pro",        "2026-03-18", "Email",      800),
  mkActive("cust-new-06", "Pi Analytics SA",    "Pro",        "2026-03-21", "Google Ads", 800),
  mkActive("cust-new-07", "Rho Startup",        "Starter",    "2026-03-24", "Email",      200),
  mkActive("cust-new-08", "Sigma Tech",         "Starter",    "2026-03-27", "Email",      200),

  // ── 3 churned in March 2026 (triggers churn rate > 5 %) ──────────
  mkChurned("cust-churn-01", "Tau Corp SA",      "Enterprise", "2024-08-15", "Direct",     3000, "2026-03-10"),
  mkChurned("cust-churn-02", "Upsilon Media",    "Pro",        "2025-02-20", "LinkedIn",   800,  "2026-03-14"),
  mkChurned("cust-churn-03", "Phi Digital SA",   "Pro",        "2025-04-11", "Google Ads", 800,  "2026-03-22"),

  // ── 2 older churned customers ─────────────────────────────────────
  mkChurned("cust-old-01",   "Chi Services SA",  "Pro",        "2024-06-01", "Direct",     800,  "2025-11-05"),
  mkChurned("cust-old-02",   "Psi Ventures SA",  "Starter",    "2024-10-15", "Email",      200,  "2026-02-18"),

  // ── 3 new customers in April 2026 → newCustomersMonth = 3 ────────
  // CAC not affected (computeCAC uses M-1 = March window)
  mkActive("cust-apr-01", "Omega Fintech SA",   "Pro",     "2026-04-03", "Google Ads", 800),
  mkActive("cust-apr-02", "Pi Software SA",     "Pro",     "2026-04-09", "LinkedIn",   800),
  mkActive("cust-apr-03", "Rho Analytics",      "Starter", "2026-04-14", "Email",      200),
];

// ── MARKETING METRICS ─────────────────────────────────────────────────────────
// March 2026: spend 12 000 / 8 customers acquired / revenue 28 000
// CAC = 12 000 / 8 = 1 500 CHF   Marketing ROI = (28k-12k)/12k = 133 %

export const mockMarketingMetrics: MarketingMetrics[] = [
  // March 2026 (M-1) ──────────────────────────────────────────────────
  {
    id: "mm-mar-01", company_id: CO,
    channel_id: "Google Ads", campaign_id: "camp-gads-mar",
    period_start: "2026-03-01", period_end: "2026-03-31",
    spend: 6000, impressions: 180000, clicks: 3600, leads: 80, mql: 32, sql: 12,
    customers_acquired: 4, revenue_generated: 15000, mrr_generated: 9600,
    created_at: ts("2026-03-01"), updated_at: ts("2026-04-01"),
  },
  {
    id: "mm-mar-02", company_id: CO,
    channel_id: "LinkedIn", campaign_id: "camp-li-mar",
    period_start: "2026-03-01", period_end: "2026-03-31",
    spend: 4000, impressions: 60000, clicks: 900, leads: 40, mql: 20, sql: 8,
    customers_acquired: 2, revenue_generated: 8000, mrr_generated: 3600,
    created_at: ts("2026-03-01"), updated_at: ts("2026-04-01"),
  },
  {
    id: "mm-mar-03", company_id: CO,
    channel_id: "Email", campaign_id: "camp-email-mar",
    period_start: "2026-03-01", period_end: "2026-03-31",
    spend: 2000, impressions: 25000, clicks: 2100, leads: 150, mql: 45, sql: 10,
    customers_acquired: 2, revenue_generated: 5000, mrr_generated: 400,
    created_at: ts("2026-03-01"), updated_at: ts("2026-04-01"),
  },

  // February 2026 ─────────────────────────────────────────────────────
  {
    id: "mm-feb-01", company_id: CO,
    channel_id: "Google Ads",
    period_start: "2026-02-01", period_end: "2026-02-28",
    spend: 5500, impressions: 160000, clicks: 3200, leads: 70,
    customers_acquired: 3, revenue_generated: 12000,
    created_at: ts("2026-02-01"), updated_at: ts("2026-03-01"),
  },
  {
    id: "mm-feb-02", company_id: CO,
    channel_id: "LinkedIn",
    period_start: "2026-02-01", period_end: "2026-02-28",
    spend: 3500, impressions: 52000, clicks: 780, leads: 35,
    customers_acquired: 2, revenue_generated: 7000,
    created_at: ts("2026-02-01"), updated_at: ts("2026-03-01"),
  },
  {
    id: "mm-feb-03", company_id: CO,
    channel_id: "Email",
    period_start: "2026-02-01", period_end: "2026-02-28",
    spend: 2000, impressions: 22000, clicks: 1800, leads: 120,
    customers_acquired: 2, revenue_generated: 4000,
    created_at: ts("2026-02-01"), updated_at: ts("2026-03-01"),
  },

  // January 2026 ──────────────────────────────────────────────────────
  {
    id: "mm-jan-01", company_id: CO,
    channel_id: "Google Ads",
    period_start: "2026-01-01", period_end: "2026-01-31",
    spend: 5000, impressions: 145000, clicks: 2900, leads: 65,
    customers_acquired: 3, revenue_generated: 11000,
    created_at: ts("2026-01-01"), updated_at: ts("2026-02-01"),
  },
  {
    id: "mm-jan-02", company_id: CO,
    channel_id: "LinkedIn",
    period_start: "2026-01-01", period_end: "2026-01-31",
    spend: 3000, impressions: 45000, clicks: 650, leads: 30,
    customers_acquired: 2, revenue_generated: 6000,
    created_at: ts("2026-01-01"), updated_at: ts("2026-02-01"),
  },
  {
    id: "mm-jan-03", company_id: CO,
    channel_id: "Email",
    period_start: "2026-01-01", period_end: "2026-01-31",
    spend: 1500, impressions: 18000, clicks: 1500, leads: 100,
    customers_acquired: 2, revenue_generated: 3500,
    created_at: ts("2026-01-01"), updated_at: ts("2026-02-01"),
  },
];

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
export const mockProducts: Product[] = [
  { id: "prod-01", name: "SaaS Pro",        unit_cost: 200,  units_sold: 47 },
  { id: "prod-02", name: "SaaS Enterprise", unit_cost: 600,  units_sold: 13 },
  { id: "prod-03", name: "Consulting Pack", unit_cost: 1200, units_sold: 8  },
];

// ── DEBTS ─────────────────────────────────────────────────────────────────────
export const mockDebts: Debt[] = [
  { id: "debt-01", label: "Prêt bancaire UBS",          remaining_amount: 80000, monthly_repayment: 2000 },
  { id: "debt-02", label: "Crédit-bail équipement IT",  remaining_amount: 15000, monthly_repayment: 500  },
];

// ── RECEIVABLES ───────────────────────────────────────────────────────────────
export const mockReceivables: Receivable[] = [
  { id: "rec-01", customer_id: "cust-ent-03", amount: 6000,  due_date: "2026-04-30" },
  { id: "rec-02", customer_id: "cust-ent-07", amount: 4500,  due_date: "2026-04-25" },
  { id: "rec-03", customer_id: "cust-pro-05", amount: 2400,  due_date: "2026-04-20" },
  { id: "rec-04", customer_id: "cust-new-01", amount: 3000,  due_date: "2026-05-05" },
];

// ── INVENTORY ─────────────────────────────────────────────────────────────────
export const mockInventory: InventoryItem[] = [];

// ── GOALS ─────────────────────────────────────────────────────────────────────
export const mockGoals: Goal[] = [
  { id: "goal-01", metric_name: "Revenu mensuel (CHF)",  target_value: 72000, current_value: 68000 },
  { id: "goal-02", metric_name: "Clients actifs",        target_value: 40,    current_value: 47    },
  { id: "goal-03", metric_name: "Marge brute (%)",       target_value: 75,    current_value: 80    },
  { id: "goal-04", metric_name: "MRR Growth (%)",        target_value: 5,     current_value: 7.9   },
  { id: "goal-05", metric_name: "Marketing ROI (%)",     target_value: 100,   current_value: 133   },
  { id: "goal-06", metric_name: "Taux de conversion (%)",target_value: 3,     current_value: 2.96  },
];
