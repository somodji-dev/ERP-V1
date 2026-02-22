import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Clock, Banknote, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"

export async function RadniciKpiCards() {
  const supabase = await createClient()
  const now = new Date()
  const mesec = now.getMonth() + 1
  const godina = now.getFullYear()
  const startDate = `${godina}-${String(mesec).padStart(2, "0")}-01`
  const lastDay = new Date(godina, mesec, 0).getDate()
  const endDate = `${godina}-${String(mesec).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

  let aktivni = 0
  let ukupnoSati = 0
  let ukupnoIsplaceno = 0
  let prekovremeni = 0

  const { count } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("aktivan", true)
  aktivni = count ?? 0

  try {
    const { data: satiRows } = await supabase
      .from("work_logs")
      .select("sati")
      .gte("datum", startDate)
      .lte("datum", endDate)
    if (satiRows?.length) {
      ukupnoSati = satiRows.reduce((sum, r) => sum + Number(r.sati ?? 0), 0)
    }

    const { data: prekovremeniRows } = await supabase
      .from("work_logs")
      .select("sati")
      .eq("tip_sata", "prekovremeno")
      .gte("datum", startDate)
      .lte("datum", endDate)
    if (prekovremeniRows?.length) {
      prekovremeni = prekovremeniRows.reduce((sum, r) => sum + Number(r.sati ?? 0), 0)
    }

    const { data: payrollRows } = await supabase
      .from("payroll_reports")
      .select("neto_za_isplatu")
      .eq("mesec", mesec)
      .eq("godina", godina)
      .in("status", ["finalizovan", "isplacen"])
    if (payrollRows?.length) {
      ukupnoIsplaceno = payrollRows.reduce((sum, r) => sum + Number(r.neto_za_isplatu ?? 0), 0)
    }
  } catch {
    // RLS ili tabela nedostaje — ostaje 0
  }

  const cards = [
    {
      title: "Aktivni radnici",
      value: String(aktivni),
      icon: Users,
      suffix: "",
    },
    {
      title: "Ukupno sati (mesec)",
      value: String(Math.round(ukupnoSati * 10) / 10),
      icon: Clock,
      suffix: "h",
    },
    {
      title: "Ukupno isplaćeno (mesec)",
      value: formatCurrency(ukupnoIsplaceno),
      icon: Banknote,
      suffix: "",
    },
    {
      title: "Prekovremeni sati",
      value: String(Math.round(prekovremeni * 10) / 10),
      icon: AlertCircle,
      suffix: "h",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ title, value, icon: Icon, suffix }) => (
        <Card
          key={title}
          className="border-[#E5E7EB] bg-white shadow-sm"
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-[#6B7280]">{title}</span>
              <Icon className="h-5 w-5 text-[#9CA3AF]" aria-hidden />
            </div>
            <p className="text-3xl font-bold text-[#111827]">
              {value}
              {suffix && <span className="text-lg font-medium text-[#6B7280]"> {suffix}</span>}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
