import { getLatestRates } from "@/app/actions/rate-settings"
import { PodesavanjaSatniceClient } from "@/components/radnici/PodesavanjaSatniceClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"

export default async function PodesavanjaSatnicePage() {
  const rates = await getLatestRates()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111827] flex items-center gap-2">
          <Settings className="h-6 w-6 text-[#6B7280]" />
          Podešavanja — Satnice
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Trenutne satnice po tipu. Izmena kreira novu stavku sa datumom „Važi od” (istorija se čuva).
        </p>
      </div>

      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Satnice</CardTitle>
        </CardHeader>
        <CardContent>
          <PodesavanjaSatniceClient rates={rates} />
        </CardContent>
      </Card>
    </div>
  )
}
