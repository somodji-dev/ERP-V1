"use client"

import { useState, useEffect } from "react"
import { getSnapshotsForChart, getSnapshotsForChartByRange } from "@/app/actions/cashflow"
import { prepareChartData } from "@/lib/cashflow/chartData"
import type { ChartPoint } from "@/lib/cashflow/chartData"
import { CashFlowChart } from "./CashFlowChart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type RangeType = "12" | "60" | "range"

function getDefaultRange(): { from: string; to: string } {
  const now = new Date()
  const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const fromDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
  const from = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, "0")}`
  return { from, to }
}

export function CashFlowChartWithRange({
  initialData,
}: {
  initialData: ChartPoint[]
}) {
  const [rangeType, setRangeType] = useState<RangeType>("12")
  const [chartData, setChartData] = useState<ChartPoint[]>(initialData)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [loading, setLoading] = useState(false)

  const defaultRange = getDefaultRange()
  const from = dateFrom || defaultRange.from
  const to = dateTo || defaultRange.to

  useEffect(() => {
    setChartData(initialData)
  }, [initialData])

  async function loadChart() {
    setLoading(true)
    try {
      if (rangeType === "12") {
        const raw = await getSnapshotsForChart(12)
        setChartData(prepareChartData(raw))
      } else if (rangeType === "60") {
        const raw = await getSnapshotsForChart(60)
        setChartData(prepareChartData(raw))
      } else {
        const [yFrom, mFrom] = from.slice(0, 7).split("-").map(Number)
        const [yTo, mTo] = to.slice(0, 7).split("-").map(Number)
        if (!yFrom || !mFrom || !yTo || !mTo) {
          setLoading(false)
          return
        }
        const raw = await getSnapshotsForChartByRange(yFrom, mFrom, yTo, mTo)
        setChartData(prepareChartData(raw))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (rangeType === "12") {
      setChartData(initialData)
      return
    }
    loadChart()
  }, [rangeType])

  return (
    <div className="space-y-4">
      <CashFlowChart data={chartData} />
      <div className="flex flex-wrap items-end gap-4 border-t border-[#E5E7EB] pt-4">
        <span className="text-sm font-medium text-[#6B7280]">Pregled:</span>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={rangeType === "12" ? "default" : "outline"}
            size="sm"
            className={rangeType === "12" ? "bg-[#2563EB] hover:bg-[#1D4ED8]" : "border-[#E5E7EB]"}
            onClick={() => setRangeType("12")}
          >
            Zadnjih 12 meseci
          </Button>
          <Button
            type="button"
            variant={rangeType === "60" ? "default" : "outline"}
            size="sm"
            className={rangeType === "60" ? "bg-[#2563EB] hover:bg-[#1D4ED8]" : "border-[#E5E7EB]"}
            onClick={() => setRangeType("60")}
          >
            Zadnjih 5 godina
          </Button>
          <Button
            type="button"
            variant={rangeType === "range" ? "default" : "outline"}
            size="sm"
            className={rangeType === "range" ? "bg-[#2563EB] hover:bg-[#1D4ED8]" : "border-[#E5E7EB]"}
            onClick={() => setRangeType("range")}
          >
            Od – Do
          </Button>
        </div>
        {rangeType === "range" && (
          <>
            <div className="flex items-center gap-2">
              <Label htmlFor="cf-from" className="text-sm text-[#6B7280] whitespace-nowrap">
                Od
              </Label>
              <Input
                id="cf-from"
                type="month"
                value={dateFrom || defaultRange.from}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[140px] border-[#E5E7EB]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="cf-to" className="text-sm text-[#6B7280] whitespace-nowrap">
                Do
              </Label>
              <Input
                id="cf-to"
                type="month"
                value={dateTo || defaultRange.to}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[140px] border-[#E5E7EB]"
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="bg-[#2563EB] hover:bg-[#1D4ED8]"
              disabled={loading}
              onClick={loadChart}
            >
              {loading ? "Učitavanje..." : "Primeni"}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
