"use client";

import { useState, useCallback } from "react";

export interface Filters {
  retailer: string;
  ppg: string;
  quarter: string;
  promoType: string;
}

const defaultFilters: Filters = {
  retailer: "",
  ppg: "",
  quarter: "",
  promoType: "",
};

export function useFilters() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const updateFilter = useCallback((key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const toQueryString = useCallback(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  return { filters, updateFilter, resetFilters, toQueryString };
}
