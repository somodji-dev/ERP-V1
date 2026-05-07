"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import type { PtrFiksniStavka, PtrParams, PtrMiksRow } from "@/lib/types/ptr"
import { EMPTY_PTR_PARAMS } from "@/lib/types/ptr"

// ---------- FIKSNI ----------

export async function getFiksniByProizvod(proizvodId: string): Promise<PtrFiksniStavka[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ptr_fiksni_stavke")
    .select("id, proizvod_id, naziv, iznos")
    .eq("proizvod_id", proizvodId)
    .order("created_at", { ascending: true })

  if (error) {
    logAppError(error.message, "getFiksniByProizvod")
    return []
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    proizvod_id: r.proizvod_id,
    naziv: r.naziv,
    iznos: Number(r.iznos),
  }))
}

export async function addFiksniAction(
  proizvodId: string,
  naziv: string,
  iznos: number
): Promise<{ error?: string; id?: string }> {
  if (!naziv.trim()) return { error: "Naziv je obavezan." }
  if (isNaN(iznos) || iznos < 0) return { error: "Iznos mora biti ≥ 0." }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ptr_fiksni_stavke")
    .insert({ proizvod_id: proizvodId, naziv: naziv.trim(), iznos })
    .select("id")
    .single()

  if (error) {
    logAppError(error.message, "addFiksniAction")
    return { error: "Greška pri dodavanju fiksnog troška." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return { id: data.id }
}

export async function deleteFiksniAction(
  id: string,
  proizvodId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("ptr_fiksni_stavke").delete().eq("id", id)

  if (error) {
    logAppError(error.message, "deleteFiksniAction")
    return { error: "Greška pri brisanju." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return {}
}

// ---------- PARAMS ----------

export async function getPtrParams(proizvodId: string): Promise<PtrParams> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ptr_params")
    .select("proizvod_id, prodajna_kg, kapacitet, kurs, selected_pakovanje_id")
    .eq("proizvod_id", proizvodId)
    .maybeSingle()

  if (error) {
    logAppError(error.message, "getPtrParams")
    return EMPTY_PTR_PARAMS(proizvodId)
  }
  if (!data) return EMPTY_PTR_PARAMS(proizvodId)

  return {
    proizvod_id: data.proizvod_id,
    prodajna_kg: Number(data.prodajna_kg),
    kapacitet: Number(data.kapacitet),
    kurs: Number(data.kurs),
    selected_pakovanje_id: data.selected_pakovanje_id,
  }
}

export async function upsertPtrParamsAction(
  proizvodId: string,
  patch: Partial<Omit<PtrParams, "proizvod_id">>
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const existing = await getPtrParams(proizvodId)
  const next = { ...existing, ...patch }

  for (const k of ["prodajna_kg", "kapacitet", "kurs"] as const) {
    if (isNaN(next[k]) || next[k] < 0) return { error: `Vrednost za ${k} mora biti ≥ 0.` }
  }

  const { error } = await supabase.from("ptr_params").upsert({
    proizvod_id: proizvodId,
    prodajna_kg: next.prodajna_kg,
    kapacitet: next.kapacitet,
    kurs: next.kurs,
    selected_pakovanje_id: next.selected_pakovanje_id,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    logAppError(error.message, "upsertPtrParamsAction")
    return { error: "Greška pri čuvanju parametara." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return {}
}

// ---------- MIKS ----------

export async function getMiksByProizvod(proizvodId: string): Promise<PtrMiksRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ptr_miks")
    .select("id, proizvod_id, pakovanje_id, kolicina_kg, prodajna_kg")
    .eq("proizvod_id", proizvodId)
    .order("created_at", { ascending: true })

  if (error) {
    logAppError(error.message, "getMiksByProizvod")
    return []
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    proizvod_id: r.proizvod_id,
    pakovanje_id: r.pakovanje_id,
    kolicina_kg: Number(r.kolicina_kg),
    prodajna_kg: Number(r.prodajna_kg),
  }))
}

export async function addMiksRowAction(
  proizvodId: string,
  pakovanjeId: string
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ptr_miks")
    .insert({ proizvod_id: proizvodId, pakovanje_id: pakovanjeId, kolicina_kg: 0, prodajna_kg: 0 })
    .select("id")
    .single()

  if (error) {
    logAppError(error.message, "addMiksRowAction")
    return { error: "Greška pri dodavanju reda." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return { id: data.id }
}

export async function createMiksRowWithValuesAction(
  proizvodId: string,
  pakovanjeId: string,
  kolicinaKg: number,
  prodajnaKg: number
): Promise<{ error?: string; id?: string }> {
  if (isNaN(kolicinaKg) || kolicinaKg < 0) return { error: "Količina mora biti ≥ 0." }
  if (isNaN(prodajnaKg) || prodajnaKg < 0) return { error: "Prodajna mora biti ≥ 0." }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ptr_miks")
    .insert({
      proizvod_id: proizvodId,
      pakovanje_id: pakovanjeId,
      kolicina_kg: kolicinaKg,
      prodajna_kg: prodajnaKg,
    })
    .select("id")
    .single()

  if (error) {
    logAppError(error.message, "createMiksRowWithValuesAction")
    return { error: "Greška pri dodavanju miks reda." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return { id: data.id }
}

export async function bulkPopulateMiksAction(
  proizvodId: string,
  pakovanjeIds: string[]
): Promise<{ error?: string }> {
  if (pakovanjeIds.length === 0) return {}

  const supabase = await createClient()
  const rows = pakovanjeIds.map((pid) => ({
    proizvod_id: proizvodId,
    pakovanje_id: pid,
    kolicina_kg: 0,
    prodajna_kg: 0,
  }))

  const { error } = await supabase.from("ptr_miks").insert(rows)

  if (error) {
    logAppError(error.message, "bulkPopulateMiksAction")
    return { error: "Greška pri popunjavanju miksa." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return {}
}

export async function updateMiksRowAction(
  id: string,
  proizvodId: string,
  patch: Partial<Omit<PtrMiksRow, "id" | "proizvod_id">>
): Promise<{ error?: string }> {
  for (const k of ["kolicina_kg", "prodajna_kg"] as const) {
    if (patch[k] !== undefined && (isNaN(patch[k]!) || patch[k]! < 0)) {
      return { error: `Vrednost za ${k} mora biti ≥ 0.` }
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("ptr_miks").update(patch).eq("id", id)

  if (error) {
    logAppError(error.message, "updateMiksRowAction")
    return { error: "Greška pri izmeni reda." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return {}
}

export async function deleteMiksRowAction(
  id: string,
  proizvodId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("ptr_miks").delete().eq("id", id)

  if (error) {
    logAppError(error.message, "deleteMiksRowAction")
    return { error: "Greška pri brisanju reda." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return {}
}
