import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, ClipboardList, Plus, Users } from "lucide-react"

export function QuickActions() {
  const actions = [
    { href: "/cash-flow/novi", label: "Novi Cash Flow snimak", icon: TrendingUp },
    { href: "/proizvodnja/novi", label: "Novi radni nalog", icon: ClipboardList },
    { href: "/proizvodnja", label: "Proizvodnja", icon: ClipboardList },
    { href: "/radnici", label: "Radnici & Plate", icon: Users },
  ]

  return (
    <Card className="border-[#E5E7EB] bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-[#111827]">
          Brze akcije
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {actions.map((a) => {
            const Icon = a.icon
            return (
              <Button key={a.href} asChild variant="outline" className="justify-start border-[#E5E7EB]">
                <Link href={a.href}>
                  <Icon className="mr-2 h-4 w-4 text-[#6B7280]" />
                  {a.label}
                </Link>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
