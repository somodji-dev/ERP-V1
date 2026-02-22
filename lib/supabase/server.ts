import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Supabase klijent za Server Components i Server Actions.
 * Koristi cookie store za čitanje/postavljanje auth sesije.
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value ?? null
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        try {
          cookieStore.set(name, value, options)
        } catch {
          // Ignoriši u Server Components kada set nije dozvoljen
        }
      },
      remove(name: string, options: Record<string, unknown>) {
        try {
          cookieStore.set(name, "", { ...options, maxAge: 0 })
        } catch {
          // ignoriši
        }
      },
    },
  })
}
