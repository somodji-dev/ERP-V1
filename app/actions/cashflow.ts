"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import { getCurrentUser } from "@/lib/auth/user"
import type { CreateBrziPayload, CreateDetaljanPayload } from "@/lib/types/cashflow"

export async function listSnapshots(): Promise<
  { data: Array<Record<string, unknown>>; error?: string }
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cash_snapshots")
    .select("id, mesec, godina, tip_unosa, ukupno_cash, dugovanja_dobavljaci, neto_cash_flow, datum_unosa")
    .order("godina", { ascending: false })
    .order("mesec", { ascending: false })

  if (error) {
    logAppError(error.message, "listSnapshots")
    return { data: [], error: error.message }
  }
  return { data: data ?? [] }
}

export async function getSnapshot(id: string): Promise<{
  data: Record<string, unknown> | null
  error?: string
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cash_snapshots")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    logAppError(error.message, "getSnapshot")
    return { data: null, error: error.message }
  }
  return { data }
}

export async function getExcelPartners(snapshotId: string): Promise<{
  data: Array<{ partner_naziv: string; kupci_iznos: number; dobavljaci_iznos: number }>
  error?: string
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("excel_partners")
    .select("partner_naziv, kupci_iznos, dobavljaci_iznos")
    .eq("snapshot_id", snapshotId)
    .order("partner_naziv", { ascending: true })

  if (error) {
    logAppError(error.message, "getExcelPartners")
    return { data: [], error: error.message }
  }
  return {
    data: (data ?? []).map((r) => ({
      partner_naziv: String(r.partner_naziv ?? ""),
      kupci_iznos: Number(r.kupci_iznos ?? 0),
      dobavljaci_iznos: Number(r.dobavljaci_iznos ?? 0),
    })),
  }
}

export async function createBrziSnapshotAction(
  payload: CreateBrziPayload
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  return createBrziSnapshot(payload, user?.id ?? null)
}

export async function createBrziSnapshot(
  payload: CreateBrziPayload,
  createdBy: string | null
): Promise<{ error?: string }> {
  const neto = payload.ukupno_cash - payload.dugovanja_dobavljaci
  const supabase = await createClient()
  const { error } = await supabase.from("cash_snapshots").insert({
    mesec: payload.mesec,
    godina: payload.godina,
    tip_unosa: "brzi",
    ukupno_cash: payload.ukupno_cash,
    dugovanja_dobavljaci: payload.dugovanja_dobavljaci,
    neto_cash_flow: neto,
    created_by: createdBy,
  })

  if (error) {
    logAppError(error.message, "createBrziSnapshot")
    return { error: error.message }
  }
  revalidatePath("/cash-flow")
  return {}
}

export async function createDetaljanSnapshotAction(
  payload: CreateDetaljanPayload
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  return createDetaljanSnapshot(payload, user?.id ?? null)
}

export async function createDetaljanSnapshot(
  payload: CreateDetaljanPayload,
  createdBy: string | null
): Promise<{ error?: string }> {
  const ukupnoCash =
    payload.potrazivanja_kupci +
    payload.racun_intesa +
    payload.racun_nlb +
    payload.devizni_racun +
    payload.gotovi_proizvodi +
    payload.sirovine +
    payload.ostalo
  const neto = ukupnoCash - payload.dugovanja_dobavljaci

  const supabase = await createClient()
  const { data: inserted, error: insertErr } = await supabase
    .from("cash_snapshots")
    .insert({
      mesec: payload.mesec,
      godina: payload.godina,
      tip_unosa: "detaljan",
      potrazivanja_kupci: payload.potrazivanja_kupci,
      racun_intesa: payload.racun_intesa,
      racun_nlb: payload.racun_nlb,
      devizni_racun: payload.devizni_racun,
      gotovi_proizvodi: payload.gotovi_proizvodi,
      sirovine: payload.sirovine,
      ostalo: payload.ostalo,
      ukupno_cash: ukupnoCash,
      dugovanja_dobavljaci: payload.dugovanja_dobavljaci,
      neto_cash_flow: neto,
      created_by: createdBy,
    })
    .select("id")
    .single()

  if (insertErr) {
    logAppError(insertErr.message, "createDetaljanSnapshot")
    return { error: insertErr.message }
  }

  if (payload.excel_partners.length > 0 && inserted?.id) {
    const rows = payload.excel_partners.map((p) => ({
      snapshot_id: inserted.id,
      partner_naziv: p.partner_naziv,
      kupci_iznos: p.kupci_iznos,
      dobavljaci_iznos: p.dobavljaci_iznos,
    }))
    const { error: partnersErr } = await supabase.from("excel_partners").insert(rows)
    if (partnersErr) {
      logAppError(partnersErr.message, "createDetaljanSnapshot.excel_partners")
      return { error: partnersErr.message }
    }
  }

  revalidatePath("/cash-flow")
  return {}
}

