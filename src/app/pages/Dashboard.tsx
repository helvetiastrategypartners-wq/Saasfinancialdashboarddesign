import { motion, AnimatePresence } from "motion/react";
import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Flame, Clock, GitCompare, type LucideIcon } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useMetrics } from "../contexts/MetricsContext";
import { formatCurrencyShort } from "../../utils/currency";
import ExportButton from '../components/ExportButton';
import type { Transaction } from "@shared/types";

// ── Period Comparator ─────────────────────────────────────────────────────────

type PeriodType = "week" | "month" | "quarter" | "year";
interface PeriodSel { year: number; sub: number; }

const MONTHS_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];
const YEARS = [2025, 2026];

function getISOWeekMonday(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const d = new Date(jan4);
  d.setUTCDate(jan4.getUTCDate() - (dow - 1) + (week - 1) * 7);
  return d;
}

function getPeriodBounds(type: PeriodType, sel: PeriodSel): { start: Date; end: Date; label: string } {
  switch (type) {
    case "month":
      return {
        start: new Date(Date.UTC(sel.year, sel.sub - 1, 1)),
        end:   new Date(Date.UTC(sel.year, sel.sub,     1)),
        label: `${MONTHS_FR[sel.sub - 1]} ${sel.year}`,
      };
    case "quarter": {
      const sm = (sel.sub - 1) * 3;
      return {
        start: new Date(Date.UTC(sel.year, sm,     1)),
        end:   new Date(Date.UTC(sel.year, sm + 3, 1)),
        label: `T${sel.sub} ${sel.year}`,
      };
    }
    case "year":
      return {
        start: new Date(Date.UTC(sel.year,     0, 1)),
        end:   new Date(Date.UTC(sel.year + 1, 0, 1)),
        label: `${sel.year}`,
      };
    case "week": {
      const start = getISOWeekMonday(sel.year, sel.sub);
      const end   = new Date(start);
      end.setUTCDate(start.getUTCDate() + 7);
      return {
        start,
        end,
        label: `Sem. ${sel.sub} — ${sel.year}`,
      };
    }
  }
}

function sumPeriod(
  txs: Transaction[],
  start: Date,
  end: Date,
  type: "income" | "expense",
  cat?: string,
): number {
  return txs
    .filter(t => {
      if (t.payment_status !== "completed" || t.type !== type) return false;
      if (cat && t.category !== cat) return false;
      const d = new Date(t.date.length === 10 ? t.date + "T00:00:00Z" : t.date);
      return d >= start && d < end;
    })
    .reduce((s, t) => s + t.amount, 0);
}

function calcPeriodMetrics(txs: Transaction[], bounds: { start: Date; end: Date }) {
  const rev = sumPeriod(txs, bounds.start, bounds.end, "income");
  const exp = sumPeriod(txs, bounds.start, bounds.end, "expense");
  const dc  = sumPeriod(txs, bounds.start, bounds.end, "expense", "Direct Costs");
  return { rev, exp, net: rev - exp, gm: rev > 0 ? ((rev - dc) / rev * 100) : 0 };
}

const selectCls =
  "px-3 py-2 rounded-xl bg-secondary/50 border border-glass-border text-foreground text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all";

