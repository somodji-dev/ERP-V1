import Link from "next/link"
import { getCurrentUser } from "@/lib/auth/user"
import { getUserPermissions, canViewModule, canEdit } from "@/lib/auth/permissions"
import { redirect } from "next/navigation"
import { getUserRoleByUserId, getUserPermissionsForAdmin } from "@/app/actions/users"
import { PermissionsMatrix } from "@/components/podesavanja/PermissionsMatrix"
import { format } from "date-fns"

export default async function KorisnikDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const permissions = await getUserPermissions(user.id)
  if (!canViewModule(permissions, "podesavanja")) redirect("/dashboard")

  const role = await getUserRoleByUserId(userId)
  if (!role) {
    redirect("/podesavanja/korisnici")
  }

  const canEditUsers = canEdit(permissions, "podesavanja")
  const permList = canEditUsers ? await getUserPermissionsForAdmin(userId) : []

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
      <div className="mb-6 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <h1 className="text-xl font-bold text-[#111827]">{role.display_name}</h1>
        <p className="text-sm text-[#6B7280]">@{role.username}</p>
        <div className="mt-2 flex items-center gap-4 text-xs text-[#9CA3AF]">
          <span>
            Status:{" "}
            <span
              className={
                role.aktivan
                  ? "font-medium text-[#16A34A]"
                  : "font-medium text-[#DC2626]"
              }
            >
              {role.aktivan ? "Aktivan" : "Neaktivan"}
            </span>
          </span>
          {role.last_login && (
            <span>
              Poslednja prijava:{" "}
              {format(new Date(role.last_login), "dd.MM.yyyy HH:mm")}
            </span>
          )}
        </div>
      </div>
      {canEditUsers ? (
        <PermissionsMatrix
          userId={userId}
          initialPermissions={permList.map((p) => ({
            modul: p.modul,
            view: p.view,
            create: p.create,
            edit: p.edit,
            delete: p.delete,
          }))}
        />
      ) : (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <p className="text-sm text-[#6B7280]">
            Nemate pravo da menjate prava ovog korisnika.
          </p>
        </div>
      )}
    </div>
  )
}
