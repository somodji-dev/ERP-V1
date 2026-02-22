import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList } from "lucide-react"
import { format } from "date-fns"
import { srLatn } from "date-fns/locale"

type Order = {
  id: string
  broj_naloga: string
  datum: string
  smena: string
  ukupnoKg: number
}

type Props = { orders: Order[] }

export function RecentOrders({ orders }: Props) {
  return (
    <Card className="border-[#E5E7EB] bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-[#111827]">
          Poslednji radni nalozi
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="py-8 text-center text-[#6B7280]">
            <ClipboardList className="mx-auto h-10 w-10 opacity-50" />
            <p className="mt-2 text-sm">Nema naloga.</p>
            <Button asChild variant="outline" size="sm" className="mt-3 border-[#E5E7EB]">
              <Link href="/proizvodnja/novi">Novi nalog</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id}>
                <Link
                  href={`/proizvodnja/${o.id}`}
                  className="flex items-center justify-between rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm transition-colors hover:bg-[#F9FAFB] hover:border-[#2563EB]"
                >
                  <span className="font-medium text-[#111827]">{o.broj_naloga}</span>
                  <span className="text-[#6B7280]">
                    {format(new Date(o.datum), "dd.MM.yy", { locale: srLatn })} · {o.ukupnoKg} kg
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {orders.length > 0 && (
          <Button asChild variant="ghost" size="sm" className="mt-3 w-full text-[#2563EB]">
            <Link href="/proizvodnja">Svi nalozi</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
