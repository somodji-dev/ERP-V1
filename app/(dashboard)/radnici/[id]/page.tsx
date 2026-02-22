import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Palette, ThermometerSun } from "lucide-react"
import { format } from "date-fns"
import { srLatn } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils/format"

type Props = { params: Promise<{ id: string }> }

export default async function RadnikProfilPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: employee, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !employee) {
    notFound()
  }

  const datumZaposlenjaFormatted = employee.datum_zaposlenja
    ? format(new Date(employee.datum_zaposlenja), "dd.MM.yyyy", { locale: srLatn })
    : "—"

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/radnici" aria-label="Nazad na listu">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-[#111827]">
          {employee.ime} {employee.prezime}
        </h1>
      </div>

      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Lični podaci</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium text-[#6B7280]">Ime i prezime:</span>{" "}
            {employee.ime} {employee.prezime}
          </p>
          <p>
            <span className="font-medium text-[#6B7280]">Pozicija:</span>{" "}
            {employee.pozicija ?? "—"}
          </p>
          <p>
            <span className="font-medium text-[#6B7280]">Zaposlenje:</span>{" "}
            {datumZaposlenjaFormatted}
          </p>
          <p>
            <span className="font-medium text-[#6B7280]">Godišnji fond:</span>{" "}
            {employee.godisnji_fond ?? 20} dana
          </p>
          <p>
            <span className="font-medium text-[#6B7280]">Prevoz:</span>{" "}
            {(employee as { nadoknada_prevoz?: number }).nadoknada_prevoz != null &&
            Number((employee as { nadoknada_prevoz?: number }).nadoknada_prevoz) > 0
              ? formatCurrency(Number((employee as { nadoknada_prevoz?: number }).nadoknada_prevoz))
              : "nema pravo na prevoz"}
          </p>
          <p>
            <span className="font-medium text-[#6B7280]">Status:</span>{" "}
            {employee.aktivan ? "Aktivan" : "Neaktivan"}
          </p>
          {employee.napomena ? (
            <p>
              <span className="font-medium text-[#6B7280]">Napomena:</span>{" "}
              {employee.napomena}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mt-4 border-[#E5E7EB] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="h-5 w-5 text-[#6B7280]" />
            Godišnji odmor (Jul – Jun)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[#6B7280]">
          Pregled fonda i iskorišćenih dana biće dostupan u sledećoj fazi (unos sati).
        </CardContent>
      </Card>

      <Card className="mt-4 border-[#E5E7EB] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ThermometerSun className="h-5 w-5 text-[#6B7280]" />
            Bolovanje
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[#6B7280]">
          Evidencija bolovanja biće dostupna uz unos radnih sati.
        </CardContent>
      </Card>

      <Card className="mt-4 border-[#E5E7EB] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#6B7280]" />
            Statistika meseca
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[#6B7280]">
          Redovni / prekovremeni / subota-nedelja sati biće prikazani kada postoji unos sati.
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/radnici/${id}/uredi`}>Uredi</Link>
        </Button>
        <Button asChild size="sm" className="bg-[#2563EB] hover:bg-[#1D4ED8]">
          <Link href={`/plate/novi?employeeId=${id}`}>Generiši platni izveštaj</Link>
        </Button>
      </div>
    </div>
  )
}
