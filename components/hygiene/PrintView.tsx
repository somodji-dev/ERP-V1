import type { HygieneChecklistDetail, HygieneTemplate, HygieneCompletionWithRelations } from "@/lib/types/hygiene"

const MESECI = [
  "", "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
]

const MAX_DATUM_COLS = 14

function formatDatumShort(iso: string): string {
  const [, m, d] = iso.split("-")
  return `${d}.${m}.`
}

function getInitials(emp: { ime: string; prezime: string } | null | undefined): string {
  if (!emp) return ""
  const i = (emp.ime || "").trim().charAt(0).toUpperCase()
  const p = (emp.prezime || "").trim().charAt(0).toUpperCase()
  return `${i}${p}`
}

function sortedComps(comps: HygieneCompletionWithRelations[]): HygieneCompletionWithRelations[] {
  return [...comps].sort((a, b) => a.datum_uradjeno.localeCompare(b.datum_uradjeno))
}

function renderRowNapomena(comps: HygieneCompletionWithRelations[]): string {
  const notes = comps
    .map((c) => c.napomena?.trim())
    .filter((n): n is string => !!n && n.length > 0)
  if (comps.length > MAX_DATUM_COLS) {
    return `+${comps.length - MAX_DATUM_COLS} više... ${notes.join("; ")}`.trim()
  }
  return notes.join("; ")
}

