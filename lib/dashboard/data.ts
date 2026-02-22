"use server"

import { createClient } from "@/lib/supabase/server"
import { getSnapshotsForChart, getLastSnapshotForKpi } from "@/app/actions/cashflow"
import { calculateTotalKg } from "@/lib/proizvodnja/calculations"
import { startOfMonth, endOfMonth, subMonths, subDays, format } from "date-fns"

export type DashboardKpiCashFlow = {
  neto: number
  change: { value: number; percentage: number; isPositive: boolean } | null
  mesec: number
  godina: number
}

export type DashboardKpiProizvodnja = {
  ukupnoKg: number
  dailyAverage: number
  change: { value: number; percentage: number; isPositive: boolean } | null
  daysInPeriod: number
}

export type DashboardKpiRadniNalozi = {
  count: number
  change: { value: number; percentage: number; isPositive: boolean } | null
  mesec: number
  godina: number
}

export type DailyProductionChartPoint = {
  label: string
  datum: string
  pikant: number
  bbq: number
  ukupno: number
  count: number
}

export type DashboardData = {
  cashFlow: DashboardKpiCashFlow | null
  proizvodnja: DashboardKpiProizvodnja | null
  radniNalozi: DashboardKpiRadniNalozi | null
  chartCashFlow: Array<{ label: string; cash: number; dugovanja: number; neto: number }>
  dailyProductionChart: DailyProductionChartPoint[]
  recentOrders: Array<{
    id: string
    broj_naloga: string
    datum: string
    smena: string
    ukupnoKg: number
  }>
}

const MESECI = ["", "Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Avg", "Sep", "Okt", "Nov", "Dec"]

function firstRow<T>(rel: T[] | T | null | undefined): T | null {
  if (rel == null) return null
  if (Array.isArray(rel)) return rel[0] ?? null
  return rel
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date()
  const startCurrent = startOfMonth(now)
  const endCurrent = endOfMonth(now)
  const startPrev = startOfMonth(subMonths(now, 1))
  const endPrev = endOfMonth(subMonths(now, 1))

  const supabase = await createClient()

  const endChart = endOfMonth(now)
  const startChart = subDays(startCurrent, 29)
  const startChartStr = startChart.toISOString().slice(0, 10)
  const endChartStr = endChart.toISOString().slice(0, 10)

  const [kpiCash, chartRaw, currentMonthOrders, prevMonthOrders, lastOrders, ordersForChart] = await Promise.all([
    getLastSnapshotForKpi(),
    getSnapshotsForChart(12),
    fetchWorkOrdersInRange(supabase, startCurrent.toISOString().slice(0, 10), endCurrent.toISOString().slice(0, 10)),
    fetchWorkOrdersInRange(supabase, startPrev.toISOString().slice(0, 10), endPrev.toISOString().slice(0, 10)),
    fetchRecentOrders(supabase, 10),
    fetchWorkOrdersInRangeForChart(supabase, startChartStr, endChartStr),
  ])

  const chartCashFlow = chartRaw.map((s) => ({
    label: `${MESECI[s.mesec]} ${String(s.godina).slice(-2)}`,
    cash: s.ukupno_cash,
    dugovanja: s.dugovanja_dobavljaci,
    neto: s.neto_cash_flow,
  }))

  let cashFlow: DashboardKpiCashFlow | null = null
  if (kpiCash) {
    const prevSnapshot = chartRaw.filter((s) => s.godina === startPrev.getFullYear() && s.mesec === startPrev.getMonth() + 1)[0]
    const prevNeto = prevSnapshot?.neto_cash_flow ?? 0
    const change = prevNeto !== 0
      ? { value: kpiCash.neto_cash_flow - prevNeto, percentage: Math.round(((kpiCash.neto_cash_flow - prevNeto) / prevNeto) * 100), isPositive: kpiCash.neto_cash_flow >= prevNeto }
      : null
    cashFlow = {
      neto: kpiCash.neto_cash_flow,
      change,
      mesec: kpiCash.mesec,
      godina: kpiCash.godina,
    }
  }

  const currentKg = currentMonthOrders.reduce((sum, o) => sum + o.ukupnoKg, 0)
  const prevKg = prevMonthOrders.reduce((sum, o) => sum + o.ukupnoKg, 0)
  // Dnevni prosek = ukupno kg / broj dana u kojima je bila proizvodnja (radni dani)
  const distinctDaysCurrent = new Set(currentMonthOrders.map((o) => o.datum)).size
  const daysWithProduction = Math.max(1, distinctDaysCurrent)
  const proizvodnja: DashboardKpiProizvodnja | null =
    currentMonthOrders.length > 0
      ? {
          ukupnoKg: Math.round(currentKg * 10) / 10,
          dailyAverage: Math.round((currentKg / daysWithProduction) * 10) / 10,
          change:
            prevKg > 0
              ? {
                  value: currentKg - prevKg,
                  percentage: Math.round(((currentKg - prevKg) / prevKg) * 100),
                  isPositive: currentKg >= prevKg,
                }
              : null,
          daysInPeriod: daysWithProduction,
        }
      : null

  const currentCount = currentMonthOrders.length
  const prevCount = prevMonthOrders.length
  const radniNalozi: DashboardKpiRadniNalozi | null = {
    count: currentCount,
    change:
      prevCount > 0
        ? {
            value: currentCount - prevCount,
            percentage: Math.round(((currentCount - prevCount) / prevCount) * 100),
            isPositive: currentCount >= prevCount,
          }
        : null,
    mesec: now.getMonth() + 1,
    godina: now.getFullYear(),
  }

  const dailyMap = new Map<string, { pikant: number; bbq: number; ukupno: number; count: number }>()
  for (const row of ordersForChart) {
    const key = row.datum
    const existing = dailyMap.get(key)
    if (existing) {
      existing.pikant += row.pikant
      existing.bbq += row.bbq
      existing.ukupno += row.ukupno
      existing.count += 1
    } else {
      dailyMap.set(key, { pikant: row.pikant, bbq: row.bbq, ukupno: row.ukupno, count: 1 })
    }
  }
  const dailyProductionChart: DailyProductionChartPoint[] = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([datum, v]) => ({
      label: format(new Date(datum), "dd.MM"),
      datum,
      pikant: Math.round(v.pikant * 10) / 10,
      bbq: Math.round(v.bbq * 10) / 10,
      ukupno: Math.round(v.ukupno * 10) / 10,
      count: v.count,
    }))

  return {
    cashFlow,
    proizvodnja,
    radniNalozi,
    chartCashFlow,
    dailyProductionChart,
    recentOrders: lastOrders,
  }
}

