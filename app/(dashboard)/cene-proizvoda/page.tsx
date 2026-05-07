import { CeneProizvodaListClient } from "@/components/financials/CeneProizvodaListClient"
import { getProizvodi } from "@/app/actions/proizvodi"

export default async function CeneProizvodaPage() {
  const proizvodi = await getProizvodi()
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111827]">Proračun cene proizvoda</h1>
        <p className="text-sm text-[#6B7280]">
          Izračun proizvodne cene po proizvodu: sirovine, radna snaga, prevoz, ambalaža
        </p>
      </div>
      <CeneProizvodaListClient initialProizvodi={proizvodi} />
    </div>
  )
}
