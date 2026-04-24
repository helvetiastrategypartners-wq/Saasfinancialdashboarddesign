import { useState, useRef, useEffect } from "react";
import { ChevronDown, Calendar, X } from "lucide-react";
import { useDateRange, type ComparisonMode, type DateRange } from "../contexts/DateRangeContext";
import { useCurrency, type Currency } from "../contexts/CurrencyContext";

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];
const DAYS_FR = ["Lu","Ma","Me","Je","Ve","Sa","Di"];

const COMPARISON_OPTIONS: { value: ComparisonMode; label: string }[] = [
  { value: 'none',                   label: 'Aucune comparaison' },
  { value: 'previous_period',        label: 'Période précédente' },
  { value: 'previous_year',          label: 'Année précédente' },
  { value: 'previous_year_same_day', label: 'Année préc. (même jour sem.)' },
];

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'CHF', label: 'CHF ₣' },
  { value: 'EUR', label: 'EUR €' },
  { value: 'USD', label: 'USD $' },
];

// ── Presets ───────────────────────────────────────────────────────────────────

type Preset = { label: string; getRange: () => DateRange };

function getPresets(): Preset[] {
  const now    = new Date();
  const today  = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const tmrw   = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const yest   = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const q      = Math.floor(now.getMonth() / 3);
  const pq     = q === 0 ? 3 : q - 1;
  const pqYear = q === 0 ? now.getFullYear() - 1 : now.getFullYear();

  return [
    { label: "Aujourd'hui",        getRange: () => ({ from: today, to: tmrw }) },
    { label: "Hier",               getRange: () => ({ from: yest,  to: today }) },
    { label: "7 derniers jours",   getRange: () => ({ from: new Date(today.getTime() - 6 * 86400000), to: tmrw }) },
    { label: "30 derniers jours",  getRange: () => ({ from: new Date(today.getTime() - 29 * 86400000), to: tmrw }) },
    { label: "Mois en cours",      getRange: () => ({
      from: new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)),
      to:   new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1)),
    }) },
    { label: "Mois précédent",     getRange: () => ({
      from: new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1)),
      to:   new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)),
    }) },
    { label: "Ce trimestre",       getRange: () => ({
      from: new Date(Date.UTC(now.getFullYear(), q * 3, 1)),
      to:   new Date(Date.UTC(now.getFullYear(), q * 3 + 3, 1)),
    }) },
    { label: "Trimestre précédent",getRange: () => ({
      from: new Date(Date.UTC(pqYear, pq * 3, 1)),
      to:   new Date(Date.UTC(pqYear, pq * 3 + 3, 1)),
    }) },
    { label: "Cette année",        getRange: () => ({
      from: new Date(Date.UTC(now.getFullYear(), 0, 1)),
      to:   new Date(Date.UTC(now.getFullYear() + 1, 0, 1)),
    }) },
  ];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRangeLabel(from: Date, to: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const toDisplay = new Date(to.getTime() - 86400000);
  return `${from.toLocaleDateString('fr-CH', opts)} → ${toDisplay.toLocaleDateString('fr-CH', opts)}`;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── Mini Calendar ─────────────────────────────────────────────────────────────

function MiniCalendar({
  viewYear, viewMonth, localFrom, localTo, hoverDay, onDayClick, onDayHover,
}: {
  viewYear: number;
  viewMonth: number;
  localFrom: Date | null;
  localTo: Date | null;
  hoverDay: Date | null;
  onDayClick: (d: Date) => void;
  onDayHover: (d: Date | null) => void;
}) {
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
  const firstDow    = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
  const padStart    = (firstDow + 6) % 7; // shift Sun→Mon

  const cells: (number | null)[] = [];
  for (let i = 0; i < padStart; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const toUTC = (d: number) =>
    new Date(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}T00:00:00Z`);

  // Determine displayed range (account for hover when to not yet picked)
  let rangeFrom = localFrom;
  let rangeTo   = localTo ?? hoverDay;
  if (rangeFrom && rangeTo && rangeTo < rangeFrom) [rangeFrom, rangeTo] = [rangeTo, rangeFrom];

  return (
    <div className="min-w-[210px]">
      <p className="text-center text-sm font-semibold text-foreground mb-3">
        {MONTHS_FR[viewMonth]} {viewYear}
      </p>
      <div className="grid grid-cols-7 mb-1">
        {DAYS_FR.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => {
          if (d === null) return <div key={`p-${i}`} />;
          const date  = toUTC(d);
          const key   = dateKey(date);
          const isFrom = localFrom ? dateKey(localFrom) === key : false;
          const isTo   = localTo   ? dateKey(localTo)   === key : false;
          const inRange = rangeFrom && rangeTo ? date > rangeFrom && date < rangeTo : false;
          const isSelected = isFrom || isTo;

          return (
            <button
              key={d}
              onClick={() => onDayClick(date)}
              onMouseEnter={() => onDayHover(date)}
              onMouseLeave={() => onDayHover(null)}
              className={`
                text-xs py-1.5 rounded-lg transition-all text-center
                ${isSelected
                  ? 'bg-accent-blue text-white font-semibold shadow-sm'
                  : inRange
                  ? 'bg-accent-blue/15 text-foreground'
                  : 'text-foreground hover:bg-secondary/70'}
              `}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── DateRangeBar ──────────────────────────────────────────────────────────────

export function DateRangeBar() {
  const { dateRange, setDateRange, comparison, setComparison } = useDateRange();
  const { currency, setCurrency } = useCurrency();

  // Dropdown open state
  const [calOpen, setCalOpen] = useState(false);
  const [cmpOpen, setCmpOpen] = useState(false);
  const [curOpen, setCurOpen] = useState(false);

  // Calendar internal state
  const now = new Date();
  const initLeftMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const initLeftYear  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const [leftMonth, setLeftMonth] = useState(initLeftMonth);
  const [leftYear,  setLeftYear]  = useState(initLeftYear);

  // Local selection before Apply
  const [localFrom, setLocalFrom] = useState<Date | null>(dateRange.from);
  const [localTo,   setLocalTo]   = useState<Date | null>(new Date(dateRange.to.getTime() - 86400000));
  const [picking,   setPicking]   = useState<'from' | 'to'>('from');
  const [hoverDay,  setHoverDay]  = useState<Date | null>(null);
  const [activePreset, setActivePreset] = useState<string>("Mois précédent");

  const presets = getPresets();
  const rightMonth = (leftMonth + 1) % 12;
  const rightYear  = leftMonth === 11 ? leftYear + 1 : leftYear;

  // Click-outside to close
  const calRef = useRef<HTMLDivElement>(null);
  const cmpRef = useRef<HTMLDivElement>(null);
  const curRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
      if (cmpRef.current && !cmpRef.current.contains(e.target as Node)) setCmpOpen(false);
      if (curRef.current && !curRef.current.contains(e.target as Node)) setCurOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // Day click in calendar
  const handleDayClick = (d: Date) => {
    setActivePreset("Personnalisée");
    if (picking === 'from' || (localFrom && localTo)) {
      setLocalFrom(d);
      setLocalTo(null);
      setPicking('to');
    } else {
      if (localFrom && d < localFrom) {
        setLocalTo(localFrom);
        setLocalFrom(d);
      } else {
        setLocalTo(d);
      }
      setPicking('from');
    }
  };

  // Preset click
  const handlePreset = (preset: Preset) => {
    const r = preset.getRange();
    setLocalFrom(r.from);
    setLocalTo(new Date(r.to.getTime() - 86400000));
    setActivePreset(preset.label);
    setPicking('from');
  };

  // Apply
  const handleApply = () => {
    if (localFrom) {
      const to = localTo ? new Date(localTo.getTime() + 86400000) : new Date(localFrom.getTime() + 86400000);
      setDateRange({ from: localFrom, to });
    }
    setCalOpen(false);
  };

  // Cancel
  const handleCancel = () => {
    setLocalFrom(dateRange.from);
    setLocalTo(new Date(dateRange.to.getTime() - 86400000));
    setCalOpen(false);
  };

  const prevLeftMonth = () => {
    if (leftMonth === 0) { setLeftMonth(11); setLeftYear(y => y - 1); }
    else setLeftMonth(m => m - 1);
  };
  const nextLeftMonth = () => {
    if (leftMonth === 11) { setLeftMonth(0); setLeftYear(y => y + 1); }
    else setLeftMonth(m => m + 1);
  };

  const cmpLabel = COMPARISON_OPTIONS.find(o => o.value === comparison)?.label ?? 'Aucune comparaison';
  const curLabel = CURRENCIES.find(c => c.value === currency)?.label ?? 'CHF ₣';

  const btnCls =
    "flex items-center gap-2 px-3 py-2 rounded-xl border border-glass-border " +
    "bg-secondary/30 text-sm font-medium text-foreground " +
    "hover:border-accent-blue/40 hover:bg-secondary/50 transition-all whitespace-nowrap";

  const dropCls =
    "absolute top-full mt-2 z-50 rounded-2xl border border-glass-border " +
    "backdrop-blur-xl shadow-2xl overflow-hidden";

  const dateInputCls = (active: boolean) =>
    `flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
      active ? 'border-accent-blue/60 bg-accent-blue/5' : 'border-glass-border bg-secondary/30'
    }`;

  return (
    <div className="flex items-center gap-2 flex-wrap">

      {/* ── Date range picker ── */}
      <div className="relative" ref={calRef}>
        <div className="flex items-center">
          <button
            onClick={() => { setCalOpen(v => !v); setCmpOpen(false); setCurOpen(false); }}
            className={`${btnCls} ${activePreset !== 'Mois précédent' ? 'rounded-r-none border-r-0' : ''}`}
          >
            <Calendar className="w-4 h-4 text-accent-blue shrink-0" />
            <span>{formatRangeLabel(dateRange.from, dateRange.to)}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${calOpen ? 'rotate-180' : ''}`} />
          </button>
          {activePreset !== 'Mois précédent' && (
            <button
              onClick={() => {
                const r = presets.find(p => p.label === 'Mois précédent')!.getRange();
                setDateRange(r);
                setLocalFrom(r.from);
                setLocalTo(new Date(r.to.getTime() - 86400000));
                setActivePreset('Mois précédent');
                setPicking('from');
              }}
              title="Réinitialiser la période"
              className="flex items-center justify-center py-2 px-2.5 rounded-r-xl border border-glass-border border-l-0 bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {calOpen && (
          <div className={dropCls} style={{ background: 'var(--popover)', left: 0 }}>
            <div className="flex">

              {/* Presets */}
              <div className="w-44 border-r border-glass-border p-3 space-y-0.5 shrink-0">
                {presets.map(p => (
                  <button
                    key={p.label}
                    onClick={() => handlePreset(p)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${
                      activePreset === p.label
                        ? 'bg-secondary/80 text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
                <div className="border-t border-glass-border my-1.5" />
                <button
                  onClick={() => { setActivePreset("Personnalisée"); setPicking('from'); setLocalFrom(null); setLocalTo(null); }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${
                    activePreset === 'Personnalisée'
                      ? 'bg-secondary/80 text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  }`}
                >
                  Personnalisée
                </button>
              </div>

              {/* Calendar */}
              <div className="p-4 flex flex-col gap-3">

                {/* Input display */}
                <div className="flex items-center gap-2">
                  <div className={dateInputCls(picking === 'from')}>
                    <span className="text-muted-foreground text-[11px] shrink-0">Du</span>
                    <span className="text-foreground tabular-nums">
                      {localFrom
                        ? localFrom.toLocaleDateString('fr-CH', { day: 'numeric', month: 'short', year: 'numeric' })
                        : <span className="text-muted-foreground">—</span>}
                    </span>
                    {localFrom && (
                      <button onClick={() => { setLocalFrom(null); setPicking('from'); }}>
                        <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">→</span>
                  <div className={dateInputCls(picking === 'to' && !!localFrom)}>
                    <span className="text-muted-foreground text-[11px] shrink-0">Au</span>
                    <span className="text-foreground tabular-nums">
                      {localTo
                        ? localTo.toLocaleDateString('fr-CH', { day: 'numeric', month: 'short', year: 'numeric' })
                        : <span className="text-muted-foreground">—</span>}
                    </span>
                    {localTo && (
                      <button onClick={() => { setLocalTo(null); setPicking('to'); }}>
                        <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Month navigation */}
                <div className="flex items-center justify-between px-1">
                  <button
                    onClick={prevLeftMonth}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-all"
                  >
                    ←
                  </button>
                  <div />
                  <button
                    onClick={nextLeftMonth}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-all"
                  >
                    →
                  </button>
                </div>

                {/* Two-month calendar */}
                <div className="flex gap-6">
                  <MiniCalendar
                    viewYear={leftYear} viewMonth={leftMonth}
                    localFrom={localFrom} localTo={localTo}
                    hoverDay={hoverDay}
                    onDayClick={handleDayClick}
                    onDayHover={setHoverDay}
                  />
                  <div className="w-px bg-glass-border shrink-0" />
                  <MiniCalendar
                    viewYear={rightYear} viewMonth={rightMonth}
                    localFrom={localFrom} localTo={localTo}
                    hoverDay={hoverDay}
                    onDayClick={handleDayClick}
                    onDayHover={setHoverDay}
                  />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-glass-border">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={!localFrom}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-foreground text-background hover:opacity-90 transition-all disabled:opacity-40"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Comparison dropdown ── */}
      <div className="relative" ref={cmpRef}>
        <div className="flex items-center">
          <button
            onClick={() => { setCmpOpen(v => !v); setCalOpen(false); setCurOpen(false); }}
            className={`${btnCls} ${comparison !== 'none' ? 'rounded-r-none border-r-0' : ''}`}
          >
            <span className="text-muted-foreground">⇆</span>
            <span>{cmpLabel}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${cmpOpen ? 'rotate-180' : ''}`} />
          </button>
          {comparison !== 'none' && (
            <button
              onClick={() => setComparison('none')}
              title="Réinitialiser la comparaison"
              className="flex items-center justify-center w-8 h-full px-0 rounded-r-xl border border-glass-border border-l-0 bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {cmpOpen && (
          <div className={dropCls} style={{ background: 'var(--popover)', minWidth: '260px', left: 0 }}>
            <div className="p-1.5 space-y-0.5">
              {COMPARISON_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setComparison(opt.value); setCmpOpen(false); }}
                  className={`w-full text-left text-sm px-3 py-2.5 rounded-lg transition-all ${
                    comparison === opt.value
                      ? 'bg-secondary/80 text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Currency switcher ── */}
      <div className="relative" ref={curRef}>
        <button
          onClick={() => { setCurOpen(v => !v); setCalOpen(false); setCmpOpen(false); }}
          className={btnCls}
        >
          <span className="font-semibold">{curLabel}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${curOpen ? 'rotate-180' : ''}`} />
        </button>

        {curOpen && (
          <div className={dropCls} style={{ background: 'var(--popover)', minWidth: '130px', right: 0 }}>
            <div className="p-1.5 space-y-0.5">
              {CURRENCIES.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setCurrency(opt.value); setCurOpen(false); }}
                  className={`w-full text-left text-sm px-3 py-2.5 rounded-lg transition-all ${
                    currency === opt.value
                      ? 'bg-secondary/80 text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
