"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { saveCompanySettings } from "@/app/actions/company"
import type { CompanySettings } from "@/lib/types/podesavanja"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  naziv: z.string().optional(),
  pib: z.string().optional(),
  maticni_broj: z.string().optional(),
  adresa: z.string().optional(),
  grad: z.string().optional(),
  postanski_broj: z.string().optional(),
  telefon: z.string().optional(),
  email: z.string().email("Neispravan email").optional().or(z.literal("")),
})

type FormValues = z.infer<typeof formSchema>

export function CompanyForm({ initialData }: { initialData: CompanySettings | null }) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      naziv: initialData?.naziv ?? "",
      pib: initialData?.pib ?? "",
      maticni_broj: initialData?.maticni_broj ?? "",
      adresa: initialData?.adresa ?? "",
      grad: initialData?.grad ?? "",
      postanski_broj: initialData?.postanski_broj ?? "",
      telefon: initialData?.telefon ?? "",
      email: initialData?.email ?? "",
    },
  })

  async function onSubmit(values: FormValues) {
    setIsLoading(true)
    try {
      await saveCompanySettings({
        naziv: values.naziv || null,
        pib: values.pib || null,
        maticni_broj: values.maticni_broj || null,
        adresa: values.adresa || null,
        grad: values.grad || null,
        postanski_broj: values.postanski_broj || null,
        telefon: values.telefon || null,
        email: values.email || null,
      })
      toast({ title: "Sačuvano", description: "Podaci firme su ažurirani." })
    } catch (e) {
      toast({
        title: "Greška",
        description: e instanceof Error ? e.message : "Nije moguće sačuvati.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border border-[#E5E7EB] bg-white shadow-sm rounded-xl">
      <CardHeader>
        <CardTitle className="text-lg">Podaci firme</CardTitle>
        <p className="text-sm text-[#6B7280]">
          Unesite naziv, PIB, adresu i ostale podatke. Sva polja su opciona.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="naziv">Naziv firme</Label>
              <Input
                id="naziv"
                {...form.register("naziv")}
                className="border-[#E5E7EB]"
                placeholder="npr. Rio d.o.o."
              />
              {form.formState.errors.naziv && (
                <p className="text-xs text-red-500">{form.formState.errors.naziv.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pib">PIB</Label>
              <Input
                id="pib"
                {...form.register("pib")}
                className="border-[#E5E7EB]"
                placeholder=""
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maticni_broj">Matični broj</Label>
              <Input
                id="maticni_broj"
                {...form.register("maticni_broj")}
                className="border-[#E5E7EB]"
                placeholder=""
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefon">Telefon</Label>
              <Input
                id="telefon"
                {...form.register("telefon")}
                className="border-[#E5E7EB]"
                placeholder=""
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                className="border-[#E5E7EB]"
                placeholder=""
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="adresa">Adresa</Label>
              <Input
                id="adresa"
                {...form.register("adresa")}
                className="border-[#E5E7EB]"
                placeholder=""
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grad">Grad</Label>
              <Input
                id="grad"
                {...form.register("grad")}
                className="border-[#E5E7EB]"
                placeholder=""
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postanski_broj">Poštanski broj</Label>
              <Input
                id="postanski_broj"
                {...form.register("postanski_broj")}
                className="border-[#E5E7EB]"
                placeholder=""
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isLoading} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Čuvanje...
                </>
              ) : (
                "Sačuvaj izmene"
              )}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/podesavanja">Nazad</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
