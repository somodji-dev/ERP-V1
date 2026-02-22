"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"

type PieItem = { name: string; value: number; color: string }

type Props = {
  pieShift: PieItem[]
  pieWorker: PieItem[]
}

export function ProizvodnjaPieCharts({ pieShift, pieWorker }: Props) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      {pieShift.length > 0 && (
        <Card className="border-[#E5E7EB] bg-white shadow-sm">
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-[#111827]">Proizvodnja po smeni</h2>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieShift}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieShift.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v} naloga`, ""]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
      {pieWorker.length > 0 && (
        <Card className="border-[#E5E7EB] bg-white shadow-sm">
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-[#111827]">Top 5 radnika (kg)</h2>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieWorker}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value} kg`}
                  >
                    {pieWorker.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v} kg`, ""]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
