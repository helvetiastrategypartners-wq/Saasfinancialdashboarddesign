import { useState, useRef, useEffect } from "react";
import { ChevronDown, Calendar, X } from "lucide-react";
import { useDateRange, type ComparisonMode, type DateRange } from "../contexts/DateRangeContext";
import { useCurrency, type Currency } from "../contexts/CurrencyContext";

// Constants
const MONTHS_FR = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

const DAYS_FR = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

const COMPARISON_OPTIONS: { value: ComparisonMode; label: string }[] = [
  { value: "none", label: "Aucune comparaison" },
  { value: "previous_period", label: "Periode precedente" },
  { value: "previous_year", label: "Annee precedente" },
  { value: "previous_year_same_day", label: "Annee prec. (meme jour sem.)" },
];

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "CHF", label: "CHF" },
  { value: "EUR", label: "EUR" },
  { value: "USD", label: "USD $" },
];

// Presets
type Preset = { label: string; getRange: () => DateRange };

function getPresets(): Preset[] {
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const tomorrow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const yesterday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const quarter = Math.floor(now.getMonth() / 3);
  const previousQuarter = quarter === 0 ? 3 : quarter - 1;
  const previousQuarterYear = quarter === 0 ? now.getFullYear() - 1 : now.getFullYear();

  return [
    { label: "Aujourd'hui", getRange: () => ({ from: today, to: tomorrow }) },
    { label: "Hier", getRange: () => ({ from: yesterday, to: today }) },
    { label: "7 derniers jours", getRange: () => ({ from: new Date(today.getTime() - 6 * 86400000), to: tomorrow }) },
    { label: "30 derniers jours", getRange: () => ({ from: new Date(today.getTime() - 29 * 86400000), to: tomorrow }) },
    {
      label: "Mois en cours",
      getRange: () => ({
        from: new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)),
        to: new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1)),
      }),
    },
    {
      label: "Mois precedent",
      getRange: () => ({
        from: new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1)),
        to: new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)),
      }),
    },
    {
      label: "Ce trimestre",
      getRange: () => ({
        from: new Date(Date.UTC(now.getFullYear(), quarter * 3, 1)),
        to: new Date(Date.UTC(now.getFullYear(), quarter * 3 + 3, 1)),
      }),
    },
    {
      label: "Trimestre precedent",
      getRange: () => ({
        from: new Date(Date.UTC(previousQuarterYear, previousQuarter * 3, 1)),
        to: new Date(Date.UTC(previousQuarterYear, previousQuarter * 3 + 3, 1)),
      }),
    },
    {
      label: "Cette annee",
      getRange: () => ({
        from: new Date(Date.UTC(now.getFullYear(), 0, 1)),
        to: new Date(Date.UTC(now.getFullYear() + 1, 0, 1)),
      }),
    },
  ];
}

