"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

/**
 * Odjava — briše Supabase sesiju i preusmerava na /login.
 */
export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
