import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Middleware osvežava Supabase auth sesiju (cookies) pre nego što zahtev stigne do Server Components.
 * Bez toga prvi zahtev na /dashboard posle logina može imati neosveženu sesiju pa getCurrentUser() vrati null.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) return response

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value: "", ...options, maxAge: 0 })
        },
      },
    })
    await supabase.auth.getUser()
  } catch {
    // Ne blokiraj učitavanje stranice (npr. /login bez cookie-ja)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Zaobilazi static fajlove i sl.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
