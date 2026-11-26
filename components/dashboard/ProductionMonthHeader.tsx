import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { DashboardProductionMonth } from "@/lib/dashboard/data"

const MESECI_PUNI = [
  "", "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
]

/** Zaglavlje grafikona "Proizvodnja po danu": mesec sa strelicama i prosek po radnom danu. */
export function ProductionMonthHeader({ month }: { month: DashboardProductionMonth }) {
  const prevMesec = month.mesec === 1 ? 12 : month.mesec - 1
  const strelica =
    "flex h-7 w-7 items-center justify-center rounded-md border border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6]"

  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-[#111827]">Proizvodnja po danu</h2>
        <div className="mt-1 flex items-center gap-2">
          <Link
            href={`/dashboard?mesec=${month.prevKey}`}
            scroll={false}
            className={strelica}
            aria-label="Prethodni mesec"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-[120px] text-center text-sm font-medium text-[#374151]">
            {MESECI_PUNI[month.mesec]} {month.godina}
          </span>
          {month.nextKey ? (
            <Link
              href={`/dashboard?mesec=${month.nextKey}`}
              scroll={false}
              className={strelica}
              aria-label="Sledeći mesec"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className={`${strelica} cursor-not-allowed opacity-40`} aria-hidden>
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-[#6B7280]">Pikant + BBQ (kg)</p>
      </div>

      <div className="text-right">
        <p className="text-xs text-[#6B7280]">Prosek po radnom danu</p>
        <p className="text-xl font-bold text-[#111827]">
          {month.radnihDana > 0 ? `${month.prosekDnevno.toLocaleString("sr-RS")} kg` : "—"}
        </p>
        {month.razlika ? (
          <p className={`text-xs font-medium ${month.razlika.isPositive ? "text-[#059669]" : "text-[#DC2626]"}`}>
            {month.razlika.value >= 0 ? "+" : "−"}
            {Math.abs(month.razlika.value).toLocaleString("sr-RS")} kg ({month.razlika.percentage >= 0 ? "+" : "−"}
            {Math.abs(month.razlika.percentage)}%) u odnosu na {MESECI_PUNI[prevMesec].toLowerCase()}
          </p>
        ) : (
          <p className="text-xs text-[#9CA3AF]">Nema podataka za {MESECI_PUNI[prevMesec].toLowerCase()}</p>
        )}
        <p className="text-xs text-[#9CA3AF]">{month.radnihDana} radnih dana</p>
      </div>
    </div>
  )
}
