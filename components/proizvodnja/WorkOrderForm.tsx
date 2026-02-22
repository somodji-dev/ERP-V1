"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { createWorkOrder, updateWorkOrder, getNextBrojNaloga } from "@/app/actions/work-orders"
import { WorkOrderCard } from "@/components/proizvodnja/WorkOrderCard"
import { ProcessCard } from "@/components/proizvodnja/ProcessCard"
import { PakovanjeGrid } from "@/components/proizvodnja/PakovanjeGrid"
import { EmployeeMultiSelect } from "@/components/proizvodnja/EmployeeMultiSelect"
import { workOrderSchema, type WorkOrderFormValues, DOBAVLJACI } from "@/lib/proizvodnja/validation"
import { Loader2 } from "lucide-react"

type Employee = { id: string; ime: string; prezime: string }

type Props = {
  mode: "create" | "edit"
  workOrderId?: string
  employees: Employee[]
  initialBrojNaloga?: string
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
  initialBrojNaloga,
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

  useEffect(() => {
    if (mode === "create" && !initialData?.broj_naloga) {
      if (initialBrojNaloga) {
        form.setValue("broj_naloga", initialBrojNaloga)
        return
      }
      getNextBrojNaloga().then((next) => form.setValue("broj_naloga", next))
    }
  }, [mode, initialBrojNaloga, initialData?.broj_naloga, form])

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
              className="border-[#E5E7EB]"
              {...form.register("broj_naloga")}
            />
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
        <div className="mt-4 space-y-2">
          <EmployeeMultiSelect
            employees={employees}
            selectedIds={form.watch("radnici")}
            onChange={(ids) => form.setValue("radnici", ids, { shouldValidate: true })}
            error={form.formState.errors.radnici?.message}
          />
        </div>
        <div className="mt-4 max-w-[120px] space-y-2">
          <Label className="text-[#6B7280]">Smena</Label>
          <Select
            value={form.watch("smena")}
            onValueChange={(v) => form.setValue("smena", v as "I" | "II", { shouldValidate: true })}
          >
            <SelectTrigger className="border-[#E5E7EB]">
              <SelectValue placeholder="Smena" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="I">I</SelectItem>
              <SelectItem value="II">II</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </WorkOrderCard>

      <ProcessCard title="Dražiranje" subtitle="Sva polja obavezna">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-[#6B7280]">Radnik</Label>
            <Select
              value={form.watch("draziranje.radnik_id")}
              onValueChange={(v) => form.setValue("draziranje.radnik_id", v, { shouldValidate: true })}
            >
              <SelectTrigger className="border-[#E5E7EB]">
                <SelectValue placeholder="Izaberi radnika" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.ime} {e.prezime}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.draziranje?.radnik_id && (
              <p className="text-xs text-[#DC2626]">{form.formState.errors.draziranje.radnik_id.message}</p>
            )}
          </div>
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
          <div className="space-y-2">
            <Label className="text-[#6B7280]">Dobavljač</Label>
            <Select
              value={form.watch("draziranje.dobavljac")}
              onValueChange={(v) => form.setValue("draziranje.dobavljac", v as "Good Food" | "Karlito" | "In sistem", { shouldValidate: true })}
            >
              <SelectTrigger className="border-[#E5E7EB]">
                <SelectValue placeholder="Izaberi dobavljača" />
              </SelectTrigger>
              <SelectContent>
                {DOBAVLJACI.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          <div className="max-w-[280px] space-y-2">
            <Label className="text-[#6B7280]">Radnik</Label>
            <Select
              value={form.watch("pakovanje.radnik_id")}
              onValueChange={(v) => form.setValue("pakovanje.radnik_id", v, { shouldValidate: true })}
            >
              <SelectTrigger className="border-[#E5E7EB]">
                <SelectValue placeholder="Izaberi radnika" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.ime} {e.prezime}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.pakovanje?.radnik_id && (
              <p className="text-xs text-[#DC2626]">{form.formState.errors.pakovanje.radnik_id.message}</p>
            )}
          </div>
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
              placeholder="npr. LOT-2025-A456"
              {...form.register("pakovanje.lot_broj")}
            />
          </div>
        </div>
      </ProcessCard>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="border-[#E5E7EB]"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Otkaži
        </Button>
        <Button type="submit" className="bg-[#2563EB] hover:bg-[#1D4ED8]" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "edit" ? "Sačuvaj izmene" : "Sačuvaj nalog"}
        </Button>
      </div>
    </form>
  )
}
