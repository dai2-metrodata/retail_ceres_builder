"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilterBar } from "@/components/filter-bar";
import { useFilters } from "@/lib/use-filters";
import { formatIDR, formatPercent, formatNumber, promoTypeColors } from "@/lib/format";
import { ChatBubble } from "@/components/chat-bubble";

interface Meta {
  TOTAL_PROMOS: number;
  TOTAL_SPEND: number;
  AVG_DISCOUNT: number;
  AVG_ROI: number;
}

interface Promo {
  PROMO_ID: number;
  WEEK_START: string;
  WEEK_END: string;
  DISCOUNT_PCT: number;
  PROMO_TYPE: string;
  PLANNED_SPEND_IDR: number;
  PLANNED_VOLUME_CASES: number;
  STATUS: string;
  RETAILER_NAME: string;
  PPG_NAME: string;
  PACK_SIZE: string;
}

export default function PromotionalCalendar() {
  const { filters, updateFilter, resetFilters, toQueryString } = useFilters();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = toQueryString();
      const [metaRes, promoRes] = await Promise.all([
        fetch("/api/calendar/meta"),
        fetch(`/api/calendar?${qs}`),
      ]);
      setMeta(await metaRes.json());
      setPromos(await promoRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [toQueryString]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Promotional Calendar</h2>
        <p className="text-muted-foreground">Overview of all trade promotions across retailers and products</p>
      </div>

      {meta && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Promotions</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatNumber(meta.TOTAL_PROMOS)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Planned Spend</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatIDR(meta.TOTAL_SPEND)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg Discount Depth</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatPercent(meta.AVG_DISCOUNT)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg ROI</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{meta.AVG_ROI?.toFixed(2)}x</div></CardContent>
          </Card>
        </div>
      )}

      <FilterBar filters={filters} onFilterChange={updateFilter} onReset={resetFilters} />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Retailer</th>
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">Period</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Discount</th>
                  <th className="px-4 py-3 text-right font-medium">Planned Spend</th>
                  <th className="px-4 py-3 text-right font-medium">Volume (cases)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : promos.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No promotions found</td></tr>
                ) : (
                  promos.map((p) => (
                    <tr key={p.PROMO_ID} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-2">{p.RETAILER_NAME}</td>
                      <td className="px-4 py-2">
                        <div>{p.PPG_NAME}</div>
                        <div className="text-xs text-muted-foreground">{p.PACK_SIZE}</div>
                      </td>
                      <td className="px-4 py-2 text-xs">{p.WEEK_START?.slice(0, 10)}</td>
                      <td className="px-4 py-2">
                        <Badge className={promoTypeColors[p.PROMO_TYPE] || ""} variant="secondary">
                          {p.PROMO_TYPE}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right">{formatPercent(p.DISCOUNT_PCT)}</td>
                      <td className="px-4 py-2 text-right">{formatIDR(p.PLANNED_SPEND_IDR)}</td>
                      <td className="px-4 py-2 text-right">{formatNumber(p.PLANNED_VOLUME_CASES)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ChatBubble />
    </div>
  );
}
