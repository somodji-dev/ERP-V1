import Link from "next/link"
import { getCurrentUser } from "@/lib/auth/user"
import { getUserPermissions, canViewModule, canEdit } from "@/lib/auth/permissions"
import { redirect } from "next/navigation"
import { listUsers } from "@/app/actions/users"
import { KorisniciListClient } from "@/components/podesavanja/KorisniciListClient"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function KorisniciPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const permissions = await getUserPermissions(user.id)
  if (!canViewModule(permissions, "podesavanja")) redirect("/dashboard")

  const users = await listUsers()
  const canEditUsers = canEdit(permissions, "podesavanja")

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/podesavanja"
          className="text-sm text-[#6B7280] hover:text-[#111827]"
          aria-label="Nazad na Podešavanja"
        >
          ← Podešavanja
        </Link>
      </div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Korisnici</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Lista korisnika i upravljanje pravima pristupa po modulima.
          </p>
        </div>
        {canEditUsers && (
          <Button asChild className="shrink-0 bg-[#2563EB] hover:bg-[#1D4ED8]">
            <Link href="/podesavanja/korisnici/novi">+ Novi korisnik</Link>
          </Button>
        )}
      </div>
      <KorisniciListClient users={users} canEdit={canEditUsers} />
    </div>
  )
}
