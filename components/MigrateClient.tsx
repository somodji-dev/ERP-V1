"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Loader2, Database, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import type { Proizvod } from "@/lib/types/proizvodi"
import {
  addProizvodAction,
} from "@/app/actions/proizvodi"
import {
  addPakovanjeAction,
  addStavkaAction,
} from "@/app/actions/ambalaza"
import {
  addBomStavkaAction,
  updateUkupnaKolicinaAction,
} from "@/app/actions/bom"
import {
  upsertPrevozEnergijaAction,
} from "@/app/actions/prevoz-energija"
import {
  upsertRadnaSnagaGrupaAction,
  updateOpterecenjePlataAction,
} from "@/app/actions/radna-snaga"
import {
  addFiksniAction,
  upsertPtrParamsAction,
  createMiksRowWithValuesAction,
} from "@/app/actions/ptr"

// --- localStorage tipovi (stari format) ---
interface OldProizvod { id: string; naziv: string; opis?: string }
interface OldStavka { id: string; naziv: string; kolicina: number; jedinica: string; cena: number }
interface OldPakovanje { id: string; naziv: string; masa?: number; expanded?: boolean; stavke: OldStavka[] }
interface OldBomItem { id: string; naziv: string; materijal_id?: string; udeo: number; cena_po_kg: number }
interface OldPrevoz { prevozCena?: number; prevozKg?: number; strujaRacun?: number; strujaKg?: number }
interface OldRadnaSnagaGrupa { key: string; label: string; broj: number; neto: number }
interface OldFiksni { id: string; naziv: string; iznos: number }
interface OldParams { prodajna?: number; prodajnaKg?: number; kapacitet?: number; kurs?: number; selectedPId?: string }
interface OldMiksRow { id: string; pakovanjeId: string; kolicinaKg: string; prodajnaKg: string }

interface ProizvodData {
  proizvod: OldProizvod
  pakovanja: OldPakovanje[]
  bom: OldBomItem[]
  bomUkupnaKg: number
  prevoz: OldPrevoz | null
  radnaSnaga: OldRadnaSnagaGrupa[]
  fiksni: OldFiksni[]
  params: OldParams | null
  miks: OldMiksRow[]
}

interface LocalData {
  proizvodi: ProizvodData[]
  opterecenjePlata: number | null
}

interface Props {
  existingProizvodi: Proizvod[]
}

