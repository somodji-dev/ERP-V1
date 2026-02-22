import { createClient } from "@/lib/supabase/server"
import type { UserPermission } from "@/lib/types/auth"

/**
 * Učitava prava za korisnika iz user_permissions.
 * Kolone "create" i "delete" u bazi; Supabase ih vraća kao create i delete u JSON.
 */
export async function getUserPermissions(
  userId: string
): Promise<UserPermission[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("user_permissions")
    .select('id, user_id, modul, view, "create", edit, "delete"')
    .eq("user_id", userId)
    .order("modul")

  if (error) return []
  if (!data?.length) return []

  return data.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    modul: row.modul as UserPermission["modul"],
    view: row.view ?? false,
    create: (row as { create?: boolean }).create ?? false,
    edit: row.edit ?? false,
    delete: (row as { delete?: boolean }).delete ?? false,
  }))
}

export function canViewModule(
  permissions: UserPermission[],
  modulName: string
): boolean {
  const perm = permissions.find((p) => p.modul === modulName)
  return perm?.view === true
}

export function canCreate(
  permissions: UserPermission[],
  modulName: string
): boolean {
  const perm = permissions.find((p) => p.modul === modulName)
  return perm?.create === true
}

export function canEdit(
  permissions: UserPermission[],
  modulName: string
): boolean {
  const perm = permissions.find((p) => p.modul === modulName)
  return perm?.edit === true
}

export function canDelete(
  permissions: UserPermission[],
  modulName: string
): boolean {
  const perm = permissions.find((p) => p.modul === modulName)
  return perm?.delete === true
}
