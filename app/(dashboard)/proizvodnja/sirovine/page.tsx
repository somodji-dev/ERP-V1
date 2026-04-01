import {
  getRawMaterials,
  getLatestInventoryCount,
  getInventoryCountItems,
  getInventoryCounts,
} from "@/app/actions/inventory"
import { PopisSirovinaClient } from "@/components/inventory/PopisSirovinaClient"
import type { InventoryRow } from "@/lib/types/inventory"

export default async function SirovinePage() {
  const [materials, latestCount, allCounts] = await Promise.all([
    getRawMaterials(),
    getLatestInventoryCount(),
    getInventoryCounts(),
  ])

  // Učitaj stavke poslednjeg popisa (ako postoji)
  let items: { raw_material_id: string; kolicina: number }[] = []
  if (latestCount) {
    items = await getInventoryCountItems(latestCount.id)
  }
  const itemMap = new Map(items.map((i) => [i.raw_material_id, Number(i.kolicina)]))

  const rows: InventoryRow[] = materials.map((m) => {
    const kolicina = itemMap.get(m.id) ?? 0
    return {
      ...m,
      kolicina,
      ispod_minimuma: kolicina < Number(m.min_kolicina),
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
      />
    </div>
  )
}
