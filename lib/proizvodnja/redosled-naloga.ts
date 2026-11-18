import { parseLotBroj, formatLotBroj } from "@/lib/proizvodnja/lot-broj"

/**
 * Redosled radnih naloga u mesecu: po datumu, pa smena I pre II, pa po vremenu unosa.
 * Broj naloga = pozicija u tom redosledu (NN-MM-YY), pa se posle naknadnog unosa
 * svi kasniji nalozi u mesecu pomere za 1.
 * LOT se NE prenumeriše (odštampan je na ambalaži) — samo se predlaže broj koji fali.
 */
export type NalogZaRedosled = {
  id: string
  datum: string // YYYY-MM-DD
  smena: string // "I" | "II"
  created_at?: string | null
  lot_broj?: string | null
}

function uporedi(a: NalogZaRedosled, b: NalogZaRedosled): number {
  if (a.datum !== b.datum) return a.datum < b.datum ? -1 : 1
  if (a.smena !== b.smena) return a.smena === "I" ? -1 : 1
  const ca = a.created_at ?? ""
  const cb = b.created_at ?? ""
  if (ca !== cb) return ca < cb ? -1 : 1
  return a.id < b.id ? -1 : 1
}

export function formatBrojNaloga(redni: number, godina: number, mesec: number): string {
  return `${String(redni).padStart(2, "0")}-${String(mesec).padStart(2, "0")}-${String(godina).slice(-2)}`
}

/** Novi brojevi naloga za sve naloge jednog meseca: id → NN-MM-YY. */
export function brojeviNalogaZaMesec(
  nalozi: NalogZaRedosled[],
  godina: number,
  mesec: number
): Map<string, string> {
  const sortirani = [...nalozi].sort(uporedi)
  const mapa = new Map<string, string>()
  sortirani.forEach((n, i) => mapa.set(n.id, formatBrojNaloga(i + 1, godina, mesec)))
  return mapa
}

/**
 * Predlog LOT-a za nalog sa datim datumom i smenom u mesecu:
 * LOT poslednjeg ranijeg naloga u mesecu + 1, ako je slobodan; inače najveći LOT + 1.
 * Vraća i listu zauzetih rednih brojeva LOT-a (za upozorenje na duplikat).
 */
export function predlogLotaZaSmenu(
  nalozi: NalogZaRedosled[],
  datum: string,
  smena: string,
  mesec: number
): { predlog: string; zauzeti: number[] } {
  const zauzeti = new Set<number>()
  let max = 0
  for (const n of nalozi) {
    const p = parseLotBroj(n.lot_broj)
    if (!p || p.mesec !== mesec) continue
    zauzeti.add(p.redni)
    if (p.redni > max) max = p.redni
  }

  const ovaj: NalogZaRedosled = { id: "￿", datum, smena, created_at: "￿" }
  const raniji = nalozi
    .filter((n) => uporedi(n, ovaj) < 0 && !(n.datum === datum && n.smena === smena))
    .sort(uporedi)
  let prethodni = 0
  for (let i = raniji.length - 1; i >= 0; i--) {
    const p = parseLotBroj(raniji[i].lot_broj)
    if (p && p.mesec === mesec) {
      prethodni = p.redni
      break
    }
  }

  // Smena I kad je smena II istog dana već upisana: LOT smene II − 1
  // (tačno i kad fali više uzastopnih smena, npr. 10.11 II i 12.11 I).
  let kandidat = prethodni + 1
  if (smena === "I") {
    const drugaSmena = nalozi.find((n) => n.datum === datum && n.smena === "II")
    const p = parseLotBroj(drugaSmena?.lot_broj)
    if (p && p.mesec === mesec && p.redni > 1 && !zauzeti.has(p.redni - 1)) kandidat = p.redni - 1
  }
  const redni = zauzeti.has(kandidat) ? max + 1 : kandidat
  return { predlog: formatLotBroj(redni, mesec), zauzeti: Array.from(zauzeti).sort((a, b) => a - b) }
}
