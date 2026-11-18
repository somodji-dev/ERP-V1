/**
 * Predlog smene i datuma radnog naloga po vremenu otvaranja forme.
 *
 * Smena I se završava u 15h, a nalog se popunjava oko kraja smene (~13–15h).
 * Smena II se završava 22–23h, a nalog se popunjava oko 21–23h.
 * Granica je 18h. Unos posle ponoći (do 05h) je zakasneli unos smene II od prethodnog dana.
 */
export const GRANICA_SMENA_SAT = 18
export const KASNI_UNOS_DO_SAT = 5

export function predlogSmeneIDatuma(sada: Date = new Date()): { smena: "I" | "II"; datum: Date } {
  const sat = sada.getHours()
  const datum = new Date(sada.getFullYear(), sada.getMonth(), sada.getDate())

  if (sat < KASNI_UNOS_DO_SAT) {
    datum.setDate(datum.getDate() - 1)
    return { smena: "II", datum }
  }
  return { smena: sat < GRANICA_SMENA_SAT ? "I" : "II", datum }
}
