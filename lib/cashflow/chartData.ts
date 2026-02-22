/**
 * Priprema podataka za Cash Flow grafikon (Recharts).
 */

const MESECI = [
  "", "Jan", "Feb", "Mar", "Apr", "Maj", "Jun",
  "Jul", "Avg", "Sep", "Okt", "Nov", "Dec",
]

export type ChartPoint = {
  label: string
  cash: number
  dugovanja: number
  neto: number
}

export function prepareChartData(
  snapshots: Array<{
    mesec: number
    godina: number
    ukupno_cash: number
    dugovanja_dobavljaci: number
    neto_cash_flow: number
  }>
): ChartPoint[] {
  return snapshots.map((s) => ({
    label: `${MESECI[s.mesec]} ${String(s.godina).slice(-2)}`,
    cash: s.ukupno_cash,
    dugovanja: s.dugovanja_dobavljaci,
    neto: s.neto_cash_flow,
  }))
}
