import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/user"
import { getUserPermissions, canViewModule, getFirstAllowedRoute } from "@/lib/auth/permissions"
import { getDashboardData } from "@/lib/dashboard/data"
import { KPICard } from "@/components/dashboard/KPICard"
import { DashboardCashFlowChart } from "@/components/dashboard/DashboardCashFlowChart"
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
          subtitle={data.proizvodnja ? `Prosek dnevno (${data.proizvodnja.daysInPeriod} dana)` : "Nema podataka"}
          icon={<Package className="h-5 w-5" />}
          href="/analitika/proizvodnja"
        />
        <KPICard
          title="Radni nalozi"
          value={data.radniNalozi?.count ?? 0}
          change={data.radniNalozi?.change ?? undefined}
          subtitle={data.radniNalozi ? `${MESECI[data.radniNalozi.mesec]} ${data.radniNalozi.godina}` : "Ovaj mesec"}
          icon={<ClipboardList className="h-5 w-5" />}
          href="/analitika/radni-nalozi"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#111827]">Cash Flow trend</h2>
          <p className="mb-4 text-sm text-[#6B7280]">Poslednjih 12 meseci — Cash, Dugovanja, Neto</p>
          <DashboardCashFlowChart data={data.chartCashFlow} />
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#111827]">Dnevna proizvodnja</h2>
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
