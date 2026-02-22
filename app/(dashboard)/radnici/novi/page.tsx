"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createEmployeeAction } from "@/app/actions/radnici"
import { ArrowLeft, Loader2 } from "lucide-react"

const formSchema = z.object({
  ime: z.string().min(1, "Ime je obavezno"),
  prezime: z.string().min(1, "Prezime je obavezno"),
  jmbg: z.string().optional(),
  pozicija: z.string().optional(),
  datum_zaposlenja: z.string().optional(),
  godisnji_fond: z.union([z.number().int().min(0), z.nan()]).optional(),
  nadoknada_prevoz: z.union([z.number().min(0), z.nan()]).optional(),
  aktivan: z.boolean().default(true),
  napomena: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function NoviRadnikPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ime: "",
      prezime: "",
      jmbg: "",
      pozicija: "",
      datum_zaposlenja: "",
      godisnji_fond: undefined,
      nadoknada_prevoz: undefined,
      aktivan: true,
      napomena: "",
    },
  })

  async function onSubmit(values: FormValues) {
    setIsLoading(true)
    const formData = new FormData()
    formData.set("ime", values.ime)
    formData.set("prezime", values.prezime)
    if (values.jmbg) formData.set("jmbg", values.jmbg)
    if (values.pozicija) formData.set("pozicija", values.pozicija)
    if (values.datum_zaposlenja) formData.set("datum_zaposlenja", values.datum_zaposlenja)
    if (values.godisnji_fond !== undefined && !Number.isNaN(values.godisnji_fond))
      formData.set("godisnji_fond", String(values.godisnji_fond))
    if (values.nadoknada_prevoz !== undefined && !Number.isNaN(values.nadoknada_prevoz))
      formData.set("nadoknada_prevoz", String(values.nadoknada_prevoz))
    formData.set("aktivan", values.aktivan ? "true" : "false")
    if (values.napomena) formData.set("napomena", values.napomena)

    const result = await createEmployeeAction(null, formData)
    setIsLoading(false)

    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof FormValues, { message: messages?.[0] })
        })
      }
      toast({
        title: "Greška",
        description: result.error,
        variant: "destructive",
      })
      return
    }
    toast({ title: "Radnik je uspešno dodat." })
    if (result.id) router.push(`/radnici/${result.id}`)
    else router.push("/radnici")
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/radnici" aria-label="Nazad">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-[#111827]">Novi radnik</h1>
      </div>

      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Lični podaci</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ime">Ime *</Label>
                <Input
                  id="ime"
                  {...form.register("ime")}
                  className="border-[#E5E7EB]"
                  placeholder="Ime"
                />
                {form.formState.errors.ime && (
                  <p className="text-xs text-red-600">{form.formState.errors.ime.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="prezime">Prezime *</Label>
                <Input
                  id="prezime"
                  {...form.register("prezime")}
                  className="border-[#E5E7EB]"
                  placeholder="Prezime"
                />
                {form.formState.errors.prezime && (
                  <p className="text-xs text-red-600">{form.formState.errors.prezime.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="jmbg">JMBG</Label>
                <Input
                  id="jmbg"
                  {...form.register("jmbg")}
                  className="border-[#E5E7EB]"
                  placeholder="JMBG"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pozicija">Pozicija</Label>
                <Input
                  id="pozicija"
                  {...form.register("pozicija")}
                  className="border-[#E5E7EB]"
                  placeholder="Pozicija"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="datum_zaposlenja">Datum zaposlenja</Label>
                <Input
                  id="datum_zaposlenja"
                  type="date"
                  {...form.register("datum_zaposlenja")}
                  className="border-[#E5E7EB]"
                  value={form.watch("datum_zaposlenja") ?? ""}
                  onChange={(e) => form.setValue("datum_zaposlenja", e.target.value || undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="godisnji_fond">Godišnji fond (dana)</Label>
                <Input
                  id="godisnji_fond"
                  type="number"
                  min={0}
                  className="border-[#E5E7EB]"
                  placeholder="20"
                  value={
                    form.watch("godisnji_fond") === undefined ||
                    Number.isNaN(form.watch("godisnji_fond"))
                      ? ""
                      : form.watch("godisnji_fond")
                  }
                  onChange={(e) =>
                    form.setValue(
                      "godisnji_fond",
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nadoknada_prevoz">Prevoz (RSD / mesec)</Label>
                <Input
                  id="nadoknada_prevoz"
                  type="number"
                  min={0}
                  className="border-[#E5E7EB]"
                  placeholder="0 = nema pravo na prevoz"
                  value={
                    form.watch("nadoknada_prevoz") === undefined ||
                    Number.isNaN(form.watch("nadoknada_prevoz"))
                      ? ""
                      : form.watch("nadoknada_prevoz")
                  }
                  onChange={(e) =>
                    form.setValue(
                      "nadoknada_prevoz",
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="napomena">Napomena</Label>
              <Input
                id="napomena"
                {...form.register("napomena")}
                className="border-[#E5E7EB]"
                placeholder="Napomena"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#2563EB] hover:bg-[#1D4ED8]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Čuvanje...
                  </>
                ) : (
                  "Sačuvaj"
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/radnici">Otkaži</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
