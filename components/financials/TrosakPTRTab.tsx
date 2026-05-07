"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, X } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { cn } from "@/lib/utils/cn"
import type { AmbalazaPakovanje } from "@/lib/types/ambalaza"
import type { BomStavka } from "@/lib/types/bom"
import type { PrevozEnergija } from "@/lib/types/prevoz-energija"
import type { PtrFiksniStavka, PtrParams, PtrMiksRow } from "@/lib/types/ptr"
import {
  addFiksniAction,
  deleteFiksniAction,
  upsertPtrParamsAction,
  addMiksRowAction,
  bulkPopulateMiksAction,
  updateMiksRowAction,
  deleteMiksRowAction,
} from "@/app/actions/ptr"

interface Props {
  productId: string
  ukupnoPlate: number
  pakovanja: AmbalazaPakovanje[]
  bomStavke: BomStavka[]
  prevozEnergija: PrevozEnergija
  fiksniStavke: PtrFiksniStavka[]
  params: PtrParams
  miks: PtrMiksRow[]
}

type ParamField = "prodajna_kg" | "kapacitet" | "kurs"
type MiksField = "kolicina_kg" | "prodajna_kg"

export function TrosakPTRTab({
  productId,
  ukupnoPlate,
  pakovanja,
  bomStavke,
  prevozEnergija,
  fiksniStavke,
  params,
  miks,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [subTab, setSubTab] = useState<"ulazne" | "analiza" | "miks">("ulazne")
  const [addOpen, setAddOpen] = useState(false)
  const [formNaziv, setFormNaziv] = useState("")
  const [formIznos, setFormIznos] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [paramDrafts, setParamDrafts] = useState<Partial<Record<ParamField, string>>>({})
  const [prodajnaKomDraft, setProdajnaKomDraft] = useState<string | null>(null)

  const [miksDrafts, setMiksDrafts] = useState<Record<string, Partial<Record<MiksField | "kom" | "prodKom", string>>>>({})

  const bomItems = bomStavke
  const prevozPoKg = prevozEnergija.prevoz_kg > 0 ? prevozEnergija.prevoz_cena / prevozEnergija.prevoz_kg : 0
  const energijaPoKg = prevozEnergija.struja_kg > 0 ? prevozEnergija.struja_racun / prevozEnergija.struja_kg : 0

  const selectedPak = pakovanja.find((p) => p.id === params.selected_pakovanje_id) ?? null
  const masaKg = selectedPak?.masa ?? 0

  // --- Params input helpers ---
  const getParamVal = (k: ParamField): string => {
    if (paramDrafts[k] !== undefined) return paramDrafts[k]!
    const v = params[k]
    return v > 0 ? String(v) : ""
  }

  const onParamChange = (k: ParamField, raw: string) => {
    setParamDrafts((d) => ({ ...d, [k]: raw }))
    if (k === "prodajna_kg") {
      const n = parseFloat(raw)
      if (!isNaN(n) && n > 0 && masaKg > 0) setProdajnaKomDraft(fmtInput(n * masaKg))
      else if (!raw) setProdajnaKomDraft("")
    }
  }

  const commitParam = (k: ParamField) => {
    const raw = paramDrafts[k]
    if (raw === undefined) return
    const val = parseFloat(raw) || 0
    const clear = () => setParamDrafts((d) => {
      const next = { ...d }
      delete next[k]
      return next
    })
    if (val === params[k]) { clear(); return }
    startTransition(async () => {
      const res = await upsertPtrParamsAction(productId, { [k]: val })
      if (res.error) { alert(res.error); return }
      clear()
      router.refresh()
    })
  }

  const onProdajnaKomChange = (raw: string) => {
    setProdajnaKomDraft(raw)
    const n = parseFloat(raw)
    if (!isNaN(n) && n > 0 && masaKg > 0) {
      setParamDrafts((d) => ({ ...d, prodajna_kg: fmtInput(n / masaKg) }))
    } else if (!raw) {
      setParamDrafts((d) => ({ ...d, prodajna_kg: "" }))
    }
  }

  const commitProdajnaKom = () => {
    commitParam("prodajna_kg")
    setProdajnaKomDraft(null)
  }

  const onSelectedPakovanjeChange = (pId: string) => {
    startTransition(async () => {
      const res = await upsertPtrParamsAction(productId, { selected_pakovanje_id: pId || null })
      if (res.error) { alert(res.error); return }
      setProdajnaKomDraft(null)
      router.refresh()
    })
  }

  // --- Fiksni ---
  const addFiksni = () => {
    if (!formNaziv.trim() || !parseFloat(formIznos)) return
    startTransition(async () => {
      const res = await addFiksniAction(productId, formNaziv.trim(), parseFloat(formIznos))
      if (res.error) { alert(res.error); return }
      setFormNaziv("")
      setFormIznos("")
      setAddOpen(false)
      router.refresh()
    })
  }

  const deleteFiksni = (id: string) => {
    startTransition(async () => {
      const res = await deleteFiksniAction(id, productId)
      if (res.error) { alert(res.error); return }
      setDeleteId(null)
      router.refresh()
    })
  }

  // --- Miks ---
  const addMiksRow = () => {
    if (pakovanja.length === 0) return
    startTransition(async () => {
      const res = await addMiksRowAction(productId, pakovanja[0].id)
      if (res.error) { alert(res.error); return }
      router.refresh()
    })
  }

  const bulkPopulateMiks = () => {
    const existing = new Set(miks.map((m) => m.pakovanje_id))
    const toAdd = pakovanja.filter((p) => !existing.has(p.id)).map((p) => p.id)
    if (toAdd.length === 0) return
    startTransition(async () => {
      const res = await bulkPopulateMiksAction(productId, toAdd)
      if (res.error) { alert(res.error); return }
      router.refresh()
    })
  }

  const removeMiksRow = (id: string) => {
    startTransition(async () => {
      const res = await deleteMiksRowAction(id, productId)
      if (res.error) { alert(res.error); return }
      router.refresh()
    })
  }

  const updateMiksPakovanje = (id: string, pakovanjeId: string) => {
    startTransition(async () => {
      const res = await updateMiksRowAction(id, productId, { pakovanje_id: pakovanjeId } as Partial<PtrMiksRow>)
      if (res.error) { alert(res.error); return }
      router.refresh()
    })
  }

  const getMiksVal = (row: PtrMiksRow, field: MiksField): string => {
    const d = miksDrafts[row.id]?.[field]
    if (d !== undefined) return d
    const v = row[field]
    return v > 0 ? String(v) : ""
  }

  const getMiksKomVal = (row: PtrMiksRow, masa: number): string => {
    const d = miksDrafts[row.id]?.kom
    if (d !== undefined) return d
    if (masa > 0 && row.kolicina_kg > 0) return String(Math.round(row.kolicina_kg / masa))
    return ""
  }

  const onMiksChange = (id: string, field: MiksField, raw: string) => {
    setMiksDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? {}), [field]: raw } }))
  }

  const onMiksKomChange = (id: string, raw: string, masa: number) => {
    setMiksDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? {}), kom: raw } }))
    if (masa > 0) {
      const n = parseFloat(raw)
      const kg = !isNaN(n) && n > 0 ? fmtInput(n * masa) : ""
      setMiksDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? {}), kolicina_kg: kg } }))
    }
  }

  const getMiksProdKomVal = (row: PtrMiksRow, masa: number): string => {
    const d = miksDrafts[row.id]?.prodKom
    if (d !== undefined) return d
    if (masa > 0 && row.prodajna_kg > 0) return fmtInput(row.prodajna_kg * masa)
    return ""
  }

  const onMiksProdKomChange = (id: string, raw: string, masa: number) => {
    setMiksDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? {}), prodKom: raw } }))
    if (masa > 0) {
      const n = parseFloat(raw)
      const kg = !isNaN(n) && n > 0 ? fmtInput(n / masa) : ""
      setMiksDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? {}), prodajna_kg: kg } }))
    }
  }

  const commitMiksField = (row: PtrMiksRow, field: MiksField) => {
    const raw = miksDrafts[row.id]?.[field]
    if (raw === undefined) return
    const val = parseFloat(raw) || 0
    const clearDrafts = () => setMiksDrafts((d) => {
      const next = { ...d }
      delete next[row.id]
      return next
    })
    if (val === row[field]) { clearDrafts(); return }
    startTransition(async () => {
      const res = await updateMiksRowAction(row.id, productId, { [field]: val })
      if (res.error) { alert(res.error); return }
      clearDrafts()
      router.refresh()
    })
  }

  // --- Izračuni ---
  const sirovinePoKg = bomItems.reduce((s, i) => s + i.udeo * i.cena_po_kg, 0)
  const kapacitetNum = parseFloat(getParamVal("kapacitet")) || 0
  const radnaSnagaPoKg = kapacitetNum > 0 ? ukupnoPlate / kapacitetNum : 0

  const ambalazaUkupnoKom = selectedPak
    ? selectedPak.stavke.reduce((s, st) => s + st.kolicina * st.cena, 0)
    : 0
  const ambalazaPoKg = masaKg > 0 ? ambalazaUkupnoKom / masaKg : 0

  const varijabilniPoKg = sirovinePoKg + radnaSnagaPoKg + prevozPoKg + energijaPoKg + ambalazaPoKg
  const fiksniUkupno = fiksniStavke.reduce((s, f) => s + f.iznos, 0)
  const prodajnaKgNum = parseFloat(getParamVal("prodajna_kg")) || 0
  const kursNum = parseFloat(getParamVal("kurs")) || 0

  const margina = prodajnaKgNum - varijabilniPoKg
  const ptrKg = margina > 0 && fiksniUkupno > 0 ? fiksniUkupno / margina : null
  const ptrKom = ptrKg !== null && masaKg > 0 ? ptrKg / masaKg : null
  const ptrDin = ptrKg !== null ? ptrKg * prodajnaKgNum : null

  const minCenaKg = kapacitetNum > 0 ? (fiksniUkupno + varijabilniPoKg * kapacitetNum) / kapacitetNum : null
  const minCenaKom = minCenaKg !== null && masaKg > 0 ? minCenaKg * masaKg : null
  const fiksniPoKg = kapacitetNum > 0 ? fiksniUkupno / kapacitetNum : null

  const zarada = minCenaKg !== null ? prodajnaKgNum - minCenaKg : null
  const mesecnaZarada = zarada !== null && kapacitetNum > 0 ? zarada * kapacitetNum : null
  const marzinaProcenat = prodajnaKgNum > 0 && zarada !== null ? (zarada / prodajnaKgNum) * 100 : null

  const varijabilniAlt = sirovinePoKg + prevozPoKg + energijaPoKg + ambalazaPoKg
  const fiksniAlt = fiksniUkupno + ukupnoPlate
  const marginaAlt = prodajnaKgNum - varijabilniAlt
  const ptrKgAlt = marginaAlt > 0 && fiksniAlt > 0 ? fiksniAlt / marginaAlt : null
  const ptrKomAlt = ptrKgAlt !== null && masaKg > 0 ? ptrKgAlt / masaKg : null

  const showKom = masaKg > 0

  // --- Miks izračuni ---
  const miksComputed = miks.map((row) => {
    const pak = pakovanja.find((p) => p.id === row.pakovanje_id)
    const kgNum = row.kolicina_kg
    const prodKg = row.prodajna_kg
    const masa = pak?.masa ?? 0
    const ambKom = pak ? pak.stavke.reduce((s, st) => s + st.kolicina * st.cena, 0) : 0
    const ambKgVal = masa > 0 ? ambKom / masa : 0
    const komBroj = masa > 0 && kgNum > 0 ? Math.round(kgNum / masa) : null
    return { row, pak, kgNum, prodKg, masa, ambKom, ambKgVal, komBroj }
  })

  const totalKgMiks = miksComputed.reduce((s, d) => s + d.kgNum, 0)
  const radnaMiks = totalKgMiks > 0 ? ukupnoPlate / totalKgMiks : 0

  const miksResults = miksComputed.map((d) => {
    const varKg = sirovinePoKg + radnaMiks + prevozPoKg + energijaPoKg + d.ambKgVal
    const prihod = d.kgNum * d.prodKg
    const varCost = d.kgNum * varKg
    const doprinos = prihod - varCost
    const dopKg = d.prodKg > 0 ? d.prodKg - varKg : null
    return { ...d, varKg, prihod, varCost, doprinos, dopKg }
  })

  const miksTotalPrihod = miksResults.reduce((s, r) => s + r.prihod, 0)
  const miksTotalVar = miksResults.reduce((s, r) => s + r.varCost, 0)
  const miksDoprinos = miksResults.reduce((s, r) => s + r.doprinos, 0)
  const miksNeto = miksDoprinos - fiksniUkupno
  const miksPokrivenost = fiksniUkupno > 0
    ? Math.min(100, (miksDoprinos / fiksniUkupno) * 100)
    : (miksDoprinos > 0 ? 100 : 0)
  const miksPTR = totalKgMiks > 0 && miksDoprinos > 0
    ? (fiksniUkupno / miksDoprinos) * totalKgMiks
    : null

  // --- Tooltip sadržaj ---
  const tipSirovine: string[] = bomItems.length > 0
    ? [
        "Σ (udeo × cena/kg) za svaku sirovinu",
        "─────────────────────────────",
        ...bomItems.slice(0, 5).map((i) => `${(i.udeo * 100).toFixed(1)}% × ${fmt(i.cena_po_kg)} = ${fmt(i.udeo * i.cena_po_kg)} din/kg`),
        ...(bomItems.length > 5 ? [`...i ${bomItems.length - 5} više`] : []),
        `= ${fmt(sirovinePoKg)} din/kg`,
      ]
    : ["Nema unetih sirovina"]

  const tipRadnaSnaga: string[] = kapacitetNum > 0 && ukupnoPlate > 0
    ? [
        "Ukupne plate mesečno ÷ Kapacitet",
        `${fmt(ukupnoPlate)} din ÷ ${fmt(kapacitetNum)} kg`,
        `= ${fmt(radnaSnagaPoKg)} din/kg`,
      ]
    : ["Unesite plate i kapacitet"]

  const tipPrevoz: string[] = prevozEnergija.prevoz_kg > 0
    ? [
        "Cena prevoza ÷ Ukupna količina",
        `${fmt(prevozEnergija.prevoz_cena)} din ÷ ${fmt(prevozEnergija.prevoz_kg)} kg`,
        `= ${fmt(prevozPoKg)} din/kg`,
      ]
    : ["Unesite u tab Trošak prevoza i energije"]

  const tipEnergija: string[] = prevozEnergija.struja_kg > 0
    ? [
        "Račun struje ÷ Mesečna proizvodnja",
        `${fmt(prevozEnergija.struja_racun)} din ÷ ${fmt(prevozEnergija.struja_kg)} kg`,
        `= ${fmt(energijaPoKg)} din/kg`,
      ]
    : ["Unesite u tab Trošak prevoza i energije"]

  const tipAmbalaza: string[] = masaKg > 0 && ambalazaUkupnoKom > 0
    ? [
        "Trošak pakovanja ÷ Masa pakovanja",
        `${fmt(ambalazaUkupnoKom)} din/kom ÷ ${fmt2(masaKg)} kg`,
        `= ${fmt(ambalazaPoKg)} din/kg`,
      ]
    : masaKg === 0
    ? ["Unesite masu pakovanja u tab Trošak ambalaže"]
    : ["Dodajte stavke u tab Trošak ambalaže"]

  const tipFiksniPoKg: string[] = fiksniPoKg !== null
    ? [
        "Fiksni troškovi ÷ Kapacitet",
        `${fmt(fiksniUkupno)} din ÷ ${fmt(kapacitetNum)} kg`,
        `= ${fmt(fiksniPoKg)} din/kg`,
      ]
    : ["Unesite kapacitet mesečno"]

  const tipVarijabilniUkupno: string[] = [
    "Sirovine:    " + fmt(sirovinePoKg) + " din/kg",
    "Radna snaga: " + fmt(radnaSnagaPoKg) + " din/kg",
    "Prevoz:      " + fmt(prevozPoKg) + " din/kg",
    "Energija:    " + fmt(energijaPoKg) + " din/kg",
    "Ambalaža:    " + fmt(ambalazaPoKg) + " din/kg",
    "─────────────────────────────",
    "Σ = " + fmt(varijabilniPoKg) + " din/kg",
  ]

  const tipZarada: string[] = prodajnaKgNum > 0 && zarada !== null
    ? [
        "Prodajna cena − Cena koštanja",
        `${fmt(prodajnaKgNum)} − ${fmt(minCenaKg!)}`,
        `= ${fmt(zarada)} din/kg`,
      ]
    : prodajnaKgNum > 0
    ? ["Unesite kapacitet da biste videli zaradu"]
    : []

  const tipMarzinaProcenat: string[] = zarada !== null && prodajnaKgNum > 0
    ? [
        "Zarada ÷ Prodajna cena × 100",
        `${fmt(zarada)} ÷ ${fmt(prodajnaKgNum)} × 100`,
        `= ${marzinaProcenat!.toFixed(0)} %`,
      ]
    : []

  const tipPTRKg: string[] = ptrKg !== null
    ? [
        "Fiksni troškovi ÷ Marža doprinosa",
        `${fmt(fiksniUkupno)} ÷ ${fmt(margina)}`,
        `= ${fmt(ptrKg)} kg/mes`,
      ]
    : []

  const tipPTRKom: string[] = ptrKom !== null
    ? [
        "PTR u kg ÷ Masa pakovanja",
        `${fmt(ptrKg!)} ÷ ${fmt2(masaKg)}`,
        `= ${fmt(ptrKom)} kom/mes`,
      ]
    : []

  const tipPTRAlt: string[] = ptrKgAlt !== null
    ? [
        "Radnici prebačeni u fiksne troškove",
        "─────────────────────────────",
        `Var. (bez radnika): ${fmt(varijabilniAlt)} din/kg`,
        `Fiksni + plate:     ${fmt(fiksniAlt)} din/mes`,
        `${fmt(fiksniAlt)} ÷ ${fmt(marginaAlt)} = ${fmt(ptrKgAlt)} kg/mes`,
      ]
    : ukupnoPlate === 0
    ? ["Unesite plate u tab Trošak radne snage"]
    : ["Unesite prodajnu cenu"]

  const tipPTRDin: string[] = ptrDin !== null
    ? [
        "PTR (kg) × Prodajna cena",
        `${fmt(ptrKg!)} × ${fmt(prodajnaKgNum)}`,
        `= ${fmt(ptrDin)} din`,
      ]
    : []

  const tipMinCenaKg: string[] = minCenaKg !== null
    ? [
        "Varijabilni + (Fiksni ÷ Kapacitet)",
        `${fmt(varijabilniPoKg)} + (${fmt(fiksniUkupno)} ÷ ${fmt(kapacitetNum)})`,
        `= ${fmt(minCenaKg)} din/kg`,
      ]
    : []

  const tipMinCenaKom: string[] = minCenaKom !== null
    ? [
        "Cena koštanja/kg × Masa pakovanja",
        `${fmt(minCenaKg!)} × ${fmt2(masaKg)}`,
        `= ${fmt(minCenaKom)} din/kom`,
      ]
    : []

  const tipProdajnaEur: string[] = kursNum > 0 && prodajnaKgNum > 0
    ? [
        "Prodajna cena ÷ Kurs",
        `${fmt(prodajnaKgNum)} din ÷ ${fmt(kursNum)} din/€`,
        `= ${(prodajnaKgNum / kursNum).toFixed(2)} €/kg`,
      ]
    : []

  const tipMinEur: string[] = kursNum > 0 && minCenaKg !== null
    ? [
        "Cena koštanja ÷ Kurs",
        `${fmt(minCenaKg)} din ÷ ${fmt(kursNum)} din/€`,
        `= ${(minCenaKg / kursNum).toFixed(2)} €/kg`,
      ]
    : []

  const tipMesecnaZarada: string[] = mesecnaZarada !== null
    ? [
        "Zarada/kg × Kapacitet",
        `${fmt(zarada!)} din/kg × ${fmt(kapacitetNum)} kg`,
        `= ${fmt(mesecnaZarada)} din/mes`,
      ]
    : ["Unesite kapacitet mesečno"]

  const prodajnaKomDisplay = prodajnaKomDraft !== null
    ? prodajnaKomDraft
    : prodajnaKgNum > 0 && masaKg > 0
    ? fmtInput(prodajnaKgNum * masaKg)
    : ""

  return (
    <div className="space-y-4">

      <div className="flex gap-1 border-b border-[#E5E7EB]">
        {(["ulazne", "analiza", "miks"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSubTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              subTab === t
                ? "border-[#2563EB] text-[#2563EB]"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            )}
          >
            {t === "ulazne" ? "Ulazne komponente" : t === "analiza" ? "Analiza" : "Miks pakovanja"}
          </button>
        ))}
      </div>

      {/* Tab: Ulazne komponente */}
      {subTab === "ulazne" && (
        <div className="space-y-6">

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#374151]">Fiksni troškovi mesečno</h3>
              <button
                type="button"
                onClick={() => { setFormNaziv(""); setFormIznos(""); setAddOpen(true) }}
                className="flex items-center gap-1.5 text-sm text-[#2563EB] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Dodaj stavku
              </button>
            </div>
            <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    <th className="px-4 py-2.5 text-left font-medium text-[#6B7280]">Trošak</th>
                    <th className="w-40 px-4 py-2.5 text-right font-medium text-[#6B7280]">Iznos (din/mes.)</th>
                    <th className="w-10 px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {fiksniStavke.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-xs text-[#9CA3AF]">
                        Dodajte fiksne troškove (zakup, struja, telefoni, gorivo...)
                      </td>
                    </tr>
                  )}
                  {fiksniStavke.map((f) => (
                    <tr key={f.id} className="group hover:bg-[#F9FAFB]">
                      <td className="px-4 py-2 text-[#111827]">{f.naziv}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-[#374151]">{fmt(f.iznos)}</td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => setDeleteId(f.id)}
                          className="opacity-0 group-hover:opacity-100 rounded p-1 text-[#9CA3AF] hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {fiksniStavke.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-[#E5E7EB] bg-[#F0F7FF]">
                      <td className="px-4 py-2.5 text-sm font-semibold text-[#374151]">∑ Ukupno fiksni</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-bold text-[#2563EB]">{fmt(fiksniUkupno)} din</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>

          <section>
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-[#374151]">Varijabilni troškovi po kg</h3>
              <p className="text-xs text-[#9CA3AF]">Automatski povučeno iz ostalih tabova — hover za detalje</p>
            </div>
            <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-[#E5E7EB]">
                  <VarRow label="Sirovine" value={sirovinePoKg} tip={tipSirovine}
                    note={bomItems.length === 0 ? "Unesite sirovine u tab Trošak sirovina" : undefined} />
                  <VarRow label="Radna snaga" value={radnaSnagaPoKg} tip={tipRadnaSnaga}
                    note={ukupnoPlate === 0 ? "Unesite plate u tab Trošak radne snage" : kapacitetNum === 0 ? "Unesite kapacitet u Analiza tab" : undefined} />
                  <VarRow label="Prevoz" value={prevozPoKg} tip={tipPrevoz}
                    note={prevozPoKg === 0 ? "Unesite u tab Trošak prevoza i energije" : undefined} />
                  <VarRow label="Energija (struja)" value={energijaPoKg} tip={tipEnergija}
                    note={energijaPoKg === 0 ? "Unesite u tab Trošak prevoza i energije" : undefined} />
                  <VarRow label="Ambalaža" value={ambalazaPoKg} tip={tipAmbalaza}
                    note={
                      !selectedPak ? "Izaberite pakovanje u Analiza tabu" :
                      ambalazaUkupnoKom === 0 ? "Dodajte stavke u tab Trošak ambalaže" :
                      masaKg === 0 ? "Unesite masu pakovanja u tab Trošak ambalaže" : undefined
                    } />
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#E5E7EB] bg-[#F0F7FF]">
                    <td className="px-4 py-2.5 text-sm font-semibold text-[#374151]">∑ Ukupno varijabilni</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-bold text-[#2563EB]">{fmt(varijabilniPoKg)} din/kg</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

        </div>
      )}

      {/* Tab: Analiza */}
      {subTab === "analiza" && (
        <div className="space-y-6">

          <section>
            <h3 className="mb-3 text-sm font-semibold text-[#374151]">Parametri</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#374151]">Pakovanje</label>
                <p className="text-xs text-[#9CA3AF]">Izaberite pakovanje — masa određuje preračun din/kg ↔ din/kom</p>
                {pakovanja.length === 0 ? (
                  <p className="mt-1 text-xs text-amber-600">Nema pakovanja. Dodajte ih u tab Trošak ambalaže.</p>
                ) : (
                  <select
                    value={params.selected_pakovanje_id ?? ""}
                    onChange={(e) => onSelectedPakovanjeChange(e.target.value)}
                    disabled={isPending}
                    className="mt-1 w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-[#F9FAFB]"
                  >
                    <option value="">— Izaberite pakovanje —</option>
                    {pakovanja.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.naziv}{(p.masa ?? 0) > 0 ? ` (${p.masa} kg)` : " — bez mase"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151]">Prodajna cena</label>
                <p className="text-xs text-[#9CA3AF]">Unesite po kg ili po komadu — automatski se sinhronizuju</p>
                <div className="mt-1 grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number" min="0" step="any"
                      value={getParamVal("prodajna_kg")}
                      onChange={(e) => onParamChange("prodajna_kg", e.target.value)}
                      onBlur={() => commitParam("prodajna_kg")}
                      placeholder="npr. 300"
                      disabled={isPending}
                      className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 pr-14 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-[#F9FAFB]"
                    />
                    <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-[#9CA3AF]">din/kg</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number" min="0" step="any"
                      value={prodajnaKomDisplay}
                      onChange={(e) => onProdajnaKomChange(e.target.value)}
                      onBlur={commitProdajnaKom}
                      placeholder={masaKg > 0 ? `npr. ${(300 * masaKg).toFixed(0)}` : "izaberite pak."}
                      disabled={masaKg === 0 || isPending}
                      className={cn(
                        "w-full rounded-md border border-[#E5E7EB] px-3 py-2 pr-16 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]",
                        (masaKg === 0 || isPending) && "bg-[#F9FAFB] text-[#9CA3AF] cursor-not-allowed"
                      )}
                    />
                    <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-[#9CA3AF]">din/kom</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ParamInput label="Kapacitet mesečno (kg)" value={getParamVal("kapacitet")}
                  onChange={(v) => onParamChange("kapacitet", v)}
                  onBlur={() => commitParam("kapacitet")}
                  placeholder="npr. 14000"
                  disabled={isPending} />
                <ParamInput label="Kurs (din/€)" value={getParamVal("kurs")}
                  onChange={(v) => onParamChange("kurs", v)}
                  onBlur={() => commitParam("kurs")}
                  placeholder="npr. 117"
                  disabled={isPending} />
              </div>
            </div>
          </section>

          {(prodajnaKgNum > 0 || fiksniUkupno > 0) && (
            <section className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Rezultati</h3>
                  <p className="text-[10px] text-[#9CA3AF]">Hover za prikaz računice</p>
                </div>
                {showKom && (
                  <div className="flex gap-2 text-xs text-[#9CA3AF]">
                    <span className="w-28 text-right">din/kg</span>
                    <span className="w-32 text-right">{selectedPak?.naziv}</span>
                  </div>
                )}
              </div>

              <DualRow label="Varijabilni troškovi"
                kg={`${fmt(varijabilniPoKg)} din/kg`}
                kom={showKom ? `${fmt(varijabilniPoKg * masaKg)} din/kom` : undefined}
                tipKg={tipVarijabilniUkupno} />
              <DualRow label="Fiksni troškovi/kg"
                kg={fiksniPoKg !== null ? `${fmt(fiksniPoKg)} din/kg` : "— unesite kapacitet"}
                kom={showKom && fiksniPoKg !== null ? `${fmt(fiksniPoKg * masaKg)} din/kom` : undefined}
                tipKg={tipFiksniPoKg} />
              <DualRow label="Prodajna cena"
                kg={prodajnaKgNum > 0 ? `${fmt(prodajnaKgNum)} din/kg` : "—"}
                kom={showKom && prodajnaKgNum > 0 ? `${fmt(prodajnaKgNum * masaKg)} din/kom` : undefined} />
              <DualRow label="Zarada"
                kg={zarada !== null ? `${fmt(zarada)} din/kg` : prodajnaKgNum > 0 ? "— unesite kapacitet" : "—"}
                kom={showKom && zarada !== null ? `${fmt(zarada * masaKg)} din/kom` : undefined}
                highlight={zarada !== null && zarada > 0}
                warning={zarada !== null && zarada <= 0}
                tipKg={tipZarada} />
              {zarada !== null && prodajnaKgNum > 0 && (
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-[#6B7280]">Marža</span>
                  <CalcTip lines={tipMarzinaProcenat}>
                    <span className={cn(
                      "text-sm font-semibold cursor-help",
                      zarada > 0 ? "text-[#2563EB]" : "text-red-600"
                    )}>
                      {marzinaProcenat!.toFixed(0)} %
                    </span>
                  </CalcTip>
                </div>
              )}

              {prodajnaKgNum > 0 && margina <= 0 ? (
                <p className="text-sm font-medium text-red-600">
                  Prodajna cena mora biti viša od varijabilnih troškova ({fmt(varijabilniPoKg)} din/kg).
                </p>
              ) : (
                <>
                  <div className="border-t border-[#E5E7EB]" />
                  <DualRow label="Prelomna tačka (mesečno)"
                    kg={ptrKg !== null ? `${fmt(ptrKg)} kg` : "—"}
                    kom={showKom ? (ptrKom !== null ? `${fmt(ptrKom)} kom` : "—") : undefined}
                    large highlight={ptrKg !== null}
                    tipKg={tipPTRKg} tipKom={tipPTRKom} />
                  <DualRow label="PTR (radnici kao fiksni)"
                    kg={ptrKgAlt !== null ? `${fmt(ptrKgAlt)} kg` : "—"}
                    kom={showKom ? (ptrKomAlt !== null ? `${fmt(ptrKomAlt)} kom` : "—") : undefined}
                    highlight={ptrKgAlt !== null}
                    tipKg={tipPTRAlt} />
                  {ptrDin !== null && (
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-[#6B7280]">Prelomna tačka (din prihoda/mes.)</span>
                      <CalcTip lines={tipPTRDin}>
                        <span className="text-sm font-semibold text-[#111827] cursor-help">{fmt(ptrDin)} din</span>
                      </CalcTip>
                    </div>
                  )}

                  <div className="border-t border-[#E5E7EB]" />
                  <DualRow label="Cena koštanja (sa fiksnim)"
                    kg={minCenaKg !== null ? `${fmt(minCenaKg)} din/kg` : "—"}
                    kom={showKom ? (minCenaKom !== null ? `${fmt(minCenaKom)} din/kom` : "—") : undefined}
                    large tipKg={tipMinCenaKg} tipKom={tipMinCenaKom} />
                  {kursNum > 0 && prodajnaKgNum > 0 && (
                    <DualRow label="Prodajna cena u €"
                      kg={`${(prodajnaKgNum / kursNum).toFixed(2)} €/kg`}
                      kom={showKom ? `${((prodajnaKgNum * masaKg) / kursNum).toFixed(2)} €/kom` : undefined}
                      tipKg={tipProdajnaEur} />
                  )}
                  {kursNum > 0 && minCenaKg !== null && (
                    <DualRow label="Min. cena u €"
                      kg={`${(minCenaKg / kursNum).toFixed(2)} €/kg`}
                      kom={showKom && minCenaKom !== null ? `${(minCenaKom / kursNum).toFixed(2)} €/kom` : undefined}
                      tipKg={tipMinEur} />
                  )}

                  <div className="border-t-2 border-[#E5E7EB] pt-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-[#374151]">Mesečna zarada</span>
                      <CalcTip lines={tipMesecnaZarada}>
                        <span className={cn(
                          "text-lg font-bold cursor-help",
                          mesecnaZarada === null ? "text-[#9CA3AF]" :
                          mesecnaZarada > 0 ? "text-[#16A34A]" : "text-red-600"
                        )}>
                          {mesecnaZarada !== null ? `${fmt(mesecnaZarada)} din` : "—"}
                        </span>
                      </CalcTip>
                    </div>
                    {kursNum > 0 && mesecnaZarada !== null && (
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xs text-[#9CA3AF]">u evrima</span>
                        <span className="text-sm font-semibold text-[#16A34A]">
                          {fmt(mesecnaZarada / kursNum)} €
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          )}

        </div>
      )}

      {/* Tab: Miks pakovanja */}
      {subTab === "miks" && (
        <div className="space-y-6">

          <div>
            <p className="text-xs text-[#9CA3AF]">
              Unesite koliko kg svakog pakovanja planirate ovaj mesec i prodajnu cenu.
              Radna snaga se preračunava na ukupnu mesečnu količinu svih pakovanja.
            </p>
          </div>

          {pakovanja.length === 0 ? (
            <p className="text-sm text-amber-600">Nema pakovanja. Dodajte ih u tab Trošak ambalaže.</p>
          ) : (
            <>
              {miks.length === 0 && (
                <button
                  type="button"
                  onClick={bulkPopulateMiks}
                  disabled={isPending}
                  className="rounded-md border border-dashed border-[#2563EB] px-4 py-2 text-sm font-medium text-[#2563EB] hover:bg-[#EFF6FF] transition-colors disabled:opacity-50"
                >
                  Popuni sa svim pakovanjima ({pakovanja.length})
                </button>
              )}

              {miks.length > 0 && (
                <>
                  <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                          <th className="px-3 py-2.5 text-left font-medium text-[#6B7280]">Pakovanje</th>
                          <th className="px-3 py-2.5 text-right font-medium text-[#6B7280]">Količina (kg)</th>
                          <th className="px-3 py-2.5 text-right font-medium text-[#6B7280]">Količina (kom)</th>
                          <th className="px-3 py-2.5 text-right font-medium text-[#6B7280]">Prodajna (din/kg)</th>
                          <th className="px-3 py-2.5 text-right font-medium text-[#6B7280]">Prodajna (din/kom)</th>
                          <th className="px-3 py-2.5 text-right font-medium text-[#6B7280]">Var./kg</th>
                          <th className="px-3 py-2.5 text-right font-medium text-[#6B7280]">Doprinos/kg</th>
                          <th className="px-3 py-2.5 text-right font-medium text-[#6B7280]">Ukupan doprinos</th>
                          <th className="w-8 px-2 py-2.5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {miksResults.map((d) => {
                          const komVal = getMiksKomVal(d.row, d.masa)
                          return (
                            <tr key={d.row.id} className="group hover:bg-[#F9FAFB]">
                              <td className="px-3 py-2 text-left">
                                <select
                                  value={d.row.pakovanje_id}
                                  onChange={(e) => updateMiksPakovanje(d.row.id, e.target.value)}
                                  disabled={isPending}
                                  className="w-full rounded border border-[#E5E7EB] px-2 py-1 text-sm outline-none focus:border-[#2563EB]"
                                >
                                  {pakovanja.map((p) => (
                                    <option key={p.id} value={p.id}>{p.naziv}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <input
                                  type="number" min="0" step="any"
                                  value={getMiksVal(d.row, "kolicina_kg")}
                                  onChange={(e) => onMiksChange(d.row.id, "kolicina_kg", e.target.value)}
                                  onBlur={() => commitMiksField(d.row, "kolicina_kg")}
                                  placeholder="0"
                                  className="w-full rounded border border-[#E5E7EB] px-2 py-1 text-right text-sm outline-none focus:border-[#2563EB]"
                                />
                              </td>
                              <td className="px-3 py-2 text-right">
                                {d.masa > 0 ? (
                                  <input
                                    type="number" min="0" step="1"
                                    value={komVal}
                                    onChange={(e) => onMiksKomChange(d.row.id, e.target.value, d.masa)}
                                    onBlur={() => commitMiksField(d.row, "kolicina_kg")}
                                    placeholder="0"
                                    className="w-full rounded border border-[#E5E7EB] px-2 py-1 text-right text-sm outline-none focus:border-[#2563EB]"
                                  />
                                ) : (
                                  <span className="text-[#D1D5DB]">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <input
                                  type="number" min="0" step="any"
                                  value={getMiksVal(d.row, "prodajna_kg")}
                                  onChange={(e) => onMiksChange(d.row.id, "prodajna_kg", e.target.value)}
                                  onBlur={() => commitMiksField(d.row, "prodajna_kg")}
                                  placeholder="din/kg"
                                  className="w-full rounded border border-[#E5E7EB] px-2 py-1 text-right text-sm outline-none focus:border-[#2563EB]"
                                />
                              </td>
                              <td className="px-3 py-2 text-right">
                                {d.masa > 0 ? (
                                  <input
                                    type="number" min="0" step="any"
                                    value={getMiksProdKomVal(d.row, d.masa)}
                                    onChange={(e) => onMiksProdKomChange(d.row.id, e.target.value, d.masa)}
                                    onBlur={() => commitMiksField(d.row, "prodajna_kg")}
                                    placeholder="din/kom"
                                    className="w-full rounded border border-[#E5E7EB] px-2 py-1 text-right text-sm outline-none focus:border-[#2563EB]"
                                  />
                                ) : (
                                  <span className="text-[#D1D5DB]">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums text-[#374151]">
                                {totalKgMiks > 0 && d.kgNum > 0
                                  ? fmt(d.varKg)
                                  : <span className="text-[#D1D5DB]">—</span>}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {d.dopKg !== null && d.kgNum > 0
                                  ? <span className={d.dopKg > 0 ? "font-medium text-[#16A34A]" : "font-medium text-red-600"}>{fmt(d.dopKg)}</span>
                                  : <span className="text-[#D1D5DB]">—</span>}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {d.doprinos !== 0
                                  ? <span className={cn("font-semibold", d.doprinos > 0 ? "text-[#2563EB]" : "text-red-600")}>{fmt(d.doprinos)}</span>
                                  : <span className="text-[#D1D5DB]">—</span>}
                              </td>
                              <td className="px-2 py-2">
                                <button
                                  type="button"
                                  onClick={() => removeMiksRow(d.row.id)}
                                  className="opacity-0 group-hover:opacity-100 rounded p-1 text-[#9CA3AF] hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      {totalKgMiks > 0 && (
                        <tfoot>
                          <tr className="border-t-2 border-[#E5E7EB] bg-[#F0F7FF]">
                            <td className="px-3 py-2.5 text-sm font-semibold text-[#374151]">∑ Ukupno</td>
                            <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-[#374151]">{fmt(totalKgMiks)} kg</td>
                            <td />
                            <td />
                            <td />
                            <td />
                            <td />
                            <td className="px-3 py-2.5 text-right tabular-nums font-bold text-[#2563EB]">{fmt(miksDoprinos)} din</td>
                            <td />
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  <button
                    type="button"
                    onClick={addMiksRow}
                    disabled={isPending}
                    className="flex items-center gap-1.5 text-sm text-[#2563EB] hover:underline disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> Dodaj pakovanje
                  </button>
                </>
              )}
            </>
          )}

          {totalKgMiks > 0 && (
            <section className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Analiza miksa</h3>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Ukupna količina</span>
                  <span className="font-semibold text-[#111827]">{fmt(totalKgMiks)} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Radna snaga/kg (pri ovom miksu)</span>
                  <span className="font-semibold text-[#374151]">{fmt(radnaMiks)} din/kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Ukupan prihod</span>
                  <span className="font-semibold text-[#111827]">{fmt(miksTotalPrihod)} din</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Ukupni varijabilni troškovi</span>
                  <span className="font-semibold text-[#374151]">{fmt(miksTotalVar)} din</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Ukupan doprinos pokriću</span>
                  <span className={cn("font-semibold", miksDoprinos > 0 ? "text-[#2563EB]" : "text-red-600")}>
                    {fmt(miksDoprinos)} din
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Fiksni troškovi mesečno</span>
                  <span className="font-semibold text-[#374151]">{fmt(fiksniUkupno)} din</span>
                </div>
              </div>

              {fiksniUkupno > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-[#9CA3AF] mb-1">
                    <span>Pokrivenost fiksnih troškova</span>
                    <span>{miksPokrivenost.toFixed(0)} %</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E5E7EB] overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        miksDoprinos >= fiksniUkupno ? "bg-[#16A34A]" : "bg-[#F59E0B]"
                      )}
                      style={{ width: `${miksPokrivenost}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="border-t border-[#E5E7EB] pt-3 space-y-2">
                {miksPTR !== null && (
                  <div className="flex justify-between text-sm">
                    <CalcTip lines={[
                      "Minimum kg da pokriješ fiksne pri ovom miksu:",
                      `(${fmt(fiksniUkupno)} ÷ ${fmt(miksDoprinos)}) × ${fmt(totalKgMiks)} kg`,
                      `= ${fmt(miksPTR)} kg`,
                    ]}>
                      <span className="text-[#6B7280] cursor-help">PTR pri ovom miksu</span>
                    </CalcTip>
                    <span className="font-semibold text-[#111827]">{fmt(miksPTR)} kg</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-[#374151]">Neto zarada (mesečno)</span>
                  <span className={cn(
                    "text-lg font-bold",
                    miksNeto > 0 ? "text-[#16A34A]" : "text-red-600"
                  )}>
                    {fmt(miksNeto)} din
                  </span>
                </div>

                {kursNum > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs text-[#9CA3AF]">u evrima</span>
                    <span className={cn("text-sm font-semibold", miksNeto > 0 ? "text-[#16A34A]" : "text-red-600")}>
                      {fmt(miksNeto / kursNum)} €
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

        </div>
      )}

      {/* Dialog — dodaj fiksni trošak */}
      <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-base font-semibold text-[#111827]">Dodaj fiksni trošak</Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="rounded p-1 text-[#9CA3AF] hover:text-[#111827]"><X className="h-4 w-4" /></button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">Dodavanje fiksnog troška</Dialog.Description>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#374151]">Naziv</label>
                <input type="text" autoFocus value={formNaziv}
                  onChange={(e) => setFormNaziv(e.target.value)}
                  placeholder="npr. Zakup prostora"
                  className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151]">Iznos mesečno (din)</label>
                <input type="number" min="0" value={formIznos}
                  onChange={(e) => setFormIznos(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addFiksni()}
                  placeholder="npr. 50000"
                  className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button type="button" className="rounded-md border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors">Otkaži</button>
              </Dialog.Close>
              <button type="button" onClick={addFiksni}
                disabled={!formNaziv.trim() || !formIznos || isPending}
                className="rounded-md bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8] transition-colors disabled:opacity-50">
                {isPending ? "Dodajem..." : "Dodaj"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* AlertDialog — brisanje fiksnog */}
      <AlertDialog.Root open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <AlertDialog.Title className="text-base font-semibold text-[#111827]">Ukloni stavku</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-[#6B7280]">
              Ukloniti ovaj fiksni trošak iz proračuna?
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <button type="button" className="rounded-md border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors">Otkaži</button>
              </AlertDialog.Cancel>
              <button type="button"
                onClick={() => deleteId && deleteFiksni(deleteId)}
                disabled={isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                Ukloni
              </button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

    </div>
  )
}

// --- Tooltip ---

function CalcTip({ lines, children }: { lines: string[]; children: React.ReactNode }) {
  if (!lines.length) return <>{children}</>
  return (
    <span className="group/tip relative">
      {children}
      <span className="pointer-events-none absolute right-0 bottom-full z-30 mb-2 hidden group-hover/tip:block">
        <span className="block rounded-lg bg-[#1F2937] px-3 py-2 text-left text-xs text-white shadow-xl whitespace-nowrap font-mono leading-relaxed">
          {lines.map((l, i) => <span key={i} className="block">{l}</span>)}
        </span>
        <span className="absolute right-3 top-full border-x-[5px] border-t-[5px] border-x-transparent border-t-[#1F2937]" />
      </span>
    </span>
  )
}

// --- Helper komponente ---

function VarRow({ label, value, note, tip }: {
  label: string; value: number; note?: string; tip?: string[]
}) {
  return (
    <tr className="hover:bg-[#F9FAFB]">
      <td className="px-4 py-2.5 text-sm text-[#374151]">{label}</td>
      <td className="px-4 py-2.5 text-right text-sm tabular-nums">
        {value > 0 ? (
          <CalcTip lines={tip ?? []}>
            <span className="font-medium text-[#111827] cursor-help">{fmt(value)} din/kg</span>
          </CalcTip>
        ) : (
          <span className="text-xs text-[#9CA3AF]">{note ?? "—"}</span>
        )}
      </td>
    </tr>
  )
}

function ParamInput({ label, value, onChange, onBlur, placeholder, disabled }: {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  placeholder: string
  disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#374151]">{label}</label>
      <input type="number" min="0" step="any" value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-[#F9FAFB]" />
    </div>
  )
}

function DualRow({ label, kg, kom, large, highlight, warning, tipKg, tipKom }: {
  label: string
  kg: string
  kom?: string
  large?: boolean
  highlight?: boolean
  warning?: boolean
  tipKg?: string[]
  tipKom?: string[]
}) {
  const cls = cn(
    "tabular-nums font-semibold",
    large ? "text-base" : "text-sm",
    highlight ? "text-[#2563EB]" : warning ? "text-red-600" : "text-[#111827]"
  )
  const clsKom = cn(
    "tabular-nums font-semibold",
    large ? "text-base" : "text-sm",
    highlight ? "text-[#2563EB]" : warning ? "text-red-600" : "text-[#374151]"
  )
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="shrink-0 text-sm text-[#6B7280]">{label}</span>
      <div className="flex gap-2">
        <span className="w-28 text-right">
          {tipKg?.length && kg !== "—" ? (
            <CalcTip lines={tipKg}><span className={cn(cls, "cursor-help")}>{kg}</span></CalcTip>
          ) : (
            <span className={cls}>{kg}</span>
          )}
        </span>
        {kom !== undefined && (
          <span className="w-32 text-right">
            {tipKom?.length && kom !== "—" ? (
              <CalcTip lines={tipKom}><span className={cn(clsKom, "cursor-help")}>{kom}</span></CalcTip>
            ) : (
              <span className={clsKom}>{kom}</span>
            )}
          </span>
        )}
      </div>
    </div>
  )
}

function fmt(n: number): string {
  return new Intl.NumberFormat("sr-RS", { maximumFractionDigits: 0 }).format(n)
}

function fmt2(n: number): string {
  return new Intl.NumberFormat("sr-RS", { maximumFractionDigits: 2 }).format(n)
}

function fmtInput(n: number): string {
  return parseFloat(n.toFixed(4)).toString()
}
