"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils/cn"

export type NavGroupIconName = "Users"

const ICONS: Record<NavGroupIconName, React.ComponentType<{ className?: string }>> = {
  Users,
}

interface SubItem {
  href: string
  label: string
}

interface NavGroupProps {
  label: string
  iconName: NavGroupIconName
  subItems: SubItem[]
}

function isSubItemActive(href: string, pathname: string): boolean {
  if (href === "/radnici") {
    return pathname === "/radnici" || (pathname.startsWith("/radnici/") && !pathname.startsWith("/radnici/podesavanja"))
  }
  if (href === "/radnici/podesavanja") return pathname === "/radnici/podesavanja"
  if (href === "/sati") return pathname === "/sati"
  if (href === "/plate") return pathname === "/plate" || pathname.startsWith("/plate/")
  return pathname === href || pathname.startsWith(href + "/")
}

export function NavGroup({ label, iconName, subItems }: NavGroupProps) {
  const pathname = usePathname()
  const isGroupActive =
    pathname === "/radnici" ||
    pathname.startsWith("/radnici/") ||
    pathname === "/sati" ||
    pathname === "/plate" ||
    pathname.startsWith("/plate/")

  const [expanded, setExpanded] = useState(isGroupActive)

  useEffect(() => {
    if (isGroupActive) setExpanded(true)
  }, [isGroupActive])

  const Icon = ICONS[iconName]

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isGroupActive
            ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
            : "text-[#6B7280] hover:bg-[#F4F5F7]"
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
      </button>
      {expanded && (
        <ul className="space-y-0.5 pl-6 pr-2">
          {subItems.map((sub) => {
            const isActive = isSubItemActive(sub.href, pathname)
            return (
              <li key={sub.href}>
                <Link
                  href={sub.href}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
                      : "text-[#6B7280] hover:bg-[#F4F5F7]"
                  )}
                >
                  {sub.label}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
