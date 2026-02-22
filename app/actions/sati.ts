"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import { getTipSataZaDan } from "@/lib/radnici/sati"

type DanUnos = { datum: string; redovni: number; prekovremeni: number }

export async function saveSatiAction(
  employeeId: string,
  mesec: number,
  godina: number,
  dani: DanUnos[]
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const startDate = `${godina}-${String(mesec).padStart(2, "0")}-01`
  const lastDay = new Date(godina, mesec, 0).getDate()
  const endDate = `${godina}-${String(mesec).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

  await supabase
    .from("work_logs")
    .delete()
    .eq("employee_id", employeeId)
    .gte("datum", startDate)
    .lte("datum", endDate)

  for (const dan of dani) {
    const [y, m, day] = dan.datum.split("-").map(Number)
    const datum = new Date(y, m - 1, day)
    if (dan.redovni > 0) {
      const tip = getTipSataZaDan(datum)
      await supabase.from("work_logs").insert({
        employee_id: employeeId,
        datum: dan.datum,
        sati: dan.redovni,
        tip_sata: tip,
      })
    }
    if (dan.prekovremeni > 0) {
      await supabase.from("work_logs").insert({
        employee_id: employeeId,
        datum: dan.datum,
        sati: dan.prekovremeni,
        tip_sata: "prekovremeno",
      })
    }
  }

  revalidatePath("/sati")
  return {}
}

/**
 * Briše sati za mesec: prvo platni izveštaj za tog radnika/mesec, zatim unose sati (work_logs).
 * Redosled je bitan da ne ostane izveštaj bez podataka.
 */
export async function deleteSatiZaMesecAction(
  employeeId: string,
  mesec: number,
  godina: number
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const startDate = `${godina}-${String(mesec).padStart(2, "0")}-01`
  const lastDay = new Date(godina, mesec, 0).getDate()
  const endDate = `${godina}-${String(mesec).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

  await supabase
    .from("payroll_reports")
    .delete()
    .eq("employee_id", employeeId)
    .eq("mesec", mesec)
    .eq("godina", godina)

  const { error } = await supabase
    .from("work_logs")
    .delete()
    .eq("employee_id", employeeId)
    .gte("datum", startDate)
    .lte("datum", endDate)

  if (error) {
    logAppError(error.message, "deleteSatiZaMesecAction")
    return { error: error.message }
  }
  revalidatePath("/sati")
  revalidatePath("/plate")
  revalidatePath("/radnici")
  return {}
}

export async function getWorkLogsForMonth(
  employeeId: string,
  mesec: number,
  godina: number
): Promise<{ datum: string; sati: number; tip_sata: string }[]> {
  const supabase = await createClient()
  const startDate = `${godina}-${String(mesec).padStart(2, "0")}-01`
  const lastDay = new Date(godina, mesec, 0).getDate()
  const endDate = `${godina}-${String(mesec).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

  const { data } = await supabase
    .from("work_logs")
    .select("datum, sati, tip_sata")
    .eq("employee_id", employeeId)
    .gte("datum", startDate)
    .lte("datum", endDate)
    .order("datum", { ascending: true })

  return (data ?? []) as { datum: string; sati: number; tip_sata: string }[]
}

export async function getAdvancesForMonth(
  employeeId: string,
  mesec: number,
  godina: number
): Promise<{ id: string; datum: string; iznos: number; napomena: string | null }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("advances")
    .select("id, datum, iznos, napomena")
    .eq("employee_id", employeeId)
    .eq("mesec", mesec)
    .eq("godina", godina)
    .order("datum", { ascending: true })
  return (data ?? []) as { id: string; datum: string; iznos: number; napomena: string | null }[]
}

export async function getBonusesForMonth(
  employeeId: string,
  mesec: number,
  godina: number
): Promise<{ id: string; iznos: number; opis: string | null }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("bonuses")
    .select("id, iznos, opis")
    .eq("employee_id", employeeId)
    .eq("mesec", mesec)
    .eq("godina", godina)
  return (data ?? []) as { id: string; iznos: number; opis: string | null }[]
}

export async function addAdvanceAction(
  employeeId: string,
  datum: string,
  iznos: number,
  mesec: number,
  godina: number,
  napomena?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("advances").insert({
    employee_id: employeeId,
    datum,
    iznos,
    mesec,
    godina,
    napomena: napomena ?? null,
  })
  if (error) {
    logAppError(error.message, "addAdvanceAction")
    return { error: error.message }
  }
  revalidatePath("/sati")
  return {}
}

export async function addBonusAction(
  employeeId: string,
  mesec: number,
  godina: number,
  iznos: number,
  opis?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("bonuses").insert({
    employee_id: employeeId,
    mesec,
    godina,
    iznos,
    opis: opis ?? null,
  })
  if (error) {
    logAppError(error.message, "addBonusAction")
    return { error: error.message }
  }
  revalidatePath("/sati")
  return {}
}
