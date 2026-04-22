import type { Transaction } from "@shared/types";

export type PeriodType = "week" | "month" | "quarter" | "year";
export interface PeriodSel { year: number; sub: number }

export const MONTHS_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];
export const YEARS = [2025, 2026];

export function getISOWeekMonday(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dow  = jan4.getUTCDay() || 7;
  const d    = new Date(jan4);
  d.setUTCDate(jan4.getUTCDate() - (dow - 1) + (week - 1) * 7);
  return d;
}

export function getPeriodBounds(type: PeriodType, sel: PeriodSel): { start: Date; end: Date; label: string } {
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
      return { start, end, label: `Sem. ${sel.sub} — ${sel.year}` };
    }
  }
}

export function sumPeriod(
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

export function calcPeriodMetrics(txs: Transaction[], bounds: { start: Date; end: Date }) {
  const rev = sumPeriod(txs, bounds.start, bounds.end, "income");
  const exp = sumPeriod(txs, bounds.start, bounds.end, "expense");
  const dc  = sumPeriod(txs, bounds.start, bounds.end, "expense", "Direct Costs");
  return { rev, exp, net: rev - exp, gm: rev > 0 ? (rev - dc) / rev * 100 : 0 };
}