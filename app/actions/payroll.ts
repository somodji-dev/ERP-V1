"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import { getWorkLogsForMonth, getAdvancesForMonth, getBonusesForMonth } from "@/app/actions/sati"

/** Cene satnica važeće za dati mesec (poslednja vazi_od <= kraj meseca po tipu). */
async function getRatesForMonth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  mesec: number,
  godina: number
): Promise<Record<string, number>> {
  const lastDay = new Date(godina, mesec, 0).getDate()
  const endDate = `${godina}-${String(mesec).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
  const { data } = await supabase
    .from("rate_settings")
    .select("tip, iznos, vazi_od")
    .lte("vazi_od", endDate)
    .order("vazi_od", { ascending: false })
  const byTip: Record<string, number> = {}
  if (data) {
    for (const row of data) {
      if (!byTip[row.tip]) byTip[row.tip] = Number(row.iznos)
    }
  }
  return byTip
}

export async function generisiObračunAction(reportId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: report, error: reportErr } = await supabase
    .from("payroll_reports")
    .select("id, employee_id, mesec, godina")
    .eq("id", reportId)
    .single()
  if (reportErr || !report) {
    logAppError(reportErr?.message ?? "Report not found", "generisiObračunAction")
    return { error: reportErr?.message ?? "Izveštaj nije pronađen." }
  }

  const employeeId = report.employee_id as string
  const mesec = report.mesec as number
  const godina = report.godina as number

  const [logs, advances, bonuses, rates] = await Promise.all([
    getWorkLogsForMonth(employeeId, mesec, godina),
    getAdvancesForMonth(employeeId, mesec, godina),
    getBonusesForMonth(employeeId, mesec, godina),
    getRatesForMonth(supabase, mesec, godina),
  ])

  const sati: Record<string, number> = {
    redovni_sati: 0,
    prekovremeni_sati: 0,
    subota_sati: 0,
    nedelja_sati: 0,
    praznik_sati: 0,
  }
  for (const r of logs) {
    const tip = r.tip_sata as string
    const h = Number(r.sati)
    if (tip === "redovni") sati.redovni_sati += h
    else if (tip === "prekovremeno") sati.prekovremeni_sati += h
    else if (tip === "subota") sati.subota_sati += h
    else if (tip === "nedelja") sati.nedelja_sati += h
    else if (tip === "praznik") sati.praznik_sati += h
  }

  const brutoRedovni = sati.redovni_sati * (rates.redovni ?? 0)
  const brutoPrekovremeno = sati.prekovremeni_sati * (rates.prekovremeno ?? 0)
  const brutoSubota = sati.subota_sati * (rates.subota ?? 0)
  const brutoNedelja = sati.nedelja_sati * (rates.nedelja ?? 0)
  const brutoPraznik = sati.praznik_sati * (rates.praznik ?? 0)
  const ukupniBonusi = bonuses.reduce((s, b) => s + Number(b.iznos), 0)
  const ukupniAvans = advances.reduce((s, a) => s + Number(a.iznos), 0)
  const ukupnoBruto =
    brutoRedovni + brutoPrekovremeno + brutoSubota + brutoNedelja + brutoPraznik + ukupniBonusi
  const netoZaIsplatu = ukupnoBruto - ukupniAvans

  const { error: updateErr } = await supabase
    .from("payroll_reports")
    .update({
      redovni_sati: sati.redovni_sati,
      prekovremeni_sati: sati.prekovremeni_sati,
      subota_sati: sati.subota_sati,
      nedelja_sati: sati.nedelja_sati,
      praznik_sati: sati.praznik_sati,
      bruto_redovni: brutoRedovni,
      bruto_prekovremeno: brutoPrekovremeno,
      bruto_subota: brutoSubota,
      bruto_nedelja: brutoNedelja,
      bruto_praznik: brutoPraznik,
      ukupni_bonusi: ukupniBonusi,
      ukupno_bruto: ukupnoBruto,
      ukupni_avans: ukupniAvans,
      neto_za_isplatu: netoZaIsplatu,
    })
    .eq("id", reportId)

  if (updateErr) {
    logAppError(updateErr.message, "generisiObračunAction")
    return { error: updateErr.message }
  }
  revalidatePath("/plate")
  revalidatePath(`/plate/${reportId}`)
  revalidatePath("/radnici")
  return {}
}

export async function deletePayrollReportAction(reportId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("payroll_reports")
    .delete()
    .eq("id", reportId)
    .select("id")
    .single()
  if (error) {
    logAppError(error.message, "deletePayrollReportAction")
    return { error: error.message }
  }
  if (!data) {
    const msg = "Izveštaj nije obrisan (proverite RLS: mora postojati policy za DELETE na payroll_reports)."
    logAppError(msg, "deletePayrollReportAction")
    return { error: msg }
  }
  revalidatePath("/plate")
  revalidatePath("/radnici")
  return {}
}

export async function createPayrollNacrtAction(
  employeeId: string,
  mesec: number,
  godina: number
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from("payroll_reports")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("mesec", mesec)
    .eq("godina", godina)
    .maybeSingle()

  if (existing) {
    revalidatePath("/plate")
    return { id: existing.id }
  }

  const { data: inserted, error } = await supabase
    .from("payroll_reports")
    .insert({
      employee_id: employeeId,
      mesec,
      godina,
      status: "nacrt",
    })
    .select("id")
    .single()

  if (error) {
    logAppError(error.message, "createPayrollNacrtAction")
    return { error: error.message }
  }
  revalidatePath("/plate")
  return { id: inserted?.id }
}

export async function oznaciIsplacenAction(reportId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("payroll_reports")
    .update({ status: "isplacen" })
    .eq("id", reportId)

  if (error) {
    logAppError(error.message, "oznaciIsplacenAction")
    return { error: error.message }
  }
  revalidatePath("/plate")
  revalidatePath(`/plate/${reportId}`)
  return {}
}