/** Dnevni podaci za grafikon proizvodnje (pikant, bbq po datumu) — isti izvor kao KPI. */
async function fetchWorkOrdersInRangeForChart(
  supabase: Awaited<ReturnType<typeof createClient>>,
  start: string,
  end: string
): Promise<Array<{ datum: string; pikant: number; bbq: number; ukupno: number }>> {
  const { data } = await supabase
    .from("work_orders")
    .select(
      `
      datum,
      pakovanje (
        pikant_15kg, pikant_1kg, pikant_200g, pikant_150g, pikant_80g,
        bbq_15kg, bbq_1kg, bbq_200g, bbq_150g, bbq_80g
      )
    `
    )
    .gte("datum", start)
    .lte("datum", end)
    .order("datum", { ascending: true })

  const list = (data ?? []) as Array<{
    datum: string
    pakovanje: Array<Record<string, number | null>> | null
  }>
  return list.map((row) => {
    const pak = firstRow(row.pakovanje)
    const t = calculateTotalKg(pak ?? null)
    return {
      datum: row.datum,
      pikant: t.pikant,
      bbq: t.bbq,
      ukupno: t.ukupno,
    }
  })
}

async function fetchWorkOrdersInRange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  start: string,
  end: string
): Promise<Array<{ datum: string; ukupnoKg: number }>> {
  const { data } = await supabase
    .from("work_orders")
    .select(
      `
      id,
      datum,
      pakovanje (
        pikant_15kg, pikant_1kg, pikant_200g, pikant_150g, pikant_80g,
        bbq_15kg, bbq_1kg, bbq_200g, bbq_150g, bbq_80g
      )
    `
    )
    .gte("datum", start)
    .lte("datum", end)

  const list = (data ?? []) as Array<{
    datum: string
    pakovanje: Array<Record<string, number | null>> | null
  }>
  return list.map((row) => {
    const pak = firstRow(row.pakovanje)
    const t = calculateTotalKg(pak ?? null)
    return { datum: row.datum, ukupnoKg: t.ukupno }
  })
}

