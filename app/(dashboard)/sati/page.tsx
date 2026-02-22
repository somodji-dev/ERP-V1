import { createClient } from "@/lib/supabase/server"
import { UnosSatiClient } from "@/components/sati/UnosSatiClient"

export const dynamic = "force-dynamic"

export default async function UnosSatiPage() {
  const supabase = await createClient()
  const { data: employees } = await supabase
    .from("employees")
    .select("id, ime, prezime")
    .eq("aktivan", true)
    .order("prezime", { ascending: true })

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#111827]">Unos sati</h1>
      <UnosSatiClient employees={employees ?? []} />
    </div>
  )
}
