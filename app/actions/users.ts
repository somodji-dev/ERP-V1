"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth/user"
import { getUserPermissions, canEdit, canViewModule } from "@/lib/auth/permissions"
import { redirect } from "next/navigation"
import type { ModulName } from "@/lib/types/auth"

const MODULI: ModulName[] = ["dashboard", "radnici", "cashflow", "proizvodnja", "podesavanja"]

const INTERNAL_EMAIL_DOMAIN = "@internal.erp"

function requirePodesavanjaView() {
  return async () => {
    const user = await getCurrentUser()
    if (!user) redirect("/login")
    const permissions = await getUserPermissions(user.id)
    if (!canViewModule(permissions, "podesavanja")) {
      redirect("/dashboard")
    }
    return user
  }
}

function requirePodesavanjaEdit() {
  return async () => {
    const user = await getCurrentUser()
    if (!user) redirect("/login")
    const permissions = await getUserPermissions(user.id)
    if (!canEdit(permissions, "podesavanja")) {
      throw new Error("Nemate pravo da upravljate korisnicima.")
    }
    return user
  }
}

/** Doda redove u user_roles i user_permissions za auth korisnike koji ih nemaju (npr. kreirani kad je insert pao). */
async function syncMissingUserRoles(admin: ReturnType<typeof createAdminClient>) {
  const { data: authList } = await admin.auth.admin.listUsers({ per_page: 1000 })
  const authUsers = authList?.users ?? []
  if (authUsers.length === 0) return

  const { data: existingRoles } = await admin
    .from("user_roles")
    .select("user_id")
  const existingIds = new Set((existingRoles ?? []).map((r) => r.user_id))

  for (const u of authUsers) {
    if (!u.id || existingIds.has(u.id)) continue
    const email = u.email ?? ""
    const username = email.replace(/@internal\.erp$/i, "").trim() || "korisnik"
    const displayName = username
    const { error: roleErr } = await admin.from("user_roles").insert({
      user_id: u.id,
      username,
      display_name: displayName,
      aktivan: true,
    })
    if (roleErr) continue
    existingIds.add(u.id)
    const perms = MODULI.map((modul) => ({
      user_id: u.id,
      modul,
      view: false,
      create: false,
      edit: false,
      delete: false,
    }))
    await admin.from("user_permissions").insert(perms)
  }
}

/** Lista svih korisnika (user_roles) sa brojem modula gde imaju view. */
export async function listUsers() {
  await requirePodesavanjaEdit()()
  const admin = createAdminClient()
  await syncMissingUserRoles(admin)
  const { data: roles, error: rolesError } = await admin
    .from("user_roles")
    .select("id, user_id, username, display_name, aktivan, created_at, last_login")
    .order("display_name", { ascending: true })

  if (rolesError) throw new Error(rolesError.message)
  if (!roles?.length) return []

  const { data: perms } = await admin
    .from("user_permissions")
    .select("user_id, modul, view")
    .in("user_id", roles.map((r) => r.user_id))

  const viewCountByUser = new Map<string, number>()
  perms?.forEach((p) => {
    if (p.view) {
      viewCountByUser.set(p.user_id, (viewCountByUser.get(p.user_id) ?? 0) + 1)
    }
  })

  return roles.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    username: r.username,
    display_name: r.display_name,
    aktivan: r.aktivan ?? true,
    created_at: r.created_at,
    last_login: r.last_login,
    module_count: viewCountByUser.get(r.user_id) ?? 0,
  }))
}

/** Jedan korisnik (user_roles red) po user_id. Dozvoljeno i sa samo view na podesavanja. */
export async function getUserRoleByUserId(userId: string) {
  await requirePodesavanjaView()()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("user_roles")
    .select("id, user_id, username, display_name, aktivan, created_at, last_login")
    .eq("user_id", userId)
    .single()
  if (error || !data) return null
  return data
}

/** Prava za jednog korisnika (za formu / matricu). */
export async function getUserPermissionsForAdmin(userId: string) {
  await requirePodesavanjaEdit()()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("user_permissions")
    .select('id, user_id, modul, view, "create", edit, "delete"')
    .eq("user_id", userId)
    .order("modul")

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    modul: row.modul as ModulName,
    view: (row as { view?: boolean }).view ?? false,
    create: (row as { create?: boolean }).create ?? false,
    edit: row.edit ?? false,
    delete: (row as { delete?: boolean }).delete ?? false,
  }))
}

export type CreateUserInput = {
  username: string
  display_name: string
  password: string
}

/** Kreira novog korisnika u Auth + user_roles + podrazumevana prazna prava u user_permissions. */
export async function createUserAction(input: CreateUserInput) {
  await requirePodesavanjaEdit()()
  const email = `${input.username.trim()}${INTERNAL_EMAIL_DOMAIN}`
  const admin = createAdminClient()
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
  })
  if (authError) throw new Error(authError.message)
  if (!authData.user) throw new Error("Korisnik nije kreiran.")

  // Insert preko admin klijenta da zaobiđe RLS (prava smo već proverili gore)
  const { error: roleError } = await admin.from("user_roles").insert({
    user_id: authData.user.id,
    username: input.username.trim(),
    display_name: input.display_name.trim(),
    aktivan: true,
  })
  if (roleError) throw new Error(roleError.message)

  const perms = MODULI.map((modul) => ({
    user_id: authData.user!.id,
    modul,
    view: false,
    create: false,
    edit: false,
    delete: false,
  }))
  const { error: permError } = await admin.from("user_permissions").insert(perms)
  if (permError) throw new Error(permError.message)

  return { userId: authData.user.id }
}

export type PermissionRow = {
  modul: ModulName
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
}

/** Snimi prava za korisnika (briše stara, ubacuje nova). */
export async function saveUserPermissionsAction(userId: string, permissions: PermissionRow[]) {
  await requirePodesavanjaEdit()()
  const admin = createAdminClient()
  const { error: delError } = await admin.from("user_permissions").delete().eq("user_id", userId)
  if (delError) throw new Error(delError.message)

  const rows = permissions.map((p) => ({
    user_id: userId,
    modul: p.modul,
    view: p.view,
    create: p.create,
    edit: p.edit,
    delete: p.delete,
  }))
  const { error: insError } = await admin.from("user_permissions").insert(rows)
  if (insError) throw new Error(insError.message)
}

/** Aktiviraj / deaktiviraj korisnika (soft). */
export async function setUserActiveAction(userId: string, aktivan: boolean) {
  await requirePodesavanjaEdit()()
  const admin = createAdminClient()
  const { error } = await admin.from("user_roles").update({ aktivan }).eq("user_id", userId)
  if (error) throw new Error(error.message)
}

/** Reset lozinke (zahteva service role). */
export async function resetUserPasswordAction(userId: string, newPassword: string) {
  await requirePodesavanjaEdit()()
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword })
  if (error) throw new Error(error.message)
}

/** Ažuriraj display_name (i opciono username) u user_roles. */
export async function updateUserRoleAction(
  userId: string,
  data: { display_name?: string; username?: string }
) {
  await requirePodesavanjaEdit()()
  const admin = createAdminClient()
  const payload: { display_name?: string; username?: string } = {}
  if (data.display_name !== undefined) payload.display_name = data.display_name.trim()
  if (data.username !== undefined) payload.username = data.username.trim()
  if (Object.keys(payload).length === 0) return
  const { error } = await admin.from("user_roles").update(payload).eq("user_id", userId)
  if (error) throw new Error(error.message)
}
