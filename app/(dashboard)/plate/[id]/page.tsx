import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { PlateDetailActions } from "@/components/plate/PlateDetailActions"
import { PlatniListic } from "@/components/plate/PlatniListic"
import type { SatiRed, DodatakRed, AkontacijaRed } from "@/components/plate/PlatniListic"
import { getAdvancesForMonth, getBonusesForMonth } from "@/app/actions/sati"

const MESECI = [
  "", "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
]

function formatDatumIzdavanja(): string {
  const d = new Date()
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}.${month}.${year}.`
}

function formatAdvanceDatum(iso: string): string {
  const [y, m, day] = iso.split("-")
  return `${day}.${m}.`
}

export default async function PlateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: report, error } = await supabase
    .from("payroll_reports")
    .select("*, employees(ime, prezime, pozicija)")
    .eq("id", id)
    .single()

  if (error || !report) notFound()

  const employeeId = report.employee_id as string
  const mesec = report.mesec as number
  const godina = report.godina as number

  const [advances, bonuses] = await Promise.all([
    getAdvancesForMonth(employeeId, mesec, godina),
    getBonusesForMonth(employeeId, mesec, godina),
  ])

  const emp = report.employees as { ime?: string; prezime?: string; pozicija?: string } | null
  const employeeName = emp ? `${emp.ime ?? ""} ${emp.prezime ?? ""}`.trim() : "—"
  const pozicija = emp?.pozicija ?? "—"
  const period = `${MESECI[report.mesec]} ${report.godina}`

  const r = (v: unknown) => Number(v ?? 0)
  const satiRows: SatiRed[] = [
    { tip: "redovni", sati: r(report.redovni_sati), cena: r(report.redovni_sati) ? r(report.bruto_redovni) / r(report.redovni_sati) : 0, iznos: r(report.bruto_redovni) },
    { tip: "prekovremeno", sati: r(report.prekovremeni_sati), cena: r(report.prekovremeni_sati) ? r(report.bruto_prekovremeno) / r(report.prekovremeni_sati) : 0, iznos: r(report.bruto_prekovremeno) },
    { tip: "subota", sati: r(report.subota_sati), cena: r(report.subota_sati) ? r(report.bruto_subota) / r(report.subota_sati) : 0, iznos: r(report.bruto_subota) },
    { tip: "nedelja", sati: r(report.nedelja_sati), cena: r(report.nedelja_sati) ? r(report.bruto_nedelja) / r(report.nedelja_sati) : 0, iznos: r(report.bruto_nedelja) },
    { tip: "praznik", sati: r(report.praznik_sati), cena: r(report.praznik_sati) ? r(report.bruto_praznik) / r(report.praznik_sati) : 0, iznos: r(report.bruto_praznik) },
  ]
  const ukupnoSatiIznos = satiRows.reduce((sum, row) => sum + row.iznos, 0)

  const dodaci: DodatakRed[] = bonuses.length > 0
    ? bonuses.map((b) => ({ label: b.opis ? `Bonus (${b.opis})` : "Bonus", iznos: Number(b.iznos) }))
    : (r(report.ukupni_bonusi) > 0 ? [{ label: "Bonusi", iznos: r(report.ukupni_bonusi) }] : [])
  const ukupnoDodaci = r(report.ukupni_bonusi)

  const advancesRows: AkontacijaRed[] = advances.map((a) => ({
    datum: formatAdvanceDatum(a.datum),
    iznos: Number(a.iznos),
  }))

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4 print:hidden">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/plate" aria-label="Nazad">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Platni listić</h1>
          <p className="text-sm text-[#6B7280]">
            {employeeName} — {period}
          </p>
        </div>
      </div>

      <PlatniListic
        employeeName={employeeName}
        pozicija={pozicija}
        period={period}
        datumIzdavanja={formatDatumIzdavanja()}
        satiRows={satiRows}
        ukupnoSatiIznos={ukupnoSatiIznos}
        dodaci={dodaci}
        ukupnoDodaci={ukupnoDodaci}
        advances={advancesRows}
        ukupnoBruto={r(report.ukupno_bruto)}
        ukupniAvans={r(report.ukupni_avans)}
        netoZaIsplatu={r(report.neto_za_isplatu)}
        actions={<PlateDetailActions reportId={id} status={String(report.status)} />}
      />
    </div>
  )
}
