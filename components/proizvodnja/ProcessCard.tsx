import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function ProcessCard({ title, subtitle, children }: Props) {
  return (
    <Card className="border-[#E5E7EB] bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-[#111827]">{title}</CardTitle>
        {subtitle && <p className="text-xs text-[#6B7280]">{subtitle}</p>}
      </CardHeader>
      <CardContent className="text-sm text-[#111827]">{children}</CardContent>
    </Card>
  )
}
