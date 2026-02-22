import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { WorkOrderForm } from "@/components/proizvodnja/WorkOrderForm"
import type { WorkOrderFormValues } from "@/lib/proizvodnja/validation"

type Props = { params: Promise<{ id: string }> }

type NalogRow = {
  id: string
  broj_naloga: string
  datum: string
  smena: string
  work_order_employees: Array<{ employee_id?: string }>
  draziranje: Array<{ radnik_id: string; broj_draziranja: number; dobavljac: string }>
  przenje: Array<{ merenje_tpm: number | null }>
  pakovanje: Array<{
    radnik_id: string
    pikant_15kg: number | null
    pikant_1kg: number | null
    pikant_200g: number | null
    pikant_150g: number | null
    pikant_80g: number | null
    bbq_15kg: number | null
    bbq_1kg: number | null
    bbq_200g: number | null
    bbq_150g: number | null
    bbq_80g: number | null
    lot_broj: string | null
  }>
}

/** Prvi red iz relacije — Supabase može vratiti niz ili objekat. */
function firstRow<T>(rel: T[] | T | null | undefined): T | null {
  if (rel == null) return null
  if (Array.isArray(rel)) return rel[0] ?? null
  return rel
}

async function getNalog(id: string): Promise<NalogRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("work_orders")
    .select(
      `
      id,
      broj_naloga,
      datum,
      smena,
      work_order_employees (employee_id),
      draziranje (radnik_id, broj_draziranja, dobavljac),
      przenje (merenje_tpm),
      pakovanje (
        radnik_id,
        pikant_15kg, pikant_1kg, pikant_200g, pikant_150g, pikant_80g,
        bbq_15kg, bbq_1kg, bbq_200g, bbq_150g, bbq_80g,
        lot_broj
      )
    `
    )
    .eq("id", id)
    .single()

  if (error || !data) return null
  const nalog = data as unknown as NalogRow

  // Ako ugnježdene relacije nisu došle, učitaj ih posebno (isti problem kao na detalj stranici)
  const raw = nalog as Record<string, unknown>
  const hasDraziranje = Array.isArray(raw.draziranje) && (raw.draziranje as unknown[]).length > 0
  const hasPakovanje = Array.isArray(raw.pakovanje) && (raw.pakovanje as unknown[]).length > 0
  const hasPrzenje = Array.isArray(raw.przenje) && (raw.przenje as unknown[]).length > 0

  if (!hasDraziranje || !hasPakovanje || !hasPrzenje) {
    const [drRes, pakRes, prRes] = await Promise.all([
      !hasDraziranje ? supabase.from("draziranje").select("radnik_id, broj_draziranja, dobavljac").eq("work_order_id", id).maybeSingle() : { data: null },
      !hasPakovanje ? supabase.from("pakovanje").select("radnik_id, pikant_15kg, pikant_1kg, pikant_200g, pikant_150g, pikant_80g, bbq_15kg, bbq_1kg, bbq_200g, bbq_150g, bbq_80g, lot_broj").eq("work_order_id", id).maybeSingle() : { data: null },
      !hasPrzenje ? supabase.from("przenje").select("merenje_tpm").eq("work_order_id", id).maybeSingle() : { data: null },
    ])
    if (drRes.data) raw.draziranje = [drRes.data]
    if (pakRes.data) raw.pakovanje = [pakRes.data]
    if (prRes.data) raw.przenje = [prRes.data]
  }

  return nalog
}

function toInitialData(nalog: NalogRow): WorkOrderFormValues {
  const raw = nalog as Record<string, unknown>
  const dr = firstRow(raw.draziranje ?? nalog.draziranje) as { radnik_id?: string; broj_draziranja?: number; dobavljac?: string } | null
  const pr = firstRow(raw.przenje ?? nalog.przenje) as { merenje_tpm?: number | null } | null
  const pak = firstRow(raw.pakovanje ?? nalog.pakovanje) as NalogRow["pakovanje"][0] | null
  const radniciIds = (nalog.work_order_employees ?? [])
    .map((r) => r.employee_id)
    .filter(Boolean) as string[]

  return {
    broj_naloga: nalog.broj_naloga,
    radnici: radniciIds,
    datum: new Date(nalog.datum),
    smena: nalog.smena as "I" | "II",
    draziranje: {
      radnik_id: (dr && "radnik_id" in dr ? String(dr.radnik_id) : "") || "",
      broj_draziranja: (dr && "broj_draziranja" in dr ? Number(dr.broj_draziranja) : 0) || 0,
      dobavljac: (dr && "dobavljac" in dr ? String(dr.dobavljac) : "Good Food") as "Good Food" | "Karlito" | "In sistem",
    },
    przenje: {
      merenje_tpm: pr && "merenje_tpm" in pr && pr.merenje_tpm != null ? Number(pr.merenje_tpm) : undefined,
    },
    pakovanje: {
      radnik_id: (pak && "radnik_id" in pak ? pak.radnik_id : null) ?? "",
      pikant_15kg: pak ? Number((pak as Record<string, unknown>).pikant_15kg ?? 0) : 0,
      pikant_1kg: pak ? Number((pak as Record<string, unknown>).pikant_1kg ?? 0) : 0,
      pikant_200g: pak ? Number((pak as Record<string, unknown>).pikant_200g ?? 0) : 0,
      pikant_150g: pak ? Number((pak as Record<string, unknown>).pikant_150g ?? 0) : 0,
      pikant_80g: pak ? Number((pak as Record<string, unknown>).pikant_80g ?? 0) : 0,
      bbq_15kg: pak ? Number((pak as Record<string, unknown>).bbq_15kg ?? 0) : 0,
      bbq_1kg: pak ? Number((pak as Record<string, unknown>).bbq_1kg ?? 0) : 0,
      bbq_200g: pak ? Number((pak as Record<string, unknown>).bbq_200g ?? 0) : 0,
      bbq_150g: pak ? Number((pak as Record<string, unknown>).bbq_150g ?? 0) : 0,
      bbq_80g: pak ? Number((pak as Record<string, unknown>).bbq_80g ?? 0) : 0,
      lot_broj: pak && "lot_broj" in pak ? String((pak as Record<string, unknown>).lot_broj ?? "") : "",
    },
  }
}

export default async function ProizvodnjaUrediPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const [nalog, empResult] = await Promise.all([
    getNalog(id),
    supabase.from("employees").select("id, ime, prezime").eq("aktivan", true).order("ime", { ascending: true }),
  ])

  if (!nalog) notFound()
  const employees = (empResult.data ?? []) as { id: string; ime: string; prezime: string }[]

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href={`/proizvodnja/${id}`} aria-label="Nazad na nalog">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-[#111827]">Izmena naloga: {nalog.broj_naloga}</h1>
      </div>

      <WorkOrderForm
        mode="edit"
        workOrderId={id}
        employees={employees}
        initialData={toInitialData(nalog)}
      />
    </div>
  )
}