// Helpers
function formatRangeLabel(from: Date, to: Date): string {
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const toDisplay = new Date(to.getTime() - 86400000);
  return `${from.toLocaleDateString("fr-CH", options)} -> ${toDisplay.toLocaleDateString("fr-CH", options)}`;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Mini Calendar
function MiniCalendar({
  viewYear,
  viewMonth,
  localFrom,
  localTo,
  hoverDay,
  onDayClick,
  onDayHover,
}: {
  viewYear: number;
  viewMonth: number;
  localFrom: Date | null;
  localTo: Date | null;
  hoverDay: Date | null;
  onDayClick: (date: Date) => void;
  onDayHover: (date: Date | null) => void;
}) {
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
  const firstDayOfWeek = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
  const padStart = (firstDayOfWeek + 6) % 7;

  const cells: Array<number | null> = [];
  for (let index = 0; index < padStart; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const toUtcDate = (day: number) =>
    new Date(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00Z`);

  let rangeFrom = localFrom;
  let rangeTo = localTo ?? hoverDay;
  if (rangeFrom && rangeTo && rangeTo < rangeFrom) {
    [rangeFrom, rangeTo] = [rangeTo, rangeFrom];
  }

  return (
    <div className="min-w-[210px]">
      <p className="text-center text-sm font-semibold text-foreground mb-3">
        {MONTHS_FR[viewMonth]} {viewYear}
      </p>
      <div className="grid grid-cols-7 mb-1">
        {DAYS_FR.map((dayLabel) => (
          <div key={dayLabel} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
            {dayLabel}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, index) => {
          if (day === null) {
            return <div key={`pad-${index}`} />;
          }

          const date = toUtcDate(day);
          const key = dateKey(date);
          const isFrom = localFrom ? dateKey(localFrom) === key : false;
          const isTo = localTo ? dateKey(localTo) === key : false;
          const inRange = rangeFrom && rangeTo ? date > rangeFrom && date < rangeTo : false;
          const isSelected = isFrom || isTo;

          return (
            <button
              key={day}
              onClick={() => onDayClick(date)}
              onMouseEnter={() => onDayHover(date)}
              onMouseLeave={() => onDayHover(null)}
              className={`
                text-xs py-1.5 rounded-lg transition-all text-center
                ${
                  isSelected
                    ? "bg-accent-blue text-white font-semibold shadow-sm"
                    : inRange
                      ? "bg-accent-blue/15 text-foreground"
                      : "text-foreground hover:bg-secondary/70"
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// DateRangeBar
export function DateRangeBar() {
  const { dateRange, setDateRange, comparison, setComparison } = useDateRange();
  const { currency, setCurrency } = useCurrency();

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const now = new Date();
  const initialLeftMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const initialLeftYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const [leftMonth, setLeftMonth] = useState(initialLeftMonth);
  const [leftYear, setLeftYear] = useState(initialLeftYear);

  const [localFrom, setLocalFrom] = useState<Date | null>(dateRange.from);
  const [localTo, setLocalTo] = useState<Date | null>(new Date(dateRange.to.getTime() - 86400000));
  const [picking, setPicking] = useState<"from" | "to">("from");
  const [hoverDay, setHoverDay] = useState<Date | null>(null);
  const [activePreset, setActivePreset] = useState<string>("Mois precedent");

  const presets = getPresets();
  const rightMonth = (leftMonth + 1) % 12;
  const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear;

  const calendarRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setCalendarOpen(false);
      }

      if (comparisonRef.current && !comparisonRef.current.contains(event.target as Node)) {
        setComparisonOpen(false);
      }

      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setCurrencyOpen(false);
      }
    }

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const handleDayClick = (date: Date) => {
    setActivePreset("Personnalisee");

    if (picking === "from" || (localFrom && localTo)) {
      setLocalFrom(date);
      setLocalTo(null);
      setPicking("to");
      return;
    }

    if (localFrom && date < localFrom) {
      setLocalTo(localFrom);
      setLocalFrom(date);
    } else {
      setLocalTo(date);
    }

    setPicking("from");
  };

  const handlePreset = (preset: Preset) => {
    const range = preset.getRange();
    setLocalFrom(range.from);
    setLocalTo(new Date(range.to.getTime() - 86400000));
    setActivePreset(preset.label);
    setPicking("from");
  };

  const handleApply = () => {
    if (localFrom) {
      const to = localTo
        ? new Date(localTo.getTime() + 86400000)
        : new Date(localFrom.getTime() + 86400000);
      setDateRange({ from: localFrom, to });
    }

    setCalendarOpen(false);
  };

  const handleCancel = () => {
    setLocalFrom(dateRange.from);
    setLocalTo(new Date(dateRange.to.getTime() - 86400000));
    setCalendarOpen(false);
  };

  const resetToDefaultPreset = () => {
    const defaultPreset = presets.find((preset) => preset.label === "Mois precedent");
    if (!defaultPreset) {
      return;
    }

    const range = defaultPreset.getRange();
    setDateRange(range);
    setLocalFrom(range.from);
    setLocalTo(new Date(range.to.getTime() - 86400000));
    setActivePreset("Mois precedent");
    setPicking("from");
  };

  const previousLeftMonth = () => {
    if (leftMonth === 0) {
      setLeftMonth(11);
      setLeftYear((value) => value - 1);
      return;
    }

    setLeftMonth((value) => value - 1);
  };

  const nextLeftMonth = () => {
    if (leftMonth === 11) {
      setLeftMonth(0);
      setLeftYear((value) => value + 1);
      return;
    }

    setLeftMonth((value) => value + 1);
  };

  const comparisonLabel =
    COMPARISON_OPTIONS.find((option) => option.value === comparison)?.label ?? "Aucune comparaison";
  const currencyLabel = CURRENCIES.find((option) => option.value === currency)?.label ?? "CHF";

  const buttonClassName =
    "flex items-center gap-2 px-3 py-2 rounded-xl border border-glass-border " +
    "bg-secondary/30 text-sm font-medium text-foreground " +
    "hover:border-accent-blue/40 hover:bg-secondary/50 transition-all whitespace-nowrap";

  const dropdownClassName =
    "absolute top-full mt-2 z-50 rounded-2xl border border-glass-border " +
    "backdrop-blur-xl shadow-2xl overflow-hidden";

  const dateInputClassName = (isActive: boolean) =>
    `flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
      isActive ? "border-accent-blue/60 bg-accent-blue/5" : "border-glass-border bg-secondary/30"
    }`;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Date range picker */}
      <div className="relative" ref={calendarRef}>
        <div className="flex items-center">
          <button
            onClick={() => {
              setCalendarOpen((value) => !value);
              setComparisonOpen(false);
              setCurrencyOpen(false);
            }}
            className={`${buttonClassName} ${activePreset !== "Mois precedent" ? "rounded-r-none border-r-0" : ""}`}
          >
            <Calendar className="w-4 h-4 text-accent-blue shrink-0" />
            <span>{formatRangeLabel(dateRange.from, dateRange.to)}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${calendarOpen ? "rotate-180" : ""}`} />
          </button>

          {activePreset !== "Mois precedent" && (
            <button
              onClick={resetToDefaultPreset}
              title="Reinitialiser la periode"
              className="flex items-center justify-center py-2 px-2.5 rounded-r-xl border border-glass-border border-l-0 bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {calendarOpen && (
          <div className={dropdownClassName} style={{ background: "var(--popover)", left: 0 }}>
            <div className="flex">
              <div className="w-44 border-r border-glass-border p-3 space-y-0.5 shrink-0">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePreset(preset)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${
                      activePreset === preset.label
                        ? "bg-secondary/80 text-foreground font-medium"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}

                <div className="border-t border-glass-border my-1.5" />

                <button
                  onClick={() => {
                    setActivePreset("Personnalisee");
                    setPicking("from");
                    setLocalFrom(null);
                    setLocalTo(null);
                  }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${
                    activePreset === "Personnalisee"
                      ? "bg-secondary/80 text-foreground font-medium"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  Personnalisee
                </button>
              </div>

              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className={dateInputClassName(picking === "from")}>
                    <span className="text-muted-foreground text-[11px] shrink-0">Du</span>
                    <span className="text-foreground tabular-nums">
                      {localFrom
                        ? localFrom.toLocaleDateString("fr-CH", { day: "numeric", month: "short", year: "numeric" })
                        : <span className="text-muted-foreground">-</span>}
                    </span>
                    {localFrom && (
                      <button onClick={() => { setLocalFrom(null); setPicking("from"); }}>
                        <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>

                  <span className="text-muted-foreground text-xs">{"->"}</span>

                  <div className={dateInputClassName(picking === "to" && Boolean(localFrom))}>
                    <span className="text-muted-foreground text-[11px] shrink-0">Au</span>
                    <span className="text-foreground tabular-nums">
                      {localTo
                        ? localTo.toLocaleDateString("fr-CH", { day: "numeric", month: "short", year: "numeric" })
                        : <span className="text-muted-foreground">-</span>}
                    </span>
                    {localTo && (
                      <button onClick={() => { setLocalTo(null); setPicking("to"); }}>
                        <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <button
                    onClick={previousLeftMonth}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-all"
                  >
                    {"<"}
                  </button>
                  <div />
                  <button
                    onClick={nextLeftMonth}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-all"
                  >
                    {">"}
                  </button>
                </div>

                <div className="flex gap-6">
                  <MiniCalendar
                    viewYear={leftYear}
                    viewMonth={leftMonth}
                    localFrom={localFrom}
                    localTo={localTo}
                    hoverDay={hoverDay}
                    onDayClick={handleDayClick}
                    onDayHover={setHoverDay}
                  />
                  <div className="w-px bg-glass-border shrink-0" />
                  <MiniCalendar
                    viewYear={rightYear}
                    viewMonth={rightMonth}
                    localFrom={localFrom}
                    localTo={localTo}
                    hoverDay={hoverDay}
                    onDayClick={handleDayClick}
                    onDayHover={setHoverDay}
                  />
                </div>

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

      {/* Comparison dropdown */}
      <div className="relative" ref={comparisonRef}>
        <div className="flex items-center">
          <button
            onClick={() => {
              setComparisonOpen((value) => !value);
              setCalendarOpen(false);
              setCurrencyOpen(false);
            }}
            className={`${buttonClassName} ${comparison !== "none" ? "rounded-r-none border-r-0" : ""}`}
          >
            <span className="text-muted-foreground">vs</span>
            <span>{comparisonLabel}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${comparisonOpen ? "rotate-180" : ""}`} />
          </button>

          {comparison !== "none" && (
            <button
              onClick={() => setComparison("none")}
              title="Reinitialiser la comparaison"
              className="flex items-center justify-center w-8 h-full px-0 rounded-r-xl border border-glass-border border-l-0 bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {comparisonOpen && (
          <div className={dropdownClassName} style={{ background: "var(--popover)", minWidth: "260px", left: 0 }}>
            <div className="p-1.5 space-y-0.5">
              {COMPARISON_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setComparison(option.value);
                    setComparisonOpen(false);
                  }}
                  className={`w-full text-left text-sm px-3 py-2.5 rounded-lg transition-all ${
                    comparison === option.value
                      ? "bg-secondary/80 text-foreground font-medium"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Currency switcher */}
      <div className="relative" ref={currencyRef}>
        <button
          onClick={() => {
            setCurrencyOpen((value) => !value);
            setCalendarOpen(false);
            setComparisonOpen(false);
          }}
          className={buttonClassName}
        >
          <span className="font-semibold">{currencyLabel}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${currencyOpen ? "rotate-180" : ""}`} />
        </button>

        {currencyOpen && (
          <div className={dropdownClassName} style={{ background: "var(--popover)", minWidth: "130px", right: 0 }}>
            <div className="p-1.5 space-y-0.5">
              {CURRENCIES.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setCurrency(option.value);
                    setCurrencyOpen(false);
                  }}
                  className={`w-full text-left text-sm px-3 py-2.5 rounded-lg transition-all ${
                    currency === option.value
                      ? "bg-secondary/80 text-foreground font-medium"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
