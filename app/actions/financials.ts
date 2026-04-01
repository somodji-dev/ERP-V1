"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import type { MonthlyFinancial } from "@/lib/types/financials"

/** Svi mesečni unosi za datu godinu, sortirani po mesecu. */
export async function getFinancials(godina: number): Promise<MonthlyFinancial[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("monthly_financials")
    .select("id, mesec, godina, prihod, rashod, napomena, created_at")
    .eq("godina", godina)
    .order("mesec", { ascending: true })

  if (error) {
    logAppError(error.message, "getFinancials")
    return []
  }
  return (data ?? []) as MonthlyFinancial[]
}

/** Lista svih dostupnih godina (za filter dropdown). */
export async function getFinancialYears(): Promise<number[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("monthly_financials")
    .select("godina")
    .order("godina", { ascending: false })

  if (error) {
    logAppError(error.message, "getFinancialYears")
    return []
  }
  const seen = new Set<number>()
  const unique: number[] = []
  for (const r of data ?? []) {
    const g = r.godina as number
    if (!seen.has(g)) { seen.add(g); unique.push(g) }
  }
  return unique
}

/** Podaci za više godina odjednom (za uporedni grafikon). */
export async function getFinancialsMultiYear(years: number[]): Promise<MonthlyFinancial[]> {
  if (years.length === 0) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("monthly_financials")
    .select("id, mesec, godina, prihod, rashod, napomena, created_at")
    .in("godina", years)
    .order("godina", { ascending: true })
    .order("mesec", { ascending: true })

  if (error) {
    logAppError(error.message, "getFinancialsMultiYear")
    return []
  }
  return (data ?? []) as MonthlyFinancial[]
}

/** Upsert (insert ili update) za mesec+godina. */
export async function upsertFinancialAction(
  mesec: number,
  godina: number,
  prihod: number,
  rashod: number,
  napomena: string | null
): Promise<{ error?: string }> {
  if (mesec < 1 || mesec > 12) return { error: "Mesec mora biti 1–12." }
  if (prihod < 0 || rashod < 0) return { error: "Iznosi ne mogu biti negativni." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from("monthly_financials")
    .upsert(
      {
        mesec,
        godina,
        prihod,
        rashod,
        napomena: napomena || null,
        created_by: user?.id ?? null,
      },
      { onConflict: "mesec,godina" }
    )

  if (error) {
    logAppError(error.message, "upsertFinancialAction")
    return { error: error.message }
  }
  revalidatePath("/prihodi-rashodi")
  return {}
}

/** Brisanje unosa po ID-u. */
export async function deleteFinancialAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("monthly_financials")
    .delete()
    .eq("id", id)

  if (error) {
    logAppError(error.message, "deleteFinancialAction")
    return { error: error.message }
  }
  revalidatePath("/prihodi-rashodi")
  return {}
}
