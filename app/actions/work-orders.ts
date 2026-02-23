"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import type { WorkOrderFormValues } from "@/lib/proizvodnja/validation"

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Format: NN-MM-YY (redni broj u mesecu, mesec, godina); npr. 01-02-25. Sledeći = max(NN) za taj mesec + 1. */
export async function getNextBrojNaloga(): Promise<string> {
  const supabase = await createClient()
  const now = new Date()
  const godina = now.getFullYear()
  const mesec = now.getMonth() + 1
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
  const datumStr = toDateStr(data.datum)
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
  const datumStr = toDateStr(data.datum)
  try {
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
  const { error } = await supabase.from("work_orders").delete().eq("id", id)
  if (error) {
    logAppError(error.message, "deleteWorkOrder")
    return { success: false, error: error.message }
  }
  revalidatePath("/proizvodnja")
  return { success: true }
}
