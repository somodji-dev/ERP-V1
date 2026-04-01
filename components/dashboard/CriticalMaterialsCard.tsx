import Link from "next/link"
import { AlertTriangle, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils/cn"

export type CriticalMaterial = {
  naziv: string
  kolicina: number
  min_kolicina: number
  jedinica: string
  iznad_minimuma: boolean
}

export function CriticalMaterialsCard({
  materials,
  totalIspod,
  hasInventory,
}: {
  materials: CriticalMaterial[]
  totalIspod: number
  hasInventory: boolean
}) {
  return (
    <Link
      href="/proizvodnja/sirovine"
      className="block rounded-xl border-2 border-[#E5E7EB] bg-white p-6 shadow-sm transition-all duration-200 hover:border-[#2563EB] hover:shadow-md cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm text-[#6B7280]">Kritične sirovine</span>
        <AlertTriangle className={cn("h-5 w-5", totalIspod > 0 ? "text-[#DC2626]" : "text-[#9CA3AF]")} />
      </div>

      {!hasInventory ? (
        <>
          <p className="text-2xl font-extrabold text-[#6B7280]">Nema popisa</p>
          <p className="text-sm text-[#6B7280] mt-2">Kreirajte prvi popis sirovina</p>
        </>
      ) : totalIspod > 0 ? (
        <>
          <p className="text-2xl font-extrabold text-[#DC2626]">
            {totalIspod} ispod minimuma
          </p>
          <div className="mt-3 space-y-1.5">
            {materials.map((m, i) => {
              const razlika = m.kolicina - m.min_kolicina
              return (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm rounded-md bg-[#FEF2F2] px-2.5 py-1.5"
                >
                  <span className="text-[#DC2626] font-medium truncate mr-2">{m.naziv}</span>
                  <span className="text-[#DC2626] tabular-nums whitespace-nowrap">
                    {razlika.toLocaleString("sr-RS")} {m.jedinica}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <p className="text-2xl font-extrabold text-[#16A34A]">Sve OK</p>
          <p className="text-sm text-[#6B7280] mt-2">Sve sirovine su iznad minimuma</p>
        </>
      )}

      <p className="text-xs text-[#2563EB] mt-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        Pogledaj popis
        <ChevronRight className="h-3 w-3" />
      </p>
    </Link>
  )
}
