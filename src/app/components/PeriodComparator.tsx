import { motion } from "motion/react";
import { useState, useMemo } from "react";
import { GitCompare } from "lucide-react";
import { useCurrency } from "../contexts/CurrencyContext";
import {
  type PeriodType, type PeriodSel,
  MONTHS_FR, YEARS,
  getPeriodBounds, calcPeriodMetrics,
} from "../lib/periodUtils";
import type { Transaction } from "@shared/types";

const selectCls =
  "px-3 py-2 rounded-xl bg-secondary/50 border border-glass-border text-foreground text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all";

const TYPES: { key: PeriodType; label: string }[] = [
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
  { key: "quarter", label: "Trimestre" },
  { key: "year", label: "Annee" },
];

function triggerDl(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function SubSel({ sel, onChange, type }: { sel: PeriodSel; onChange: (s: PeriodSel) => void; type: PeriodType }) {
  return (
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
          {[1, 2, 3, 4].map(q => <option key={q} value={q}>T{q}</option>)}
        </select>
      )}
      {type === "week" && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Sem.</span>
          <input
            type="number"
            min={1}
            max={53}
            value={sel.sub}
            onChange={e => onChange({ ...sel, sub: Math.min(53, Math.max(1, +e.target.value)) })}
            className={`${selectCls} w-20`}
          />
        </div>
      )}
    </div>
  );
}

