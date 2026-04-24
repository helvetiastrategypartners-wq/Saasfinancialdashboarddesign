import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "../../../components/ui/GlassCard";
import { CHART_TOOLTIP } from "../../../lib/chartConfig";

interface ForecastPoint {
  month: string;
  cash: number;
  revenue: number;
  burnRate: number;
}

interface ComparisonPoint {
  month: string;
  actuel: number;
  simule: number;
}

interface ForecastChartsSectionProps {
  activeScenarioName: string;
  activeProjection: ForecastPoint[];
  cashEvolutionData: Array<{
    month: string;
    conservateur: number;
    base: number;
    ambitieux: number;
  }>;
  formatCurrency: (value: number) => string;
  simComparisonData: ComparisonPoint[];
}

export function ForecastChartsSection({
  activeScenarioName,
  activeProjection,
  cashEvolutionData,
  formatCurrency,
  simComparisonData,
}: ForecastChartsSectionProps) {
  return (
    <>
      <GlassCard>
        <h3 className="text-xl font-semibold text-foreground mb-6">Evolution du cash (3 scenarios)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={cashEvolutionData}>
            <defs>
              <linearGradient id="grad-base" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
            <Tooltip {...CHART_TOOLTIP} formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Area type="monotone" dataKey="conservateur" name="Conservateur" stroke="#f97316" fill="transparent" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="base" name="Base" stroke="var(--accent-blue)" fill="url(#grad-base)" strokeWidth={2.5} dot={false} />
            <Area type="monotone" dataKey="ambitieux" name="Ambitieux" stroke="#eab308" fill="transparent" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard delay={0.1}>
        <h3 className="text-xl font-semibold text-foreground mb-6">Revenu vs burn rate - {activeScenarioName}</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={activeProjection}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
            <Tooltip {...CHART_TOOLTIP} formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="revenue" name="Revenu" stroke="var(--accent-red)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="burnRate" name="Burn Rate" stroke="var(--accent-blue)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      <div>
        <p className="text-sm font-medium text-foreground mb-4">Projection de tresorerie - base vs scenario simule</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={simComparisonData}>
            <defs>
              <linearGradient id="grad-sim" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-base-sim" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
            <Tooltip {...CHART_TOOLTIP} formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Area type="monotone" dataKey="actuel" name="Base (actuel)" stroke="var(--accent-blue)" fill="url(#grad-base-sim)" strokeWidth={2} dot={false} strokeDasharray="5 3" />
            <Area type="monotone" dataKey="simule" name="Scenario simule" stroke="#f97316" fill="url(#grad-sim)" strokeWidth={2.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
