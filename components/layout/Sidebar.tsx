import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/user"
import { getUserPermissions, canViewModule } from "@/lib/auth/permissions"
import { NavItem } from "./NavItem"
import { NavGroup } from "./NavGroup"
import { UserMenu } from "./UserMenu"

const RADNICI_SUB_ITEMS = [
  { href: "/radnici", label: "Radnici" },
  { href: "/sati", label: "Unos sati" },
  { href: "/plate", label: "Plate" },
  { href: "/radnici/podesavanja", label: "Podešavanja satnica" },
]

const FINANSIJE_SUB_ITEMS = [
  { href: "/cash-flow", label: "Cash Flow" },
  { href: "/prihodi-rashodi", label: "Prihodi i Rashodi" },
  { href: "/dodatni-troskovi", label: "Dodatni troškovi" },
]

const PROIZVODNJA_SUB_ITEMS = [
  { href: "/proizvodnja", label: "Radni nalozi" },
  { href: "/proizvodnja/sirovine", label: "Popis sirovina" },
  { href: "/proizvodnja/higijena", label: "Higijena" },
]

export async function Sidebar() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const permissions = await getUserPermissions(user.id)
  const showDashboard = canViewModule(permissions, "dashboard")
  const showRadnici = canViewModule(permissions, "radnici")
  const showFinansije = canViewModule(permissions, "cashflow")
  const showProizvodnja = canViewModule(permissions, "proizvodnja")
  const showPodesavanja = canViewModule(permissions, "podesavanja")

  return (
    <aside
      className="flex h-full w-full min-w-[220px] flex-col border-r border-[#E5E7EB] bg-[#FFFFFF]"
      style={{ width: "220px" }}
    >
      {/* Logo sekcija */}
      <div className="flex h-16 items-center gap-3 border-b border-[#E5E7EB] px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2563EB] text-white font-bold text-lg">
          E
        </div>
        <span className="font-semibold text-[#111827]">ERP System</span>
      </div>

      {/* Navigacija */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">
          Navigacija
        </p>
        <ul className="space-y-0.5">
          {showDashboard && (
            <li>
              <NavItem href="/dashboard" label="Dashboard" iconName="Home" />
            </li>
          )}
          {showRadnici && (
            <li>
              <NavGroup
                label="Radnici & Plate"
                iconName="Users"
                subItems={RADNICI_SUB_ITEMS}
              />
            </li>
          )}
          {showFinansije && (
            <li>
              <NavGroup
                label="Finansije"
                iconName="Wallet"
                subItems={FINANSIJE_SUB_ITEMS}
              />
            </li>
          )}
          {showProizvodnja && (
            <li>
              <NavGroup
                label="Proizvodnja"
                iconName="ClipboardList"
                subItems={PROIZVODNJA_SUB_ITEMS}
              />
            </li>
          )}
          {showPodesavanja && (
            <li>
              <NavItem href="/podesavanja" label="Podešavanja" iconName="Settings" />
            </li>
          )}
        </ul>
      </nav>

      {/* User info (dno) */}
      <UserMenu user={user} />
    </aside>
  )
}
