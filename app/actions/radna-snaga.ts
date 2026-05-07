"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import type { RadnaSnagaGrupa } from "@/lib/types/radna-snaga"

export async function getRadnaSnagaByProizvod(proizvodId: string): Promise<RadnaSnagaGrupa[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("radna_snaga_grupa")
    .select("proizvod_id, grupa_key, grupa_label, broj, neto")
    .eq("proizvod_id", proizvodId)

  if (error) {
    logAppError(error.message, "getRadnaSnagaByProizvod")
    return []
  }
  return (data ?? []).map((r) => ({
    proizvod_id: r.proizvod_id,
    grupa_key: r.grupa_key,
    grupa_label: r.grupa_label,
    broj: Number(r.broj),
    neto: Number(r.neto),
  }))
}

export async function upsertRadnaSnagaGrupaAction(
  proizvodId: string,
  grupaKey: string,
  grupaLabel: string,
  patch: { broj?: number; neto?: number }
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("radna_snaga_grupa")
    .select("broj, neto")
    .eq("proizvod_id", proizvodId)
    .eq("grupa_key", grupaKey)
    .maybeSingle()

  const broj = patch.broj ?? (existing ? Number(existing.broj) : 0)
  const neto = patch.neto ?? (existing ? Number(existing.neto) : 0)

  if (isNaN(broj) || broj < 0) return { error: "Broj mora biti ≥ 0." }
  if (isNaN(neto) || neto < 0) return { error: "Neto mora biti ≥ 0." }

  const { error } = await supabase
    .from("radna_snaga_grupa")
    .upsert({
      proizvod_id: proizvodId,
      grupa_key: grupaKey,
      grupa_label: grupaLabel,
      broj,
      neto,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    logAppError(error.message, "upsertRadnaSnagaGrupaAction")
    return { error: "Greška pri čuvanju." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return {}
}

export async function getCeneConfig(): Promise<{ opterecenje_plata_procenat: number }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cene_config")
    .select("opterecenje_plata_procenat")
    .eq("id", 1)
    .maybeSingle()

  if (error) {
    logAppError(error.message, "getCeneConfig")
    return { opterecenje_plata_procenat: 0 }
  }
  return {
    opterecenje_plata_procenat: data ? Number(data.opterecenje_plata_procenat) : 0,
  }
}

export async function updateOpterecenjePlataAction(
  procenat: number
): Promise<{ error?: string }> {
  if (isNaN(procenat) || procenat < 0 || procenat > 500) {
    return { error: "Opterećenje mora biti između 0 i 500%." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("cene_config")
    .update({ opterecenje_plata_procenat: procenat, updated_at: new Date().toISOString() })
    .eq("id", 1)

  if (error) {
    logAppError(error.message, "updateOpterecenjePlataAction")
    return { error: "Greška pri čuvanju opterećenja." }
  }
  revalidatePath("/cene-proizvoda", "layout")
  return {}
}
