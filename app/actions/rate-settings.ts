"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import { RATE_TIPS } from "@/lib/radnici/rate-settings"

export type RateRow = {
  id: string
  tip: string
  iznos: number
  vazi_od: string
  napomena: string | null
}

export async function getLatestRates(): Promise<RateRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("rate_settings")
    .select("id, tip, iznos, vazi_od, napomena")
    .order("vazi_od", { ascending: false })

  const byTip = new Map<string, RateRow>()
  if (!error && data) {
    for (const row of data) {
      if (!byTip.has(row.tip)) byTip.set(row.tip, row as RateRow)
    }
  }
  return RATE_TIPS.map((tip) =>
    byTip.get(tip) ?? ({ id: "", tip, iznos: 0, vazi_od: "", napomena: null } as RateRow)
  )
}

export async function insertRateAction(formData: FormData): Promise<{ error?: string }> {
  const tip = formData.get("tip") as string
  const iznosStr = formData.get("iznos") as string
  const vaziOd = formData.get("vazi_od") as string
  const napomena = (formData.get("napomena") as string) || null

  if (!tip || !iznosStr || !vaziOd) {
    logAppError("Tip, iznos i važi od su obavezni.", "insertRateAction")
    return { error: "Tip, iznos i važi od su obavezni." }
  }
  const iznos = Number(iznosStr)
  if (Number.isNaN(iznos) || iznos < 0) {
    logAppError("Iznos mora biti nula ili veći.", "insertRateAction")
    return { error: "Iznos mora biti nula ili veći." }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("rate_settings").insert({
    tip,
    iznos,
    vazi_od: vaziOd,
    napomena,
  })

  if (error) {
    logAppError(error.message, "insertRateAction")
    return { error: error.message }
  }
  revalidatePath("/radnici/podesavanja")
  return {}
}
