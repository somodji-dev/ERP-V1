import Link from "next/link"
import { getCurrentUser } from "@/lib/auth/user"
import { getUserPermissions, canViewModule, canEdit } from "@/lib/auth/permissions"
import { redirect } from "next/navigation"
import { getCompanySettings } from "@/app/actions/company"
import { CompanyForm } from "@/components/podesavanja/CompanyForm"

export default async function FirmaPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const permissions = await getUserPermissions(user.id)
  if (!canViewModule(permissions, "podesavanja")) redirect("/dashboard")

  const company = await getCompanySettings()
  const canEditCompany = canEdit(permissions, "podesavanja")

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/podesavanja"
          className="text-sm text-[#6B7280] hover:text-[#111827]"
          aria-label="Nazad na Podešavanja"
        >
          ← Podešavanja
        </Link>
      </div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111827]">Podaci firme</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Unesite ili izmenite podatke o firmi (naziv, PIB, adresa, itd.).
        </p>
      </div>
      {canEditCompany ? (
        <CompanyForm initialData={company} />
      ) : (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <p className="text-sm text-[#6B7280]">
            Nemate pravo da menjate podatke firme. Možete ih samo pregledati.
          </p>
          {company && (
            <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {company.naziv && (
                <>
                  <dt className="text-xs text-[#9CA3AF]">Naziv</dt>
                  <dd className="text-sm text-[#111827]">{company.naziv}</dd>
                </>
              )}
              {company.pib && (
                <>
                  <dt className="text-xs text-[#9CA3AF]">PIB</dt>
                  <dd className="text-sm text-[#111827]">{company.pib}</dd>
                </>
              )}
              {company.adresa && (
                <>
                  <dt className="text-xs text-[#9CA3AF]">Adresa</dt>
                  <dd className="text-sm text-[#111827]">{company.adresa}</dd>
                </>
              )}
              {company.telefon && (
                <>
                  <dt className="text-xs text-[#9CA3AF]">Telefon</dt>
                  <dd className="text-sm text-[#111827]">{company.telefon}</dd>
                </>
              )}
              {company.email && (
                <>
                  <dt className="text-xs text-[#9CA3AF]">Email</dt>
                  <dd className="text-sm text-[#111827]">{company.email}</dd>
                </>
              )}
            </dl>
          )}
        </div>
      )}
    </div>
  )
}
