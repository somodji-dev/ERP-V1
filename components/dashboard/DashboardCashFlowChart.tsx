"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils/format"

export type ChartPoint = {
  label: string
  cash: number
  dugovanja: number
  neto: number
}

type Props = { data: ChartPoint[] }

export function DashboardCashFlowChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-sm text-[#6B7280]">
        Nema podataka za grafikon.
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    cash: d.cash,
    dugovanja: d.dugovanja,
    neto: d.neto,
  }))

  return (
    <div className="h-[280px] w-full rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
              fontSize: "12px",
            }}
            formatter={(value: number) => formatCurrency(value)}
            labelStyle={{ color: "#111827", fontWeight: 600 }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            formatter={(value) =>
              value === "cash"
                ? "Cash (aktiva)"
                : value === "dugovanja"
                  ? "Dugovanja (pasiva)"
                  : "Neto C/F"
            }
          />
          <Line
            type="monotone"
            dataKey="cash"
            stroke="#2563EB"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="cash"
          />
          <Line
            type="monotone"
            dataKey="dugovanja"
            stroke="#DC2626"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="dugovanja"
          />
          <Line
            type="monotone"
            dataKey="neto"
            stroke="#16A34A"
            strokeWidth={3}
            dot={{ r: 4 }}
            name="neto"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
