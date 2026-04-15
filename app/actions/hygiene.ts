"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import { getCurrentUser } from "@/lib/auth/user"
import { getUserPermissions, canEdit } from "@/lib/auth/permissions"
import type {
  HygieneTemplate,
  HygieneChecklist,
  HygieneChecklistSummary,
  HygieneChecklistDetail,
  HygieneCompletionWithRelations,
  HygieneGrupa,
  HygienePeriod,
} from "@/lib/types/hygiene"

/** Svi aktivni templates sortirani po redosledu. */
export async function getHygieneTemplates(): Promise<HygieneTemplate[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("hygiene_templates")
    .select("*")
    .eq("aktivan", true)
    .order("redosled", { ascending: true })

  if (error) {
    logAppError(error.message, "getHygieneTemplates")
    return []
  }
  return (data ?? []) as HygieneTemplate[]
}

/** Svi templates (i neaktivni) za admin. */
export async function getAllHygieneTemplates(): Promise<HygieneTemplate[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("hygiene_templates")
    .select("*")
    .order("redosled", { ascending: true })

  if (error) {
    logAppError(error.message, "getAllHygieneTemplates")
    return []
  }
  return (data ?? []) as HygieneTemplate[]
}

/** Lista ček lista za godinu sa brojem completions. */
export async function getHygieneChecklists(godina: number): Promise<HygieneChecklistSummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("hygiene_checklists")
    .select("id, mesec, godina, verifikator_id")
    .eq("godina", godina)
    .order("mesec", { ascending: false })

  if (error) {
    logAppError(error.message, "getHygieneChecklists")
    return []
  }

  const list = data ?? []
  if (list.length === 0) return []

  // Prebroji completions za svaku ček listu
  const ids = list.map((l) => l.id as string)
  const { data: countData } = await supabase
    .from("hygiene_completions")
    .select("checklist_id")
    .in("checklist_id", ids)

  const counts = new Map<string, number>()
  for (const r of countData ?? []) {
    const k = r.checklist_id as string
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }

  return list.map((r) => ({
    id: r.id as string,
    mesec: r.mesec as number,
    godina: r.godina as number,
    total_completions: counts.get(r.id as string) ?? 0,
    has_verifikacija: r.verifikator_id !== null,
  }))
}

/** Detalji jedne ček liste sa svim completions i templates. */
export async function getHygieneChecklistDetail(id: string): Promise<HygieneChecklistDetail | null> {
  const supabase = await createClient()

  const [checklistRes, templatesRes, completionsRes] = await Promise.all([
    supabase
      .from("hygiene_checklists")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("hygiene_templates")
      .select("*")
      .eq("aktivan", true)
      .order("redosled", { ascending: true }),
    supabase
      .from("hygiene_completions")
      .select("*")
      .eq("checklist_id", id)
      .order("datum_uradjeno", { ascending: true }),
  ])

  if (checklistRes.error || !checklistRes.data) {
    if (checklistRes.error) logAppError(checklistRes.error.message, "getHygieneChecklistDetail")
    return null
  }

  const cl = checklistRes.data as HygieneChecklist

  // Odvojeno fetch-uj verifikatora i radnike iz completions
  const employeeIds = new Set<string>()
  if (cl.verifikator_id) employeeIds.add(cl.verifikator_id)
  for (const c of completionsRes.data ?? []) {
    if (c.employee_id) employeeIds.add(c.employee_id as string)
  }

  const employeeMap = new Map<string, { ime: string; prezime: string }>()
  if (employeeIds.size > 0) {
    const { data: empData } = await supabase
      .from("employees")
      .select("id, ime, prezime")
      .in("id", Array.from(employeeIds))
    for (const e of empData ?? []) {
      employeeMap.set(e.id as string, {
        ime: String(e.ime ?? ""),
        prezime: String(e.prezime ?? ""),
      })
    }
  }

  const verifikator = cl.verifikator_id ? employeeMap.get(cl.verifikator_id) ?? null : null

  return {
    id: cl.id,
    mesec: cl.mesec,
    godina: cl.godina,
    verifikator_id: cl.verifikator_id,
    verifikator_funkcija: cl.verifikator_funkcija,
    verifikator_datum: cl.verifikator_datum,
    napomena: cl.napomena,
    created_by: cl.created_by,
    created_at: cl.created_at,
    templates: (templatesRes.data ?? []) as HygieneTemplate[],
    completions: (completionsRes.data ?? []).map((r) => ({
      id: r.id as string,
      checklist_id: r.checklist_id as string,
      template_id: r.template_id as string,
      datum_uradjeno: r.datum_uradjeno as string,
      employee_id: (r.employee_id as string | null) ?? null,
      napomena: (r.napomena as string | null) ?? null,
      created_at: r.created_at as string | undefined,
      employee: r.employee_id ? employeeMap.get(r.employee_id as string) ?? null : null,
    })),
    verifikator,
  }
}

