import Link from "next/link"
import { ArrowUp, ArrowDown, ChevronRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"

export type KPICardChange = {
  value: number
  percentage: number
  isPositive: boolean
}

type KPICardProps = {
  title: string
  value: string | number
  change?: KPICardChange | null
  subtitle?: string
  icon: React.ReactNode
  valuePrefix?: string
  valueSuffix?: string
  href?: string
  formatAsCurrency?: boolean
}

export function KPICard({
  title,
  value,
  change,
  subtitle,
  icon,
  valuePrefix = "",
  valueSuffix = "",
  href,
  formatAsCurrency = false,
}: KPICardProps) {
  const displayValue =
    typeof value === "number" && formatAsCurrency
      ? formatCurrency(value)
      : typeof value === "number"
        ? value.toLocaleString("sr-RS")
        : value

  const content = (
    <>
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm text-[#6B7280]">{title}</span>
        <div className="text-[#9CA3AF]">{icon}</div>
      </div>
      <p className="text-2xl font-extrabold text-[#111827] sm:text-3xl">
        {valuePrefix}
        {displayValue}
        {!formatAsCurrency && valueSuffix}
      </p>
      {change ? (
        <p
          className={`text-sm mt-2 flex items-center gap-1 ${
            change.isPositive ? "text-[#16A34A]" : "text-[#DC2626]"
          }`}
        >
          {change.isPositive ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
          {change.value > 0 ? "+" : ""}
          {change.value.toLocaleString("sr-RS")} ({change.percentage > 0 ? "+" : ""}
          {change.percentage}%)
          <span className="text-[#6B7280] ml-1">vs prošli mesec</span>
        </p>
      ) : subtitle ? (
        <p className="text-sm text-[#6B7280] mt-2">{subtitle}</p>
      ) : null}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl border-2 border-transparent bg-white p-6 shadow-sm transition-all duration-200 hover:border-[#2563EB] hover:shadow-md cursor-pointer group border-[#E5E7EB]"
      >
        {content}
        <p className="text-xs text-[#2563EB] mt-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          Detaljnija analiza
          <ChevronRight className="h-3 w-3" />
        </p>
      </Link>
    )
  }

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      {content}
    </div>
  )
}
