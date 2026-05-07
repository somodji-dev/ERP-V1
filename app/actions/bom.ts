"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import type { BomStavka } from "@/lib/types/bom"

export async function getBomByProizvod(proizvodId: string): Promise<BomStavka[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bom_stavke")
    .select("id, proizvod_id, materijal_id, naziv, udeo, cena_po_kg, created_at")
    .eq("proizvod_id", proizvodId)
    .order("created_at", { ascending: true })

  if (error) {
    logAppError(error.message, "getBomByProizvod")
    return []
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    proizvod_id: r.proizvod_id,
    materijal_id: r.materijal_id,
    naziv: r.naziv,
    udeo: Number(r.udeo),
    cena_po_kg: Number(r.cena_po_kg),
  }))
}

export async function addBomStavkaAction(
  proizvodId: string,
  naziv: string,
  udeo: number,
  cenaPoKg: number,
  materijalId: string | null
): Promise<{ error?: string; id?: string }> {
  if (!naziv.trim()) return { error: "Naziv je obavezan." }
  if (isNaN(udeo) || udeo < 0 || udeo > 1) return { error: "Udeo mora biti između 0 i 1." }
  if (isNaN(cenaPoKg) || cenaPoKg < 0) return { error: "Cena mora biti ≥ 0." }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bom_stavke")
    .insert({
      proizvod_id: proizvodId,
      naziv: naziv.trim(),
      udeo,
      cena_po_kg: cenaPoKg,
      materijal_id: materijalId,
    })
    .select("id")
    .single()

  if (error) {
    logAppError(error.message, "addBomStavkaAction")
    return { error: "Greška pri dodavanju stavke." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return { id: data.id }
}

export async function updateBomStavkaAction(
  id: string,
  proizvodId: string,
  naziv: string,
  udeo: number,
  cenaPoKg: number,
  materijalId: string | null
): Promise<{ error?: string }> {
  if (!naziv.trim()) return { error: "Naziv je obavezan." }
  if (isNaN(udeo) || udeo < 0 || udeo > 1) return { error: "Udeo mora biti između 0 i 1." }
  if (isNaN(cenaPoKg) || cenaPoKg < 0) return { error: "Cena mora biti ≥ 0." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("bom_stavke")
    .update({
      naziv: naziv.trim(),
      udeo,
      cena_po_kg: cenaPoKg,
      materijal_id: materijalId,
    })
    .eq("id", id)

  if (error) {
    logAppError(error.message, "updateBomStavkaAction")
    return { error: "Greška pri izmeni stavke." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return {}
}

export async function deleteBomStavkaAction(
  id: string,
  proizvodId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("bom_stavke")
    .delete()
    .eq("id", id)

  if (error) {
    logAppError(error.message, "deleteBomStavkaAction")
    return { error: "Greška pri brisanju." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return {}
}

export async function updateUkupnaKolicinaAction(
  proizvodId: string,
  kolicina: number
): Promise<{ error?: string }> {
  if (isNaN(kolicina) || kolicina <= 0) return { error: "Količina mora biti > 0." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("proizvodi")
    .update({ bom_ukupna_kolicina: kolicina, updated_at: new Date().toISOString() })
    .eq("id", proizvodId)

  if (error) {
    logAppError(error.message, "updateUkupnaKolicinaAction")
    return { error: "Greška pri izmeni ukupne količine." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return {}
}
