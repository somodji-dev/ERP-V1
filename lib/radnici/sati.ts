/**
 * Pomocne funkcije za unos sati (module-radnici.md)
 */

export function getTipSataZaDan(datum: Date): "redovni" | "subota" | "nedelja" {
  const dan = datum.getDay()
  if (dan === 0) return "nedelja"
  if (dan === 6) return "subota"
  return "redovni"
}

/** Vraća niz datuma u mesecu kao "YYYY-MM-DD" (lokalni kalendar, bez UTC). */
export function getDaniUMesecu(mesec: number, godina: number): string[] {
  const dani: string[] = []
  const poslednji = new Date(godina, mesec, 0).getDate()
  const m = String(mesec).padStart(2, "0")
  for (let i = 1; i <= poslednji; i++) {
    dani.push(`${godina}-${m}-${String(i).padStart(2, "0")}`)
  }
  return dani
}
