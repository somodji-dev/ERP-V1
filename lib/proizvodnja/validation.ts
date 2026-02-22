/**
 * Zod šema i tipovi za radne naloge (Proizvodnja)
 */
import { z } from "zod"

export const workOrderSchema = z.object({
  broj_naloga: z.string().min(1, "Broj naloga je obavezan"),
  radnici: z.array(z.string().uuid()).min(1, "Izaberite bar jednog radnika"),
  datum: z.date(),
  smena: z.enum(["I", "II"]),

  draziranje: z.object({
    radnik_id: z.string().min(1, "Izaberite radnika"),
    broj_draziranja: z.number().min(1, "Broj dražiranja mora biti najmanje 1"),
    dobavljac: z.enum(["Good Food", "Karlito", "In sistem"]),
  }),

  przenje: z.object({
    merenje_tpm: z.number().optional(),
  }),

  pakovanje: z
    .object({
      radnik_id: z.string().min(1, "Izaberite radnika za pakovanje"),
      pikant_15kg: z.number().min(0).default(0),
      pikant_1kg: z.number().min(0).default(0),
      pikant_200g: z.number().int().min(0).default(0),
      pikant_150g: z.number().int().min(0).default(0),
      pikant_80g: z.number().int().min(0).default(0),
      bbq_15kg: z.number().min(0).default(0),
      bbq_1kg: z.number().min(0).default(0),
      bbq_200g: z.number().int().min(0).default(0),
      bbq_150g: z.number().int().min(0).default(0),
      bbq_80g: z.number().int().min(0).default(0),
      lot_broj: z.string().optional(),
    })
    .refine(
      (data) => {
        const total =
          data.pikant_15kg +
          data.pikant_1kg +
          data.pikant_200g +
          data.pikant_150g +
          data.pikant_80g +
          data.bbq_15kg +
          data.bbq_1kg +
          data.bbq_200g +
          data.bbq_150g +
          data.bbq_80g
        return total > 0
      },
      { message: "Bar jedno pakovanje mora biti upisano" }
    ),
})

export type WorkOrderFormValues = z.infer<typeof workOrderSchema>

export const DOBAVLJACI = ["Good Food", "Karlito", "In sistem"] as const
