"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import type { Proizvod } from "@/lib/types/proizvodi"

export async function getProizvodi(): Promise<Proizvod[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("proizvodi")
    .select("id, naziv, opis, bom_ukupna_kolicina, created_at, updated_at")
    .order("naziv", { ascending: true })

  if (error) {
    logAppError(error.message, "getProizvodi")
    return []
  }
  return (data ?? []) as Proizvod[]
}

export async function getProizvod(id: string): Promise<Proizvod | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("proizvodi")
    .select("id, naziv, opis, bom_ukupna_kolicina, created_at, updated_at")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    logAppError(error.message, "getProizvod")
    return null
  }
  return (data as Proizvod) ?? null
}

export async function addProizvodAction(
  naziv: string,
  opis: string | null
): Promise<{ error?: string; id?: string }> {
  if (!naziv.trim()) return { error: "Naziv je obavezan." }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("proizvodi")
    .insert({ naziv: naziv.trim(), opis: opis?.trim() || null })
    .select("id")
    .single()

  if (error) {
    logAppError(error.message, "addProizvodAction")
    if (error.code === "23505") return { error: "Proizvod sa tim nazivom već postoji." }
    return { error: "Greška pri dodavanju." }
  }
  revalidatePath("/cene-proizvoda")
  return { id: data.id }
}

export async function deleteProizvodAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("proizvodi")
    .delete()
    .eq("id", id)

  if (error) {
    logAppError(error.message, "deleteProizvodAction")
    return { error: "Greška pri brisanju." }
  }
  revalidatePath("/cene-proizvoda")
  return {}
}
