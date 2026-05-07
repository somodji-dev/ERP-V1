import { getProizvodi } from "@/app/actions/proizvodi"
import { MigrateClient } from "@/components/MigrateClient"

export default async function MigratePage() {
  const existing = await getProizvodi()
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111827]">Migracija localStorage → Supabase</h1>
        <p className="text-sm text-[#6B7280]">
          Prebaci postojeće podatke iz browser-a u bazu. Pokreni jednom po browser-u.
        </p>
      </div>
      <MigrateClient existingProizvodi={existing} />
    </div>
  )
}
