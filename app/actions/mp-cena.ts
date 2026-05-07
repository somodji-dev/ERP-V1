"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import type { MpCenaBlock, MpCenaPatch } from "@/lib/types/mp-cena"

const NUM_FIELDS: (keyof MpCenaPatch)[] = [
  "prodajna_cena",
  "rabat",
  "marza_distributera",
  "marza_maloprodaje",
  "pdv",
]

export async function getMpCenaByProizvod(proizvodId: string): Promise<MpCenaBlock[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("mp_cena_block")
    .select(
      "id, proizvod_id, selected_pakovanje_id, position, prodajna_cena, rabat, marza_distributera, marza_maloprodaje, pdv, updated_at"
    )
    .eq("proizvod_id", proizvodId)
    .order("position", { ascending: true })

  if (error) {
    logAppError(error.message, "getMpCenaByProizvod")
    return []
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    proizvod_id: r.proizvod_id as string,
    selected_pakovanje_id: (r.selected_pakovanje_id as string | null) ?? null,
    position: Number(r.position) || 0,
    prodajna_cena: Number(r.prodajna_cena) || 0,
    rabat: Number(r.rabat) || 0,
    marza_distributera: Number(r.marza_distributera) || 0,
    marza_maloprodaje: Number(r.marza_maloprodaje) || 0,
    pdv: Number(r.pdv) || 0,
    updated_at: r.updated_at as string | undefined,
  }))
}

export async function addMpCenaBlockAction(
  proizvodId: string,
  position: number,
  selectedPakovanjeId: string | null
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("mp_cena_block")
    .insert({
      proizvod_id: proizvodId,
      position,
      selected_pakovanje_id: selectedPakovanjeId,
    })
    .select("id")
    .single()

  if (error) {
    logAppError(error.message, "addMpCenaBlockAction")
    return { error: "Greška pri dodavanju bloka." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return { id: data.id as string }
}

export async function updateMpCenaBlockAction(
  id: string,
  proizvodId: string,
  patch: MpCenaPatch
): Promise<{ error?: string }> {
  // Validacija: numerički ≥ 0
  for (const k of NUM_FIELDS) {
    const v = patch[k]
    if (v === undefined) continue
    if (typeof v !== "number" || isNaN(v) || v < 0) {
      return { error: `Vrednost za ${k} mora biti broj ≥ 0.` }
    }
  }
  // PDV u opsegu [0, 100]
  if (patch.pdv !== undefined && (patch.pdv as number) > 100) {
    return { error: "PDV ne može biti veći od 100%." }
  }
  // Rabat i marže su procenti — gornji limit 100% (mada marža može biti veća, ostavljamo malo slobode)
  if (patch.rabat !== undefined && (patch.rabat as number) > 100) {
    return { error: "Rabat ne može biti veći od 100%." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("mp_cena_block")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    logAppError(error.message, "updateMpCenaBlockAction")
    return { error: "Greška pri čuvanju." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return {}
}

export async function deleteMpCenaBlockAction(
  id: string,
  proizvodId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("mp_cena_block").delete().eq("id", id)

  if (error) {
    logAppError(error.message, "deleteMpCenaBlockAction")
    return { error: "Greška pri brisanju." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return {}
}
