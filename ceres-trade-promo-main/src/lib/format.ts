export function formatIDR(val: number | null | undefined): string {
  if (val == null) return "–";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatNumber(val: number | null | undefined, decimals = 0): string {
  if (val == null) return "–";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

export function formatPercent(val: number | null | undefined, decimals = 1): string {
  if (val == null) return "–";
  return `${val.toFixed(decimals)}%`;
}

// Kept in sync with --color-chart-1..5 in globals.css.
export const CHART_COLORS = [
  "oklch(0.6 0.1 165)",   // chart-1 — sage green
  "oklch(0.45 0.05 250)", // chart-2 — slate blue
  "oklch(0.7 0.13 70)",   // chart-3 — caramel gold
  "oklch(0.55 0.14 30)",  // chart-4 — terracotta
  "oklch(0.6 0.02 60)",   // chart-5 — neutral taupe
];

// FIX: each entry now also sets an explicit, contrasting text color.
// The Badge component's `variant="secondary"` applies a fixed dark
// text color (--color-secondary-foreground) regardless of background,
// so on darker chart colors (chart-2 slate blue, chart-4 terracotta,
// chart-1 sage) the text became nearly invisible. `!text-*` (important)
// guarantees this overrides the variant's default, regardless of
// Tailwind's internal class ordering. chart-3 (caramel gold) is light
// enough that the existing dark text already reads fine.
export const promoTypeColors: Record<string, string> = {
  TPR: "bg-chart-2 !text-white",
  "TPR+D": "bg-chart-4 !text-white",
  "TPR+F": "bg-chart-3 !text-foreground",
  "TPR+D+F": "bg-chart-1 !text-white",
};

export const promoTypeBorderColors: Record<string, string> = {
  TPR: "border-chart-2",
  "TPR+D": "border-chart-4",
  "TPR+F": "border-chart-3",
  "TPR+D+F": "border-chart-1",
};

export const promoTypeLabels: Record<string, string> = {
  TPR: "Price Reduction",
  "TPR+D": "Price + Display",
  "TPR+F": "Price + Feature",
  "TPR+D+F": "Price + Display + Feature",
};

export const promoTypeColorMap: Record<string, string> = {
  TPR: CHART_COLORS[1],
  "TPR+D": CHART_COLORS[3],
  "TPR+F": CHART_COLORS[2],
  "TPR+D+F": CHART_COLORS[0],
};

// Status semantics (compliant/partial/non-compliant) intentionally kept as
// green/orange/red — a semantic traffic-light meaning that should stay
// legible regardless of brand palette.
export const statusBadgeClass: Record<string, string> = {
  COMPLIANT: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  PARTIAL: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  "NON-COMPLIANT": "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

export const statusColors: Record<string, string> = {
  COMPLIANT: "oklch(0.55 0.15 145)",
  PARTIAL: "oklch(0.65 0.18 55)",
  "NON-COMPLIANT": "oklch(0.55 0.22 25)",
};
