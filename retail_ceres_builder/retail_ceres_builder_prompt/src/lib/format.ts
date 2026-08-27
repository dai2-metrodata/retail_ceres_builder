// Shared formatting utilities and constants for the Ceres Trade Promo app

export function formatIDR(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatNumber(val: number, decimals = 0): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

export function formatPercent(val: number, decimals = 1): string {
  return `${val.toFixed(decimals)}%`;
}

// Chart color palette (matches globals.css chart-1 through chart-5)
export const CHART_COLORS = [
  "oklch(0.62 0.16 245)",  // chart-1: Ceres blue
  "oklch(0.50 0.14 260)",  // chart-2: navy
  "oklch(0.75 0.15 85)",   // chart-3: gold
  "oklch(0.65 0.12 180)",  // chart-4: teal
  "oklch(0.7 0.02 260)",   // chart-5: grey
];

// Promo type → Tailwind background class
export const promoTypeColors: Record<string, string> = {
  TPR: "bg-chart-2",
  "TPR+D": "bg-chart-4",
  "TPR+F": "bg-chart-3",
  "TPR+D+F": "bg-chart-1",
};

// Promo type → Tailwind border class
export const promoTypeBorderColors: Record<string, string> = {
  TPR: "border-chart-2",
  "TPR+D": "border-chart-4",
  "TPR+F": "border-chart-3",
  "TPR+D+F": "border-chart-1",
};

// Promo type → Human-readable label
export const promoTypeLabels: Record<string, string> = {
  TPR: "Price Reduction",
  "TPR+D": "Price + Display",
  "TPR+F": "Price + Feature",
  "TPR+D+F": "Price + Display + Feature",
};

// Promo type → HSL chart color
export const promoTypeColorMap: Record<string, string> = {
  TPR: CHART_COLORS[1],
  "TPR+D": CHART_COLORS[3],
  "TPR+F": CHART_COLORS[2],
  "TPR+D+F": CHART_COLORS[0],
};

// Compliance status → badge Tailwind classes
export const statusBadgeClass: Record<string, string> = {
  COMPLIANT: "bg-ceres-dark/15 text-ceres-dark dark:bg-ceres-dark/30 dark:text-blue-200",
  PARTIAL: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  "NON-COMPLIANT": "bg-ceres-blue/15 text-ceres-blue dark:bg-ceres-blue/30 dark:text-red-200",
};

// Compliance status → HSL color for charts (Ceres palette)
export const statusColors: Record<string, string> = {
  COMPLIANT: "oklch(0.25 0.06 260)",       // Ceres Dark
  PARTIAL: "oklch(0.65 0.18 55)",           // Warm orange
  "NON-COMPLIANT": "oklch(0.55 0.22 25)",  // Ceres Blue
};
