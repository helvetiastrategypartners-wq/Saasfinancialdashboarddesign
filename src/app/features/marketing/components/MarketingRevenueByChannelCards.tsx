import { GlassCard } from "../../../components/ui/GlassCard";

interface MarketingRevenueByChannelCardsProps {
  cacByChannel: Record<string, number>;
  format: (value: number) => string;
  revenueByChannel: Record<string, number>;
}

export function MarketingRevenueByChannelCards({
  cacByChannel,
  format,
  revenueByChannel,
}: MarketingRevenueByChannelCardsProps) {
  if (Object.keys(revenueByChannel).length === 0) {
    return null;
  }

  return (
    <GlassCard delay={0.15}>
      <h3 className="text-xl font-semibold text-foreground mb-4">Revenue par canal (transactions)</h3>
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(revenueByChannel).map(([channel, revenue]) => (
          <div key={channel} className="rounded-xl p-4 border border-glass-border/50" style={{ background: "var(--glass-bg)" }}>
            <p className="text-xs text-muted-foreground mb-1">{channel}</p>
            <p className="text-lg font-semibold text-foreground">{format(revenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">CAC : {format(cacByChannel[channel] ?? 0)}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