export async function updateSnapshot(
  id: string,
  payload: Partial<CreateBrziPayload & Omit<CreateDetaljanPayload, "excel_partners">>,
  tipUnosa: "brzi" | "detaljan"
): Promise<{ error?: string }> {
  const supabase = await createClient()

  if (tipUnosa === "brzi" && payload.ukupno_cash != null && payload.dugovanja_dobavljaci != null) {
    const neto = payload.ukupno_cash - payload.dugovanja_dobavljaci
    const { error } = await supabase
      .from("cash_snapshots")
      .update({
        mesec: payload.mesec,
        godina: payload.godina,
        ukupno_cash: payload.ukupno_cash,
        dugovanja_dobavljaci: payload.dugovanja_dobavljaci,
        neto_cash_flow: neto,
      })
      .eq("id", id)
    if (error) {
      logAppError(error.message, "updateSnapshot")
      return { error: error.message }
    }
  } else if (tipUnosa === "detaljan") {
    const ukupnoCash =
      (payload.potrazivanja_kupci ?? 0) +
      (payload.racun_intesa ?? 0) +
      (payload.racun_nlb ?? 0) +
      (payload.devizni_racun ?? 0) +
      (payload.gotovi_proizvodi ?? 0) +
      (payload.sirovine ?? 0) +
      (payload.ostalo ?? 0)
    const dugovanja = payload.dugovanja_dobavljaci ?? 0
    const { error } = await supabase
      .from("cash_snapshots")
      .update({
        mesec: payload.mesec,
        godina: payload.godina,
        potrazivanja_kupci: payload.potrazivanja_kupci,
        racun_intesa: payload.racun_intesa,
        racun_nlb: payload.racun_nlb,
        devizni_racun: payload.devizni_racun,
        gotovi_proizvodi: payload.gotovi_proizvodi,
        sirovine: payload.sirovine,
        ostalo: payload.ostalo,
        ukupno_cash: ukupnoCash,
        dugovanja_dobavljaci: dugovanja,
        neto_cash_flow: ukupnoCash - dugovanja,
      })
      .eq("id", id)
    if (error) {
      logAppError(error.message, "updateSnapshot")
      return { error: error.message }
    }
  }

  revalidatePath("/cash-flow")
  revalidatePath(`/cash-flow/${id}`)
  revalidatePath(`/cash-flow/${id}/uredi`)
  return {}
}

export async function updateSnapshotAction(
  id: string,
  payload: Parameters<typeof updateSnapshot>[1],
  tipUnosa: "brzi" | "detaljan"
): Promise<{ error?: string }> {
  return updateSnapshot(id, payload, tipUnosa)
}

export async function deleteCashSnapshotAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cash_snapshots")
    .delete()
    .eq("id", id)
    .select("id")
  if (error) {
    logAppError(error.message, "deleteCashSnapshotAction")
    return { error: error.message }
  }
  if (!data || data.length === 0) {
    logAppError("Delete affected 0 rows (RLS?)", "deleteCashSnapshotAction")
    return { error: "Snimak nije obrisan. Proverite da li postoji RLS policy za DELETE na cash_snapshots." }
  }
  revalidatePath("/cash-flow")
  return {}
}

export async function getLastSnapshotForKpi(): Promise<{
  ukupno_cash: number
  dugovanja_dobavljaci: number
  neto_cash_flow: number
  mesec: number
  godina: number
} | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("cash_snapshots")
    .select("ukupno_cash, dugovanja_dobavljaci, neto_cash_flow, mesec, godina")
    .order("godina", { ascending: false })
    .order("mesec", { ascending: false })
    .limit(1)
    .single()

  if (!data) return null
  return {
    ukupno_cash: Number(data.ukupno_cash ?? 0),
    dugovanja_dobavljaci: Number(data.dugovanja_dobavljaci ?? 0),
    neto_cash_flow: Number(data.neto_cash_flow ?? 0),
    mesec: Number(data.mesec ?? 0),
    godina: Number(data.godina ?? 0),
  }
}

export async function getSnapshotsForChart(limit = 12): Promise<
  Array<{ mesec: number; godina: number; ukupno_cash: number; dugovanja_dobavljaci: number; neto_cash_flow: number }>
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("cash_snapshots")
    .select("mesec, godina, ukupno_cash, dugovanja_dobavljaci, neto_cash_flow")
    .order("godina", { ascending: true })
    .order("mesec", { ascending: true })

  const list = data ?? []
  const lastN = list.slice(-limit)
  return lastN.map((r) => ({
    mesec: Number(r.mesec),
    godina: Number(r.godina),
    ukupno_cash: Number(r.ukupno_cash ?? 0),
    dugovanja_dobavljaci: Number(r.dugovanja_dobavljaci ?? 0),
    neto_cash_flow: Number(r.neto_cash_flow ?? 0),
  }))
}

export async function getTwoSnapshotsForCompare(
  id1: string,
  id2: string
): Promise<{
  a: Record<string, unknown> | null
  b: Record<string, unknown> | null
  error?: string
}> {
  const supabase = await createClient()
  const [r1, r2] = await Promise.all([
    supabase.from("cash_snapshots").select("*").eq("id", id1).single(),
    supabase.from("cash_snapshots").select("*").eq("id", id2).single(),
  ])
  if (r1.error) {
    logAppError(r1.error.message, "getTwoSnapshotsForCompare")
    return { a: null, b: null, error: r1.error.message }
  }
  if (r2.error) {
    logAppError(r2.error.message, "getTwoSnapshotsForCompare")
    return { a: null, b: null, error: r2.error.message }
  }
  return { a: r1.data, b: r2.data }
}