async function fetchRecentOrders(
  supabase: Awaited<ReturnType<typeof createClient>>,
  limit: number
): Promise<Array<{ id: string; broj_naloga: string; datum: string; smena: string; ukupnoKg: number }>> {
  const { data } = await supabase
    .from("work_orders")
    .select(
      `
      id,
      broj_naloga,
      datum,
      smena,
      pakovanje (
        pikant_15kg, pikant_1kg, pikant_200g, pikant_150g, pikant_80g,
        bbq_15kg, bbq_1kg, bbq_200g, bbq_150g, bbq_80g
      )
    `
    )
    .order("datum", { ascending: false })
    .order("broj_naloga", { ascending: false })
    .limit(limit)

  const list = (data ?? []) as Array<{
    id: string
    broj_naloga: string
    datum: string
    smena: string
    pakovanje: Array<Record<string, number | null>> | null
  }>
  return list.map((row) => {
    const pak = firstRow(row.pakovanje)
    const t = calculateTotalKg(pak ?? null)
    return {
      id: row.id,
      broj_naloga: row.broj_naloga,
      datum: row.datum,
      smena: row.smena,
      ukupnoKg: t.ukupno,
    }
  })
}

export type AnalitikaCashFlowParams = { godina?: string; mesec?: string }
export type AnalitikaCashFlowRow = {
  mesec: number
  godina: number
  ukupno_cash: number
  dugovanja_dobavljaci: number
  neto_cash_flow: number
  promena_percent?: number
}

export async function getAnalitikaCashFlow(
  params: AnalitikaCashFlowParams
): Promise<{
  metrics: { cashAktiva: number; dugovanja: number; neto: number; prosekMesečno: number; ytdNeto: number }
  chartData: Array<{ label: string; cash: number; dugovanja: number; neto: number }>
  tableRows: AnalitikaCashFlowRow[]
}> {
  const godina = params.godina ? parseInt(params.godina, 10) : new Date().getFullYear()
  const supabase = await createClient()
  let query = supabase
    .from("cash_snapshots")
    .select("mesec, godina, ukupno_cash, dugovanja_dobavljaci, neto_cash_flow")
    .eq("godina", godina)
    .order("mesec", { ascending: false })
  if (params.mesec && params.mesec !== "all") {
    query = query.eq("mesec", parseInt(params.mesec, 10))
  }
  const { data } = await query
  const list = (data ?? []) as Array<{
    mesec: number
    godina: number
    ukupno_cash: number
    dugovanja_dobavljaci: number
    neto_cash_flow: number
  }>
  const tableRows: AnalitikaCashFlowRow[] = list.map((r, i) => {
    const prev = list[i + 1]
    const promena =
      prev && prev.neto_cash_flow !== 0
        ? Math.round(((r.neto_cash_flow - prev.neto_cash_flow) / prev.neto_cash_flow) * 100)
        : undefined
    return {
      mesec: r.mesec,
      godina: r.godina,
      ukupno_cash: Number(r.ukupno_cash ?? 0),
      dugovanja_dobavljaci: Number(r.dugovanja_dobavljaci ?? 0),
      neto_cash_flow: Number(r.neto_cash_flow ?? 0),
      promena_percent: promena,
    }
  })
  const chartData = [...tableRows].reverse().map((s) => ({
    label: `${MESECI[s.mesec]} ${String(s.godina).slice(-2)}`,
    cash: s.ukupno_cash,
    dugovanja: s.dugovanja_dobavljaci,
    neto: s.neto_cash_flow,
  }))
  const cashAktiva = tableRows[0]?.ukupno_cash ?? 0
  const dugovanja = tableRows[0]?.dugovanja_dobavljaci ?? 0
  const neto = tableRows[0]?.neto_cash_flow ?? 0
  const prosekMesečno =
    tableRows.length > 0
      ? tableRows.reduce((s, r) => s + r.neto_cash_flow, 0) / tableRows.length
      : 0
  const ytdNeto = tableRows.reduce((s, r) => s + r.neto_cash_flow, 0)
  return {
    metrics: { cashAktiva, dugovanja, neto, prosekMesečno, ytdNeto },
    chartData,
    tableRows,
  }
}

