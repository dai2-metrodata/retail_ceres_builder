"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilterBar } from "@/components/filter-bar";
import { useFilters } from "@/lib/use-filters";
import { formatPercent, statusBadgeClass } from "@/lib/format";
import { ChatBubble } from "@/components/chat-bubble";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "@/lib/format";

interface ComplianceRow {
  RETAILER_NAME: string;
  AVG_OVERALL: number;
  AVG_PRICE: number;
  AVG_DISPLAY: number;
  AVG_FEATURE: number;
  COMPLIANT_COUNT: number;
  PARTIAL_COUNT: number;
  NONCOMPLIANT_COUNT: number;
  TOTAL: number;
}

export default function CompliancePage() {
  const { filters, updateFilter, resetFilters } = useFilters();
  const [data, setData] = useState<ComplianceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.retailer) params.set("retailer", filters.retailer);
    if (filters.quarter) params.set("quarter", filters.quarter);

    fetch(`/api/compliance?${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters.retailer, filters.quarter]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Compliance Check</h2>
        <p className="text-muted-foreground">Execution scoring: price accuracy, display, and feature compliance</p>
      </div>

      <FilterBar filters={filters} onFilterChange={updateFilter} onReset={resetFilters} />

      <Card>
        <CardHeader><CardTitle>Compliance by Retailer</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="RETAILER_NAME" angle={-30} textAnchor="end" height={80} fontSize={11} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="AVG_PRICE" name="Price Accuracy" fill={CHART_COLORS[0]} />
              <Bar dataKey="AVG_DISPLAY" name="Display" fill={CHART_COLORS[2]} />
              <Bar dataKey="AVG_FEATURE" name="Feature" fill={CHART_COLORS[3]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Retailer</th>
                  <th className="px-4 py-3 text-right font-medium">Overall</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Display</th>
                  <th className="px-4 py-3 text-right font-medium">Feature</th>
                  <th className="px-4 py-3 text-center font-medium">Status Breakdown</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : (
                  data.map((row) => (
                    <tr key={row.RETAILER_NAME} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-2 font-medium">{row.RETAILER_NAME}</td>
                      <td className="px-4 py-2 text-right font-semibold">{formatPercent(row.AVG_OVERALL)}</td>
                      <td className="px-4 py-2 text-right">{formatPercent(row.AVG_PRICE)}</td>
                      <td className="px-4 py-2 text-right">{formatPercent(row.AVG_DISPLAY)}</td>
                      <td className="px-4 py-2 text-right">{formatPercent(row.AVG_FEATURE)}</td>
                      <td className="px-4 py-2 text-center space-x-1">
                        <Badge className={statusBadgeClass["COMPLIANT"]}>{row.COMPLIANT_COUNT}</Badge>
                        <Badge className={statusBadgeClass["PARTIAL"]}>{row.PARTIAL_COUNT}</Badge>
                        <Badge className={statusBadgeClass["NON-COMPLIANT"]}>{row.NONCOMPLIANT_COUNT}</Badge>
                      </td>
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
