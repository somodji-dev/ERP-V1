"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { appendLoginDebug } from "@/app/actions/log-debug"

const INTERNAL_EMAIL_DOMAIN = "@internal.erp"
const DEBUG_STORAGE_KEY = "login_debug_last"

type DebugStep =
  | ""
  | "1_submit_pozvan"
  | "2_env_ok"
  | "3_supabase_kreiran"
  | "4_posle_signin"
  | "5_uspeh_redirect"
  | "greska"

function saveDebug(step: DebugStep, errorMsg: string | null) {
  try {
    sessionStorage.setItem(
      DEBUG_STORAGE_KEY,
      JSON.stringify({ step, errorMsg, at: new Date().toISOString() })
    )
  } catch {
    // ignore
  }
}

export function LoginForm({
  sessionMissingMessage = null,
}: {
  sessionMissingMessage?: string | null
}) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    saveDebug("1_submit_pozvan", null)
    appendLoginDebug("1_submit_pozvan", null, { username: username.trim() })
    console.log("[Login] 1. handleSubmit pozvan", { username: username.trim() })

    const email = `${username.trim()}${INTERNAL_EMAIL_DOMAIN}`

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      const msg = "Supabase nije konfigurisan. Proverite .env.local (NEXT_PUBLIC_SUPABASE_URL i ANON_KEY)."
      console.error("[Login] Env nedostaje", { url: !!supabaseUrl, key: !!supabaseKey })
      setErrorMessage(msg)
      saveDebug("greska", msg)
      appendLoginDebug("greska", msg, { reason: "env_missing" })
      setLoading(false)
      toast({ title: "Greška", description: msg, variant: "destructive" })
      return
    }
    saveDebug("2_env_ok", null)
    appendLoginDebug("2_env_ok", null)
    console.log("[Login] 2. Env OK")

    try {
      const supabase = createClient()
      saveDebug("3_supabase_kreiran", null)
      appendLoginDebug("3_supabase_kreiran", null)
      console.log("[Login] 3. Supabase client kreiran")

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password })

      saveDebug("4_posle_signin", signInError?.message ?? null)
      appendLoginDebug("4_posle_signin", signInError?.message ?? null, {
        hasUser: !!signInData?.user,
      })
      console.log("[Login] 4. signIn odgovor", {
        hasUser: !!signInData?.user,
        error: signInError?.message ?? null,
      })

      if (signInError) {
        const msg = signInError.message || "Pogrešan username ili lozinka."
        setErrorMessage(msg)
        saveDebug("greska", msg)
        appendLoginDebug("greska", msg, { signInError: signInError.message })
        setLoading(false)
        toast({ title: "Greška pri prijavi", description: msg, variant: "destructive" })
        return
      }

      if (!signInData?.user) {
        const msg = "Nije moguće dobiti podatke o korisniku."
        setErrorMessage(msg)
        saveDebug("greska", msg)
        appendLoginDebug("greska", msg, { reason: "no_user" })
        setLoading(false)
        toast({ title: "Greška", description: msg, variant: "destructive" })
        return
      }

      const userId = signInData.user.id
      try {
        await supabase
          .from("user_roles")
          .update({ last_login: new Date().toISOString() })
          .eq("user_id", userId)
      } catch {
        // ne blokira login
      }

      saveDebug("5_uspeh_redirect", null)
      appendLoginDebug("5_uspeh_redirect", null, { userId })
      try {
        await fetch(window.location.origin + "/dashboard", { credentials: "include" })
      } catch {
        // ignoriši
      }
      await new Promise((r) => setTimeout(r, 500))
      window.location.replace("/dashboard")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Neočekivana greška. Pokušajte ponovo."
      console.error("[Login] Izuzetak:", err)
      setErrorMessage(msg)
      saveDebug("greska", msg)
      appendLoginDebug("greska", msg, {
        exception: String(err),
        stack: err instanceof Error ? err.stack : undefined,
      })
      setLoading(false)
      toast({ title: "Greška", description: msg, variant: "destructive" })
    }
  }

  return (
    <Card className="w-full max-w-md border border-[#E5E7EB] bg-white shadow-sm rounded-xl">
      <CardHeader className="text-center pb-2">
        <div className="w-14 h-14 bg-primary rounded-xl mx-auto mb-3 flex items-center justify-center">
          <span className="text-white text-xl font-bold">E</span>
        </div>
        <CardTitle className="text-xl">ERP Sistem</CardTitle>
        <CardDescription>Prijavite se na sistem</CardDescription>
      </CardHeader>
      <CardContent>
        {sessionMissingMessage && (
          <div className="mb-4 p-3 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-800">
            {sessionMissingMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=""
              required
              autoComplete="username"
              className="border-[#E5E7EB]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Lozinka</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
              required
              autoComplete="current-password"
              className="border-[#E5E7EB]"
            />
          </div>
          {errorMessage && (
            <p className="text-sm text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-md px-3 py-2">
              {errorMessage}
            </p>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover"
          >
            {loading ? "Prijava..." : "Prijavi se"}
          </Button>
          <p className="text-xs text-[#6B7280]">
            U Supabase Dashboard mora postojati korisnik sa emailom:{" "}
            <strong>{username.trim() || "username"}@internal.erp</strong>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
