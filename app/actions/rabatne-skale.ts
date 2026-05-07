"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import type { RabatniBlock, RabatnaScenario } from "@/lib/types/rabatne-skale"
import { EMPTY_SCENARIOS } from "@/lib/types/rabatne-skale"

function normalizeScenarios(raw: unknown): RabatniBlock["scenarios"] {
  if (!Array.isArray(raw) || raw.length !== 4) return EMPTY_SCENARIOS
  return raw.map((s) => ({
    osnovna_kg: Number((s as RabatnaScenario)?.osnovna_kg) || 0,
    kolicina_kg: Number((s as RabatnaScenario)?.kolicina_kg) || 0,
    rabat: Number((s as RabatnaScenario)?.rabat) || 0,
  })) as RabatniBlock["scenarios"]
}

export async function getRabatneSkaleByProizvod(proizvodId: string): Promise<RabatniBlock[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("rabatne_skale_block")
    .select("id, proizvod_id, selected_pakovanje_id, position, scenarios")
    .eq("proizvod_id", proizvodId)
    .order("position", { ascending: true })

  if (error) {
    logAppError(error.message, "getRabatneSkaleByProizvod")
    return []
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    proizvod_id: r.proizvod_id,
    selected_pakovanje_id: r.selected_pakovanje_id,
    position: r.position,
    scenarios: normalizeScenarios(r.scenarios),
  }))
}

export async function addRabatniBlockAction(
  proizvodId: string,
  position: number,
  selectedPakovanjeId: string | null
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("rabatne_skale_block")
    .insert({
      proizvod_id: proizvodId,
      position,
      selected_pakovanje_id: selectedPakovanjeId,
    })
    .select("id")
    .single()

  if (error) {
    logAppError(error.message, "addRabatniBlockAction")
    return { error: "Greška pri dodavanju bloka." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return { id: data.id }
}

export async function updateRabatniBlockAction(
  id: string,
  proizvodId: string,
  patch: Partial<Pick<RabatniBlock, "selected_pakovanje_id" | "scenarios">>
): Promise<{ error?: string }> {
  if (patch.scenarios) {
    for (const s of patch.scenarios) {
      for (const k of ["osnovna_kg", "kolicina_kg", "rabat"] as const) {
        if (isNaN(s[k]) || s[k] < 0) return { error: `Vrednost za ${k} mora biti ≥ 0.` }
      }
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("rabatne_skale_block")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    logAppError(error.message, "updateRabatniBlockAction")
    return { error: "Greška pri čuvanju." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return {}
}

export async function deleteRabatniBlockAction(
  id: string,
  proizvodId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("rabatne_skale_block").delete().eq("id", id)

  if (error) {
    logAppError(error.message, "deleteRabatniBlockAction")
    return { error: "Greška pri brisanju." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return {}
}
