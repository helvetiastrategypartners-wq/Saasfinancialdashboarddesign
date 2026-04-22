import { createContext, useContext, useState, useMemo } from "react";

export type ComparisonMode = 'none' | 'previous_period' | 'previous_year' | 'previous_year_same_day';

export interface DateRange {
  from: Date;
  to: Date; // exclusive upper bound (e.g. Apr 1 means "through March")
}

interface DateRangeContextType {
  dateRange: DateRange;
  setDateRange: (r: DateRange) => void;
  comparison: ComparisonMode;
  setComparison: (c: ComparisonMode) => void;
  comparisonRange: DateRange | null;
}

const DateRangeContext = createContext<DateRangeContextType | null>(null);

function computeComparisonRange(range: DateRange, mode: ComparisonMode): DateRange | null {
  if (mode === 'none') return null;
  const duration = range.to.getTime() - range.from.getTime();
  if (mode === 'previous_period') {
    return {
      from: new Date(range.from.getTime() - duration),
      to:   new Date(range.from),
    };
  }
  if (mode === 'previous_year') {
    const from = new Date(range.from);
    from.setUTCFullYear(from.getUTCFullYear() - 1);
    const to = new Date(range.to);
    to.setUTCFullYear(to.getUTCFullYear() - 1);
    return { from, to };
  }
  if (mode === 'previous_year_same_day') {
    // Same weekday, 52 weeks back (364 days)
    return {
      from: new Date(range.from.getTime() - 364 * 86400000),
      to:   new Date(range.to.getTime()   - 364 * 86400000),
    };
  }
  return null;
}

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const now = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1)),
    to:   new Date(Date.UTC(now.getFullYear(), now.getMonth(),     1)),
  });
  const [comparison, setComparison] = useState<ComparisonMode>('previous_period');

  const comparisonRange = useMemo(
    () => computeComparisonRange(dateRange, comparison),
    [dateRange, comparison],
  );

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange, comparison, setComparison, comparisonRange }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be inside DateRangeProvider");
  return ctx;
}