export function PrintView({ detail }: { detail: HygieneChecklistDetail }) {
  const radniProstor = detail.templates
    .filter((t) => t.grupa === "radni_prostor")
    .sort((a, b) => a.redosled - b.redosled)
  const krug = detail.templates
    .filter((t) => t.grupa === "krug")
    .sort((a, b) => a.redosled - b.redosled)

  // Map completions by template_id
  const compsByTemplate = new Map<string, HygieneCompletionWithRelations[]>()
  for (const c of detail.completions) {
    const arr = compsByTemplate.get(c.template_id) ?? []
    arr.push(c)
    compsByTemplate.set(c.template_id, arr)
  }

  // Za "Potpis izvršioca" red — agregiraj po slot index-u za tabelu
  function buildPotpisRow(templates: HygieneTemplate[]): string[] {
    const slots: string[] = new Array(MAX_DATUM_COLS).fill("")
    for (let slot = 0; slot < MAX_DATUM_COLS; slot++) {
      const initialsSet = new Set<string>()
      for (const t of templates) {
        const comps = sortedComps(compsByTemplate.get(t.id) ?? [])
        const c = comps[slot]
        if (c) {
          const init = getInitials(c.employee)
          if (init) initialsSet.add(init)
        }
      }
      slots[slot] = Array.from(initialsSet).join(",")
    }
    return slots
  }

  const datumColHeaders = new Array(MAX_DATUM_COLS).fill("")

  function TableRow({ t }: { t: HygieneTemplate }) {
    const comps = sortedComps(compsByTemplate.get(t.id) ?? [])
    const napomena = renderRowNapomena(comps)
    return (
      <tr>
        <td className="border border-black px-1 py-0.5 align-top">{t.naziv}</td>
        <td className="border border-black px-1 py-0.5 text-center align-top">{t.period}</td>
        {new Array(MAX_DATUM_COLS).fill(null).map((_, i) => {
          const c = comps[i]
          return (
            <td key={i} className="border border-black px-0.5 py-0.5 text-center text-[7pt] align-top leading-tight">
              {c ? formatDatumShort(c.datum_uradjeno) : ""}
            </td>
          )
        })}
        <td className="border border-black px-1 py-0.5 text-[7pt] align-top">{napomena}</td>
      </tr>
    )
  }

  function PotpisRow({ templates }: { templates: HygieneTemplate[] }) {
    const slots = buildPotpisRow(templates)
    return (
      <tr className="bg-gray-100">
        <td className="border border-black px-1 py-0.5 font-semibold">Potpis izvršioca</td>
        <td className="border border-black px-1 py-0.5" />
        {slots.map((s, i) => (
          <td key={i} className="border border-black px-0.5 py-0.5 text-center text-[7pt] align-top">
            {s}
          </td>
        ))}
        <td className="border border-black px-1 py-0.5" />
      </tr>
    )
  }

  return (
    <div
      id="higijena-print"
      className="mx-auto w-full max-w-[297mm] bg-white p-6 print:p-0 print:max-w-none"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      {/* Header */}
      <div className="mb-4 border border-black">
        <div className="grid grid-cols-[90px_1fr_180px] text-sm">
          <div className="flex items-center justify-center border-r border-black p-3 text-2xl font-bold">
            SSOP
          </div>
          <div className="flex items-center justify-center border-r border-black p-2 text-center font-bold">
            ČEK LISTA ODRŽAVANJA HIGIJENE RADNOG PROSTORA, KRUGA I SANITARNOG ČVORA
          </div>
          <div className="text-xs">
            <div className="grid grid-cols-[60px_1fr] border-b border-black">
              <span className="border-r border-black px-2 py-1 font-semibold">Šifra</span>
              <span className="px-2 py-1">Z-19</span>
            </div>
            <div className="grid grid-cols-[60px_1fr] border-b border-black">
              <span className="border-r border-black px-2 py-1 font-semibold">Verzija</span>
              <span className="px-2 py-1">2.0</span>
            </div>
            <div className="grid grid-cols-[60px_1fr]">
              <span className="border-r border-black px-2 py-1 font-semibold">Strana</span>
              <span className="px-2 py-1">1 od 1</span>
            </div>
          </div>
        </div>
      </div>

      <p className="mb-2 text-xs">
        <span className="font-semibold">Period:</span> {MESECI[detail.mesec]} {detail.godina}
      </p>

      {/* Tabela 1: Radni prostor */}
      <table className="w-full border-collapse text-[8pt]" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black px-1 py-1 text-left" style={{ width: "22%" }}>Mesto održavanja</th>
            <th className="border border-black px-1 py-1 text-center" style={{ width: "5%" }}>Period</th>
            <th className="border border-black px-1 py-1 text-center" colSpan={MAX_DATUM_COLS}>
              Urađeno/datum
            </th>
            <th className="border border-black px-1 py-1 text-left" style={{ width: "18%" }}>Napomena</th>
          </tr>
          <tr>
            <th className="border border-black px-1 py-0.5" />
            <th className="border border-black px-1 py-0.5" />
            {datumColHeaders.map((_, i) => (
              <th key={i} className="border border-black px-0.5 py-0.5" style={{ width: `${55 / MAX_DATUM_COLS}%` }} />
            ))}
            <th className="border border-black px-1 py-0.5" />
          </tr>
        </thead>
        <tbody>
          {radniProstor.map((t) => <TableRow key={t.id} t={t} />)}
          <tr>
            <td className="border border-black px-1 py-0.5">Ostalo</td>
            <td className="border border-black px-1 py-0.5" />
            {new Array(MAX_DATUM_COLS).fill(null).map((_, i) => (
              <td key={i} className="border border-black px-0.5 py-0.5" />
            ))}
            <td className="border border-black px-1 py-0.5" />
          </tr>
          <PotpisRow templates={radniProstor} />
        </tbody>
      </table>

      {/* Tabela 2: Krug */}
      <table className="mt-4 w-full border-collapse text-[8pt]" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black px-1 py-1 text-left" style={{ width: "22%" }}>MESTO ODRŽAVANJA</th>
            <th className="border border-black px-1 py-1 text-center" style={{ width: "5%" }}>Period</th>
            <th className="border border-black px-1 py-1 text-center" colSpan={MAX_DATUM_COLS}>
              Urađeno
            </th>
            <th className="border border-black px-1 py-1 text-left" style={{ width: "18%" }}>NAPOMENA</th>
          </tr>
        </thead>
        <tbody>
          {krug.map((t) => <TableRow key={t.id} t={t} />)}
          <tr>
            <td className="border border-black px-1 py-0.5">Ostalo</td>
            <td className="border border-black px-1 py-0.5" />
            {new Array(MAX_DATUM_COLS).fill(null).map((_, i) => (
              <td key={i} className="border border-black px-0.5 py-0.5" />
            ))}
            <td className="border border-black px-1 py-0.5" />
          </tr>
          <PotpisRow templates={krug} />
        </tbody>
      </table>

      {/* Legend */}
      <p className="mt-3 text-[8pt] font-semibold">
        SP – Svakodnevni poslovi : NP – Nedeljni poslovi: MP – Mesečni poslovi:
      </p>

      {/* Verifikacija */}
      <p className="mt-4 text-[9pt] font-semibold">Verifikacija aktivnosti</p>
      <table className="mt-1 w-full border-collapse text-[8pt]">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black px-2 py-1 text-left" style={{ width: "25%" }}>Datum:</th>
            <th className="border border-black px-2 py-1 text-left" style={{ width: "30%" }}>Ime i prezime:</th>
            <th className="border border-black px-2 py-1 text-left" style={{ width: "25%" }}>Funkcija :</th>
            <th className="border border-black px-2 py-1 text-left" style={{ width: "20%" }}>Potpis:</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black px-2 py-2">
              {detail.verifikator_datum ? formatDatumShort(detail.verifikator_datum) : ""}
            </td>
            <td className="border border-black px-2 py-2">
              {detail.verifikator ? `${detail.verifikator.ime} ${detail.verifikator.prezime}` : ""}
            </td>
            <td className="border border-black px-2 py-2">{detail.verifikator_funkcija ?? ""}</td>
            <td className="border border-black px-2 py-2" />
          </tr>
        </tbody>
      </table>
    </div>
  )
}
