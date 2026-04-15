import { redirect } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth/user"
import { getUserPermissions, canEdit } from "@/lib/auth/permissions"
import { getAllHygieneTemplates } from "@/app/actions/hygiene"
import { TemplateSettingsClient } from "@/components/hygiene/TemplateSettingsClient"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function HigijenaPodesavanjaPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const permissions = await getUserPermissions(user.id)
  if (!canEdit(permissions, "proizvodnja")) {
    redirect("/proizvodnja/higijena")
  }

  const templates = await getAllHygieneTemplates()

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/proizvodnja/higijena" aria-label="Nazad">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Podešavanja higijene</h1>
          <p className="text-sm text-[#6B7280]">Upravljanje stavkama ček liste (Z-19)</p>
        </div>
      </div>
      <TemplateSettingsClient templates={templates} />
    </div>
  )
}
