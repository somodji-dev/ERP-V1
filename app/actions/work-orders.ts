"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import { DATUM_YMD, type WorkOrderFormValues } from "@/lib/proizvodnja/validation"
import { brojeviNalogaZaMesec, predlogLotaZaSmenu, type NalogZaRedosled } from "@/lib/proizvodnja/redosled-naloga"

type Supabase = Awaited<ReturnType<typeof createClient>>
type NalogMeseca = NalogZaRedosled & { broj_naloga: string }

function godinaMesec(datumYMD: string): { godina: number; mesec: number } | null {
  const [godina, mesec] = datumYMD.split("-").map((x) => parseInt(x, 10))
  if (!godina || !mesec) return null
  return { godina, mesec }
}

/** Svi nalozi jednog meseca, sa LOT brojem iz pakovanja. */
async function naloziMeseca(supabase: Supabase, godina: number, mesec: number): Promise<NalogMeseca[]> {
  const od = `${godina}-${String(mesec).padStart(2, "0")}-01`
  const doDatuma = mesec === 12 ? `${godina + 1}-01-01` : `${godina}-${String(mesec + 1).padStart(2, "0")}-01`
  const { data: nalozi, error: woError } = await supabase
    .from("work_orders")
    .select("id, broj_naloga, datum, smena, created_at")
    .gte("datum", od)
    .lt("datum", doDatuma)
  if (woError) throw woError
  const lista = (nalozi ?? []) as { id: string; broj_naloga: string; datum: string; smena: string; created_at: string | null }[]
  if (lista.length === 0) return []
  const { data: pak, error: pakError } = await supabase
    .from("pakovanje")
    .select("work_order_id, lot_broj")
    .in("work_order_id", lista.map((n) => n.id))
  if (pakError) throw pakError
  const lotPoNalogu = new Map<string, string | null>()
  for (const p of (pak ?? []) as { work_order_id: string; lot_broj: string | null }[]) {
    lotPoNalogu.set(p.work_order_id, p.lot_broj)
  }
  return lista.map((n) => ({ ...n, lot_broj: lotPoNalogu.get(n.id) ?? null }))
}

/**
 * Prenumeriše brojeve naloga u mesecu po redosledu datum → smena → vreme unosa.
 * Dve faze (privremeni broj, pa konačni) zbog UNIQUE ograničenja na broj_naloga.
 * LOT se ne dira (odštampan je na ambalaži).
 */
async function prenumerisiMesec(supabase: Supabase, godina: number, mesec: number): Promise<void> {
  const nalozi = await naloziMeseca(supabase, godina, mesec)
  const novi = brojeviNalogaZaMesec(nalozi, godina, mesec)
  const promenjeni = nalozi.filter((n) => novi.get(n.id) !== n.broj_naloga)
  for (const n of promenjeni) {
    const { error } = await supabase.from("work_orders").update({ broj_naloga: `tmp-${n.id}` }).eq("id", n.id)
    if (error) throw error
  }
  for (const n of promenjeni) {
    const { error } = await supabase.from("work_orders").update({ broj_naloga: novi.get(n.id)! }).eq("id", n.id)
    if (error) throw error
  }
}

/** Prenumeriše svaki mesec kome pripada neki od datuma (YYYY-MM-DD). */
async function prenumerisiZaDatume(supabase: Supabase, datumi: (string | null | undefined)[]): Promise<void> {
  const meseci = new Map<string, { godina: number; mesec: number }>()
  for (const d of datumi) {
    const gm = d ? godinaMesec(d) : null
    if (gm) meseci.set(`${gm.godina}-${gm.mesec}`, gm)
  }
  for (const gm of Array.from(meseci.values())) {
    try {
      await prenumerisiMesec(supabase, gm.godina, gm.mesec)
    } catch (err) {
      logAppError(err instanceof Error ? err.message : String(err), "prenumerisiMesec")
    }
  }
}

/**
 * Predlog LOT-a za datum i smenu (npr. naknadno uneti nalog 06.11 smena I → 09N11)
 * i zauzeti redni brojevi LOT-a u tom mesecu (bez naloga `iskljuciId`).
 */
