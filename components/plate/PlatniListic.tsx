"use client"

import { formatCurrency } from "@/lib/utils/format"

const TIP_LABELS: Record<string, string> = {
  redovni: "Redovni",
  prekovremeno: "Prekovremeni",
  subota: "Subota",
  nedelja: "Nedelja",
  praznik: "Praznik",
}

export type SatiRed = {
  tip: string
  sati: number
  cena: number
  iznos: number
}

export type DodatakRed = {
  label: string
  detail?: string
  iznos: number
}

export type AkontacijaRed = {
  datum: string
  iznos: number
}

export type PlatniListicProps = {
  employeeName: string
  pozicija: string
  period: string
  datumIzdavanja: string
  satiRows: SatiRed[]
  ukupnoSatiIznos: number
  dodaci: DodatakRed[]
  ukupnoDodaci: number
  brojRadnihDana?: number
  advances: AkontacijaRed[]
  ukupnoBruto: number
  ukupniAvans: number
  netoZaIsplatu: number
  /** Slot za dugmad (Štampaj, PDF, Označi isplaćen) — ispod potpisa, print:hidden */
  actions?: React.ReactNode
}

function fmtNum(n: number): string {
  return n.toLocaleString("sr-RS", { maximumFractionDigits: 0, minimumFractionDigits: 0 })
}

