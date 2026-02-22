/**
 * Tipovi za modul Radnici & Plate (prema docs/module-radnici.md)
 */

export type Employee = {
  id: string
  ime: string
  prezime: string
  jmbg: string | null
  pozicija: string | null
  datum_zaposlenja: string | null
  godisnji_fond: number
  nadoknada_prevoz?: number
  aktivan: boolean
  napomena: string | null
  created_at?: string
}

export type RateSetting = {
  id: string
  tip: string
  iznos: number
  vazi_od: string
  napomena: string | null
  created_at?: string
}

export type WorkLog = {
  id: string
  employee_id: string
  datum: string
  sati: number
  tip_sata: string
  je_godisnji?: boolean
  je_bolovanje?: boolean
  napomena: string | null
  created_at?: string
}

export type Advance = {
  id: string
  employee_id: string
  datum: string
  iznos: number
  mesec: number
  godina: number
  napomena: string | null
  created_at?: string
}

export type Bonus = {
  id: string
  employee_id: string
  mesec: number
  godina: number
  iznos: number
  opis: string | null
  created_at?: string
}

export type PayrollReport = {
  id: string
  employee_id: string
  mesec: number
  godina: number
  redovni_sati: number
  prekovremeni_sati: number
  subota_sati: number
  nedelja_sati: number
  praznik_sati: number
  bruto_redovni: number
  bruto_prekovremeno: number
  bruto_subota: number
  bruto_nedelja: number
  bruto_praznik: number
  broj_radnih_dana?: number
  topli_obrok_iznos?: number
  prevoz_iznos?: number
  ukupni_bonusi?: number
  ukupno_bruto: number
  ukupni_avans: number
  neto_za_isplatu: number
  status: "nacrt" | "finalizovan" | "isplacen"
  created_at?: string
}
