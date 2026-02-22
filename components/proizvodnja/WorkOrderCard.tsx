import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  title: string
  children: React.ReactNode
}

export function WorkOrderCard({ title, children }: Props) {
  return (
    <Card className="border-[#E5E7EB] bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-[#111827]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-[#111827]">{children}</CardContent>
    </Card>
  )
}
