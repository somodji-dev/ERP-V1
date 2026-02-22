"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/user"
import { getUserPermissions, canEdit } from "@/lib/auth/permissions"
import { redirect } from "next/navigation"

export type CompanySettingsInput = {
  naziv?: string | null
  pib?: string | null
  maticni_broj?: string | null
  adresa?: string | null
  grad?: string | null
  postanski_broj?: string | null
  telefon?: string | null
  email?: string | null
}

export async function getCompanySettings() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("company_settings")
    .select("*")
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function saveCompanySettings(input: CompanySettingsInput) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const permissions = await getUserPermissions(user.id)
  if (!canEdit(permissions, "podesavanja")) {
    throw new Error("Nemate pravo da menjate podatke firme.")
  }

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from("company_settings")
    .select("id")
    .limit(1)
    .maybeSingle()

  const row = {
    naziv: input.naziv ?? null,
    pib: input.pib ?? null,
    maticni_broj: input.maticni_broj ?? null,
    adresa: input.adresa ?? null,
    grad: input.grad ?? null,
    postanski_broj: input.postanski_broj ?? null,
    telefon: input.telefon ?? null,
    email: input.email ?? null,
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    const { error } = await supabase
      .from("company_settings")
      .update(row)
      .eq("id", existing.id)
    if (error) throw new Error(error.message)
    return { id: existing.id }
  }

  const { data: inserted, error } = await supabase
    .from("company_settings")
    .insert(row)
    .select("id")
    .single()
  if (error) throw new Error(error.message)
  return { id: inserted.id }
}
