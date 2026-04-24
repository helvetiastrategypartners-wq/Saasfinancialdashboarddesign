import {
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { GlassCard } from "../../../components/ui/GlassCard";
import { CHART_TOOLTIP } from "../../../lib/chartConfig";

interface ChartPoint {
  month: string;
  revenue: number;
  expenses: number;
}

interface CandlestickPoint extends ChartPoint {
  open: number;
  close: number;
  high: number;
  low: number;
  spacer: number;
  range: number;
}

function CandlestickShape(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: { open: number; close: number; high: number; low: number };
}) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;

  if (!payload || height <= 0 || width <= 0) {
    return null;
  }

  const { open, close, high, low } = payload;
  const range = high - low;
  if (range <= 0) {
    return null;
  }

  const centerX = x + width / 2;
  const halfWidth = Math.max(3, width * 0.55);
  const toY = (value: number) => (y + height) - ((value - low) / range) * height;
  const yOpen = toY(open);
  const yClose = toY(close);
  const bodyTop = Math.min(yOpen, yClose);
  const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));
  const isUp = close >= open;
  const color = isUp ? "var(--accent-blue)" : "var(--accent-red)";

  return (
    <g>
      <line x1={centerX} y1={y} x2={centerX} y2={y + height} stroke={color} strokeWidth={1.5} />
      <rect
        x={centerX - halfWidth / 2}
        y={bodyTop}
        width={halfWidth}
        height={bodyHeight}
        fill={color}
        fillOpacity={isUp ? 0.25 : 0.75}
        stroke={color}
        strokeWidth={1.5}
        rx={2}
      />
    </g>
  );
}

interface RevenueExpensesChartProps {
  rangeLabel: string;
  chartMode: "line" | "candle";
  onChartModeChange: (mode: "line" | "candle") => void;
  dateRangeChartData: ChartPoint[];
  candleProcessed: CandlestickPoint[];
  candleOffset: number;
  formatCurrency: (value: number) => string;
}

export function RevenueExpensesChart({
  rangeLabel,
  chartMode,
  onChartModeChange,
  dateRangeChartData,
  candleProcessed,
  candleOffset,
  formatCurrency,
}: RevenueExpensesChartProps) {
  return (
    <GlassCard delay={0.1}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-foreground">Revenus vs Depenses - {rangeLabel}</h3>
        <div className="flex gap-1 p-1 rounded-xl bg-secondary/30 border border-glass-border">
          {(["line", "candle"] as const).map(mode => (
            <button
              key={mode}
              onClick={() => onChartModeChange(mode)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                chartMode === mode ? "bg-accent-blue text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode === "line" ? "Lignes" : "Bougies"}
            </button>
          ))}
        </div>
      </div>

      {chartMode === "line" ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dateRangeChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
            <YAxis stroke="var(--muted-foreground)" tickFormatter={value => `${(value / 1000).toFixed(0)}k`} />
            <Tooltip {...CHART_TOOLTIP} formatter={(value: number) => [formatCurrency(value)]} />
            <Line type="monotone" dataKey="revenue" stroke="var(--accent-red)" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} name="Revenus" />
            <Line type="monotone" dataKey="expenses" stroke="var(--accent-blue)" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} name="Depenses" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={candleProcessed} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
            <YAxis stroke="var(--muted-foreground)" tickFormatter={value => `${((value - candleOffset) / 1000).toFixed(0)}k`} />
            <ReferenceLine y={candleOffset} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeWidth={1} />
            <Tooltip
              {...CHART_TOOLTIP}
              formatter={(_value: number, name: string, item: { payload: CandlestickPoint }) => {
                const payload = item.payload;
                if (name === "spacer") {
                  return [null, null];
                }

                return [
                  <span key="tip" style={{ color: "var(--popover-foreground)" }}>
                    Revenus: {formatCurrency(payload.revenue)} · Depenses: {formatCurrency(payload.expenses)}
                    <br />
                    Open: {formatCurrency(payload.open)} · Close: {formatCurrency(payload.close)}
                  </span>,
                  "",
                ];
              }}
            />
            <Bar dataKey="spacer" stackId="c" fill="transparent" stroke="none" legendType="none" />
            <Bar dataKey="range" stackId="c" shape={<CandlestickShape />} legendType="none" />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      <div className="flex items-center justify-center gap-6 mt-2">
        {chartMode === "line" ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent-red" />
              <span className="text-sm text-muted-foreground">Revenus</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent-blue" />
              <span className="text-sm text-muted-foreground">Depenses</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent-blue" />
              <span className="text-sm text-muted-foreground">Haussier (net +)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent-red" />
              <span className="text-sm text-muted-foreground">Baissier (net -)</span>
            </div>
          </>
        )}
      </div>
    </GlassCard>
  );
}