function PeriodComparator({ transactions }: { transactions: Transaction[] }) {
  const now = new Date();
  const cy  = now.getUTCFullYear();
  const cm  = now.getUTCMonth() + 1;

  const mA0 = cm === 1 ? 12 : cm - 1;
  const yA0 = cm === 1 ? cy - 1 : cy;
  const mB0 = cm <= 2 ? 12 + cm - 2 : cm - 2;
  const yB0 = cm <= 2 ? cy - 1 : cy;

  const [type, setType]           = useState<PeriodType>("month");
  const [selA, setSelA]           = useState<PeriodSel>({ year: yA0, sub: mA0 });
  const [selB, setSelB]           = useState<PeriodSel>({ year: yB0, sub: mB0 });
  const [compLoading, setCompLoading] = useState<string | null>(null);

  const handleType = (t: PeriodType) => {
    setType(t);
    if (t === "month")   { setSelA({ year: yA0, sub: mA0 }); setSelB({ year: yB0, sub: mB0 }); }
    if (t === "quarter") { setSelA({ year: cy, sub: 1 }); setSelB({ year: cy - 1, sub: 4 }); }
    if (t === "year")    { setSelA({ year: cy - 1, sub: 0 }); setSelB({ year: Math.max(2025, cy - 2), sub: 0 }); }
    if (t === "week")    { setSelA({ year: cy, sub: 14 }); setSelB({ year: cy, sub: 13 }); }
  };

  const boundsA = getPeriodBounds(type, selA);
  const boundsB = getPeriodBounds(type, selB);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mA = useMemo(() => calcPeriodMetrics(transactions, boundsA), [transactions, boundsA.start.getTime(), boundsA.end.getTime()]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mB = useMemo(() => calcPeriodMetrics(transactions, boundsB), [transactions, boundsB.start.getTime(), boundsB.end.getTime()]);

  const exportRows = [
    { label: "Revenus",      a: mA.rev, b: mB.rev, isPercent: false },
    { label: "Dépenses",     a: mA.exp, b: mB.exp, isPercent: false },
    { label: "Cashflow net", a: mA.net, b: mB.net, isPercent: false },
    { label: "Marge brute",  a: mA.gm,  b: mB.gm,  isPercent: true  },
  ];
  const exportTitle = `Comparaison_${boundsA.label.replace(/\s/g, "_")}_vs_${boundsB.label.replace(/\s/g, "_")}`;

  const fmtCell = (v: number, isPercent: boolean) =>
    isPercent ? `${v.toFixed(2)} %` : `CHF ${v.toFixed(2)}`;
  const deltaCell = (a: number, b: number, isPercent: boolean) => {
    const d = a - b;
    return isPercent
      ? `${d >= 0 ? "+" : ""}${d.toFixed(2)} pts`
      : `${d >= 0 ? "+" : "-"}CHF ${Math.abs(d).toFixed(2)}`;
  };
  const pctCell = (a: number, b: number) =>
    b !== 0 ? `${((a - b) / Math.abs(b) * 100).toFixed(1)} %` : "—";

  const triggerDl = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const cell = (v: string | number) => {
      const s = String(v);
      return s.includes(";") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const row = (cols: (string | number)[]) => cols.map(cell).join(";");
    const lines = [
      row(["Indicateur", boundsA.label, boundsB.label, "Delta (A − B)", "Variation (%)"]),
      ...exportRows.map(r => row([r.label, fmtCell(r.a, r.isPercent), fmtCell(r.b, r.isPercent), deltaCell(r.a, r.b, r.isPercent), pctCell(r.a, r.b)])),
    ];
    triggerDl(new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" }), `${exportTitle}.csv`);
  };

  const exportXLSX = async () => {
    setCompLoading("xlsx");
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.aoa_to_sheet([
        ["Indicateur", boundsA.label, boundsB.label, "Delta (A − B)", "Variation (%)"],
        ...exportRows.map(r => [
          r.label,
          r.isPercent ? r.a / 100 : r.a,
          r.isPercent ? r.b / 100 : r.b,
          r.isPercent ? (r.a - r.b) / 100 : r.a - r.b,
          r.b !== 0 ? (r.a - r.b) / Math.abs(r.b) : null,
        ]),
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Comparaison");
      XLSX.writeFile(wb, `${exportTitle}.xlsx`);
    } catch (err) { console.error(err); }
    finally { setCompLoading(null); }
  };

  const exportPDF = async () => {
    setCompLoading("pdf");
    try {
      const { default: jsPDF }    = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const accent = [220, 50, 50] as [number, number, number];
      const blue   = [59, 130, 246] as [number, number, number];

      const numPDF = (v: number) => {
        const abs = Math.abs(v);
        const hasCents = Math.round(abs * 100) % 100 !== 0;
        const [intPart, decPart] = abs.toFixed(hasCents ? 2 : 0).split(".");
        const intFmt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return (v < 0 ? "-" : "") + (hasCents ? `${intFmt}.${decPart}` : intFmt);
      };
      const fmtPDF = (v: number, isPercent: boolean) =>
        isPercent ? `${v.toFixed(2)} %` : `CHF ${numPDF(v)}`;
      const deltaPDF = (a: number, b: number, isPercent: boolean) => {
        const d = a - b;
        return isPercent
          ? `${d >= 0 ? "+" : ""}${d.toFixed(2)} pts`
          : `${d >= 0 ? "+" : "-"}CHF ${numPDF(Math.abs(d))}`;
      };

      doc.setFillColor(...accent);
      doc.rect(0, 0, W, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13); doc.setFont("helvetica", "bold");
      doc.text("Comparaison de periodes", 14, 12);
      doc.setFontSize(9);  doc.setFont("helvetica", "normal");
      doc.text(`Genere le ${new Date().toLocaleDateString("fr-CH")}`, W - 14, 12, { align: "right" });

      let y = 26;
      doc.setTextColor(...blue);
      doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text(`${boundsA.label}  vs  ${boundsB.label}`, 14, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [["Indicateur", boundsA.label, boundsB.label, "Delta (A - B)", "Variation (%)"]],
        body: exportRows.map(r => [
          r.label,
          fmtPDF(r.a, r.isPercent),
          fmtPDF(r.b, r.isPercent),
          deltaPDF(r.a, r.b, r.isPercent),
          r.b !== 0 ? `${((r.a - r.b) / Math.abs(r.b) * 100).toFixed(1)} %` : "—",
        ]),
        headStyles: { fillColor: blue, fontSize: 9 },
        styles: { fontSize: 9.5, cellPadding: 3.5 },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
        margin: { left: 14, right: 14 },
      });

      const pages = (doc.internal as any).getNumberOfPages() as number;
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5); doc.setTextColor(160, 160, 160);
        doc.text(`Page ${i} / ${pages}`, W / 2, 290, { align: "center" });
      }
      doc.save(`${exportTitle}.pdf`);
    } catch (err) { console.error(err); }
    finally { setCompLoading(null); }
  };

  const TYPES: { key: PeriodType; label: string }[] = [
    { key: "week",    label: "Semaine" },
    { key: "month",   label: "Mois" },
    { key: "quarter", label: "Trimestre" },
    { key: "year",    label: "Année" },
  ];

  const SubSel = ({ sel, onChange }: { sel: PeriodSel; onChange: (s: PeriodSel) => void }) => (
    <div className="flex gap-2 items-center">
      <select value={sel.year} onChange={e => onChange({ ...sel, year: +e.target.value })} className={selectCls}>
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      {type === "month" && (
        <select value={sel.sub} onChange={e => onChange({ ...sel, sub: +e.target.value })} className={`${selectCls} flex-1`}>
          {MONTHS_FR.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
      )}
      {type === "quarter" && (
        <select value={sel.sub} onChange={e => onChange({ ...sel, sub: +e.target.value })} className={selectCls}>
          {[1,2,3,4].map(q => <option key={q} value={q}>T{q}</option>)}
        </select>
      )}
      {type === "week" && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Sem.</span>
          <input
            type="number" min={1} max={53} value={sel.sub}
            onChange={e => onChange({ ...sel, sub: Math.min(53, Math.max(1, +e.target.value)) })}
            className={`${selectCls} w-20`}
          />
        </div>
      )}
    </div>
  );

  const Row = ({
    label, a, b, isPercent = false, invertColor = false,
  }: { label: string; a: number; b: number; isPercent?: boolean; invertColor?: boolean }) => {
    const delta   = a - b;
    const pct     = b !== 0 ? (delta / Math.abs(b) * 100) : null;
    const positive = invertColor ? delta <= 0 : delta >= 0;

    const CHF_OPTS: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

    const fmt = (v: number) =>
      isPercent
        ? `${v.toFixed(2)} %`
        : `CHF ${Math.abs(v).toLocaleString("fr-CH", CHF_OPTS)}`;

    const fmtDelta = () => {
      if (isPercent) return `${delta >= 0 ? "+" : ""}${delta.toFixed(2)} pts`;
      const sign = delta >= 0 ? "+" : "-";
      return `${sign}CHF ${Math.abs(delta).toLocaleString("fr-CH", CHF_OPTS)}`;
    };

    return (
      <div className="grid grid-cols-[1fr_140px_140px_140px] items-center py-3 border-b border-glass-border/50 last:border-0 gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground tabular-nums text-right">
          {a < 0 && !isPercent ? <span className="text-accent-red">-</span> : null}
          {fmt(a)}
        </span>
        <span className="text-sm text-muted-foreground/70 tabular-nums text-right">{fmt(b)}</span>
        <div className="flex items-center justify-end gap-1">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap ${
            positive ? "bg-accent-blue/10 text-accent-blue" : "bg-accent-red-muted text-accent-red"
          }`}>
            {fmtDelta()}
            {pct !== null && (
              <span className="opacity-70 ml-1">({pct >= 0 ? "+" : ""}{pct.toFixed(1)}%)</span>
            )}
          </span>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border"
      style={{ background: "var(--glass-bg)" }}
    >
      {/* Header + type tabs */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-accent-blue" />
          Comparaison de périodes
        </h3>
        <div className="flex items-center gap-3">
          {/* Export buttons */}
          <div className="flex items-center gap-1">
            {[
              { fmt: "pdf",  label: "PDF",  cls: "border-accent-red/30 text-accent-red hover:bg-accent-red/10",   action: exportPDF  },
              { fmt: "csv",  label: "CSV",  cls: "border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10", action: exportCSV  },
              { fmt: "xlsx", label: "XLSX", cls: "border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10", action: exportXLSX },
            ].map(b => (
              <button
                key={b.fmt}
                onClick={b.action}
                disabled={compLoading === b.fmt}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all disabled:opacity-40 ${b.cls}`}
              >
                {compLoading === b.fmt ? "…" : `↓ ${b.label}`}
              </button>
            ))}
          </div>
          {/* Type tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-secondary/30 border border-glass-border">
            {TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => handleType(t.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  type === t.key
                    ? "bg-accent-blue text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Period selectors */}
      <div className="grid grid-cols-[1fr_48px_1fr] gap-3 items-start mb-6">
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Période A</p>
          <SubSel sel={selA} onChange={setSelA} />
          <p className="text-xs text-accent-blue mt-1.5 font-medium">{boundsA.label}</p>
        </div>
        <div className="flex items-center justify-center mt-7">
          <span className="text-muted-foreground text-xs font-semibold px-2 py-1.5 rounded-lg bg-secondary/40 border border-glass-border">
            vs
          </span>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Période B</p>
          <SubSel sel={selB} onChange={setSelB} />
          <p className="text-xs text-muted-foreground mt-1.5 font-medium">{boundsB.label}</p>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_140px_140px_140px] items-center pb-2 mb-0 gap-2">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Indicateur</span>
        <span className="text-[11px] font-semibold text-accent-blue uppercase tracking-widest text-right">{boundsA.label}</span>
        <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest text-right">{boundsB.label}</span>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest text-right">Delta (A − B)</span>
      </div>
      <div className="border-t border-glass-border">
        <Row label="Revenus"      a={mA.rev} b={mB.rev} />
        <Row label="Dépenses"     a={mA.exp} b={mB.exp} invertColor />
        <Row label="Cashflow net" a={mA.net} b={mB.net} />
        <Row label="Marge brute"  a={mA.gm}  b={mB.gm}  isPercent />
      </div>

      {type === "week" && (
        <p className="text-[11px] text-muted-foreground/50 mt-3 italic">
          Comparaison hebdomadaire basée sur les dates exactes des transactions.
        </p>
      )}
    </motion.div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  highlight?: boolean;
}

