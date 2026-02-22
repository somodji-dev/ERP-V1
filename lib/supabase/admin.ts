import { createClient } from "@supabase/supabase-js"

/**
 * Supabase klijent sa SERVICE ROLE ključem — samo za server-side admin akcije
 * (kreiranje korisnika, reset lozinke). Nikad ga ne koristiti na clientu.
 * Za .env.local dodaj: SUPABASE_SERVICE_ROLE_KEY=...
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY nije postavljen. Dodaj ga u .env.local za kreiranje korisnika i reset lozinke."
    )
  }
  return createClient(url, serviceRoleKey)
}
