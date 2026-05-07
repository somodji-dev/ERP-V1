import { getMaterijaliCene } from "@/app/actions/materijali-cene"
import { CeneSirovinaClient } from "@/components/financials/CeneSirovinaClient"

export default async function CeneSirovinaPage() {
  const materijali = await getMaterijaliCene()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111827]">Cene sirovina</h1>
        <p className="text-sm text-[#6B7280]">
          Baza materijala sa cenama — sirovine, ambalaža i ostalo što direktno učestvuje u proizvodu
        </p>
      </div>
      <CeneSirovinaClient initialData={materijali} />
    </div>
  )
}
