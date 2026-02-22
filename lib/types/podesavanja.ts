/**
 * Tipovi za modul Podešavanja (company_settings, activity_log).
 */

export interface CompanySettings {
  id: string
  naziv: string | null
  pib: string | null
  maticni_broj: string | null
  adresa: string | null
  grad: string | null
  postanski_broj: string | null
  telefon: string | null
  email: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface ActivityLogEntry {
  id: string
  user_id: string | null
  akcija: string
  modul: string
  entitet: string | null
  entitet_id: string | null
  detalji: Record<string, unknown> | null
  created_at: string
}
