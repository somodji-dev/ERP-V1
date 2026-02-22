"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Users,
  TrendingUp,
  ClipboardList,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils/cn"

const ICONS = {
  Home,
  Users,
  TrendingUp,
  ClipboardList,
  Settings,
} as const

export type NavIconName = keyof typeof ICONS

interface NavItemProps {
  href: string
  label: string
  iconName: NavIconName
}

export function NavItem({ href, label, iconName }: NavItemProps) {
  const pathname = usePathname()
  const isActive =
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"))
  const Icon = ICONS[iconName]

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
          : "text-[#6B7280] hover:bg-[#F4F5F7]"
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span>{label}</span>
    </Link>
  )
}
