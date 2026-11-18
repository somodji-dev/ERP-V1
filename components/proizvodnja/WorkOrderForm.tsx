"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createWorkOrder, updateWorkOrder, getNextBrojNaloga, getLotPredlog } from "@/app/actions/work-orders"
import { parseLotBroj } from "@/lib/proizvodnja/lot-broj"
import { WorkOrderCard } from "@/components/proizvodnja/WorkOrderCard"
import { ProcessCard } from "@/components/proizvodnja/ProcessCard"
import { PakovanjeGrid } from "@/components/proizvodnja/PakovanjeGrid"
import { CheckLista, type CheckOpcija } from "@/components/proizvodnja/CheckLista"
import { workOrderSchema, type WorkOrderFormValues, DOBAVLJACI } from "@/lib/proizvodnja/validation"
import { predlogSmeneIDatuma } from "@/lib/proizvodnja/predlog-smene"
import { Loader2 } from "lucide-react"

type Employee = { id: string; ime: string; prezime: string }

type Props = {
  mode: "create" | "edit"
  workOrderId?: string
  employees: Employee[]
  initialData?: Partial<WorkOrderFormValues>
}

function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function WorkOrderForm({
  mode,
  workOrderId,
  employees,
  initialData,
}: Props) {
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      broj_naloga: initialData?.broj_naloga ?? "",
      radnici: initialData?.radnici ?? [],
      datum: initialData?.datum ?? new Date(),
      smena: initialData?.smena ?? "I",
      draziranje: {
        radnik_id: initialData?.draziranje?.radnik_id ?? "",
        broj_draziranja: initialData?.draziranje?.broj_draziranja ?? 0,
        dobavljac: initialData?.draziranje?.dobavljac ?? "Good Food",
      },
      przenje: {
        merenje_tpm: initialData?.przenje?.merenje_tpm,
      },
      pakovanje: {
        radnik_id: initialData?.pakovanje?.radnik_id ?? "",
        pikant_15kg: initialData?.pakovanje?.pikant_15kg ?? 0,
        pikant_1kg: initialData?.pakovanje?.pikant_1kg ?? 0,
        pikant_200g: initialData?.pakovanje?.pikant_200g ?? 0,
        pikant_150g: initialData?.pakovanje?.pikant_150g ?? 0,
        pikant_80g: initialData?.pakovanje?.pikant_80g ?? 0,
        bbq_15kg: initialData?.pakovanje?.bbq_15kg ?? 0,
        bbq_1kg: initialData?.pakovanje?.bbq_1kg ?? 0,
        bbq_200g: initialData?.pakovanje?.bbq_200g ?? 0,
        bbq_150g: initialData?.pakovanje?.bbq_150g ?? 0,
        bbq_80g: initialData?.pakovanje?.bbq_80g ?? 0,
        lot_broj: initialData?.pakovanje?.lot_broj ?? "",
      },
    },
  })

  // Predlog smene i datuma po lokalnom vremenu otvaranja forme (samo za novi nalog).
  // Radi se u useEffect da bi se koristio sat na uređaju, a ne na serveru.
  const [predlogSmeneTekst, setPredlogSmeneTekst] = useState<string | null>(null)
  useEffect(() => {
    if (mode !== "create") return
    const sada = new Date()
    const predlog = predlogSmeneIDatuma(sada)
    if (!initialData?.smena) form.setValue("smena", predlog.smena, { shouldValidate: true })
    if (!initialData?.datum) form.setValue("datum", predlog.datum, { shouldValidate: true })
    const sat = `${String(sada.getHours()).padStart(2, "0")}:${String(sada.getMinutes()).padStart(2, "0")}`
    setPredlogSmeneTekst(`Predloženo po vremenu unosa (${sat}) — proverite pre čuvanja.`)
  }, [mode, initialData?.smena, initialData?.datum, form])

  // Svi aktivni radnici za smenu; za operaciju samo radnici izabrani u smeni
  // (ako niko nije izabran — svi), uz već izabranog radnika da ne nestane iz liste.
  const sviRadnici: CheckOpcija[] = employees.map((e) => ({ value: e.id, label: `${e.ime} ${e.prezime}` }))
  const radniciUSmeni = form.watch("radnici")
  function radniciZaOperaciju(izabraniId: string): CheckOpcija[] {
    if (radniciUSmeni.length === 0) return sviRadnici
    return sviRadnici.filter((o) => radniciUSmeni.includes(o.value) || o.value === izabraniId)
  }

  // Predlog LOT broja za izabrani datum i smenu: LOT prethodne smene u mesecu + 1
  // (tako naknadno uneti nalog dobije LOT koji fali), inače najveći + 1.
  // Ne prepisuje LOT koji je korisnik ručno izmenio. Zauzeti brojevi služe za upozorenje.
  const datumYMD = toYMD(form.watch("datum"))
  const smena = form.watch("smena")
  const [zauzetiLot, setZauzetiLot] = useState<{ mesec: number; brojevi: number[] } | null>(null)
  useEffect(() => {
    let otkazano = false
    getLotPredlog(datumYMD, smena, workOrderId).then((rez) => {
      if (otkazano || !rez) return
      setZauzetiLot({ mesec: parseInt(datumYMD.slice(5, 7), 10), brojevi: rez.zauzeti })
      if (mode !== "create" || initialData?.pakovanje?.lot_broj) return
      if (form.getFieldState("pakovanje.lot_broj").isDirty) return
      form.setValue("pakovanje.lot_broj", rez.predlog)
    })
    return () => {
      otkazano = true
    }
  }, [mode, datumYMD, smena, workOrderId, initialData?.pakovanje?.lot_broj, form])

  const unetiLot = parseLotBroj(form.watch("pakovanje.lot_broj"))
  const lotDuplikat =
    unetiLot && zauzetiLot && unetiLot.mesec === zauzetiLot.mesec && zauzetiLot.brojevi.includes(unetiLot.redni)

  // Privremeni broj naloga za mesec izabranog datuma; posle čuvanja se mesec prenumeriše.
  useEffect(() => {
    if (mode !== "create" || initialData?.broj_naloga) return
    let otkazano = false
    getNextBrojNaloga(datumYMD).then((next) => {
      if (!otkazano) form.setValue("broj_naloga", next)
    })
    return () => {
      otkazano = true
    }
  }, [mode, datumYMD, initialData?.broj_naloga, form])

  const onSubmit = async (values: WorkOrderFormValues) => {
    try {
      if (mode === "edit" && workOrderId) {
        const result = await updateWorkOrder(workOrderId, values)
        if (result.success) {
          toast({ title: "Nalog izmenjen.", description: "Izmene su sačuvane." })
          router.push(`/proizvodnja/${workOrderId}`)
        } else {
          toast({ title: "Greška", description: result.error, variant: "destructive" })
        }
      } else {
        const result = await createWorkOrder(values)
        if (result.success) {
          toast({ title: "Nalog kreiran.", description: "Radni nalog je uspešno kreiran." })
          router.push(`/proizvodnja/${result.data.id}`)
        } else {
          toast({ title: "Greška", description: result.error, variant: "destructive" })
        }
      }
    } catch {
      toast({ title: "Greška", description: "Greška pri čuvanju naloga.", variant: "destructive" })
    }
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <WorkOrderCard title="Zaglavlje">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="broj_naloga" className="text-[#6B7280]">
              Broj naloga
            </Label>
            <Input
              id="broj_naloga"
              className="border-[#E5E7EB] bg-[#F9FAFB]"
              readOnly
              {...form.register("broj_naloga")}
            />
            <p className="text-xs text-[#6B7280]">Dodeljuje se automatski po datumu i smeni.</p>
            {form.formState.errors.broj_naloga && (
              <p className="text-xs text-[#DC2626]">{form.formState.errors.broj_naloga.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-[#6B7280]">Datum</Label>
            <Input
              type="date"
              className="border-[#E5E7EB]"
              value={toYMD(form.watch("datum"))}
              onChange={(e) => form.setValue("datum", new Date(e.target.value), { shouldValidate: true })}
            />
          </div>
        </div>
        <div className="mt-5">
          <CheckLista
            label="Smena"
            kolone={2}
            opcije={[
              { value: "I", label: "I smena" },
              { value: "II", label: "II smena" },
            ]}
            vrednost={form.watch("smena")}
            onChange={(v) => form.setValue("smena", v as "I" | "II", { shouldValidate: true })}
          />
          {predlogSmeneTekst && <p className="mt-1 text-xs text-[#6B7280]">{predlogSmeneTekst}</p>}
        </div>
        <div className="mt-5">
          <CheckLista
            vise
            label="Radnici u smeni"
            opcije={sviRadnici}
            vrednost={form.watch("radnici")}
            onChange={(ids) => form.setValue("radnici", ids, { shouldValidate: true })}
            error={form.formState.errors.radnici?.message}
          />
        </div>
      </WorkOrderCard>

      <ProcessCard title="Dražiranje" subtitle="Sva polja obavezna">
        <div className="max-w-[200px]">
          <div className="space-y-2">
            <Label className="text-[#6B7280]">Broj dražiranja</Label>
            <Input
              type="number"
              min={1}
              placeholder="0"
              className="border-[#E5E7EB]"
              value={form.watch("draziranje.broj_draziranja") === 0 ? "" : form.watch("draziranje.broj_draziranja")}
              onChange={(e) =>
                form.setValue("draziranje.broj_draziranja", parseInt(e.target.value, 10) || 0, {
                  shouldValidate: true,
                })
              }
            />
            {form.formState.errors.draziranje?.broj_draziranja && (
              <p className="text-xs text-[#DC2626]">{form.formState.errors.draziranje.broj_draziranja.message}</p>
            )}
          </div>
        </div>
        <div className="mt-5">
          <CheckLista
            label="Dobavljač"
            opcije={DOBAVLJACI.map((d) => ({ value: d, label: d }))}
            vrednost={form.watch("draziranje.dobavljac")}
            onChange={(v) =>
              form.setValue("draziranje.dobavljac", v as "Good Food" | "Karlito" | "In sistem", { shouldValidate: true })
            }
          />
        </div>
        <div className="mt-5">
          <CheckLista
            label="Radnik na dražiranju"
            opcije={radniciZaOperaciju(form.watch("draziranje.radnik_id"))}
            vrednost={form.watch("draziranje.radnik_id")}
            onChange={(v) => form.setValue("draziranje.radnik_id", v, { shouldValidate: true })}
            error={form.formState.errors.draziranje?.radnik_id?.message}
          />
        </div>
      </ProcessCard>

      <ProcessCard title="Prženje" subtitle="(Opciono)">
        <div className="max-w-[200px] space-y-2">
          <Label className="text-[#6B7280]">Merenje TPM</Label>
          <Input
            type="number"
            step={0.1}
            placeholder="0"
            className="border-[#E5E7EB]"
            value={form.watch("przenje.merenje_tpm") ?? ""}
            onChange={(e) => {
              const v = e.target.value
              form.setValue("przenje.merenje_tpm", v === "" ? undefined : parseFloat(v) || 0)
            }}
          />
        </div>
      </ProcessCard>

      <ProcessCard title="Začinjavanje">
        <p className="text-[#6B7280]">(Za sada prazno)</p>
      </ProcessCard>

      <ProcessCard
        title="Pakovanje"
        subtitle="Radnik i bar jedno pakovanje obavezno. LOT broj opciono."
      >
        <div className="space-y-4">
          <CheckLista
            label="Radnik na pakovanju"
            opcije={radniciZaOperaciju(form.watch("pakovanje.radnik_id"))}
            vrednost={form.watch("pakovanje.radnik_id")}
            onChange={(v) => form.setValue("pakovanje.radnik_id", v, { shouldValidate: true })}
            error={form.formState.errors.pakovanje?.radnik_id?.message}
          />
          <div>
            <Label className="text-sm font-medium text-[#111827]">Šta smo pakovali:</Label>
            <div className="mt-2">
              <PakovanjeGrid
                values={form.watch("pakovanje")}
                onChange={(field, value) =>
                  form.setValue(`pakovanje.${field}`, value, { shouldValidate: true })
                }
                errors={form.formState.errors.pakovanje as Record<string, string> | undefined}
              />
            </div>
            {form.formState.errors.pakovanje?.message && (
              <p className="mt-2 text-xs text-[#DC2626]">{form.formState.errors.pakovanje.message}</p>
            )}
          </div>
          <div className="max-w-[200px] space-y-2">
            <Label className="text-[#6B7280]">LOT broj (opciono)</Label>
            <Input
              className="border-[#E5E7EB]"
              placeholder="npr. 21N11"
              {...form.register("pakovanje.lot_broj")}
            />
            {lotDuplikat && (
              <p className="text-xs text-[#D97706]">Ovaj LOT već postoji u tom mesecu.</p>
            )}
          </div>
        </div>
      </ProcessCard>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="h-12 border-[#E5E7EB] px-5"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Otkaži
        </Button>
        <Button
          type="submit"
          className="h-14 min-w-[220px] bg-[#2563EB] px-8 text-lg font-semibold hover:bg-[#1D4ED8]"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {mode === "edit" ? "Sačuvaj izmene" : "Sačuvaj nalog"}
        </Button>
      </div>
    </form>
  )
}
