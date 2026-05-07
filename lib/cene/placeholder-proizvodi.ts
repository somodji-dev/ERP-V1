export interface PlaceholderProizvod {
  id: string
  naziv: string
  opis?: string
}

export const PLACEHOLDER_PROIZVODI: PlaceholderProizvod[] = [
  { id: "pikant-ozzy", naziv: "Pikant OZZY", opis: "Pikant kikiriki" },
  { id: "wasabi", naziv: "Wasabi", opis: "Wasabi kikiriki" },
  { id: "xotzila", naziv: "XOTZILA" },
  { id: "bbq", naziv: "BBQ" },
  { id: "bbq-fun-fit", naziv: "BBQ Fun Fit" },
  { id: "karamel", naziv: "Karamel" },
  { id: "kuglice", naziv: "Kuglice" },
]

export function findPlaceholderProizvod(id: string): PlaceholderProizvod | undefined {
  return PLACEHOLDER_PROIZVODI.find((p) => p.id === id)
}
