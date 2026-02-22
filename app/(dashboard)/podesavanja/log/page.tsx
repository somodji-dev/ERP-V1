import Link from "next/link"
import { getCurrentUser } from "@/lib/auth/user"
import { getUserPermissions, canViewModule } from "@/lib/auth/permissions"
import { redirect } from "next/navigation"

export default async function LogPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const permissions = await getUserPermissions(user.id)
  if (!canViewModule(permissions, "podesavanja")) redirect("/dashboard")

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/podesavanja"
          className="text-sm text-[#6B7280] hover:text-[#111827]"
          aria-label="Nazad na Podešavanja"
        >
          ← Podešavanja
        </Link>
      </div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111827]">Log aktivnosti</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Pregled aktivnosti korisnika u sistemu. (U izradi.)
        </p>
      </div>
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <p className="text-sm text-[#6B7280]">
          Tabela sa filterima (datum, korisnik, modul, akcija) biće dodata u narednoj iteraciji.
        </p>
      </div>
    </div>
  )
}