/** Kreiraj mesečnu ček listu (ili vrati postojeću). */
export async function createHygieneChecklistAction(
  mesec: number,
  godina: number
): Promise<{ id?: string; error?: string }> {
  if (mesec < 1 || mesec > 12) return { error: "Mesec mora biti 1-12." }
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("hygiene_checklists")
    .select("id")
    .eq("mesec", mesec)
    .eq("godina", godina)
    .maybeSingle()

  if (existing) {
    return { id: existing.id as string }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from("hygiene_checklists")
    .insert({ mesec, godina, created_by: user?.id ?? null })
    .select("id")
    .single()

  if (error || !data) {
    logAppError(error?.message ?? "Insert failed", "createHygieneChecklistAction")
    return { error: error?.message ?? "Greška pri kreiranju ček liste." }
  }

  revalidatePath("/proizvodnja/higijena")
  return { id: data.id as string }
}

/** Dodaj "urađeno" događaj za stavku. */
export async function addCompletionAction(
  checklistId: string,
  templateId: string,
  datum: string,
  employeeId: string | null,
  napomena: string | null
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from("hygiene_completions")
    .insert({
      checklist_id: checklistId,
      template_id: templateId,
      datum_uradjeno: datum,
      employee_id: employeeId || null,
      napomena: napomena || null,
      created_by: user?.id ?? null,
    })

  if (error) {
    logAppError(error.message, "addCompletionAction")
    return { error: error.message }
  }
  revalidatePath(`/proizvodnja/higijena/${checklistId}`)
  return {}
}

/** Ažuriraj jedan completion. */
export async function updateCompletionAction(
  id: string,
  patch: { datum_uradjeno?: string; employee_id?: string | null; napomena?: string | null }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error, data } = await supabase
    .from("hygiene_completions")
    .update({
      ...(patch.datum_uradjeno ? { datum_uradjeno: patch.datum_uradjeno } : {}),
      ...("employee_id" in patch ? { employee_id: patch.employee_id || null } : {}),
      ...("napomena" in patch ? { napomena: patch.napomena || null } : {}),
    })
    .eq("id", id)
    .select("checklist_id")
    .maybeSingle()

  if (error) {
    logAppError(error.message, "updateCompletionAction")
    return { error: error.message }
  }
  if (data?.checklist_id) revalidatePath(`/proizvodnja/higijena/${data.checklist_id}`)
  return {}
}

/** Obriši jedan completion. */
export async function deleteCompletionAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("hygiene_completions")
    .delete()
    .eq("id", id)
    .select("checklist_id")
    .maybeSingle()

  if (error) {
    logAppError(error.message, "deleteCompletionAction")
    return { error: error.message }
  }
  if (data?.checklist_id) revalidatePath(`/proizvodnja/higijena/${data.checklist_id}`)
  return {}
}

/** Postavi verifikaciju (datum, verifikator, funkcija). */
export async function setVerifikacijaAction(
  checklistId: string,
  verifikatorId: string | null,
  funkcija: string | null,
  datum: string | null,
  napomena: string | null
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("hygiene_checklists")
    .update({
      verifikator_id: verifikatorId || null,
      verifikator_funkcija: funkcija || null,
      verifikator_datum: datum || null,
      napomena: napomena || null,
    })
    .eq("id", checklistId)

  if (error) {
    logAppError(error.message, "setVerifikacijaAction")
    return { error: error.message }
  }
  revalidatePath(`/proizvodnja/higijena/${checklistId}`)
  return {}
}

/** Obriši celu mesečnu ček listu (i completions kroz cascade). */
export async function deleteHygieneChecklistAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("hygiene_checklists").delete().eq("id", id)
  if (error) {
    logAppError(error.message, "deleteHygieneChecklistAction")
    return { error: error.message }
  }
  revalidatePath("/proizvodnja/higijena")
  return {}
}

/** ---- ADMIN: upravljanje template-ima ---- */

export async function upsertHygieneTemplateAction(payload: {
  id?: string
  naziv: string
  grupa: HygieneGrupa
  period: HygienePeriod
  redosled: number
  aktivan: boolean
}): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const permissions = await getUserPermissions(user.id)
  if (!canEdit(permissions, "proizvodnja")) {
    return { error: "Nemate pravo da menjate stavke ček liste." }
  }

  if (!payload.naziv.trim()) return { error: "Naziv je obavezan." }

  const supabase = await createClient()
  const row = {
    naziv: payload.naziv.trim(),
    grupa: payload.grupa,
    period: payload.period,
    redosled: payload.redosled,
    aktivan: payload.aktivan,
  }

  if (payload.id) {
    const { error } = await supabase.from("hygiene_templates").update(row).eq("id", payload.id)
    if (error) {
      logAppError(error.message, "upsertHygieneTemplateAction:update")
      return { error: error.message }
    }
  } else {
    const { error } = await supabase.from("hygiene_templates").insert(row)
    if (error) {
      logAppError(error.message, "upsertHygieneTemplateAction:insert")
      return { error: error.message }
    }
  }
  revalidatePath("/proizvodnja/higijena/podesavanja")
  revalidatePath("/proizvodnja/higijena")
  return {}
}

export async function deactivateHygieneTemplateAction(id: string): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const permissions = await getUserPermissions(user.id)
  if (!canEdit(permissions, "proizvodnja")) {
    return { error: "Nemate pravo da deaktivirate stavke." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("hygiene_templates")
    .update({ aktivan: false })
    .eq("id", id)

  if (error) {
    logAppError(error.message, "deactivateHygieneTemplateAction")
    return { error: error.message }
  }
  revalidatePath("/proizvodnja/higijena/podesavanja")
  return {}
}
