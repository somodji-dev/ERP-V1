import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/user"
import { getUserPermissions, canEdit } from "@/lib/auth/permissions"
import {
  getRawMaterials,
  getLatestInventoryCount,
  getInventoryCountItems,
  getInventoryCounts,
} from "@/app/actions/inventory"
import { PopisSirovinaClient } from "@/components/inventory/PopisSirovinaClient"
import type { InventoryRow } from "@/lib/types/inventory"

export default async function SirovinePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const permissions = await getUserPermissions(user.id)
  const canEditMaterials = canEdit(permissions, "proizvodnja")

  const [materials, latestCount, allCounts] = await Promise.all([
    getRawMaterials(),
    getLatestInventoryCount(),
    getInventoryCounts(),
  ])

  // Učitaj stavke poslednjeg popisa (ako postoji)
  let items: { raw_material_id: string; kolicina: number; iznad_minimuma: boolean }[] = []
  if (latestCount) {
    items = await getInventoryCountItems(latestCount.id)
  }
  const itemMap = new Map(items.map((i) => [i.raw_material_id, i]))

  const rows: InventoryRow[] = materials.map((m) => {
    const item = itemMap.get(m.id)
    const kolicina = item ? Number(item.kolicina) : 0
    const iznadMinimuma = item?.iznad_minimuma ?? false
    return {
      ...m,
      kolicina,
      iznad_minimuma: iznadMinimuma,
      ispod_minimuma: !iznadMinimuma && kolicina < Number(m.min_kolicina),
    }
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111827]">Popis sirovina</h1>
        <p className="text-sm text-[#6B7280]">
          {latestCount
            ? `Poslednji popis: ${new Date(latestCount.datum).toLocaleDateString("sr-RS")}`
            : "Nema popisa. Kreirajte prvi popis."}
        </p>
      </div>
      <PopisSirovinaClient
        rows={rows}
        materials={materials}
        latestCountDate={latestCount?.datum ?? null}
        countsCount={allCounts.length}
        canEditMaterials={canEditMaterials}
      />
    </div>
  )
}