export async function getLotPredlog(
  datumYMD: string,
  smena: string,
  iskljuciId?: string
): Promise<{ predlog: string; zauzeti: number[] } | null> {
  const gm = godinaMesec(datumYMD)
  if (!gm) return null
  const supabase = await createClient()
  try {
    const nalozi = (await naloziMeseca(supabase, gm.godina, gm.mesec)).filter((n) => n.id !== iskljuciId)
    return predlogLotaZaSmenu(nalozi, datumYMD, smena, gm.mesec)
  } catch (err) {
    logAppError(err instanceof Error ? err.message : String(err), "getLotPredlog")
    return null
  }
}

/**
 * Privremeni broj naloga za mesec datuma (NN-MM-YY, najveći + 1). Posle čuvanja se
 * ceo mesec prenumeriše po datumu i smeni, pa nalog dobije svoj pravi redni broj.
 */
export async function getNextBrojNaloga(datumYMD?: string): Promise<string> {
  const supabase = await createClient()
  const gm = datumYMD ? godinaMesec(datumYMD) : null
  const now = new Date()
  const godina = gm?.godina ?? now.getFullYear()
  const mesec = gm?.mesec ?? now.getMonth() + 1
  const mm = String(mesec).padStart(2, "0")
  const yy = String(godina).slice(-2)
  const suffix = `-${mm}-${yy}`
  const { data, error } = await supabase
    .from("work_orders")
    .select("broj_naloga")
    .like("broj_naloga", `%${suffix}`)
  if (error) {
    logAppError(error.message, "getNextBrojNaloga")
    return `01-${mm}-${yy}`
  }
  let maxN = 0
  for (const row of data ?? []) {
    const b = String(row.broj_naloga ?? "")
    if (!b.endsWith(suffix)) continue
    const parts = b.split("-")
    if (parts.length !== 3) continue
    const n = parseInt(parts[0], 10)
    if (parts[1] === mm && parts[2] === yy && !Number.isNaN(n) && n >= 0) {
      if (n > maxN) maxN = n
    }
  }
  const next = maxN + 1
  return `${String(next).padStart(2, "0")}-${mm}-${yy}`
}

