"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import type { AmbalazaPakovanje, AmbalazaStavka } from "@/lib/types/ambalaza"

export async function getAmbalazaByProizvod(proizvodId: string): Promise<AmbalazaPakovanje[]> {
  const supabase = await createClient()

  const { data: pakovanja, error: errP } = await supabase
    .from("ambalaza_pakovanja")
    .select("id, proizvod_id, naziv, masa, created_at")
    .eq("proizvod_id", proizvodId)
    .order("created_at", { ascending: true })

  if (errP) {
    logAppError(errP.message, "getAmbalazaByProizvod.pakovanja")
    return []
  }
  if (!pakovanja || pakovanja.length === 0) return []

  const pakIds = pakovanja.map((p) => p.id)
  const { data: stavke, error: errS } = await supabase
    .from("ambalaza_stavke")
    .select("id, pakovanje_id, naziv, kolicina, jedinica, cena, created_at")
    .in("pakovanje_id", pakIds)
    .order("created_at", { ascending: true })

  if (errS) {
    logAppError(errS.message, "getAmbalazaByProizvod.stavke")
    return []
  }

  const stavkeByPak = new Map<string, AmbalazaStavka[]>()
  for (const s of stavke ?? []) {
    const list = stavkeByPak.get(s.pakovanje_id) ?? []
    list.push({
      id: s.id,
      pakovanje_id: s.pakovanje_id,
      naziv: s.naziv,
      kolicina: Number(s.kolicina),
      jedinica: s.jedinica,
      cena: Number(s.cena),
    })
    stavkeByPak.set(s.pakovanje_id, list)
  }

  return pakovanja.map((p) => ({
    id: p.id,
    proizvod_id: p.proizvod_id,
    naziv: p.naziv,
    masa: Number(p.masa),
    stavke: stavkeByPak.get(p.id) ?? [],
  }))
}

export async function addPakovanjeAction(
  proizvodId: string,
  naziv: string,
  masa: number
): Promise<{ error?: string; id?: string }> {
  if (!naziv.trim()) return { error: "Naziv je obavezan." }
  if (isNaN(masa) || masa < 0) return { error: "Masa mora biti ≥ 0." }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ambalaza_pakovanja")
    .insert({ proizvod_id: proizvodId, naziv: naziv.trim(), masa })
    .select("id")
    .single()

  if (error) {
    logAppError(error.message, "addPakovanjeAction")
    return { error: "Greška pri dodavanju pakovanja." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return { id: data.id }
}

export async function updatePakovanjeAction(
  id: string,
  naziv: string,
  masa: number,
  proizvodId: string
): Promise<{ error?: string }> {
  if (!naziv.trim()) return { error: "Naziv je obavezan." }
  if (isNaN(masa) || masa < 0) return { error: "Masa mora biti ≥ 0." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("ambalaza_pakovanja")
    .update({ naziv: naziv.trim(), masa })
    .eq("id", id)

  if (error) {
    logAppError(error.message, "updatePakovanjeAction")
    return { error: "Greška pri izmeni pakovanja." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return {}
}

export async function deletePakovanjeAction(
  id: string,
  proizvodId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("ambalaza_pakovanja")
    .delete()
    .eq("id", id)

  if (error) {
    logAppError(error.message, "deletePakovanjeAction")
    return { error: "Greška pri brisanju pakovanja." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return {}
}

export async function addStavkaAction(
  pakovanjeId: string,
  proizvodId: string,
  naziv: string,
  kolicina: number,
  jedinica: string,
  cena: number
): Promise<{ error?: string; id?: string }> {
  if (!naziv.trim()) return { error: "Naziv je obavezan." }
  if (isNaN(kolicina) || kolicina < 0) return { error: "Količina mora biti ≥ 0." }
  if (isNaN(cena) || cena < 0) return { error: "Cena mora biti ≥ 0." }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ambalaza_stavke")
    .insert({
      pakovanje_id: pakovanjeId,
      naziv: naziv.trim(),
      kolicina,
      jedinica: jedinica.trim() || "kom",
      cena,
    })
    .select("id")
    .single()

  if (error) {
    logAppError(error.message, "addStavkaAction")
    return { error: "Greška pri dodavanju stavke." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return { id: data.id }
}

export async function updateStavkaAction(
  id: string,
  proizvodId: string,
  naziv: string,
  kolicina: number,
  jedinica: string,
  cena: number
): Promise<{ error?: string }> {
  if (!naziv.trim()) return { error: "Naziv je obavezan." }
  if (isNaN(kolicina) || kolicina < 0) return { error: "Količina mora biti ≥ 0." }
  if (isNaN(cena) || cena < 0) return { error: "Cena mora biti ≥ 0." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("ambalaza_stavke")
    .update({
      naziv: naziv.trim(),
      kolicina,
      jedinica: jedinica.trim() || "kom",
      cena,
    })
    .eq("id", id)

  if (error) {
    logAppError(error.message, "updateStavkaAction")
    return { error: "Greška pri izmeni stavke." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return {}
}

export async function deleteStavkaAction(
  id: string,
  proizvodId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("ambalaza_stavke")
    .delete()
    .eq("id", id)

  if (error) {
    logAppError(error.message, "deleteStavkaAction")
    return { error: "Greška pri brisanju stavke." }
  }
  revalidatePath(`/cene-proizvoda/${proizvodId}`)
  return {}
}