export type AnalitikaProizvodnjaParams = { period?: string; smena?: string }
export type DailyProdRow = {
  datum: string
  broj_naloga: number
  pikant: number
  bbq: number
  ukupno: number
  smena?: string
}

export async function getAnalitikaProizvodnja(
  params: AnalitikaProizvodnjaParams
): Promise<{
  metrics: { ukupnoKg: number; prosekDnevno: number; pikantTotal: number; bbqTotal: number; brojNaloga: number }
  dailyData: DailyProdRow[]
  byShift: { I: number; II: number }
  byWorker: Array<{ name: string; kg: number }>
}> {
  const period = params.period ? parseInt(params.period, 10) : 30
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - period)
  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)
  const supabase = await createClient()
  let query = supabase
    .from("work_orders")
    .select(
      `
      datum,
      smena,
      pakovanje (
        pikant_15kg, pikant_1kg, pikant_200g, pikant_150g, pikant_80g,
        bbq_15kg, bbq_1kg, bbq_200g, bbq_150g, bbq_80g,
        radnik:employees(ime, prezime)
      )
    `
    )
    .gte("datum", startStr)
    .lte("datum", endStr)
    .order("datum", { ascending: false })
  if (params.smena && params.smena !== "sve") {
    query = query.eq("smena", params.smena)
  }
  const { data } = await query
  const list = (data ?? []) as Array<{
    datum: string
    smena: string
    pakovanje: Array<{
      pikant_15kg?: number | null
      pikant_1kg?: number | null
      pikant_200g?: number | null
      pikant_150g?: number | null
      pikant_80g?: number | null
      bbq_15kg?: number | null
      bbq_1kg?: number | null
      bbq_200g?: number | null
      bbq_150g?: number | null
      bbq_80g?: number | null
      radnik?: { ime?: string; prezime?: string } | null
    }> | null
  }>
  const dailyMap = new Map<string, { pikant: number; bbq: number; ukupno: number; count: number }>()
  const workerMap = new Map<string, number>()
  let shiftI = 0
  let shiftII = 0
  for (const row of list) {
    const pak = firstRow(row.pakovanje)
    const t = calculateTotalKg(pak ?? null)
    const key = row.datum
    const existing = dailyMap.get(key)
    if (existing) {
      existing.pikant += t.pikant
      existing.bbq += t.bbq
      existing.ukupno += t.ukupno
      existing.count += 1
    } else {
      dailyMap.set(key, { pikant: t.pikant, bbq: t.bbq, ukupno: t.ukupno, count: 1 })
    }
    if (row.smena === "I") shiftI += 1
    else if (row.smena === "II") shiftII += 1
    const name = pak?.radnik
      ? `${String(pak.radnik.ime ?? "").trim()} ${String(pak.radnik.prezime ?? "").trim()}`.trim()
      : "Nepoznat"
    workerMap.set(name, (workerMap.get(name) ?? 0) + t.ukupno)
  }
  const dailyData: DailyProdRow[] = Array.from(dailyMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([datum, v]) => ({
      datum,
      broj_naloga: v.count,
      pikant: Math.round(v.pikant * 10) / 10,
      bbq: Math.round(v.bbq * 10) / 10,
      ukupno: Math.round(v.ukupno * 10) / 10,
    }))
  const totalKg = dailyData.reduce((s, d) => s + d.ukupno, 0)
  const byWorker = Array.from(workerMap.entries())
    .map(([name, kg]) => ({ name, kg: Math.round(kg * 10) / 10 }))
    .sort((a, b) => b.kg - a.kg)
    .slice(0, 5)
  return {
    metrics: {
      ukupnoKg: Math.round(totalKg * 10) / 10,
      prosekDnevno: dailyData.length > 0 ? Math.round((totalKg / dailyData.length) * 10) / 10 : 0,
      pikantTotal: Math.round(dailyData.reduce((s, d) => s + d.pikant, 0) * 10) / 10,
      bbqTotal: Math.round(dailyData.reduce((s, d) => s + d.bbq, 0) * 10) / 10,
      brojNaloga: list.length,
    },
    dailyData,
    byShift: { I: shiftI, II: shiftII },
    byWorker,
  }
}

