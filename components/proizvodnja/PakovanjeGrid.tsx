"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type PakovanjeValues = {
  pikant_15kg: number
  pikant_1kg: number
  pikant_200g: number
  pikant_150g: number
  pikant_80g: number
  bbq_15kg: number
  bbq_1kg: number
  bbq_200g: number
  bbq_150g: number
  bbq_80g: number
}

type Props = {
  values: PakovanjeValues
  onChange: (field: keyof PakovanjeValues, value: number) => void
  errors?: Partial<Record<keyof PakovanjeValues, string>>
  readOnly?: boolean
}

export function PakovanjeGrid({ values, onChange, errors, readOnly }: Props) {
  const inputProps = (field: keyof PakovanjeValues, type: "float" | "int") => ({
    type: "number" as const,
    min: 0,
    ...(type === "float" ? { step: 0.1 } : {}),
    value: values[field] === 0 ? "" : values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange(field, type === "float" ? parseFloat(e.target.value) || 0 : parseInt(e.target.value, 10) || 0),
    placeholder: "0",
    className: "border-[#E5E7EB]",
    readOnly: readOnly ?? false,
  })

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold text-[#111827]">PIKANT</Label>
        <div className="grid grid-cols-2 gap-3 mt-2 sm:grid-cols-5">
          {[
            { key: "pikant_15kg" as const, label: "15kg (kg)", type: "float" as const },
            { key: "pikant_1kg" as const, label: "1kg (kg)", type: "float" as const },
            { key: "pikant_200g" as const, label: "200g (kutije)", type: "int" as const },
            { key: "pikant_150g" as const, label: "150g (kutije)", type: "int" as const },
            { key: "pikant_80g" as const, label: "80g (kutije)", type: "int" as const },
          ].map(({ key, label, type }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs text-[#6B7280]">{label}</Label>
              <Input {...inputProps(key, type)} />
              {errors?.[key] && <p className="text-xs text-[#DC2626]">{errors[key]}</p>}
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-sm font-semibold text-[#111827]">BBQ</Label>
        <div className="grid grid-cols-2 gap-3 mt-2 sm:grid-cols-5">
          {[
            { key: "bbq_15kg" as const, label: "15kg (kg)", type: "float" as const },
            { key: "bbq_1kg" as const, label: "1kg (kg)", type: "float" as const },
            { key: "bbq_200g" as const, label: "200g (kutije)", type: "int" as const },
            { key: "bbq_150g" as const, label: "150g (kutije)", type: "int" as const },
            { key: "bbq_80g" as const, label: "80g (kutije)", type: "int" as const },
          ].map(({ key, label, type }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs text-[#6B7280]">{label}</Label>
              <Input {...inputProps(key, type)} />
              {errors?.[key] && <p className="text-xs text-[#DC2626]">{errors[key]}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
