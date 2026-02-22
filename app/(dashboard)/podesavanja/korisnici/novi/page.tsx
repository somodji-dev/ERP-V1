import Link from "next/link"
import { getCurrentUser } from "@/lib/auth/user"
import { getUserPermissions, canViewModule, canEdit } from "@/lib/auth/permissions"
import { redirect } from "next/navigation"
import { NewUserForm } from "@/components/podesavanja/NewUserForm"

export default async function KorisniciNoviPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const permissions = await getUserPermissions(user.id)
  if (!canViewModule(permissions, "podesavanja")) redirect("/dashboard")
  if (!canEdit(permissions, "podesavanja")) redirect("/podesavanja/korisnici")

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/podesavanja/korisnici"
          className="text-sm text-[#6B7280] hover:text-[#111827]"
          aria-label="Nazad na Korisnici"
        >
          ← Korisnici
        </Link>
      </div>
      <NewUserForm />
    </div>
  )
}