export type AnalitikaRadniNaloziParams = { godina?: string; mesec?: string; smena?: string }
export type NalogTableRow = {
  id: string
  broj_naloga: string
  datum: string
  smena: string
  radnici: string
  proizvodnja_kg: number
  draziranje?: number
}

export type DraziranjePoRadniku = {
  name: string
  ukupnoDraziranja: number
  prosekDnevno: number
}

export async function getAnalitikaRadniNalozi(
  params: AnalitikaRadniNaloziParams
): Promise<{
  metrics: { ukupnoNaloga: number; prosekDnevno: number }
  tableRows: NalogTableRow[]
  bySupplier: Map<string, number>
  byWorkerDraziranje: DraziranjePoRadniku[]
  daysInPeriod: number
}> {
  const godina = params.godina ? parseInt(params.godina, 10) : new Date().getFullYear()
  const mesec =
    params.mesec && params.mesec !== "all" ? parseInt(params.mesec, 10) : undefined
  const start = mesec ? new Date(godina, mesec - 1, 1) : new Date(godina, 0, 1)
  const end = mesec ? new Date(godina, mesec, 0) : new Date(godina, 11, 31)
  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)
  const daysInPeriod = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1)
  const supabase = await createClient()
  let query = supabase
    .from("work_orders")
    .select(
      `
      id,
      broj_naloga,
      datum,
      smena,
      work_order_employees(employee:employees(ime, prezime)),
      draziranje(broj_draziranja, dobavljac, radnik:employees(ime, prezime)),
      pakovanje(pikant_15kg, pikant_1kg, pikant_200g, pikant_150g, pikant_80g, bbq_15kg, bbq_1kg, bbq_200g, bbq_150g, bbq_80g)
    `
    )
    .gte("datum", startStr)
    .lte("datum", endStr)
    .order("datum", { ascending: false })
    .order("broj_naloga", { ascending: false })
  if (params.smena && params.smena !== "sve") {
    query = query.eq("smena", params.smena)
  }
  const { data } = await query
  const list = (data ?? []) as Array<{
    id: string
    broj_naloga: string
    datum: string
    smena: string
    work_order_employees: Array<{ employee: { ime: string; prezime: string } | null }>
    draziranje: Array<{
      broj_draziranja: number
      dobavljac: string
      radnik: { ime: string; prezime: string } | null
    }>
    pakovanje: Array<Record<string, number | null>>
  }>
  const bySupplier = new Map<string, number>()
  const draziranjeByWorker = new Map<string, number>()
  const tableRows: NalogTableRow[] = list.map((row) => {
    const dr = firstRow(row.draziranje)
    if (dr?.dobavljac) bySupplier.set(dr.dobavljac, (bySupplier.get(dr.dobavljac) ?? 0) + 1)
    const radnikName = dr?.radnik
      ? `${String(dr.radnik.ime ?? "").trim()} ${String(dr.radnik.prezime ?? "").trim()}`.trim()
      : ""
    if (radnikName && dr.broj_draziranja != null) {
      draziranjeByWorker.set(radnikName, (draziranjeByWorker.get(radnikName) ?? 0) + Number(dr.broj_draziranja))
    }
    const pak = firstRow(row.pakovanje)
    const t = calculateTotalKg(pak ?? null)
    const radnici = (row.work_order_employees ?? [])
      .map((e) => e.employee && `${e.employee.ime} ${e.employee.prezime}`)
      .filter(Boolean)
      .join(", ")
    return {
      id: row.id,
      broj_naloga: row.broj_naloga,
      datum: row.datum,
      smena: row.smena,
      radnici: radnici || "—",
      proizvodnja_kg: t.ukupno,
      draziranje: (dr?.broj_draziranja as number) ?? undefined,
    }
  })
  const byWorkerDraziranje: DraziranjePoRadniku[] = Array.from(draziranjeByWorker.entries())
    .map(([name, ukupno]) => ({
      name,
      ukupnoDraziranja: ukupno,
      prosekDnevno: Math.round((ukupno / daysInPeriod) * 10) / 10,
    }))
    .sort((a, b) => b.prosekDnevno - a.prosekDnevno)
  return {
    metrics: {
      ukupnoNaloga: list.length,
      prosekDnevno: Math.round((list.length / daysInPeriod) * 10) / 10,
    },
    tableRows,
    bySupplier,
    byWorkerDraziranje,
    daysInPeriod,
  }
}
