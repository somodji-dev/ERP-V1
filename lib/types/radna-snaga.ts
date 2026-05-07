export interface RadnaSnagaGrupa {
  proizvod_id: string
  grupa_key: string
  grupa_label: string
  broj: number
  neto: number
}

export const DEFAULT_GRUPE: ReadonlyArray<{ key: string; label: string }> = [
  { key: "proizvodnja", label: "Radnici u proizvodnji" },
  { key: "kancelarija", label: "Radnici u kancelariji" },
  { key: "direktor",    label: "Direktori" },
]

export function hydrateGrupe(
  proizvodId: string,
  saved: RadnaSnagaGrupa[]
): RadnaSnagaGrupa[] {
  const byKey = new Map(saved.map((g) => [g.grupa_key, g]))
  return DEFAULT_GRUPE.map(({ key, label }) => {
    const existing = byKey.get(key)
    return existing ?? {
      proizvod_id: proizvodId,
      grupa_key: key,
      grupa_label: label,
      broj: 0,
      neto: 0,
    }
  })
}
