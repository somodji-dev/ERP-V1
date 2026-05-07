"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import type { MaterijaliCena } from "@/lib/types/materijali-cene"

export async function getMaterijaliCene(): Promise<MaterijaliCena[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("materijali_cene")
    .select("id, naziv, cena, created_at, updated_at")
    .order("naziv", { ascending: true })

  if (error) {
    logAppError(error.message, "getMaterijaliCene")
    return []
  }
  return (data ?? []) as MaterijaliCena[]
}

export async function addMaterijaliCenaAction(
  naziv: string,
  cena: number
): Promise<{ error?: string }> {
  if (!naziv.trim()) return { error: "Naziv je obavezan." }
  if (isNaN(cena) || cena < 0) return { error: "Cena mora biti pozitivan broj." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("materijali_cene")
    .insert({ naziv: naziv.trim(), cena })

  if (error) {
    logAppError(error.message, "addMaterijaliCenaAction")
    if (error.code === "23505") return { error: "Materijal sa tim nazivom već postoji." }
    return { error: "Greška pri dodavanju." }
  }
  revalidatePath("/cene-sirovina")
  return {}
}

export async function updateMaterijaliCenaAction(
  id: string,
  naziv: string,
  cena: number
): Promise<{ error?: string }> {
  if (!naziv.trim()) return { error: "Naziv je obavezan." }
  if (isNaN(cena) || cena < 0) return { error: "Cena mora biti pozitivan broj." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("materijali_cene")
    .update({ naziv: naziv.trim(), cena, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    logAppError(error.message, "updateMaterijaliCenaAction")
    if (error.code === "23505") return { error: "Materijal sa tim nazivom već postoji." }
    return { error: "Greška pri izmeni." }
  }
  revalidatePath("/cene-sirovina")
  return {}
}

export async function deleteMaterijaliCenaAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("materijali_cene")
    .delete()
    .eq("id", id)

  if (error) {
    logAppError(error.message, "deleteMaterijaliCenaAction")
    return { error: "Greška pri brisanju." }
  }
  revalidatePath("/cene-sirovina")
  return {}
}
