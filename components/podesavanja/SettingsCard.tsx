import Link from "next/link"
import { ChevronRight } from "lucide-react"

type SettingsCardProps = {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  subtitle?: string
}

export function SettingsCard({
  title,
  description,
  href,
  icon,
  subtitle,
}: SettingsCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition-all duration-200 hover:border-[#2563EB] hover:shadow-md"
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-[#9CA3AF]">{icon}</span>
        <ChevronRight className="h-5 w-5 text-[#9CA3AF] group-hover:text-[#2563EB] transition-colors" />
      </div>
      <h2 className="text-lg font-semibold text-[#111827]">{title}</h2>
      <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
      {subtitle && (
        <p className="mt-2 text-xs text-[#9CA3AF]">{subtitle}</p>
      )}
    </Link>
  )
}
