/**
 * Tipovi za modul Higijena (Z-19 ček lista)
 */

export type HygieneGrupa = "radni_prostor" | "krug"
export type HygienePeriod = "SP" | "NP" | "MP"

export type HygieneTemplate = {
  id: string
  naziv: string
  grupa: HygieneGrupa
  period: HygienePeriod
  redosled: number
  aktivan: boolean
  created_at?: string
}

export type HygieneChecklist = {
  id: string
  mesec: number
  godina: number
  verifikator_id: string | null
  verifikator_funkcija: string | null
  verifikator_datum: string | null
  napomena: string | null
  created_by: string | null
  created_at?: string
}

export type HygieneCompletion = {
  id: string
  checklist_id: string
  template_id: string
  datum_uradjeno: string
  employee_id: string | null
  napomena: string | null
  created_at?: string
}

export type HygieneCompletionWithRelations = HygieneCompletion & {
  employee?: { ime: string; prezime: string } | null
}

export type HygieneChecklistSummary = {
  id: string
  mesec: number
  godina: number
  total_completions: number
  has_verifikacija: boolean
}

export type HygieneChecklistDetail = HygieneChecklist & {
  templates: HygieneTemplate[]
  completions: HygieneCompletionWithRelations[]
  verifikator?: { ime: string; prezime: string } | null
}
