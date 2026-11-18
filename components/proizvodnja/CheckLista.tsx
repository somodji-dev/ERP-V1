"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils/cn"

export type CheckOpcija = { value: string; label: string }

type Zajednicko = {
  opcije: CheckOpcija[]
  label?: string
  error?: string
  disabled?: boolean
  /** Broj kolona na širem ekranu (na telefonu su uvek 2). */
  kolone?: 2 | 3 | 4
  prazno?: string
}

type Vise = Zajednicko & { vise: true; vrednost: string[]; onChange: (v: string[]) => void }
type Jedan = Zajednicko & { vise?: false; vrednost: string; onChange: (v: string) => void }

/**
 * Velika ček lista za biranje na dodir.
 * `vise` = može više izbora (radnici u smeni); inače tačno jedan izbor (radnik na operaciji, smena, dobavljač).
 */
export function CheckLista(props: Vise | Jedan) {
  const { opcije, label, error, disabled, kolone = 3, prazno } = props
  const izabrano = (v: string) => (props.vise ? props.vrednost.includes(v) : props.vrednost === v)

  function klik(v: string) {
    if (disabled) return
    if (props.vise) {
      props.onChange(izabrano(v) ? props.vrednost.filter((x) => x !== v) : [...props.vrednost, v])
    } else {
      props.onChange(v)
    }
  }

  const koloneKlasa = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[kolone]

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-[#6B7280]">{label}</span>
          <span className="text-xs text-[#9CA3AF]">
            {props.vise ? `Izabrano: ${props.vrednost.length}` : "Izaberi jedan"}
          </span>
        </div>
      )}
      {opcije.length === 0 ? (
        <p className="text-sm text-[#6B7280]">{prazno ?? "Nema opcija."}</p>
      ) : (
        <div role={props.vise ? "group" : "radiogroup"} className={cn("grid grid-cols-2 gap-2", koloneKlasa)}>
          {opcije.map((o) => {
            const on = izabrano(o.value)
            return (
              <button
                key={o.value}
                type="button"
                role={props.vise ? "checkbox" : "radio"}
                aria-checked={on}
                disabled={disabled}
                onClick={() => klik(o.value)}
                className={cn(
                  "flex min-h-[52px] items-center gap-3 rounded-lg border-2 px-3 py-2 text-left text-base transition-colors",
                  on
                    ? "border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A]"
                    : "border-[#E5E7EB] bg-white text-[#111827] hover:border-[#93C5FD]",
                  disabled && "cursor-not-allowed opacity-60"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center border-2",
                    props.vise ? "rounded-md" : "rounded-full",
                    on ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-[#D1D5DB] bg-white"
                  )}
                >
                  {on && <Check className="h-4 w-4" strokeWidth={3} />}
                </span>
                <span className="leading-tight">{o.label}</span>
              </button>
            )
          })}
        </div>
      )}
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
    </div>
  )
}