export function MigrateClient({ existingProizvodi }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [local, setLocal] = useState<LocalData | null>(null)
  const [phase, setPhase] = useState<"loading" | "ready" | "running" | "done">("loading")
  const [log, setLog] = useState<Array<{ kind: "info" | "ok" | "err"; msg: string }>>([])
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem("rio-erp-cene-proizvodi")
      const proizvodi: OldProizvod[] = raw ? JSON.parse(raw) : []

      const data: ProizvodData[] = proizvodi.map((p) => {
        const amb = safeJson<OldPakovanje[]>(`rio-erp-ambalaza-${p.id}`) ?? []
        const bom = safeJson<OldBomItem[]>(`rio-erp-bom-${p.id}`) ?? []
        const bomKg = parseFloat(localStorage.getItem(`rio-erp-bom-kg-${p.id}`) ?? "1") || 1
        const prevoz = safeJson<OldPrevoz>(`rio-erp-prevoz-energija-${p.id}`)
        const rs = safeJson<OldRadnaSnagaGrupa[]>(`rio-erp-radna-snaga-${p.id}`) ?? []
        const fiksni = safeJson<OldFiksni[]>(`rio-erp-ptr-fiksni-${p.id}`) ?? []
        const params = safeJson<OldParams>(`rio-erp-ptr-params-${p.id}`)
        const miks = safeJson<OldMiksRow[]>(`rio-erp-ptr-miks-${p.id}`) ?? []

        return {
          proizvod: p,
          pakovanja: amb,
          bom,
          bomUkupnaKg: bomKg,
          prevoz: prevoz ?? null,
          radnaSnaga: rs,
          fiksni,
          params: params ?? null,
          miks,
        }
      })

      const opterec = parseFloat(localStorage.getItem("rio-erp-radna-snaga-opterecenje") ?? "")
      setLocal({
        proizvodi: data,
        opterecenjePlata: isNaN(opterec) ? null : opterec,
      })
      setPhase("ready")
    } catch (e) {
      setLocal({ proizvodi: [], opterecenjePlata: null })
      setPhase("ready")
    }
  }, [])

  const addLog = (entry: { kind: "info" | "ok" | "err"; msg: string }) => {
    setLog((l) => [...l, entry])
    if (entry.kind === "err") setErrors((e) => [...e, entry.msg])
  }

  const existingNames = new Set(existingProizvodi.map((p) => p.naziv.toLowerCase().trim()))

  const migrate = () => {
    if (!local) return
    setPhase("running")
    setLog([])
    setErrors([])

    startTransition(async () => {
      for (const pd of local.proizvodi) {
        const { proizvod } = pd

        if (existingNames.has(proizvod.naziv.toLowerCase().trim())) {
          addLog({ kind: "info", msg: `Preskačem "${proizvod.naziv}" — već postoji u bazi.` })
          continue
        }

        addLog({ kind: "info", msg: `▶ ${proizvod.naziv}: kreiram proizvod...` })
        const pRes = await addProizvodAction(proizvod.naziv, proizvod.opis ?? null)
        if (pRes.error || !pRes.id) {
          addLog({ kind: "err", msg: `Greška: ${proizvod.naziv} — ${pRes.error}` })
          continue
        }
        const newProizvodId = pRes.id
        addLog({ kind: "ok", msg: `  ✓ Proizvod kreiran` })

        // BOM ukupna količina
        if (pd.bomUkupnaKg && pd.bomUkupnaKg !== 1) {
          await updateUkupnaKolicinaAction(newProizvodId, pd.bomUkupnaKg)
        }

        // Ambalaža — pakovanja + stavke
        const pakMap = new Map<string, string>() // oldPakId → newPakUuid
        for (const pak of pd.pakovanja) {
          const aRes = await addPakovanjeAction(newProizvodId, pak.naziv, pak.masa ?? 0)
          if (aRes.error || !aRes.id) {
            addLog({ kind: "err", msg: `  Pakovanje "${pak.naziv}" — ${aRes.error}` })
            continue
          }
          pakMap.set(pak.id, aRes.id)
          for (const st of pak.stavke) {
            const sRes = await addStavkaAction(aRes.id, newProizvodId, st.naziv, st.kolicina, st.jedinica, st.cena)
            if (sRes.error) addLog({ kind: "err", msg: `  Stavka "${st.naziv}" — ${sRes.error}` })
          }
        }
        if (pd.pakovanja.length) addLog({ kind: "ok", msg: `  ✓ Ambalaža: ${pd.pakovanja.length} pakovanja` })

        // BOM stavke — materijal_id postavlja se na null radi bezbednosti
        for (const b of pd.bom) {
          const bRes = await addBomStavkaAction(newProizvodId, b.naziv, b.udeo, b.cena_po_kg, null)
          if (bRes.error) addLog({ kind: "err", msg: `  BOM "${b.naziv}" — ${bRes.error}` })
        }
        if (pd.bom.length) addLog({ kind: "ok", msg: `  ✓ BOM: ${pd.bom.length} stavki` })

        // Prevoz/energija
        if (pd.prevoz) {
          const peRes = await upsertPrevozEnergijaAction(newProizvodId, {
            prevoz_cena: pd.prevoz.prevozCena ?? 0,
            prevoz_kg: pd.prevoz.prevozKg ?? 0,
            struja_racun: pd.prevoz.strujaRacun ?? 0,
            struja_kg: pd.prevoz.strujaKg ?? 0,
          })
          if (peRes.error) addLog({ kind: "err", msg: `  Prevoz/energija — ${peRes.error}` })
          else addLog({ kind: "ok", msg: `  ✓ Prevoz/energija` })
        }

        // Radna snaga
        for (const rs of pd.radnaSnaga) {
          if (rs.broj > 0 || rs.neto > 0) {
            const rsRes = await upsertRadnaSnagaGrupaAction(newProizvodId, rs.key, rs.label, { broj: rs.broj, neto: rs.neto })
            if (rsRes.error) addLog({ kind: "err", msg: `  Radna snaga "${rs.label}" — ${rsRes.error}` })
          }
        }
        const rsCount = pd.radnaSnaga.filter((g) => g.broj > 0 || g.neto > 0).length
        if (rsCount) addLog({ kind: "ok", msg: `  ✓ Radna snaga: ${rsCount} grupa` })

        // PTR fiksni
        for (const f of pd.fiksni) {
          const fRes = await addFiksniAction(newProizvodId, f.naziv, f.iznos)
          if (fRes.error) addLog({ kind: "err", msg: `  Fiksni "${f.naziv}" — ${fRes.error}` })
        }
        if (pd.fiksni.length) addLog({ kind: "ok", msg: `  ✓ PTR fiksni: ${pd.fiksni.length} stavki` })

        // PTR params (selected_pakovanje_id kroz pakMap)
        if (pd.params) {
          const selectedNew = pd.params.selectedPId ? pakMap.get(pd.params.selectedPId) ?? null : null
          const prodajnaKg = pd.params.prodajnaKg ?? pd.params.prodajna ?? 0
          const paramsRes = await upsertPtrParamsAction(newProizvodId, {
            prodajna_kg: prodajnaKg,
            kapacitet: pd.params.kapacitet ?? 0,
            kurs: pd.params.kurs ?? 0,
            selected_pakovanje_id: selectedNew,
          })
          if (paramsRes.error) addLog({ kind: "err", msg: `  PTR params — ${paramsRes.error}` })
          else addLog({ kind: "ok", msg: `  ✓ PTR parametri` })
        }

        // PTR miks
        let miksOk = 0
        for (const m of pd.miks) {
          const newPakId = pakMap.get(m.pakovanjeId)
          if (!newPakId) continue
          const kg = parseFloat(m.kolicinaKg) || 0
          const prodKg = parseFloat(m.prodajnaKg) || 0
          if (kg === 0 && prodKg === 0) continue
          const mRes = await createMiksRowWithValuesAction(newProizvodId, newPakId, kg, prodKg)
          if (mRes.error) addLog({ kind: "err", msg: `  Miks red — ${mRes.error}` })
          else miksOk++
        }
        if (miksOk) addLog({ kind: "ok", msg: `  ✓ PTR miks: ${miksOk} redova` })
      }

      // Globalno opterećenje plata
      if (local.opterecenjePlata && local.opterecenjePlata > 0) {
        const opRes = await updateOpterecenjePlataAction(local.opterecenjePlata)
        if (opRes.error) addLog({ kind: "err", msg: `Opterećenje plata — ${opRes.error}` })
        else addLog({ kind: "ok", msg: `✓ Globalno opterećenje plata: ${local.opterecenjePlata}%` })
      }

      setPhase("done")
      router.refresh()
    })
  }

  const clearLocalStorage = () => {
    if (!confirm("Obrisati sve localStorage podatke za cene-proizvoda?")) return
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith("rio-erp-cene-") || key.startsWith("rio-erp-ambalaza-") ||
                  key.startsWith("rio-erp-bom-") || key.startsWith("rio-erp-prevoz-energija-") ||
                  key.startsWith("rio-erp-radna-snaga-") || key.startsWith("rio-erp-ptr-"))) {
        keys.push(key)
      }
    }
    keys.forEach((k) => localStorage.removeItem(k))
    alert(`Obrisano ${keys.length} ključeva.`)
    router.push("/cene-proizvoda")
  }

  if (phase === "loading") {
    return <p className="text-sm text-[#6B7280]">Čitam localStorage...</p>
  }

  if (!local || local.proizvodi.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E7EB] bg-white p-6">
        <p className="text-sm text-[#6B7280]">
          Nema localStorage podataka za migraciju u ovom browser-u.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status sažetak */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-[#2563EB]" />
            <h3 className="text-sm font-semibold text-[#374151]">Trenutno u Supabase</h3>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#111827]">{existingProizvodi.length}</p>
          <p className="text-xs text-[#6B7280]">proizvoda</p>
          {existingProizvodi.length > 0 && (
            <ul className="mt-2 text-xs text-[#9CA3AF] space-y-0.5">
              {existingProizvodi.slice(0, 5).map((p) => <li key={p.id}>• {p.naziv}</li>)}
              {existingProizvodi.length > 5 && <li>...i još {existingProizvodi.length - 5}</li>}
            </ul>
          )}
        </div>
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-[#374151]">U localStorage-u</h3>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#111827]">{local.proizvodi.length}</p>
          <p className="text-xs text-[#6B7280]">proizvoda za migraciju</p>
        </div>
      </div>

      {/* Detalji po proizvodu */}
      <div className="rounded-lg border border-[#E5E7EB] bg-white overflow-hidden">
        <div className="bg-[#F9FAFB] px-4 py-3 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#374151]">Šta će biti migrirano</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-xs text-[#9CA3AF]">
              <th className="px-4 py-2 text-left font-medium">Proizvod</th>
              <th className="px-4 py-2 text-right font-medium">Ambalaža</th>
              <th className="px-4 py-2 text-right font-medium">BOM</th>
              <th className="px-4 py-2 text-right font-medium">Radnici</th>
              <th className="px-4 py-2 text-right font-medium">Fiksni</th>
              <th className="px-4 py-2 text-right font-medium">Miks</th>
              <th className="px-4 py-2 text-left font-medium">Napomena</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {local.proizvodi.map((pd) => {
              const dup = existingNames.has(pd.proizvod.naziv.toLowerCase().trim())
              return (
                <tr key={pd.proizvod.id}>
                  <td className="px-4 py-2 font-medium text-[#111827]">{pd.proizvod.naziv}</td>
                  <td className="px-4 py-2 text-right text-[#374151]">{pd.pakovanja.length} pak.</td>
                  <td className="px-4 py-2 text-right text-[#374151]">{pd.bom.length}</td>
                  <td className="px-4 py-2 text-right text-[#374151]">{pd.radnaSnaga.filter((g) => g.broj > 0 || g.neto > 0).length}</td>
                  <td className="px-4 py-2 text-right text-[#374151]">{pd.fiksni.length}</td>
                  <td className="px-4 py-2 text-right text-[#374151]">{pd.miks.length}</td>
                  <td className="px-4 py-2 text-xs">
                    {dup ? <span className="text-amber-600">Postoji — preskoči</span> : <span className="text-[#16A34A]">Nov</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Akcije */}
      {phase === "ready" && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={migrate}
            className="rounded-md bg-[#2563EB] px-5 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8] transition-colors"
          >
            Migriraj sve
          </button>
        </div>
      )}

      {(phase === "running" || phase === "done") && (
        <div className="rounded-lg border border-[#E5E7EB] bg-[#1F2937] p-4 font-mono text-xs text-white max-h-96 overflow-y-auto">
          {phase === "running" && (
            <div className="mb-2 flex items-center gap-2 text-amber-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Migracija u toku...</span>
            </div>
          )}
          {log.map((entry, i) => (
            <div
              key={i}
              className={cn(
                "whitespace-pre-wrap",
                entry.kind === "ok" && "text-[#86EFAC]",
                entry.kind === "err" && "text-[#FCA5A5]",
                entry.kind === "info" && "text-white"
              )}
            >
              {entry.msg}
            </div>
          ))}
          {phase === "done" && (
            <div className="mt-3 border-t border-[#374151] pt-3">
              {errors.length === 0 ? (
                <div className="flex items-center gap-2 text-[#86EFAC]">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Migracija završena bez grešaka.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[#FCA5A5]">
                  <XCircle className="h-4 w-4" />
                  <span>Migracija završena sa {errors.length} grešaka.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/cene-proizvoda")}
            className="rounded-md bg-[#2563EB] px-5 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8] transition-colors"
          >
            Otvori cene proizvoda
          </button>
          <button
            type="button"
            onClick={clearLocalStorage}
            className="flex items-center gap-2 rounded-md border border-red-200 px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Obriši localStorage
          </button>
        </div>
      )}
    </div>
  )
}

function safeJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}
