const LEVERAGE_MAX = 8;

function polarXY(cx: number, cy: number, r: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  return { x: cx + r * Math.cos(radians), y: cy - r * Math.sin(radians) };
}

function arcD(cx: number, cy: number, r: number, fromDeg: number, toDeg: number) {
  const start = polarXY(cx, cy, r, fromDeg);
  const end = polarXY(cx, cy, r, toDeg);
  const large = fromDeg - toDeg > 180 ? 1 : 0;
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}

export function LeverageGauge({ value }: { value: number }) {
  const centerX = 100;
  const centerY = 100;
  const radius = 70;
  const needleRadius = 55;
  const clampedValue = Math.min(LEVERAGE_MAX, Math.max(0, value));
  const toAngle = (input: number) => 180 - (input / LEVERAGE_MAX) * 180;
  const needleAngle = toAngle(clampedValue);
  const { x: needleX, y: needleY } = polarXY(centerX, centerY, needleRadius, needleAngle);
  const zoneColor = value < 2 ? "var(--accent-blue)" : value < 4 ? "#f97316" : "var(--accent-red)";
  const zoneLabel = value < 2 ? "Sain" : value < 4 ? "Modere" : "RisquE";

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 200 130" className="w-56 h-36">
        <path d={arcD(centerX, centerY, radius, 180, 0)} fill="none" stroke="var(--border)" strokeWidth={16} strokeLinecap="round" />
        <path d={arcD(centerX, centerY, radius, 180, toAngle(2))} fill="none" stroke="var(--accent-blue)" strokeWidth={14} strokeOpacity={0.8} strokeLinecap="round" />
        <path d={arcD(centerX, centerY, radius, toAngle(2), toAngle(4))} fill="none" stroke="#f97316" strokeWidth={14} strokeOpacity={0.8} strokeLinecap="round" />
        <path d={arcD(centerX, centerY, radius, toAngle(4), toAngle(LEVERAGE_MAX))} fill="none" stroke="var(--accent-red)" strokeWidth={14} strokeOpacity={0.8} strokeLinecap="round" />
        <line x1={centerX} y1={centerY} x2={needleX} y2={needleY} stroke={zoneColor} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={centerX} cy={centerY} r={6} fill={zoneColor} />
        <text x={centerX} y={centerY + 22} textAnchor="middle" fontSize={20} fontWeight="700" fill="var(--foreground)">{value.toFixed(2)}x</text>
        <text x={centerX} y={centerY + 36} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">{zoneLabel}</text>
      </svg>
      <div className="flex gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent-blue" />Sain (&lt;2x)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#f97316]" />Modere (2-4x)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent-red" />Risque (&gt;4x)
        </span>
      </div>
    </div>
  );
}