function Row({ label, a, b, isPercent = false, invertColor = false }: {
  label: string;
  a: number;
  b: number;
  isPercent?: boolean;
  invertColor?: boolean;
}) {
  const { format } = useCurrency();
  const delta = a - b;
  const pct = b !== 0 ? (delta / Math.abs(b) * 100) : null;
  const positive = invertColor ? delta <= 0 : delta >= 0;

  const fmtVal = (value: number) => isPercent ? `${value.toFixed(2)} %` : format(Math.abs(value));
  const fmtDelta = () => {
    if (isPercent) {
      return `${delta >= 0 ? "+" : ""}${delta.toFixed(2)} pts`;
    }
    return `${delta >= 0 ? "+" : "-"}${format(Math.abs(delta))}`;
  };

  return (
    <div className="grid grid-cols-[1fr_140px_140px_140px] items-center py-3 border-b border-glass-border/50 last:border-0 gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground tabular-nums text-right">
        {a < 0 && !isPercent ? <span className="text-accent-red">-</span> : null}
        {fmtVal(a)}
      </span>
      <span className="text-sm text-muted-foreground/70 tabular-nums text-right">{fmtVal(b)}</span>
      <div className="flex items-center justify-end gap-1">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap ${
          positive ? "bg-accent-blue/10 text-accent-blue" : "bg-accent-red-muted text-accent-red"
        }`}>
          {fmtDelta()}
          {pct !== null && <span className="opacity-70 ml-1">({pct >= 0 ? "+" : ""}{pct.toFixed(1)}%)</span>}
        </span>
      </div>
    </div>
  );
}

export function PeriodComparator({ transactions }: { transactions: Transaction[] }) {
  const now = new Date();
  const cy = now.getUTCFullYear();
  const cm = now.getUTCMonth() + 1;

  const mA0 = cm === 1 ? 12 : cm - 1;
  const yA0 = cm === 1 ? cy - 1 : cy;
  const mB0 = cm <= 2 ? 12 + cm - 2 : cm - 2;
  const yB0 = cm <= 2 ? cy - 1 : cy;

  const [type, setType] = useState<PeriodType>("month");
  const [selA, setSelA] = useState<PeriodSel>({ year: yA0, sub: mA0 });
  const [selB, setSelB] = useState<PeriodSel>({ year: yB0, sub: mB0 });
  const [loading, setLoading] = useState<string | null>(null);

  const handleType = (nextType: PeriodType) => {
    setType(nextType);
    if (nextType === "month") {
      setSelA({ year: yA0, sub: mA0 });
      setSelB({ year: yB0, sub: mB0 });
    }
    if (nextType === "quarter") {
      setSelA({ year: cy, sub: 1 });
      setSelB({ year: cy - 1, sub: 4 });
    }
    if (nextType === "year") {
      setSelA({ year: cy - 1, sub: 0 });
      setSelB({ year: Math.max(2025, cy - 2), sub: 0 });
    }
    if (nextType === "week") {
      setSelA({ year: cy, sub: 14 });
      setSelB({ year: cy, sub: 13 });
    }
  };

  const boundsA = getPeriodBounds(type, selA);
  const boundsB = getPeriodBounds(type, selB);

  const mA = useMemo(() => calcPeriodMetrics(transactions, boundsA), [transactions, boundsA.start.getTime(), boundsA.end.getTime()]);
  const mB = useMemo(() => calcPeriodMetrics(transactions, boundsB), [transactions, boundsB.start.getTime(), boundsB.end.getTime()]);

  const exportRows = [
    { label: "Revenus", a: mA.rev, b: mB.rev, isPercent: false },
    { label: "Depenses", a: mA.exp, b: mB.exp, isPercent: false },
    { label: "Cashflow net", a: mA.net, b: mB.net, isPercent: false },
    { label: "Marge brute", a: mA.gm, b: mB.gm, isPercent: true },
  ];
  const exportTitle = `Comparaison_${boundsA.label.replace(/\s/g, "_")}_vs_${boundsB.label.replace(/\s/g, "_")}`;

  const fmtCell = (value: number, isPercent: boolean) => isPercent ? `${value.toFixed(2)} %` : `CHF ${value.toFixed(2)}`;
  const deltaCell = (a: number, b: number, isPercent: boolean) => {
    const d = a - b;
    return isPercent ? `${d >= 0 ? "+" : ""}${d.toFixed(2)} pts` : `${d >= 0 ? "+" : "-"}CHF ${Math.abs(d).toFixed(2)}`;
  };
  const pctCell = (a: number, b: number) => b !== 0 ? `${((a - b) / Math.abs(b) * 100).toFixed(1)} %` : "-";

  const exportCSV = () => {
    const cell = (value: string | number) => {
      const s = String(value);
      return s.includes(";") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const row = (cols: (string | number)[]) => cols.map(cell).join(";");
    const lines = [
      row(["Indicateur", boundsA.label, boundsB.label, "Delta (A - B)", "Variation (%)"]),
      ...exportRows.map(r => row([r.label, fmtCell(r.a, r.isPercent), fmtCell(r.b, r.isPercent), deltaCell(r.a, r.b, r.isPercent), pctCell(r.a, r.b)])),
    ];
    triggerDl(new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" }), `${exportTitle}.csv`);
  };

  const exportPDF = async () => {
    setLoading("pdf");
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const width = doc.internal.pageSize.getWidth();
      const accent: [number, number, number] = [220, 50, 50];
      const blue: [number, number, number] = [59, 130, 246];

      const numPDF = (value: number) => {
        const abs = Math.abs(value);
        const hasCents = Math.round(abs * 100) % 100 !== 0;
        const [intPart, decPart] = abs.toFixed(hasCents ? 2 : 0).split(".");
        const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return (value < 0 ? "-" : "") + (hasCents ? `${formattedInt}.${decPart}` : formattedInt);
      };
      const fmtPDF = (value: number, isPercent: boolean) => isPercent ? `${value.toFixed(2)} %` : `CHF ${numPDF(value)}`;
      const deltaPDF = (a: number, b: number, isPercent: boolean) => {
        const d = a - b;
        return isPercent ? `${d >= 0 ? "+" : ""}${d.toFixed(2)} pts` : `${d >= 0 ? "+" : "-"}CHF ${numPDF(Math.abs(d))}`;
      };

      doc.setFillColor(...accent);
      doc.rect(0, 0, width, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Comparaison de periodes", 14, 12);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Genere le ${new Date().toLocaleDateString("fr-CH")}`, width - 14, 12, { align: "right" });

      let y = 26;
      doc.setTextColor(...blue);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${boundsA.label} vs ${boundsB.label}`, 14, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [["Indicateur", boundsA.label, boundsB.label, "Delta (A - B)", "Variation (%)"]],
        body: exportRows.map(r => [
          r.label,
          fmtPDF(r.a, r.isPercent),
          fmtPDF(r.b, r.isPercent),
          deltaPDF(r.a, r.b, r.isPercent),
          r.b !== 0 ? `${((r.a - r.b) / Math.abs(r.b) * 100).toFixed(1)} %` : "-",
        ]),
        headStyles: { fillColor: blue, fontSize: 9 },
        styles: { fontSize: 9.5, cellPadding: 3.5 },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
        margin: { left: 14, right: 14 },
      });

      const internal = doc.internal as any;
      const pages = internal.getNumberOfPages ? internal.getNumberOfPages() : internal.pages.length - 1;
      for (let i = 1; i <= pages; i += 1) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setTextColor(160, 160, 160);
        doc.text(`Page ${i} / ${pages}`, width / 2, 290, { align: "center" });
      }

      doc.save(`${exportTitle}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-accent-blue" />
          Comparaison de periodes
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[
              { fmt: "pdf", label: "PDF", cls: "border-accent-red/30 text-accent-red hover:bg-accent-red/10", action: exportPDF },
              { fmt: "csv", label: "CSV", cls: "border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10", action: exportCSV },
            ].map(button => (
              <button
                key={button.fmt}
                onClick={button.action}
                disabled={loading === button.fmt}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all disabled:opacity-40 ${button.cls}`}
              >
                {loading === button.fmt ? "..." : `Export ${button.label}`}
              </button>
            ))}
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-secondary/30 border border-glass-border">
            {TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => handleType(t.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  type === t.key ? "bg-accent-blue text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_48px_1fr] gap-3 items-start mb-6">
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Periode A</p>
          <SubSel sel={selA} onChange={setSelA} type={type} />
          <p className="text-xs text-accent-blue mt-1.5 font-medium">{boundsA.label}</p>
        </div>
        <div className="flex items-center justify-center mt-7">
          <span className="text-muted-foreground text-xs font-semibold px-2 py-1.5 rounded-lg bg-secondary/40 border border-glass-border">vs</span>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Periode B</p>
          <SubSel sel={selB} onChange={setSelB} type={type} />
          <p className="text-xs text-muted-foreground mt-1.5 font-medium">{boundsB.label}</p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_140px_140px_140px] items-center pb-2 gap-2">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Indicateur</span>
        <span className="text-[11px] font-semibold text-accent-blue uppercase tracking-widest text-right">{boundsA.label}</span>
        <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest text-right">{boundsB.label}</span>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest text-right">Delta (A - B)</span>
      </div>
      <div className="border-t border-glass-border">
        <Row label="Revenus" a={mA.rev} b={mB.rev} />
        <Row label="Depenses" a={mA.exp} b={mB.exp} invertColor />
        <Row label="Cashflow net" a={mA.net} b={mB.net} />
        <Row label="Marge brute" a={mA.gm} b={mB.gm} isPercent />
      </div>

      {type === "week" && (
        <p className="text-[11px] text-muted-foreground/50 mt-3 italic">
          Comparaison hebdomadaire basee sur les dates exactes des transactions.
        </p>
      )}
    </motion.div>
  );
}
