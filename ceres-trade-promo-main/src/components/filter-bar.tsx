"use client";

import { useEffect, useState } from "react";

interface FilterOptions {
  retailers: { id: number; name: string }[];
  ppgs: { id: number; name: string }[];
  quarters: string[];
  promoTypes: string[];
}

interface FilterBarProps {
  filters: { retailer: string; ppg: string; quarter: string; promoType: string };
  onFilterChange: (key: string, value: string) => void;
  onReset: () => void;
}

export function FilterBar({ filters, onFilterChange, onReset }: FilterBarProps) {
  const [options, setOptions] = useState<FilterOptions>({
    retailers: [],
    ppgs: [],
    quarters: [],
    promoTypes: [],
  });

  useEffect(() => {
    fetch("/api/filters")
      .then((r) => r.json())
      .then(setOptions)
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <select
        className="h-9 rounded-md border bg-background px-3 text-sm"
        value={filters.retailer}
        onChange={(e) => onFilterChange("retailer", e.target.value)}
      >
        <option value="">All Retailers</option>
        {options.retailers.map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>

      <select
        className="h-9 rounded-md border bg-background px-3 text-sm"
        value={filters.ppg}
        onChange={(e) => onFilterChange("ppg", e.target.value)}
      >
        <option value="">All Products</option>
        {options.ppgs.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <select
        className="h-9 rounded-md border bg-background px-3 text-sm"
        value={filters.quarter}
        onChange={(e) => onFilterChange("quarter", e.target.value)}
      >
        <option value="">All Quarters</option>
        {options.quarters.map((q) => (
          <option key={q} value={q}>{q}</option>
        ))}
      </select>

      <select
        className="h-9 rounded-md border bg-background px-3 text-sm"
        value={filters.promoType}
        onChange={(e) => onFilterChange("promoType", e.target.value)}
      >
        <option value="">All Promo Types</option>
        {options.promoTypes.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <button
        onClick={onReset}
        className="h-9 px-3 text-sm rounded-md border hover:bg-muted"
      >
        Reset
      </button>
    </div>
  );
}
