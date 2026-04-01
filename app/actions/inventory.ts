"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import { getCurrentUser } from "@/lib/auth/user"
import { getUserPermissions, canEdit } from "@/lib/auth/permissions"
import type { RawMaterial, InventoryCount } from "@/lib/types/inventory"

/** Aktivni zaposleni za dropdown (id + ime prezime). */
export async function getActiveEmployees(): Promise<{ id: string; label: string }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("employees")
    .select("id, ime, prezime")
    .eq("aktivan", true)
    .order("ime", { ascending: true })

  if (error) {
    logAppError(error.message, "getActiveEmployees")
    return []
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    label: `${r.ime ?? ""} ${r.prezime ?? ""}`.trim(),
  }))
}

/** Sve aktivne sirovine, sortirane po redosledu. */
export async function getRawMaterials(): Promise<RawMaterial[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("raw_materials")
    .select("*")
    .eq("aktivan", true)
    .order("redosled", { ascending: true })

  if (error) {
    logAppError(error.message, "getRawMaterials")
    return []
  }
  return (data ?? []) as RawMaterial[]
}

/** Svi popisi, najnoviji prvi. */
export async function getInventoryCounts(): Promise<InventoryCount[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("inventory_counts")
    .select("*")
    .order("datum", { ascending: false })

  if (error) {
    logAppError(error.message, "getInventoryCounts")
    return []
  }
  return (data ?? []) as InventoryCount[]
}

/** Stavke jednog popisa (količine + iznad_minimuma po sirovini). */
export async function getInventoryCountItems(
  countId: string
): Promise<{ raw_material_id: string; kolicina: number; iznad_minimuma: boolean }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("inventory_count_items")
    .select("raw_material_id, kolicina, iznad_minimuma")
    .eq("inventory_count_id", countId)

  if (error) {
    logAppError(error.message, "getInventoryCountItems")
    return []
  }
  return (data ?? []).map((r) => ({
    raw_material_id: r.raw_material_id as string,
    kolicina: Number(r.kolicina),
    iznad_minimuma: (r.iznad_minimuma as boolean) ?? false,
  }))
}

/** Poslednji popis (ako postoji). */
export async function getLatestInventoryCount(): Promise<InventoryCount | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("inventory_counts")
    .select("*")
    .order("datum", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    logAppError(error.message, "getLatestInventoryCount")
    return null
  }
  return data as InventoryCount | null
}

/** Kreiraj novi popis sa stavkama (količine + iznad_minimuma za svaku sirovinu). */
export async function createInventoryCountAction(
  datum: string,
  employeeId: string | null,
  items: { raw_material_id: string; kolicina: number; iznad_minimuma: boolean }[]
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: inserted, error: insertErr } = await supabase
    .from("inventory_counts")
    .insert({ datum, employee_id: employeeId || null, created_by: user?.id ?? null })
    .select("id")
    .single()

  if (insertErr || !inserted) {
    logAppError(insertErr?.message ?? "Insert failed", "createInventoryCountAction")
    return { error: insertErr?.message ?? "Greška pri kreiranju popisa." }
  }

  const rows = items.map((item) => ({
    inventory_count_id: inserted.id,
    raw_material_id: item.raw_material_id,
    kolicina: item.kolicina,
    iznad_minimuma: item.iznad_minimuma,
  }))

  const { error: itemsErr } = await supabase
    .from("inventory_count_items")
    .insert(rows)

  if (itemsErr) {
    logAppError(itemsErr.message, "createInventoryCountAction:items")
    return { error: itemsErr.message }
  }

  revalidatePath("/proizvodnja/sirovine")
  return { id: inserted.id }
}

/** Admin: ažuriraj min. količinu i jedinicu sirovine. */
export async function updateRawMaterialAction(
  id: string,
  minKolicina: number,
  jedinica: string
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const permissions = await getUserPermissions(user.id)
  if (!canEdit(permissions, "proizvodnja")) {
    return { error: "Nemate pravo da menjate sirovine." }
  }

  if (minKolicina < 0) return { error: "Minimalna količina ne može biti negativna." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("raw_materials")
    .update({ min_kolicina: minKolicina, jedinica })
    .eq("id", id)

  if (error) {
    logAppError(error.message, "updateRawMaterialAction")
    return { error: error.message }
  }
  revalidatePath("/proizvodnja/sirovine")
  return {}
}

/** Brisanje popisa. */
export async function deleteInventoryCountAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("inventory_counts")
    .delete()
    .eq("id", id)

  if (error) {
    logAppError(error.message, "deleteInventoryCountAction")
    return { error: error.message }
  }
  revalidatePath("/proizvodnja/sirovine")
  return {}
}
