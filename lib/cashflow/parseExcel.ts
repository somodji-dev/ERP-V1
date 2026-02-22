/**
 * Parsiranje Excel/CSV za Cash Flow — DOCS/module-cashflow.md
 *
 * Podržani nazivi kolona:
 * - Partner: Partner, NAZIV, Naziv, Firma
 * - Kupci:   KUPAC, Kupci, Potraživanja, Customers
 * - Dobavljači: DOBAVLJAC, Dobavljači, Suppliers
 */

import * as XLSX from "xlsx"

export type ParsedPartnerRow = {
  partner_naziv: string
  kupci_iznos: number
  dobavljaci_iznos: number
}

export type ParseExcelResult = {
  partneri: ParsedPartnerRow[]
  sumaKupci: number
  sumaDobavljaci: number
}

/** Uklanja dijakritike za upoređivanje (č→c, ć→c, š→s, ž→z, đ→d) */
function bezDijakritika(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/č/g, "c")
    .replace(/ć/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/đ/g, "d")
}

/**
 * Vraća tip kolone: "partner" | "kupci" | "dobavljaci" | "".
 * Podržani formati: Partner/Naziv, Kupci/KUPAC, Dobavljači/DOBAVLJAC (i engleski/sadrži).
 */
function tipKolone(key: unknown): "partner" | "kupci" | "dobavljaci" | "" {
  if (key == null) return ""
  const s = String(key).trim().toLowerCase()
  const b = bezDijakritika(s)
  // Partner — NAZIV, Partner, Naziv, Firma
  if (
    b === "naziv" || b === "partner" || b === "firma" || b === "name" ||
    b.includes("partner") || b.includes("naziv") || b.includes("firma")
  ) return "partner"
  // Kupci — KUPAC, Kupci, Potraživanja, Customers
  if (
    b === "kupac" || b === "kupci" || b === "potrazivanja" || b === "customers" ||
    b.includes("kupac") || b.includes("kupci") || b.includes("potrazivanja") || b.includes("customers")
  ) return "kupci"
  // Dobavljači — DOBAVLJAC, Dobavljači, Suppliers
  if (
    b === "dobavljac" || b === "dobavljaci" || b === "suppliers" ||
    b.includes("dobavljac") || b.includes("suppliers")
  ) return "dobavljaci"
  return ""
}

/**
 * Parsira broj iz ćelije: podržava number, string sa evropskim (150.000,50) ili
 * američkim (150,000.50) formatom, razmak kao separator hiljada, i tekst tipa "150.000 RSD".
 */
function num(val: unknown): number {
  if (val == null || val === "") return 0
  if (typeof val === "number" && !Number.isNaN(val)) return val
  let s = String(val).trim()
  // Ukloni valutu na kraju (RSD, EUR, din, itd.) — ne diraj tačku/zarez
  s = s.replace(/\s*(RSD|EUR|din\.?|dinara?)\s*$/gi, "").trim()
  // Ukloni razmake (npr. "150 000")
  s = s.replace(/\s/g, "")
  if (!s || s === "-") return 0
  const hasComma = s.includes(",")
  const hasDot = s.includes(".")
  if (!hasComma && !hasDot) return Number(s) || 0
  // Jedan separator: decimalni (npr. "150" ili "150,50")
  if (hasComma && !hasDot) {
    const parts = s.split(",")
    if (parts.length === 2) return Number(parts[0] + "." + parts[1].replace(/\./g, "")) || 0
    return Number(s.replace(/,/g, "")) || 0
  }
  if (hasDot && !hasComma) {
    const parts = s.split(".")
    if (parts.length === 2) return Number(parts[0].replace(/\s/g, "") + "." + parts[1]) || 0
    return Number(s.replace(/\./g, "")) || 0
  }
  // Oba: evropski (150.000,50) ili američki (150,000.50) — poslednji je decimalni
  const lastComma = s.lastIndexOf(",")
  const lastDot = s.lastIndexOf(".")
  if (lastComma > lastDot) {
    // Zarez je decimalni (evropski): 150.000,50
    s = s.replace(/\./g, "").replace(",", ".")
  } else {
    // Tačka je decimalna (američki): 150,000.50
    s = s.replace(/,/g, "")
  }
  return Number(s) || 0
}

export function parseExcelFile(file: File): Promise<ParseExcelResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data || !(data instanceof ArrayBuffer)) {
          reject(new Error("Prazan fajl"))
          return
        }
        const workbook = XLSX.read(data, { type: "array" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        if (!sheet) {
          reject(new Error("Nema lista u fajlu"))
          return
        }
        // raw: true — brojevi iz ćelija ostaju number (ne formatirani string)
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: "",
          raw: true,
        })
        if (rows.length === 0) {
          resolve({ partneri: [], sumaKupci: 0, sumaDobavljaci: 0 })
          return
        }

        const first = rows[0]
        // Svi ključevi iz prvog reda (uključujući prazne ili __EMPTY — koristimo ih po indeksu ako treba)
        const allKeys = Object.keys(first)
        const keys = allKeys.filter((k) => k && !String(k).startsWith("__"))
        const keyMap: Record<string, string> = {}
        keys.forEach((k) => {
          const tip = tipKolone(k)
          if (tip) keyMap[tip] = k
        })

        // Ako neki tip nije prepoznat, probaj po sadržaju naziva (npr. "Kupci (RSD)" -> kupci)
        if (!keyMap.kupci) {
          const found = (keys.length ? keys : allKeys).find((k) => {
            const b = bezDijakritika(String(k).toLowerCase())
            return b.includes("kupci") || b.includes("potrazivanja") || b.includes("kupac")
          })
          if (found) keyMap.kupci = found
        }
        if (!keyMap.dobavljaci) {
          const list = keys.length ? keys : allKeys
          const found = list.find((k) => bezDijakritika(String(k).toLowerCase()).includes("dobavljac"))
          if (found) keyMap.dobavljaci = found
        }
        if (!keyMap.partner) {
          const list = keys.length ? keys : allKeys
          const found = list.find((k) => {
            const b = bezDijakritika(String(k).toLowerCase())
            return b.includes("partner") || b.includes("naziv") || b.includes("firma")
          })
          if (found) keyMap.partner = found
        }

        // Konačno: ako nema mapiranja po imenu, uzmi po redosledu kolona (1. = Partner, 2. = Kupci, 3. = Dobavljači)
        const byIndex = keys.length > 0 ? keys : allKeys
        const partnerKey = keyMap.partner ?? byIndex[0] ?? ""
        const kupciKey = keyMap.kupci ?? byIndex[1] ?? ""
        const dobavljaciKey = keyMap.dobavljaci ?? byIndex[2] ?? ""

        let sumaKupci = 0
        let sumaDobavljaci = 0
        const partneri: ParsedPartnerRow[] = []

        for (const row of rows) {
          const partnerNaziv = String(row[partnerKey] ?? "").trim()
          const kupciIznos = num(row[kupciKey])
          const dobavljaciIznos = num(row[dobavljaciKey])
          if (!partnerNaziv && kupciIznos === 0 && dobavljaciIznos === 0) continue
          partneri.push({
            partner_naziv: partnerNaziv || "—",
            kupci_iznos: kupciIznos,
            dobavljaci_iznos: dobavljaciIznos,
          })
          sumaKupci += kupciIznos
          sumaDobavljaci += dobavljaciIznos
        }

        resolve({ partneri, sumaKupci, sumaDobavljaci })
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Greška pri čitanju fajla"))
      }
    }
    reader.onerror = () => reject(new Error("Greška pri čitanju fajla"))
    reader.readAsArrayBuffer(file)
  })
}
