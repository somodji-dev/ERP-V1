"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logAppError } from "@/lib/logger"
import type { AdditionalExpense, MonthlyChartPoint } from "@/lib/types/additional-expenses"

const MESECI = ["", "Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Avg", "Sep", "Okt", "Nov", "Dec"]

/** Dodatni troškovi za datu godinu. */
export async function getAdditionalExpenses(godina: number): Promise<AdditionalExpense[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("additional_expenses")
    .select("*")
    .eq("godina", godina)
    .order("mesec", { ascending: true })

  if (error) {
    logAppError(error.message, "getAdditionalExpenses")
    return []
  }
  return (data ?? []) as AdditionalExpense[]
}

/** Podaci za grafikon: neposlovni + bankomat + neto cash flow. */
export async function getChartData(
  rangeType: "12" | "year" | "range",
  options: { godina?: number; fromY?: number; fromM?: number; toY?: number; toM?: number }
): Promise<MonthlyChartPoint[]> {
  const supabase = await createClient()
  const now = new Date()

  // Odredi listu meseci (year, month) za koje trebaju podaci
  const months: { mesec: number; godina: number }[] = []
  if (rangeType === "12") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ mesec: d.getMonth() + 1, godina: d.getFullYear() })
    }
  } else if (rangeType === "year" && options.godina) {
    for (let m = 1; m <= 12; m++) {
      months.push({ mesec: m, godina: options.godina })
    }
  } else if (rangeType === "range" && options.fromY && options.fromM && options.toY && options.toM) {
    let y = options.fromY
    let m = options.fromM
    while (y < options.toY || (y === options.toY && m <= options.toM)) {
      months.push({ mesec: m, godina: y })
      m++
      if (m > 12) { m = 1; y++ }
    }
  }

  if (months.length === 0) return []

  const godine = Array.from(new Set(months.map((x) => x.godina)))

  // Fetch oba izvora paralelno
  const [expensesRes, snapshotsRes] = await Promise.all([
    supabase.from("additional_expenses")
      .select("mesec, godina, neposlovni, bankomat")
      .in("godina", godine),
    supabase.from("cash_snapshots")
      .select("mesec, godina, neto_cash_flow")
      .in("godina", godine),
  ])

  const expMap = new Map<string, { neposlovni: number; bankomat: number }>()
  for (const r of expensesRes.data ?? []) {
    expMap.set(`${r.godina}-${r.mesec}`, {
      neposlovni: Number(r.neposlovni ?? 0),
      bankomat: Number(r.bankomat ?? 0),
    })
  }
  const cashMap = new Map<string, number>()
  for (const r of snapshotsRes.data ?? []) {
    cashMap.set(`${r.godina}-${r.mesec}`, Number(r.neto_cash_flow ?? 0))
  }

  return months.map((mm) => {
    const key = `${mm.godina}-${mm.mesec}`
    const exp = expMap.get(key)
    return {
      mesec: mm.mesec,
      godina: mm.godina,
      label: `${MESECI[mm.mesec]} ${String(mm.godina).slice(-2)}`,
      neposlovni: exp?.neposlovni ?? 0,
      bankomat: exp?.bankomat ?? 0,
      neto_cash_flow: cashMap.get(key) ?? 0,
    }
  })
}

/** Upsert (insert ili update) za mesec+godina. */
export async function upsertAdditionalExpenseAction(
  mesec: number,
  godina: number,
  neposlovni: number,
  bankomat: number,
  napomena: string | null
): Promise<{ error?: string }> {
  if (mesec < 1 || mesec > 12) return { error: "Mesec mora biti 1–12." }
  if (neposlovni < 0 || bankomat < 0) return { error: "Iznosi ne mogu biti negativni." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from("additional_expenses")
    .upsert(
      {
        mesec,
        godina,
        neposlovni,
        bankomat,
        napomena: napomena || null,
        created_by: user?.id ?? null,
      },
      { onConflict: "mesec,godina" }
    )

  if (error) {
    logAppError(error.message, "upsertAdditionalExpenseAction")
    return { error: error.message }
  }
  revalidatePath("/dodatni-troskovi")
  return {}
}

/** Brisanje unosa. */
export async function deleteAdditionalExpenseAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("additional_expenses")
    .delete()
    .eq("id", id)

  if (error) {
    logAppError(error.message, "deleteAdditionalExpenseAction")
    return { error: error.message }
  }
  revalidatePath("/dodatni-troskovi")
  return {}
}
