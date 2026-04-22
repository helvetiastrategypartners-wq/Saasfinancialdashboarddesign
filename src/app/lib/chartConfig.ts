/** Drop these props onto any Recharts <Tooltip /> to get the consistent dark-glass style. */
export const CHART_TOOLTIP = {
  contentStyle: {
    backgroundColor: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
  },
  labelStyle:  { color: "var(--popover-foreground)" },
  itemStyle:   { color: "var(--popover-foreground)" },
} as const;