import { GlassCard } from "./GlassCard";

interface StatCardProps {
  label:        string;
  value:        string;
  description?: string;
  delay?:       number;
  /** blue text */
  highlight?:   boolean;
  /** red text + red border */
  alert?:       boolean;
}

export function StatCard({
  label, value, description,
  delay = 0, highlight = false, alert = false,
}: StatCardProps) {
  return (
    <GlassCard
      delay={delay}
      hover
      // ✅ `transition-all` remplacé par des propriétés ciblées
      // `transition-all` force le browser à surveiller TOUTES les propriétés CSS
      // → jank sur les grilles denses. On ne transition que ce qui change réellement.
      className={`transition-[border-color,box-shadow] duration-200 ${
        alert       ? "border-accent-red/40"
        : highlight ? "border-accent-blue/30"
        : "hover:border-accent-blue/20"
      }`}
    >
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <p className={`text-3xl font-semibold ${
        alert ? "text-accent-red" : highlight ? "text-accent-blue" : "text-foreground"
      }`}>
        {value}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </GlassCard>
  );
}