export async function createWorkOrder(data: WorkOrderFormValues): Promise<{ success: true; data: { id: string } } | { success: false; error: string }> {
  const supabase = await createClient()
  const datumStr = data.datum
  if (typeof datumStr !== "string" || !DATUM_YMD.test(datumStr)) {
    return { success: false, error: "Neispravan datum. Osvežite stranicu i pokušajte ponovo." }
  }
  try {
    const { data: workOrder, error: woError } = await supabase
      .from("work_orders")
      .insert({
        broj_naloga: data.broj_naloga,
        datum: datumStr,
        smena: data.smena,
      })
      .select("id")
      .single()

    if (woError) throw woError
    const workOrderId = workOrder.id as string

    const employees = data.radnici.map((emp_id: string) => ({
      work_order_id: workOrderId,
      employee_id: emp_id,
    }))
    const { error: empErr } = await supabase.from("work_order_employees").insert(employees)
    if (empErr) throw empErr

    const { error: drErr } = await supabase.from("draziranje").insert({
      work_order_id: workOrderId,
      radnik_id: data.draziranje.radnik_id,
      broj_draziranja: data.draziranje.broj_draziranja,
      dobavljac: data.draziranje.dobavljac,
      datum: datumStr,
      smena: data.smena,
    })
    if (drErr) throw drErr

    const { error: prErr } = await supabase.from("przenje").insert({
      work_order_id: workOrderId,
      merenje_tpm: data.przenje.merenje_tpm ?? null,
      datum: datumStr,
      smena: data.smena,
    })
    if (prErr) throw prErr

    const { error: zErr } = await supabase.from("zacinjavane").insert({
      work_order_id: workOrderId,
      datum: datumStr,
      smena: data.smena,
    })
    if (zErr) throw zErr

    const { error: pakErr } = await supabase.from("pakovanje").insert({
      work_order_id: workOrderId,
      radnik_id: data.pakovanje.radnik_id,
      pikant_15kg: data.pakovanje.pikant_15kg,
      pikant_1kg: data.pakovanje.pikant_1kg,
      pikant_200g: data.pakovanje.pikant_200g,
      pikant_150g: data.pakovanje.pikant_150g,
      pikant_80g: data.pakovanje.pikant_80g,
      bbq_15kg: data.pakovanje.bbq_15kg,
      bbq_1kg: data.pakovanje.bbq_1kg,
      bbq_200g: data.pakovanje.bbq_200g,
      bbq_150g: data.pakovanje.bbq_150g,
      bbq_80g: data.pakovanje.bbq_80g,
      lot_broj: data.pakovanje.lot_broj || null,
      datum: datumStr,
      smena: data.smena,
    })
    if (pakErr) throw pakErr

    await prenumerisiZaDatume(supabase, [datumStr])

    revalidatePath("/proizvodnja")
    return { success: true, data: { id: workOrderId } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Greška pri kreiranju naloga"
    logAppError(msg, "createWorkOrder")
    return { success: false, error: msg }
  }
}

export async function updateWorkOrder(
  id: string,
  data: WorkOrderFormValues
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient()
  const datumStr = data.datum
  if (typeof datumStr !== "string" || !DATUM_YMD.test(datumStr)) {
    return { success: false, error: "Neispravan datum. Osvežite stranicu i pokušajte ponovo." }
  }
  try {
    const { data: stari } = await supabase.from("work_orders").select("datum").eq("id", id).single()
    const stariDatum = (stari as { datum?: string } | null)?.datum

    const { error: woErr } = await supabase
      .from("work_orders")
      .update({ broj_naloga: data.broj_naloga, datum: datumStr, smena: data.smena, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (woErr) throw woErr

    await supabase.from("work_order_employees").delete().eq("work_order_id", id)
    const employees = data.radnici.map((emp_id: string) => ({ work_order_id: id, employee_id: emp_id }))
    await supabase.from("work_order_employees").insert(employees)

    const { error: drErr } = await supabase
      .from("draziranje")
      .update({
        radnik_id: data.draziranje.radnik_id,
        broj_draziranja: data.draziranje.broj_draziranja,
        dobavljac: data.draziranje.dobavljac,
        datum: datumStr,
        smena: data.smena,
      })
      .eq("work_order_id", id)
    if (drErr) throw drErr

    await supabase
      .from("przenje")
      .update({ merenje_tpm: data.przenje.merenje_tpm ?? null, datum: datumStr, smena: data.smena })
      .eq("work_order_id", id)

    const { error: pakErr } = await supabase
      .from("pakovanje")
      .update({
        radnik_id: data.pakovanje.radnik_id,
        pikant_15kg: data.pakovanje.pikant_15kg,
        pikant_1kg: data.pakovanje.pikant_1kg,
        pikant_200g: data.pakovanje.pikant_200g,
        pikant_150g: data.pakovanje.pikant_150g,
        pikant_80g: data.pakovanje.pikant_80g,
        bbq_15kg: data.pakovanje.bbq_15kg,
        bbq_1kg: data.pakovanje.bbq_1kg,
        bbq_200g: data.pakovanje.bbq_200g,
        bbq_150g: data.pakovanje.bbq_150g,
        bbq_80g: data.pakovanje.bbq_80g,
        lot_broj: data.pakovanje.lot_broj || null,
        datum: datumStr,
        smena: data.smena,
      })
      .eq("work_order_id", id)
    if (pakErr) throw pakErr

    // Ako je promenjen datum ili smena, redosled u mesecu (ili u dva meseca) se menja.
    await prenumerisiZaDatume(supabase, [datumStr, stariDatum])

    revalidatePath("/proizvodnja")
    revalidatePath(`/proizvodnja/${id}`)
    revalidatePath(`/proizvodnja/${id}/uredi`)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Greška pri izmeni naloga"
    logAppError(msg, "updateWorkOrder")
    return { success: false, error: msg }
  }
}

export async function deleteWorkOrder(id: string): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient()
  const { data: stari } = await supabase.from("work_orders").select("datum").eq("id", id).single()
  const { error } = await supabase.from("work_orders").delete().eq("id", id)
  if (error) {
    logAppError(error.message, "deleteWorkOrder")
    return { success: false, error: error.message }
  }
  await prenumerisiZaDatume(supabase, [(stari as { datum?: string } | null)?.datum])
  revalidatePath("/proizvodnja")
  return { success: true }
}
