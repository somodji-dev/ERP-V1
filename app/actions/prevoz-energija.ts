"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import type { PrevozEnergija } from "@/lib/types/prevoz-energija"
import { EMPTY_PREVOZ_ENERGIJA } from "@/lib/types/prevoz-energija"

export async function getPrevozEnergija(proizvodId: string): Promise<PrevozEnergija> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("prevoz_energija")
    .select("proizvod_id, prevoz_cena, prevoz_kg, struja_racun, struja_kg")
    .eq("proizvod_id", proizvodId)
    .maybeSingle()

  if (error) {
    logAppError(error.message, "getPrevozEnergija")
    return EMPTY_PREVOZ_ENERGIJA(proizvodId)
  }
  if (!data) return EMPTY_PREVOZ_ENERGIJA(proizvodId)

  return {
    proizvod_id: data.proizvod_id,
    prevoz_cena: Number(data.prevoz_cena),
    prevoz_kg: Number(data.prevoz_kg),
    struja_racun: Number(data.struja_racun),
    struja_kg: Number(data.struja_kg),
  }
}

export async function upsertPrevozEnergijaAction(
  proizvodId: string,
  patch: Partial<Omit<PrevozEnergija, "proizvod_id">>
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const existing = await getPrevozEnergija(proizvodId)
  const next = { ...existing, ...patch }

  for (const k of ["prevoz_cena", "prevoz_kg", "struja_racun", "struja_kg"] as const) {
    const v = next[k]
    if (isNaN(v) || v < 0) return { error: `Vrednost za ${k} mora biti ≥ 0.` }
  }

  const { error } = await supabase
    .from("prevoz_energija")
    .upsert({
      proizvod_id: proizvodId,
      prevoz_cena: next.prevoz_cena,
      prevoz_kg: next.prevoz_kg,
      struja_racun: next.struja_racun,
      struja_kg: next.struja_kg,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    logAppError(error.message, "upsertPrevozEnergijaAction")
    return { error: "Greška pri čuvanju." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return {}
}
