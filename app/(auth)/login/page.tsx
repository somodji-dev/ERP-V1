import { LoginForm } from "@/components/auth/LoginForm"

const SESSION_MISSING_MESSAGE =
  "Prijava je uspela, ali server nije pronašao sesiju. Proverite: (1) da ste u Supabase pokrenuli migration-user-auth-rls-policies.sql, (2) da postoji red u user_roles za vaš User UID, (3) terminal/server log za [getCurrentUser]."

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { reason?: string } | Promise<{ reason?: string }>
}) {
  const params =
    searchParams instanceof Promise ? await searchParams : searchParams ?? {}
  const sessionMissingMessage =
    params.reason === "session_missing" ? SESSION_MISSING_MESSAGE : null

  return <LoginForm sessionMissingMessage={sessionMissingMessage} />
}
