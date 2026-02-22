import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WorkOrderCard } from "@/components/proizvodnja/WorkOrderCard"
import { ProcessCard } from "@/components/proizvodnja/ProcessCard"
import { calculateTotalKg, calculateKomadi, formatUkupnoKg } from "@/lib/proizvodnja/calculations"
import { format } from "date-fns"
import { srLatn } from "date-fns/locale"
import { ArrowLeft, Pencil, Trash2 } from "lucide-react"
import { NalogDeleteButton } from "@/components/proizvodnja/NalogDeleteButton"

type Props = { params: Promise<{ id: string }> }

type Nalog = {
  id: string
  broj_naloga: string
  datum: string
  smena: string
  work_order_employees: Array<{ employee: { ime: string; prezime: string } | null }>
  draziranje: Array<{
    radnik: { ime: string; prezime: string } | null
    broj_draziranja: number
    dobavljac: string
  }>
  przenje: Array<{ merenje_tpm: number | null }>
  zacinjavane: Array<unknown>
  pakovanje: Array<{
    radnik: { ime: string; prezime: string } | null
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

async function getNalog(id: string): Promise<Nalog | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("work_orders")
    .select(
      `
      id,
      broj_naloga,
      datum,
      smena,
      work_order_employees (
        employee:employees (ime, prezime)
      ),
      draziranje (
        broj_draziranja,
        dobavljac,
        radnik_id,
        radnik:employees (ime, prezime)
      ),
      przenje (merenje_tpm),
      zacinjavane (*),
      pakovanje (
        pikant_15kg, pikant_1kg, pikant_200g, pikant_150g, pikant_80g,
        bbq_15kg, bbq_1kg, bbq_200g, bbq_150g, bbq_80g,
        lot_broj,
        radnik_id,
        radnik:employees (ime, prezime)
      )
    `
    )
    .eq("id", id)
    .single()

  if (error || !data) return null
  const nalog = data as unknown as Nalog

  // Ako ugnježdene relacije nisu došle (prazan niz ili nedostaju), učitaj ih posebno
  const hasDraziranje = Array.isArray(nalog.draziranje) && nalog.draziranje.length > 0
  const hasPakovanje = Array.isArray(nalog.pakovanje) && nalog.pakovanje.length > 0
  const hasPrzenje = Array.isArray(nalog.przenje) && nalog.przenje.length > 0
  const needDraziranje = !hasDraziranje
  const needPakovanje = !hasPakovanje
  const needPrzenje = !hasPrzenje

  if (needDraziranje || needPakovanje || needPrzenje) {
    const [drRes, pakRes, prRes] = await Promise.all([
      needDraziranje ? supabase.from("draziranje").select("*, radnik:employees(ime, prezime)").eq("work_order_id", id).maybeSingle() : { data: null },
      needPakovanje ? supabase.from("pakovanje").select("*, radnik:employees(ime, prezime)").eq("work_order_id", id).maybeSingle() : { data: null },
      needPrzenje ? supabase.from("przenje").select("merenje_tpm").eq("work_order_id", id).maybeSingle() : { data: null },
    ])
    if (drRes.data) (nalog as Record<string, unknown>).draziranje = [drRes.data]
    if (pakRes.data) (nalog as Record<string, unknown>).pakovanje = [pakRes.data]
    if (prRes.data) (nalog as Record<string, unknown>).przenje = [prRes.data]
  }

  return nalog
}

/** Supabase može vratiti 1:1 relaciju kao niz ili kao objekat — uzimamo prvi red. */
function firstRow<T>(rel: T[] | T | null | undefined): T | null {
  if (rel == null) return null
  if (Array.isArray(rel)) return rel[0] ?? null
  return rel
}

/** Ime i prezime radnika iz nested objekta (alias radnik ili employees). */
function radnikImePrezime(row: { radnik?: { ime?: string; prezime?: string } | null; employees?: { ime?: string; prezime?: string } | null } | null): string {
  if (!row) return "—"
  const r = row.radnik ?? (row as { employees?: { ime?: string; prezime?: string } | null }).employees
  if (!r?.ime && !r?.prezime) return "—"
  return `${r.ime ?? ""} ${r.prezime ?? ""}`.trim()
}

export default async function ProizvodnjaDetaljPage({ params }: Props) {
  const { id } = await params
  const nalog = await getNalog(id)
  if (!nalog) notFound()

  const dr = firstRow((nalog as Record<string, unknown>).draziranje ?? nalog.draziranje)
  const pr = firstRow<{ merenje_tpm?: number | null }>((nalog as Record<string, unknown>).przenje ?? nalog.przenje)
  const pak = firstRow((nalog as Record<string, unknown>).pakovanje ?? nalog.pakovanje)
  const radniciNames = (nalog.work_order_employees ?? [])
    .map((r) => r.employee && `${r.employee.ime} ${r.employee.prezime}`)
    .filter(Boolean) as string[]
  const total = calculateTotalKg(pak ?? null)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/proizvodnja" aria-label="Nazad na listu">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-[#111827]">Radni nalog: {nalog.broj_naloga}</h1>
        <div className="flex gap-2 ml-auto">
          <Button asChild variant="outline" size="sm" className="border-[#E5E7EB]">
            <Link href={`/proizvodnja/${id}/uredi`}>
              <Pencil className="mr-2 h-4 w-4" />
              Izmeni
            </Link>
          </Button>
          <NalogDeleteButton nalogId={id} brojNaloga={nalog.broj_naloga} />
        </div>
      </div>

      <div className="space-y-5">
        <WorkOrderCard title="Zaglavlje">
          <div className="grid gap-2 sm:grid-cols-2">
            <p>
              <span className="font-medium text-[#6B7280]">Datum:</span>{" "}
              {format(new Date(nalog.datum), "dd.MM.yyyy", { locale: srLatn })}
            </p>
            <p>
              <span className="font-medium text-[#6B7280]">Smena:</span>{" "}
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  nalog.smena === "II" ? "bg-[#EFF6FF] text-[#2563EB]" : "bg-[#F3F4F6] text-[#6B7280]"
                }`}
              >
                {nalog.smena}
              </span>
            </p>
          </div>
          <p className="mt-2">
            <span className="font-medium text-[#6B7280]">Radnici:</span>{" "}
            {radniciNames.length ? radniciNames.join(", ") : "—"}
          </p>
        </WorkOrderCard>

        <ProcessCard title="Dražiranje">
          {dr && (dr as Record<string, unknown>).broj_draziranja != null ? (
            <div className="space-y-1">
              <p>
                <span className="font-medium text-[#6B7280]">Radnik:</span>{" "}
                {radnikImePrezime(dr as Parameters<typeof radnikImePrezime>[0])}
              </p>
              <p>
                <span className="font-medium text-[#6B7280]">Broj dražiranja:</span>{" "}
                {String((dr as Record<string, unknown>).broj_draziranja)}
              </p>
              <p>
                <span className="font-medium text-[#6B7280]">Dobavljač:</span>{" "}
                {String((dr as Record<string, unknown>).dobavljac ?? "—")}
              </p>
            </div>
          ) : (
            <p className="text-[#6B7280]">(Nije popunjeno)</p>
          )}
        </ProcessCard>

        <ProcessCard title="Prženje">
          <p>
            <span className="font-medium text-[#6B7280]">Merenje TPM:</span>{" "}
            {pr?.merenje_tpm != null ? String(pr.merenje_tpm) : "Nije upisano"}
          </p>
        </ProcessCard>

        <ProcessCard title="Začinjavanje">
          <p className="text-[#6B7280]">(Nije popunjeno)</p>
        </ProcessCard>

        <ProcessCard title="Pakovanje">
          {pak ? (
            <div className="space-y-4">
              <p>
                <span className="font-medium text-[#6B7280]">Radnik:</span>{" "}
                {radnikImePrezime(pak as Parameters<typeof radnikImePrezime>[0])}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-[#111827] mb-2">PIKANT</p>
                  <ul className="text-sm space-y-1">
                    <li>15kg: {Number((pak as Record<string, unknown>).pikant_15kg ?? 0)} kg</li>
                    <li>1kg: {Number((pak as Record<string, unknown>).pikant_1kg ?? 0)} kg</li>
                    <li>200g: {Number((pak as Record<string, unknown>).pikant_200g ?? 0)} kutija ({calculateKomadi(Number((pak as Record<string, unknown>).pikant_200g ?? 0), 16)} kom.)</li>
                    <li>150g: {Number((pak as Record<string, unknown>).pikant_150g ?? 0)} kutija ({calculateKomadi(Number((pak as Record<string, unknown>).pikant_150g ?? 0), 15)} kom.)</li>
                    <li>80g: {Number((pak as Record<string, unknown>).pikant_80g ?? 0)} kutija ({calculateKomadi(Number((pak as Record<string, unknown>).pikant_80g ?? 0), 36)} kom.)</li>
                    <li className="font-medium pt-2">UKUPNO PIKANT: {formatUkupnoKg(total.pikant)} kg</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827] mb-2">BBQ</p>
                  <ul className="text-sm space-y-1">
                    <li>15kg: {Number((pak as Record<string, unknown>).bbq_15kg ?? 0)} kg</li>
                    <li>1kg: {Number((pak as Record<string, unknown>).bbq_1kg ?? 0)} kg</li>
                    <li>200g: {Number((pak as Record<string, unknown>).bbq_200g ?? 0)} kutija ({calculateKomadi(Number((pak as Record<string, unknown>).bbq_200g ?? 0), 16)} kom.)</li>
                    <li>150g: {Number((pak as Record<string, unknown>).bbq_150g ?? 0)} kutija ({calculateKomadi(Number((pak as Record<string, unknown>).bbq_150g ?? 0), 15)} kom.)</li>
                    <li>80g: {Number((pak as Record<string, unknown>).bbq_80g ?? 0)} kutija ({calculateKomadi(Number((pak as Record<string, unknown>).bbq_80g ?? 0), 36)} kom.)</li>
                    <li className="font-medium pt-2">UKUPNO BBQ: {formatUkupnoKg(total.bbq)} kg</li>
                  </ul>
                </div>
              </div>
              <p>
                <span className="font-medium text-[#6B7280]">LOT broj:</span>{" "}
                {(pak as Record<string, unknown>).lot_broj && String((pak as Record<string, unknown>).lot_broj).trim() ? String((pak as Record<string, unknown>).lot_broj) : "Nije upisano"}
              </p>
            </div>
          ) : (
            <p className="text-[#6B7280]">(Nije popunjeno)</p>
          )}
        </ProcessCard>

        <Card className="border-[#2563EB] bg-[#EFF6FF] shadow-sm">
          <CardContent className="py-4 text-center">
            <p className="text-lg font-bold text-[#111827]">UKUPNA PROIZVODNJA: {formatUkupnoKg(total.ukupno)} kg</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
