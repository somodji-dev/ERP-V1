import { Card, CardContent } from "@/components/ui/card"

type Props = {
  title: string
  value: string | number
  subtitle?: string
  valuePrefix?: string
  valueSuffix?: string
  formatAsCurrency?: boolean
}

export function MetricCard({
  title,
  value,
  subtitle,
  valuePrefix = "",
  valueSuffix = "",
  formatAsCurrency = false,
}: Props) {
  const displayValue =
    typeof value === "number" && formatAsCurrency
      ? value.toLocaleString("sr-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " RSD"
      : typeof value === "number"
        ? value.toLocaleString("sr-RS")
        : value

  return (
    <Card className="border-[#E5E7EB] bg-white shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs font-medium text-[#6B7280]">{title}</p>
        <p className="mt-1 text-xl font-bold text-[#111827]">
          {valuePrefix}
          {displayValue}
          {!formatAsCurrency && valueSuffix}
        </p>
        {subtitle && <p className="mt-0.5 text-xs text-[#6B7280]">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
