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

export const CHART_COLORS = [
  "oklch(0.62 0.16 245)",
  "oklch(0.50 0.14 260)",
  "oklch(0.75 0.15 85)",
  "oklch(0.65 0.12 180)",
  "oklch(0.7 0.02 260)",
];

export const promoTypeColors: Record<string, string> = {
  TPR: "bg-chart-2",
  "TPR+D": "bg-chart-4",
  "TPR+F": "bg-chart-3",
  "TPR+D+F": "bg-chart-1",
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
