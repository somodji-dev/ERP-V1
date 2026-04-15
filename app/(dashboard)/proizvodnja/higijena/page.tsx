import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/user"
import { getUserPermissions, canEdit } from "@/lib/auth/permissions"
import { getHygieneChecklists } from "@/app/actions/hygiene"
import { Button } from "@/components/ui/button"
import { Plus, Settings, CheckCircle2, Printer, ClipboardCheck } from "lucide-react"

const MESECI = [
  "", "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
]

export default async function HigijenaListaPage({
  searchParams,
}: {
  searchParams: Promise<{ godina?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const permissions = await getUserPermissions(user.id)
  const isAdmin = canEdit(permissions, "proizvodnja")

  const params = await searchParams
  const currentYear = new Date().getFullYear()
  const godina = params.godina ? Number(params.godina) : currentYear
  const checklists = await getHygieneChecklists(godina)

  const years: number[] = []
  for (let y = currentYear; y >= 2018; y--) years.push(y)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Higijena — ček liste</h1>
          <p className="text-sm text-[#6B7280]">Mesečni pregled higijene radnog prostora (Z-19)</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button asChild variant="outline" className="border-[#E5E7EB]">
              <Link href="/proizvodnja/higijena/podesavanja">
                <Settings className="mr-2 h-4 w-4" />
                Podešavanja
              </Link>
            </Button>
          )}
          <Button asChild className="bg-[#2563EB] hover:bg-[#1D4ED8]">
            <Link href="/proizvodnja/higijena/nova">
              <Plus className="mr-2 h-4 w-4" />
              Nova za mesec
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-[#6B7280]">Godina:</span>
        <form action="/proizvodnja/higijena" method="GET">
          <select
            name="godina"
            defaultValue={String(godina)}
            className="rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm"
            onChange={(e) => (e.currentTarget.form as HTMLFormElement).submit()}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </form>
      </div>

      {checklists.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-white py-12 text-center shadow-sm">
          <ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-[#9CA3AF]" />
          <p className="text-sm text-[#6B7280]">Nema ček lista za {godina}. godinu.</p>
          <Button asChild className="mt-4 bg-[#2563EB] hover:bg-[#1D4ED8]">
            <Link href="/proizvodnja/higijena/nova">
              <Plus className="mr-2 h-4 w-4" />
              Nova ček lista
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {checklists.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-bold text-[#111827]">{MESECI[c.mesec]} {c.godina}</p>
                  <p className="mt-1 text-sm text-[#6B7280]">{c.total_completions} unosa</p>
                </div>
                {c.has_verifikacija && (
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm" className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8]">
                  <Link href={`/proizvodnja/higijena/${c.id}`}>Otvori</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-[#E5E7EB]">
                  <Link href={`/proizvodnja/higijena/${c.id}/stampa`}>
                    <Printer className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
