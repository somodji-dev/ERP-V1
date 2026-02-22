import { getCurrentUser } from "@/lib/auth/user"
import { getUserPermissions, canViewModule } from "@/lib/auth/permissions"
import { redirect } from "next/navigation"
import { SettingsCard } from "@/components/podesavanja/SettingsCard"
import { Users, Building2, Database, Activity } from "lucide-react"

export default async function PodesavanjaPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const permissions = await getUserPermissions(user.id)
  if (!canViewModule(permissions, "podesavanja")) redirect("/dashboard")

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111827]">Podešavanja</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Korisnici, podaci firme, backup i log aktivnosti.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <SettingsCard
          title="Korisnici"
          description="Upravljanje korisnicima i pravima pristupa po modulima."
          href="/podesavanja/korisnici"
          icon={<Users className="h-6 w-6" />}
        />
        <SettingsCard
          title="Podaci firme"
          description="Naziv, PIB, adresa i ostali podaci o firmi."
          href="/podesavanja/firma"
          icon={<Building2 className="h-6 w-6" />}
        />
        <SettingsCard
          title="Backup"
          description="Preuzimanje backup-a podataka (export)."
          href="/podesavanja/backup"
          icon={<Database className="h-6 w-6" />}
        />
        <SettingsCard
          title="Log aktivnosti"
          description="Pregled aktivnosti korisnika u sistemu."
          href="/podesavanja/log"
          icon={<Activity className="h-6 w-6" />}
        />
      </div>
    </div>
  )
}
