"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import { z } from "zod"

const createEmployeeSchema = z.object({
  ime: z.string().min(1, "Ime je obavezno"),
  prezime: z.string().min(1, "Prezime je obavezno"),
  jmbg: z.string().optional(),
  pozicija: z.string().optional(),
  datum_zaposlenja: z.string().optional(),
  godisnji_fond: z
    .union([z.number().int().min(0), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v)),
  nadoknada_prevoz: z
    .union([z.number().min(0), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v)),
  aktivan: z.boolean().optional().default(true),
  napomena: z.string().optional(),
})

export type CreateEmployeeState =
  | { success: true; id: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function createEmployeeAction(
  _prevState: CreateEmployeeState | null,
  formData: FormData
): Promise<CreateEmployeeState> {
  const raw = {
    ime: formData.get("ime") ?? "",
    prezime: formData.get("prezime") ?? "",
    jmbg: (formData.get("jmbg") as string) || undefined,
    pozicija: (formData.get("pozicija") as string) || undefined,
    datum_zaposlenja: (formData.get("datum_zaposlenja") as string) || undefined,
    godisnji_fond:
      formData.get("godisnji_fond") === ""
        ? undefined
        : Number(formData.get("godisnji_fond")),
    nadoknada_prevoz:
      formData.get("nadoknada_prevoz") === ""
        ? undefined
        : Number(formData.get("nadoknada_prevoz")),
    aktivan: formData.get("aktivan") === "true",
    napomena: (formData.get("napomena") as string) || undefined,
  }

  const parsed = createEmployeeSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    parsed.error.flatten().fieldErrors &&
      Object.entries(parsed.error.flatten().fieldErrors).forEach(([k, v]) => {
        if (v) fieldErrors[k] = v
      })
    logAppError(parsed.error.message, "createEmployeeAction")
    return {
      success: false,
      error: parsed.error.message,
      fieldErrors,
    }
  }

  const supabase = await createClient()
  const row = {
    ime: parsed.data.ime,
    prezime: parsed.data.prezime,
    jmbg: parsed.data.jmbg || null,
    pozicija: parsed.data.pozicija || null,
    datum_zaposlenja: parsed.data.datum_zaposlenja || null,
    godisnji_fond: parsed.data.godisnji_fond ?? 20,
    nadoknada_prevoz: parsed.data.nadoknada_prevoz ?? 0,
    aktivan: parsed.data.aktivan ?? true,
    napomena: parsed.data.napomena || null,
  }

  const { data, error } = await supabase.from("employees").insert(row).select("id").maybeSingle()

  if (error) {
    logAppError(error.message, "createEmployeeAction")
    return { success: false, error: error.message }
  }

  revalidatePath("/radnici")
  return { success: true, id: data?.id ?? "" }
}

export type UpdateEmployeeState =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function updateEmployeeAction(
  id: string,
  _prevState: UpdateEmployeeState | null,
  formData: FormData
): Promise<UpdateEmployeeState> {
  const raw = {
    ime: formData.get("ime") ?? "",
    prezime: formData.get("prezime") ?? "",
    jmbg: (formData.get("jmbg") as string) || undefined,
    pozicija: (formData.get("pozicija") as string) || undefined,
    datum_zaposlenja: (formData.get("datum_zaposlenja") as string) || undefined,
    godisnji_fond:
      formData.get("godisnji_fond") === ""
        ? undefined
        : Number(formData.get("godisnji_fond")),
    nadoknada_prevoz:
      formData.get("nadoknada_prevoz") === ""
        ? undefined
        : Number(formData.get("nadoknada_prevoz")),
    aktivan: formData.get("aktivan") === "true",
    napomena: (formData.get("napomena") as string) || undefined,
  }

  const parsed = createEmployeeSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    parsed.error.flatten().fieldErrors &&
      Object.entries(parsed.error.flatten().fieldErrors).forEach(([k, v]) => {
        if (v) fieldErrors[k] = v
      })
    logAppError(parsed.error.message, "updateEmployeeAction")
    return { success: false, error: parsed.error.message, fieldErrors }
  }

  const supabase = await createClient()
  const row = {
    ime: parsed.data.ime,
    prezime: parsed.data.prezime,
    jmbg: parsed.data.jmbg || null,
    pozicija: parsed.data.pozicija || null,
    datum_zaposlenja: parsed.data.datum_zaposlenja || null,
    godisnji_fond: parsed.data.godisnji_fond ?? 20,
    nadoknada_prevoz: parsed.data.nadoknada_prevoz ?? 0,
    aktivan: parsed.data.aktivan ?? true,
    napomena: parsed.data.napomena || null,
  }

  const { error } = await supabase.from("employees").update(row).eq("id", id)

  if (error) {
    logAppError(error.message, "updateEmployeeAction")
    return { success: false, error: error.message }
  }

  revalidatePath("/radnici")
  revalidatePath(`/radnici/${id}`)
  revalidatePath(`/radnici/${id}/uredi`)
  return { success: true }
}