export function PlatniListic({
  employeeName,
  pozicija,
  period,
  datumIzdavanja,
  satiRows,
  ukupnoSatiIznos,
  dodaci,
  ukupnoDodaci,
  brojRadnihDana,
  advances,
  ukupnoBruto,
  ukupniAvans,
  netoZaIsplatu,
  actions,
}: PlatniListicProps) {
  return (
    <div
      id="platni-izvestaj-print"
      className="mx-auto w-full max-w-[210mm] rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm print:max-w-none print:shadow-none print:border-0"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* A4 margine za štampu (20mm) — padding u @media print u globals.css */}
      <div className="print:min-h-[277mm]">
        {/* Header */}
        <header className="mb-6 text-center">
          <div className="mb-2 text-[10px] text-[#6B7280]">[LOGO]</div>
          <h1 className="text-[20px] font-bold text-[#111827]">
            ISPLATNI IZVEŠTAJ ZA ZAPOSLENOG
          </h1>
          <div className="mt-1 h-px w-48 bg-[#E5E7EB] mx-auto" aria-hidden />
        </header>

        <div className="mb-4 grid gap-1 text-sm text-[#111827]">
          <p><span className="font-medium text-[#6B7280]">Radnik:</span> {employeeName}</p>
          <p><span className="font-medium text-[#6B7280]">Pozicija:</span> {pozicija}</p>
          <p><span className="font-medium text-[#6B7280]">Period:</span> {period}</p>
          <p><span className="font-medium text-[#6B7280]">Datum izdavanja:</span> {datumIzdavanja}</p>
        </div>

        <div className="my-4 h-px bg-[#E5E7EB]" aria-hidden />

        {/* Dve kolone: Obračun sati | Akontacije */}
        <div className="grid grid-cols-1 gap-0 border border-[#E5E7EB] sm:grid-cols-[1fr_200px]">
          {/* Leva kolona — Obračun radnih sati + Dodaci */}
          <div className="border-b border-r-0 border-[#E5E7EB] p-3 sm:border-r sm:border-b-0">
            <h2 className="mb-2 text-sm font-semibold text-[#111827]">OBRAČUN RADNIH SATI</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-left text-[#6B7280]">
                  <th className="pb-1 pr-2">Tip</th>
                  <th className="pb-1 text-right tabular-nums">Sati</th>
                  <th className="pb-1 text-right tabular-nums">Cena</th>
                  <th className="pb-1 text-right tabular-nums">Iznos</th>
                </tr>
              </thead>
              <tbody>
                {satiRows.map((r) => (
                  <tr key={r.tip} className="border-b border-[#E5E7EB]/70">
                    <td className="py-0.5 pr-2">{TIP_LABELS[r.tip] ?? r.tip}</td>
                    <td className="py-0.5 text-right tabular-nums">{r.sati}h</td>
                    <td className="py-0.5 text-right tabular-nums">{fmtNum(r.cena)}</td>
                    <td className="py-0.5 text-right tabular-nums">{fmtNum(r.iznos)}</td>
                  </tr>
                ))}
                <tr className="border-b border-[#E5E7EB] font-medium">
                  <td colSpan={3} className="py-1 pr-2 text-[#111827]">UKUPNO SATI:</td>
                  <td className="py-1 text-right tabular-nums">{fmtNum(ukupnoSatiIznos)}</td>
                </tr>
              </tbody>
            </table>

            <h2 className="mb-2 mt-4 text-sm font-semibold text-[#111827]">DODACI</h2>
            <table className="w-full text-sm">
              <tbody>
                {dodaci.map((d, i) => (
                  <tr key={i} className="border-b border-[#E5E7EB]/70">
                    <td className="py-0.5 pr-2">{d.label}</td>
                    {d.detail != null ? (
                      <td className="py-0.5 text-right tabular-nums text-[#6B7280]">{d.detail}</td>
                    ) : (
                      <td className="py-0.5" />
                    )}
                    <td className="py-0.5 text-right tabular-nums">{fmtNum(d.iznos)}</td>
                  </tr>
                ))}
                <tr className="border-b border-[#E5E7EB] font-medium">
                  <td colSpan={2} className="py-1 pr-2 text-[#111827]">UKUPNO DODACI:</td>
                  <td className="py-1 text-right tabular-nums">{fmtNum(ukupnoDodaci)}</td>
                </tr>
              </tbody>
            </table>
            {brojRadnihDana != null && (
              <p className="mt-2 text-sm text-[#6B7280]">Broj radnih dana: {brojRadnihDana}</p>
            )}
          </div>

          {/* Desna kolona — Akontacije */}
          <div className="border-[#E5E7EB] p-3 sm:border-l-0">
            <h2 className="mb-2 text-sm font-semibold text-[#111827]">AKONTACIJE</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-left text-[#6B7280]">
                  <th className="pb-1">Datum</th>
                  <th className="pb-1 text-right tabular-nums">Iznos</th>
                </tr>
              </thead>
              <tbody>
                {advances.map((a, i) => (
                  <tr key={i} className="border-b border-[#E5E7EB]/70">
                    <td className="py-0.5">{a.datum}</td>
                    <td className="py-0.5 text-right tabular-nums">{fmtNum(a.iznos)}</td>
                  </tr>
                ))}
                <tr className="border-b border-[#E5E7EB] font-medium">
                  <td className="py-1 text-[#111827]">UKUPNO:</td>
                  <td className="py-1 text-right tabular-nums">{fmtNum(ukupniAvans)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Ukupno bruto / akontacije / neto */}
        <div className="mt-6 space-y-1 border-t border-[#E5E7EB] pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-[#111827]">UKUPNO BRUTO:</span>
            <span className="tabular-nums font-medium text-[#111827]">
              {formatCurrency(ukupnoBruto)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#111827]">ISPLAĆENO (akontacije):</span>
            <span className="tabular-nums text-[#111827]">− {formatCurrency(ukupniAvans)}</span>
          </div>
          <div className="my-2 h-px bg-[#E5E7EB]" aria-hidden />
          <div
            className="flex justify-between rounded-lg bg-[#D1FAE5] px-3 py-2 text-[18px] font-bold text-[#111827]"
            style={{ backgroundColor: "#D1FAE5" }}
          >
            <span>NETO ZA ISPLATU:</span>
            <span className="tabular-nums">{formatCurrency(netoZaIsplatu)}</span>
          </div>
        </div>

        {/* Datum i potpisi */}
        <div className="mt-8 text-sm text-[#6B7280]">
          <p className="mb-6">Datum: ______________</p>
          <div className="flex justify-between gap-8">
            <div className="flex-1 border-b border-[#E5E7EB] pb-1">
              Potpis poslodavca
            </div>
            <div className="flex-1 border-b border-[#E5E7EB] pb-1">
              Potpis radnika
            </div>
          </div>
        </div>

        {/* Dugmad — vidljiva samo na ekranu */}
        {actions != null && (
          <div className="mt-6 flex flex-wrap gap-2 print:hidden">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
