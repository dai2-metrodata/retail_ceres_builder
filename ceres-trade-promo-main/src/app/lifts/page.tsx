"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterBar } from "@/components/filter-bar";
import { useFilters } from "@/lib/use-filters";
import { formatPercent, CHART_COLORS, promoTypeColorMap } from "@/lib/format";
import { ChatBubble } from "@/components/chat-bubble";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from "recharts";

interface LiftRow {
  RETAILER_NAME: string;
  PROMO_TYPE: string;
  AVG_LIFT: number;
  AVG_ROI: number;
  SPEND_M: number;
  REVENUE_M: number;
  PORTFOLIO_ROI: number;
  PROMO_COUNT: number;
}

export default function LiftsPage() {
  const { filters, updateFilter, resetFilters } = useFilters();
  const [data, setData] = useState<LiftRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.retailer) params.set("retailer", filters.retailer);
    if (filters.quarter) params.set("quarter", filters.quarter);

    fetch(`/api/lifts?${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters.retailer, filters.quarter]);

  const byRetailer = data.reduce((acc, row) => {
    if (!acc[row.RETAILER_NAME]) acc[row.RETAILER_NAME] = { name: row.RETAILER_NAME, spend: 0, revenue: 0 };
    acc[row.RETAILER_NAME].spend += row.SPEND_M;
    acc[row.RETAILER_NAME].revenue += row.REVENUE_M;
    return acc;
  }, {} as Record<string, { name: string; spend: number; revenue: number }>);

  const retailerChart = Object.values(byRetailer).map((r) => ({
    ...r,
    roi: r.spend > 0 ? +(r.revenue / r.spend).toFixed(2) : 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Volume Lifts & ROI</h2>
        <p className="text-muted-foreground">Post-event measurement: lift %, ROI, and incremental revenue</p>
      </div>

      <FilterBar filters={filters} onFilterChange={updateFilter} onReset={resetFilters} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>ROI by Retailer</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={retailerChart} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" fontSize={10} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="roi" name="Portfolio ROI" fill={CHART_COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Lift vs ROI by Promo Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="AVG_LIFT" name="Avg Lift %" type="number" />
                <YAxis dataKey="PORTFOLIO_ROI" name="ROI" type="number" />
                <ZAxis dataKey="PROMO_COUNT" range={[50, 400]} name="Promos" />
                <Tooltip />
                <Scatter data={data} fill={CHART_COLORS[0]} />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Retailer</th>
                  <th className="px-4 py-3 text-left font-medium">Promo Type</th>
                  <th className="px-4 py-3 text-right font-medium">Avg Lift</th>
                  <th className="px-4 py-3 text-right font-medium">Portfolio ROI</th>
                  <th className="px-4 py-3 text-right font-medium">Spend (M)</th>
                  <th className="px-4 py-3 text-right font-medium">Revenue (M)</th>
                  <th className="px-4 py-3 text-right font-medium">Promos</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : (
                  data.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-2">{row.RETAILER_NAME}</td>
                      <td className="px-4 py-2">{row.PROMO_TYPE}</td>
                      <td className="px-4 py-2 text-right">{formatPercent(row.AVG_LIFT)}</td>
                      <td className="px-4 py-2 text-right font-semibold">{row.PORTFOLIO_ROI?.toFixed(2)}x</td>
                      <td className="px-4 py-2 text-right">Rp {row.SPEND_M?.toFixed(1)}M</td>
                      <td className="px-4 py-2 text-right">Rp {row.REVENUE_M?.toFixed(1)}M</td>
                      <td className="px-4 py-2 text-right">{row.PROMO_COUNT}</td>
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
