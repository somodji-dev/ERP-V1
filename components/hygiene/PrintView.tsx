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

  // Pomocne funkcije za jednu tabelu (radni_prostor ili krug)
  function buildTableData(templates: HygieneTemplate[]) {
    // Sve unique datume u tabeli, sortirano rastuće
    const dateSet = new Set<string>()
    for (const t of templates) {
      const comps = compsByTemplate.get(t.id) ?? []
      for (const c of comps) dateSet.add(c.datum_uradjeno)
    }
    const allDates = Array.from(dateSet).sort()
    const visibleDates = allDates.slice(0, MAX_DATUM_COLS)
    const overflow = allDates.length > MAX_DATUM_COLS ? allDates.slice(MAX_DATUM_COLS) : []

    // Map (template_id, date) -> completion (za prikaz kvačice + napomenu po stavci)
    const cellMap = new Map<string, HygieneCompletionWithRelations>()
    for (const t of templates) {
      for (const c of compsByTemplate.get(t.id) ?? []) {
        cellMap.set(`${t.id}|${c.datum_uradjeno}`, c)
      }
    }

    // Map date -> initials za Potpis izvršioca red
    const initialsByDate = new Map<string, string>()
    for (const date of visibleDates) {
      const set = new Set<string>()
      for (const t of templates) {
        const c = cellMap.get(`${t.id}|${date}`)
        if (c) {
          const init = getInitials(c.employee)
          if (init) set.add(init)
        }
      }
      initialsByDate.set(date, Array.from(set).join(","))
    }

    // Po stavci sažet napomena tekst (sve napomene + overflow datumi za njega)
    function napomenaForTemplate(t: HygieneTemplate): string {
      const comps = compsByTemplate.get(t.id) ?? []
      const notes = comps
        .map((c) => c.napomena?.trim())
        .filter((n): n is string => !!n && n.length > 0)
      const sortedComps = [...comps].sort((a, b) => a.datum_uradjeno.localeCompare(b.datum_uradjeno))
      const myOverflow = sortedComps
        .map((c) => c.datum_uradjeno)
        .filter((d) => !visibleDates.includes(d))
        .map(formatDatumShort)
      const parts: string[] = []
      if (myOverflow.length > 0) parts.push(`+${myOverflow.join(", ")}`)
      if (notes.length > 0) parts.push(notes.join("; "))
      return parts.join(" · ")
    }

    return { visibleDates, overflow, cellMap, initialsByDate, napomenaForTemplate }
  }

  const radniData = buildTableData(radniProstor)
  const krugData = buildTableData(krug)

  function HeaderCols({ dates }: { dates: string[] }) {
    return (
      <>
        {dates.map((d) => (
          <th key={d} className="border border-black px-0.5 py-0.5 text-center text-[7pt]" style={{ width: `${55 / MAX_DATUM_COLS}%` }}>
            {formatDatumShort(d)}
          </th>
        ))}
        {/* Padding kolone do MAX_DATUM_COLS */}
        {new Array(Math.max(0, MAX_DATUM_COLS - dates.length)).fill(null).map((_, i) => (
          <th key={`pad-${i}`} className="border border-black px-0.5 py-0.5" style={{ width: `${55 / MAX_DATUM_COLS}%` }} />
        ))}
      </>
    )
  }

  function TableRow({
    t,
    data,
  }: {
    t: HygieneTemplate
    data: ReturnType<typeof buildTableData>
  }) {
    return (
      <tr>
        <td className="border border-black px-1 py-0.5 align-top">{t.naziv}</td>
        <td className="border border-black px-1 py-0.5 text-center align-top">{t.period}</td>
        {data.visibleDates.map((date) => {
          const c = data.cellMap.get(`${t.id}|${date}`)
          return (
            <td key={date} className="border border-black px-0.5 py-0.5 text-center align-top">
              {c ? <span className="text-[10pt] leading-none">✓</span> : ""}
            </td>
          )
        })}
        {new Array(Math.max(0, MAX_DATUM_COLS - data.visibleDates.length)).fill(null).map((_, i) => (
          <td key={`pad-${i}`} className="border border-black px-0.5 py-0.5" />
        ))}
        <td className="border border-black px-1 py-0.5 text-[7pt] align-top">{data.napomenaForTemplate(t)}</td>
      </tr>
    )
  }

  function PotpisRow({ data }: { data: ReturnType<typeof buildTableData> }) {
    return (
      <tr className="bg-gray-100">
        <td className="border border-black px-1 py-0.5 font-semibold">Potpis izvršioca</td>
        <td className="border border-black px-1 py-0.5" />
        {data.visibleDates.map((date) => (
          <td key={date} className="border border-black px-0.5 py-0.5 text-center text-[7pt] align-top">
            {data.initialsByDate.get(date) ?? ""}
          </td>
        ))}
        {new Array(Math.max(0, MAX_DATUM_COLS - data.visibleDates.length)).fill(null).map((_, i) => (
          <td key={`pad-${i}`} className="border border-black px-0.5 py-0.5" />
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
            <HeaderCols dates={radniData.visibleDates} />
            <th className="border border-black px-1 py-0.5" />
          </tr>
        </thead>
        <tbody>
          {radniProstor.map((t) => <TableRow key={t.id} t={t} data={radniData} />)}
          <tr>
            <td className="border border-black px-1 py-0.5">Ostalo</td>
            <td className="border border-black px-1 py-0.5" />
            {new Array(MAX_DATUM_COLS).fill(null).map((_, i) => (
              <td key={i} className="border border-black px-0.5 py-0.5" />
            ))}
            <td className="border border-black px-1 py-0.5" />
          </tr>
          <PotpisRow data={radniData} />
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
          <tr>
            <th className="border border-black px-1 py-0.5" />
            <th className="border border-black px-1 py-0.5" />
            <HeaderCols dates={krugData.visibleDates} />
            <th className="border border-black px-1 py-0.5" />
          </tr>
        </thead>
        <tbody>
          {krug.map((t) => <TableRow key={t.id} t={t} data={krugData} />)}
          <tr>
            <td className="border border-black px-1 py-0.5">Ostalo</td>
            <td className="border border-black px-1 py-0.5" />
            {new Array(MAX_DATUM_COLS).fill(null).map((_, i) => (
              <td key={i} className="border border-black px-0.5 py-0.5" />
            ))}
            <td className="border border-black px-1 py-0.5" />
          </tr>
          <PotpisRow data={krugData} />
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
