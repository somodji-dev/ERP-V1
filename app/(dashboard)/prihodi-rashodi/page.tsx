import { getFinancials, getFinancialYears } from "@/app/actions/financials"
import { PrihodiRashodiClient } from "@/components/financials/PrihodiRashodiClient"

export default async function PrihodiRashodiPage({
  searchParams,
}: {
  searchParams: Promise<{ godina?: string }>
}) {
  const params = await searchParams
  const currentYear = new Date().getFullYear()
  const godina = params.godina ? Number(params.godina) : currentYear

  const [data, years] = await Promise.all([
    getFinancials(godina),
    getFinancialYears(),
  ])

  // Dodaj tekuću godinu u listu ako ne postoji
  const allYears = years.includes(currentYear) ? years : [currentYear, ...years]
  // Dodaj odabranu godinu ako ne postoji
  const finalYears = allYears.includes(godina) ? allYears : [godina, ...allYears]
  finalYears.sort((a, b) => b - a)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111827]">Prihodi i Rashodi</h1>
        <p className="text-sm text-[#6B7280]">Mesečni pregled prihoda, rashoda i bruto profita</p>
      </div>
      <PrihodiRashodiClient
        initialData={data}
        godina={godina}
        availableYears={finalYears}
      />
    </div>
  )
}