function KPICard({ icon: Icon, label, value, sub, trend, trendUp, highlight }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border hover:border-accent-red/20 transition-all duration-300"
      style={{ background: "var(--glass-bg)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${highlight ? "bg-accent-blue/10" : "bg-accent-red-muted"}`}>
          <Icon className={`w-6 h-6 ${highlight ? "text-accent-blue" : "text-accent-red"}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
            trendUp ? "bg-accent-blue/10 text-accent-blue" : "bg-accent-red-muted text-accent-red"
          }`}>
            {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <p className="text-3xl font-semibold text-foreground">{value}</p>
      {sub && <p className="text-sm text-muted-foreground mt-1">{sub}</p>}
    </motion.div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function Dashboard() {
  const { metrics, monthlyChartData, expensesByCategory, transactions, calculator } = useMetrics();
  const [showComparator, setShowComparator] = useState(false);

  // Trend vs previous month (M-2 → M-1)
  const prevRevenue  = monthlyChartData.at(-3)?.revenue  ?? 0;
  const prevExpenses = monthlyChartData.at(-3)?.expenses ?? 0;
  const revTrend     = prevRevenue  > 0 ? ((metrics.monthlyRevenue  - prevRevenue)  / prevRevenue  * 100) : 0;
  const expTrend     = prevExpenses > 0 ? ((metrics.monthlyExpenses - prevExpenses) / prevExpenses * 100) : 0;
  const marginPrev   = prevRevenue > 0 ? ((prevRevenue - (monthlyChartData.at(-3)?.expenses ?? 0)) / prevRevenue * 100) : 0;
  const marginCurr   = metrics.monthlyRevenue > 0 ? (metrics.grossMargin / metrics.monthlyRevenue * 100) : 0;

  // Recent transactions — last 6, sorted by date descending
  const recentTx = [...transactions]
    .filter(t => t.payment_status === "completed")
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  // Monthly net cashflow for bar chart
  const cashTrendData = calculator.getMonthlyCashTrend(6);

  // Dynamic M-1 label for header
  const lastMonthLabel = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toLocaleDateString("fr-CH", { month: "long", year: "numeric" });

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-semibold text-foreground mb-2 tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Vue d'ensemble de vos finances — {lastMonthLabel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowComparator(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              showComparator
                ? "bg-accent-blue text-white border-accent-blue"
                : "bg-secondary/50 border-glass-border text-foreground hover:border-accent-blue/40 hover:text-accent-blue"
            }`}
          >
            <GitCompare className="w-4 h-4" />
            Comparer des périodes
          </button>
          <ExportButton title="Monthly_Sales_Report" />
        </div>
      </div>

      {/* Period Comparator (toggle) */}
      <AnimatePresence>
        {showComparator && <PeriodComparator transactions={transactions} />}
      </AnimatePresence>

      {/* KPI Cards — 6 KPIs du PDF Dashboard */}
      <div className="grid grid-cols-3 gap-6">
        <KPICard
          icon={DollarSign}
          label="Cash disponible"
          value={formatCurrencyShort(metrics.cash)}
          highlight
        />
        <KPICard
          icon={TrendingUp}
          label="Revenus mensuels"
          value={formatCurrencyShort(metrics.monthlyRevenue)}
          trend={`${revTrend >= 0 ? "+" : ""}${revTrend.toFixed(1)}%`}
          trendUp={revTrend >= 0}
        />
        <KPICard
          icon={TrendingDown}
          label="Dépenses mensuelles"
          value={formatCurrencyShort(metrics.monthlyExpenses)}
          trend={`${expTrend >= 0 ? "+" : ""}${expTrend.toFixed(1)}%`}
          trendUp={false}
        />
        <KPICard
          icon={BarChart2}
          label="Marge brute"
          value={`${marginCurr.toFixed(2)}%`}
          sub={formatCurrencyShort(metrics.grossMargin)}
          trend={`${(marginCurr - marginPrev).toFixed(2)}pts`}
          trendUp={marginCurr >= marginPrev}
        />
        <KPICard
          icon={Flame}
          label="Burn rate (moy. 3 mois)"
          value={formatCurrencyShort(metrics.burnRate)}
        />
        <KPICard
          icon={Clock}
          label="Runway estimé"
          value={`${metrics.runway.toFixed(1)} mois`}
          trend={metrics.cashRisk?.message}
          trendUp={metrics.runway >= 6}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">

        {/* Revenus vs Dépenses — 6 mois */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border"
          style={{ background: "var(--glass-bg)" }}
        >
          <h3 className="text-xl font-semibold text-foreground mb-6">Revenus vs Dépenses (6 mois)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: "12px" }}
                labelStyle={{ color: "var(--popover-foreground)" }}
                itemStyle={{ color: "var(--popover-foreground)" }}
                formatter={(v: number) => [formatCurrencyShort(v)]}
              />
              <Line type="monotone" dataKey="revenue"  stroke="var(--accent-red)"  strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} name="Revenus" />
              <Line type="monotone" dataKey="expenses" stroke="var(--accent-blue)" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} name="Dépenses" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-2">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent-red" /><span className="text-sm text-muted-foreground">Revenus</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent-blue" /><span className="text-sm text-muted-foreground">Dépenses</span></div>
          </div>
        </motion.div>

        {/* Répartition des dépenses — Mars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border"
          style={{ background: "var(--glass-bg)" }}
        >
          <h3 className="text-xl font-semibold text-foreground mb-6">Répartition des dépenses — {lastMonthLabel}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expensesByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {expensesByCategory.map(entry => (
                  <Cell key={`pie-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: "12px" }}
                labelStyle={{ color: "var(--popover-foreground)" }}
                itemStyle={{ color: "var(--popover-foreground)" }}
                formatter={(v: number) => [formatCurrencyShort(v)]}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Cashflow net mensuel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border"
        style={{ background: "var(--glass-bg)" }}
      >
        <h3 className="text-xl font-semibold text-foreground mb-6">Cashflow net mensuel (6 mois)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={cashTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: "12px" }}
              labelStyle={{ color: "var(--popover-foreground)" }}
              itemStyle={{ color: "var(--popover-foreground)" }}
              formatter={(v: number) => [formatCurrencyShort(v), "Net"]}
            />
            <Bar
              dataKey="netFlow"
              name="Cashflow net"
              radius={[6, 6, 0, 0]}
            >
              {cashTrendData.map((entry, idx) => (
                <Cell
                  key={`cf-${idx}`}
                  fill={entry.netFlow >= 0 ? "var(--accent-blue)" : "var(--accent-red)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Transactions récentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl p-6 backdrop-blur-xl border border-glass-border"
        style={{ background: "var(--glass-bg)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-foreground">Transactions récentes</h3>
          <span className="text-sm text-muted-foreground">{recentTx.length} transactions</span>
        </div>
        <div className="space-y-3">
          {recentTx.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className="flex items-center justify-between p-4 rounded-xl border hover:bg-glass-hover transition-all border-glass-border"
              style={{ background: "var(--glass-bg)" }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${tx.type === "income" ? "bg-accent-blue" : "bg-accent-red"}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{tx.label}</p>
                  <p className="text-xs text-muted-foreground">{tx.date} · {tx.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${tx.type === "income" ? "text-accent-blue" : "text-accent-red"}`}>
                  {tx.type === "income" ? "+" : "-"}{formatCurrencyShort(tx.amount)}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{tx.payment_status}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Résumé bas de page */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "MRR",            value: formatCurrencyShort(metrics.mrr) },
          { label: "Clients actifs", value: `${metrics.activeCustomers}` },
          { label: "Nouveaux (mois)",value: `+${metrics.newCustomersMonth}` },
          { label: "Cashflow net",   value: formatCurrencyShort(metrics.netCashflow) },
        ].map(item => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4 backdrop-blur-xl border border-glass-border text-center"
            style={{ background: "var(--glass-bg)" }}
          >
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className={`text-xl font-semibold ${item.label === "Cashflow net" && metrics.netCashflow < 0 ? "text-accent-red" : "text-foreground"}`}>
              {item.value}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
