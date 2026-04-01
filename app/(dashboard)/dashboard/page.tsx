import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/user"
import { getUserPermissions, canViewModule, getFirstAllowedRoute } from "@/lib/auth/permissions"
import { getDashboardData } from "@/lib/dashboard/data"
import { getRawMaterials, getLatestInventoryCount, getInventoryCountItems } from "@/app/actions/inventory"
import { KPICard } from "@/components/dashboard/KPICard"
import { CriticalMaterialsCard } from "@/components/dashboard/CriticalMaterialsCard"
import type { CriticalMaterial } from "@/components/dashboard/CriticalMaterialsCard"
import { CashFlowChartWithRange } from "@/components/cashflow/CashFlowChartWithRange"
import { ProductionChart } from "@/components/dashboard/ProductionChart"
import { RecentOrders } from "@/components/dashboard/RecentOrders"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { TrendingUp, Package, ClipboardList } from "lucide-react"

const MESECI = ["", "Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Avg", "Sep", "Okt", "Nov", "Dec"]

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const permissions = await getUserPermissions(user.id)
  if (!canViewModule(permissions, "dashboard")) {
    const firstRoute = getFirstAllowedRoute(permissions)
    if (firstRoute) redirect(firstRoute)
    return (
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-[#111827]">Nema pristupa</h2>
        <p className="mt-2 text-sm text-[#6B7280]">
          Nemate pristup nijednom modulu. Kontaktirajte administratora da vam dodeli prava.
        </p>
      </div>
    )
  }

  const data = await getDashboardData()
  const dailySorted = data.dailyProductionChart
  const avgLine =
    dailySorted.length > 0 ? dailySorted.reduce((s, d) => s + d.ukupno, 0) / dailySorted.length : undefined

  // Kritične sirovine za dashboard karticu
  const [allMaterials, latestCount] = await Promise.all([
    getRawMaterials(),
    getLatestInventoryCount(),
  ])
  let criticalMaterials: CriticalMaterial[] = []
  let totalIspod = 0
  if (latestCount) {
    const countItems = await getInventoryCountItems(latestCount.id)
    const itemMap = new Map(countItems.map((i) => [i.raw_material_id, i]))
    const ispod: CriticalMaterial[] = []
    for (const m of allMaterials) {
      const item = itemMap.get(m.id)
      const iznadMinimuma = item?.iznad_minimuma ?? false
      const kolicina = item ? Number(item.kolicina) : 0
      if (!iznadMinimuma && kolicina < Number(m.min_kolicina)) {
        ispod.push({
          naziv: m.naziv,
          kolicina,
          min_kolicina: Number(m.min_kolicina),
          jedinica: m.jedinica,
          iznad_minimuma: false,
        })
      }
    }
    // Sortiraj po razlici (najkritičniji prvi) i uzmi top 3
    ispod.sort((a, b) => (a.kolicina - a.min_kolicina) - (b.kolicina - b.min_kolicina))
    totalIspod = ispod.length
    criticalMaterials = ispod.slice(0, 3)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111827]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Pregled ključnih pokazatelja i trendova.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <KPICard
          title="Cash Flow Neto"
          value={data.cashFlow?.neto ?? 0}
          valuePrefix=""
          valueSuffix=" RSD"
          formatAsCurrency
          change={data.cashFlow?.change ?? undefined}
          subtitle={data.cashFlow ? `${MESECI[data.cashFlow.mesec]} ${data.cashFlow.godina}` : "Nema snimaka"}
          icon={<TrendingUp className="h-5 w-5" />}
          href="/analitika/cash-flow"
        />
        <KPICard
          title="Proizvodnja"
          value={data.proizvodnja?.dailyAverage ?? 0}
          valueSuffix=" kg"
          change={data.proizvodnja?.change ?? undefined}
          subtitle={data.proizvodnja ? `Prosek po smeni (${data.proizvodnja.shiftsInPeriod} smena)` : "Nema podataka"}
          icon={<Package className="h-5 w-5" />}
          href="/analitika/proizvodnja"
        />
        <KPICard
          title="Radni nalozi analitika"
          value={data.radniNalozi?.count ?? 0}
          change={data.radniNalozi?.change ?? undefined}
          subtitle={data.radniNalozi ? `${MESECI[data.radniNalozi.mesec]} ${data.radniNalozi.godina}` : "Ovaj mesec"}
          icon={<ClipboardList className="h-5 w-5" />}
          href="/analitika/radni-nalozi"
        />
      </div>

      {/* Kritične sirovine kartica */}
      {canViewModule(permissions, "proizvodnja") && (
        <div className="mt-6">
          <CriticalMaterialsCard materials={criticalMaterials} totalIspod={totalIspod} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#111827]">Cash Flow trend</h2>
          <p className="mb-4 text-sm text-[#6B7280]">Izaberite period ispod grafikona (12 meseci, 5 godina ili Od–Do).</p>
          <CashFlowChartWithRange initialData={data.chartCashFlow} />
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#111827]">Proizvodnja po danu</h2>
          <p className="mb-4 text-sm text-[#6B7280]">Poslednjih 30 dana — Pikant + BBQ (kg)</p>
          <ProductionChart data={data.dailyProductionChart} averageLine={avgLine} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentOrders orders={data.recentOrders} />
        <QuickActions />
      </div>
    </div>
  )
}
