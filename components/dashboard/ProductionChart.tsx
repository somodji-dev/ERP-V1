"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

export type DailyProductionPoint = {
  label: string
  datum: string
  pikant: number
  bbq: number
  ukupno: number
  count: number
}

type Props = {
  data: DailyProductionPoint[]
  averageLine?: number
}

export function ProductionChart({ data, averageLine }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-sm text-[#6B7280]">
        Nema podataka za grafikon.
      </div>
    )
  }

  return (
    <div className="h-[280px] w-full rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickLine={false}
            tickFormatter={(v) => `${v} kg`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [`${value} kg`, ""]}
            labelStyle={{ color: "#111827", fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar dataKey="pikant" stackId="a" fill="#2563EB" name="Pikant" radius={[0, 0, 0, 0]} />
          <Bar dataKey="bbq" stackId="a" fill="#F59E0B" name="BBQ" radius={[0, 0, 0, 0]} />
          {averageLine != null && averageLine > 0 && (
            <ReferenceLine
              y={averageLine}
              stroke="#6B7280"
              strokeDasharray="3 3"
              label={{ value: "Prosek", position: "right", fontSize: 10, fill: "#6B7280" }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
