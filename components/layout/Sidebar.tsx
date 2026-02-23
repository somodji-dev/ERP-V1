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

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", modul: "dashboard" as const, iconName: "Home" as const },
  { href: "/cash-flow", label: "Cash Flow", modul: "cashflow" as const, iconName: "TrendingUp" as const },
  { href: "/proizvodnja", label: "Proizvodnja", modul: "proizvodnja" as const, iconName: "ClipboardList" as const },
  { href: "/podesavanja", label: "Podešavanja", modul: "podesavanja" as const, iconName: "Settings" as const },
]

export async function Sidebar() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const permissions = await getUserPermissions(user.id)
  const showDashboard = canViewModule(permissions, "dashboard")
  const showRadnici = canViewModule(permissions, "radnici")
  const visibleItems = NAV_ITEMS.filter((item) =>
    canViewModule(permissions, item.modul)
  )

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
          {visibleItems
            .filter((item) => item.href !== "/dashboard")
            .map((item) => (
              <li key={item.href}>
                <NavItem href={item.href} label={item.label} iconName={item.iconName} />
              </li>
            ))}
        </ul>
      </nav>

      {/* User info (dno) */}
      <UserMenu user={user} />
    </aside>
  )
}
