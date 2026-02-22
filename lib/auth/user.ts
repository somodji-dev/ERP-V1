import { createClient } from "@/lib/supabase/server"
import type { CurrentUser } from "@/lib/types/auth"

/**
 * Vraća trenutnog korisnika iz auth sesije + user_roles.
 * Ako nema sesije ili korisnik nije u user_roles / nije aktivan, vraća null.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error("[getCurrentUser] auth.getUser() error:", authError.message, authError.status)
    return null
  }
  if (!authUser) {
    console.error("[getCurrentUser] Nema sesije na serveru — cookie možda nije poslat ili je istekao.")
    return null
  }

  const { data: role, error } = await supabase
    .from("user_roles")
    .select("id, user_id, username, display_name, aktivan, employee_id, last_login")
    .eq("user_id", authUser.id)
    .single()

  if (error || !role) {
    if (error) {
      console.error("[getCurrentUser] user_roles query failed:", error.message, error.code)
    } else {
      console.error("[getCurrentUser] no user_roles row for user_id:", authUser.id)
    }
    return null
  }
  if (!role.aktivan) {
    console.error("[getCurrentUser] user_roles.aktivan = false for user_id:", authUser.id)
    return null
  }

  return {
    id: authUser.id,
    email: authUser.email ?? "",
    username: role.username,
    display_name: role.display_name,
    aktivan: role.aktivan,
    employee_id: role.employee_id,
    last_login: role.last_login,
  }
}

/**
 * Odjava — briše Supabase sesiju (koristi se na clientu preko signOut).
 */
export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
