export interface PrevozEnergija {
  proizvod_id: string
  prevoz_cena: number
  prevoz_kg: number
  struja_racun: number
  struja_kg: number
}

export const EMPTY_PREVOZ_ENERGIJA = (proizvodId: string): PrevozEnergija => ({
  proizvod_id: proizvodId,
  prevoz_cena: 0,
  prevoz_kg: 0,
  struja_racun: 0,
  struja_kg: 0,
})
