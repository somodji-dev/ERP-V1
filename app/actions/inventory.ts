"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import type { RawMaterial, InventoryCount } from "@/lib/types/inventory"

/** Sve aktivne sirovine, sortirane po nazivu. */
export async function getRawMaterials(): Promise<RawMaterial[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("raw_materials")
    .select("*")
    .eq("aktivan", true)
    .order("naziv", { ascending: true })

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

/** Stavke jednog popisa (količine po sirovini). */
export async function getInventoryCountItems(
  countId: string
): Promise<{ raw_material_id: string; kolicina: number }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("inventory_count_items")
    .select("raw_material_id, kolicina")
    .eq("inventory_count_id", countId)

  if (error) {
    logAppError(error.message, "getInventoryCountItems")
    return []
  }
  return (data ?? []) as { raw_material_id: string; kolicina: number }[]
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

/** Kreiraj novi popis sa stavkama (količine za svaku sirovinu). */
export async function createInventoryCountAction(
  datum: string,
  napomena: string | null,
  items: { raw_material_id: string; kolicina: number }[]
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: inserted, error: insertErr } = await supabase
    .from("inventory_counts")
    .insert({ datum, napomena: napomena || null, created_by: user?.id ?? null })
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
