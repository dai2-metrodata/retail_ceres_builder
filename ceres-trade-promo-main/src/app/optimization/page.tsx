"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatBubble } from "@/components/chat-bubble";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "@/lib/format";

interface OptRow {
  PROMO_TYPE: string;
  AVG_DISCOUNT: number;
  AVG_LIFT: number;
  AVG_ROI: number;
  PROMO_COUNT: number;
  TOTAL_SPEND_B: number;
  TOTAL_REVENUE_B: number;
}

export default function OptimizationPage() {
  const [data, setData] = useState<OptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(10);
  const [simResult, setSimResult] = useState<{ optimalMix: Record<string, number>; expectedROI: number } | null>(null);

  useEffect(() => {
    fetch("/api/optimization")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const runSimulation = () => {
    if (!data.length) return;
    const totalROI = data.reduce((s, r) => s + r.AVG_ROI * r.PROMO_COUNT, 0);
    const totalPromos = data.reduce((s, r) => s + r.PROMO_COUNT, 0);
    const weightedROI = totalROI / totalPromos;

    const sorted = [...data].sort((a, b) => b.AVG_ROI - a.AVG_ROI);
    const mix: Record<string, number> = {};
    let remaining = budget;
    sorted.forEach((row) => {
      const share = Math.min(remaining, budget * (row.AVG_ROI / data.reduce((s, r) => s + r.AVG_ROI, 0)));
      mix[row.PROMO_TYPE] = +(share).toFixed(1);
      remaining -= share;
    });

    setSimResult({ optimalMix: mix, expectedROI: +(weightedROI * 1.15).toFixed(2) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Trade Optimization</h2>
        <p className="text-muted-foreground">Forward-looking scenario modeling and budget allocation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>ROI by Promo Mechanic</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="PROMO_TYPE" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="AVG_ROI" name="Avg ROI %" fill={CHART_COLORS[0]} />
                  <Bar dataKey="AVG_LIFT" name="Avg Lift %" fill={CHART_COLORS[2]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Simulator</CardTitle>
            <CardDescription>Set a budget (Rp B) and allocate optimally across promo types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Budget (Rp Billion):</label>
              <input
                type="range"
                min={1}
                max={50}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-lg font-bold w-16 text-right">Rp {budget}B</span>
            </div>
            <Button onClick={runSimulation} disabled={loading}>Run Simulation</Button>

            {simResult && (
              <div className="mt-4 p-4 rounded-lg border bg-muted/50 space-y-2">
                <div className="text-sm font-medium">Optimal Allocation:</div>
                {Object.entries(simResult.optimalMix).map(([type, amount]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span>{type}</span>
                    <span className="font-mono">Rp {amount}B</span>
                  </div>
                ))}
                <div className="pt-2 border-t mt-2">
                  <span className="text-sm font-medium">Expected Portfolio ROI: </span>
                  <span className="text-lg font-bold text-green-600">{simResult.expectedROI}x</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Promo Type</th>
                  <th className="px-4 py-3 text-right font-medium">Promos</th>
                  <th className="px-4 py-3 text-right font-medium">Avg Discount</th>
                  <th className="px-4 py-3 text-right font-medium">Avg Lift</th>
                  <th className="px-4 py-3 text-right font-medium">Avg ROI</th>
                  <th className="px-4 py-3 text-right font-medium">Total Spend (B)</th>
                  <th className="px-4 py-3 text-right font-medium">Total Revenue (B)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.PROMO_TYPE} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium">{row.PROMO_TYPE}</td>
                    <td className="px-4 py-2 text-right">{row.PROMO_COUNT}</td>
                    <td className="px-4 py-2 text-right">{row.AVG_DISCOUNT}%</td>
                    <td className="px-4 py-2 text-right">{row.AVG_LIFT}%</td>
                    <td className="px-4 py-2 text-right font-semibold">{row.AVG_ROI}%</td>
                    <td className="px-4 py-2 text-right">Rp {row.TOTAL_SPEND_B}B</td>
                    <td className="px-4 py-2 text-right">Rp {row.TOTAL_REVENUE_B}B</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ChatBubble />
    </div>
  );
}
