export interface RabatnaScenario {
  osnovna_kg: number
  kolicina_kg: number
  rabat: number
}

export interface RabatniBlock {
  id: string
  proizvod_id: string
  selected_pakovanje_id: string | null
  position: number
  scenarios: [RabatnaScenario, RabatnaScenario, RabatnaScenario, RabatnaScenario]
}

export const EMPTY_SCENARIO: RabatnaScenario = {
  osnovna_kg: 0,
  kolicina_kg: 0,
  rabat: 0,
}

export const EMPTY_SCENARIOS: [RabatnaScenario, RabatnaScenario, RabatnaScenario, RabatnaScenario] = [
  { ...EMPTY_SCENARIO },
  { ...EMPTY_SCENARIO },
  { ...EMPTY_SCENARIO },
  { ...EMPTY_SCENARIO },
]
