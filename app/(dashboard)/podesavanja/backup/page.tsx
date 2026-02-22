import Link from "next/link"
import { getCurrentUser } from "@/lib/auth/user"
import { getUserPermissions, canViewModule } from "@/lib/auth/permissions"
import { redirect } from "next/navigation"

export default async function BackupPage() {
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
        <h1 className="text-xl font-bold text-[#111827]">Backup</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Preuzimanje backup-a podataka. (U izradi.)
        </p>
      </div>
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <p className="text-sm text-[#6B7280]">
          Dugme za preuzimanje backup-a (JSON ili ZIP) biće dodato u narednoj iteraciji.
        </p>
      </div>
    </div>
  )
}
