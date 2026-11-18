/**
 * LOT broj: redni broj smene u mesecu + "N" + mesec, npr. 21N11.
 *
 * Stari ručni unosi imaju razne oblike (15N010, 6N11, 02n11, 22NO11),
 * pa parser prihvata malo/veliko N, vodeće nule i slovo O umesto nule.
 */
export function parseLotBroj(lot: string | null | undefined): { redni: number; mesec: number } | null {
  if (!lot) return null
  const s = lot.trim().toUpperCase().replace(/\s+/g, "")
  const m = /^(\d+)N([0-9O]+)$/.exec(s)
  if (!m) return null
  const redni = parseInt(m[1], 10)
  const mesec = parseInt(m[2].replace(/O/g, "0"), 10)
  if (Number.isNaN(redni) || Number.isNaN(mesec) || mesec < 1 || mesec > 12) return null
  return { redni, mesec }
}

export function formatLotBroj(redni: number, mesec: number): string {
  return `${String(redni).padStart(2, "0")}N${String(mesec).padStart(2, "0")}`
}

/** Sledeći LOT za mesec: najveći redni broj među LOT-ovima tog meseca + 1. */
export function sledeciLotBroj(postojeci: (string | null | undefined)[], mesec: number): string {
  let max = 0
  for (const lot of postojeci) {
    const p = parseLotBroj(lot)
    if (p && p.mesec === mesec && p.redni > max) max = p.redni
  }
  return formatLotBroj(max + 1, mesec)
}
