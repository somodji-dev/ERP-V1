"use client"

import { useState } from "react"
import { cn } from "@/lib/utils/cn"
import { TrosakSirovinaTab } from "./TrosakSirovinaTab"
import { TrosakRadneSnageTab } from "./TrosakRadneSnageTab"
import { TrosakPrevozaEnergije } from "./TrosakPrevozaEnergije"
import { TrosakAmbalaze } from "./TrosakAmbalaze"
import { TrosakPTRTab } from "./TrosakPTRTab"
import { TrosakRabatneSkale } from "./TrosakRabatneSkale"
import { MaloprodajnaCenaTab } from "./MaloprodajnaCenaTab"
import type { MaterijaliCena } from "@/lib/types/materijali-cene"
import type { AmbalazaPakovanje } from "@/lib/types/ambalaza"
import type { BomStavka } from "@/lib/types/bom"
import type { PrevozEnergija } from "@/lib/types/prevoz-energija"
import type { RadnaSnagaGrupa } from "@/lib/types/radna-snaga"
import type { PtrFiksniStavka, PtrParams, PtrMiksRow } from "@/lib/types/ptr"
import type { RabatniBlock } from "@/lib/types/rabatne-skale"
import type { MpCenaBlock } from "@/lib/types/mp-cena"

type Tab = "sirovine" | "radna-snaga" | "prevoz" | "ambalaza" | "ptr" | "rabatne" | "krajnja-cena"

const TABS: { key: Tab; label: string }[] = [
  { key: "sirovine", label: "Trošak sirovina" },
  { key: "radna-snaga", label: "Trošak radne snage" },
  { key: "prevoz", label: "Trošak prevoza i energije" },
  { key: "ambalaza", label: "Trošak ambalaže" },
  { key: "ptr", label: "PTR" },
  { key: "rabatne", label: "Rabatne skale" },
  { key: "krajnja-cena", label: "Krajnja MP cena" },
]

interface Props {
  productId: string
  proizvodNaziv: string
  materijali: MaterijaliCena[]
  pakovanja: AmbalazaPakovanje[]
  bomStavke: BomStavka[]
  ukupnaKolicina: number
  prevozEnergija: PrevozEnergija
  radnaSnagaGrupe: RadnaSnagaGrupa[]
  opterecenje: number
  fiksniStavke: PtrFiksniStavka[]
  ptrParams: PtrParams
  miks: PtrMiksRow[]
  rabatneBlocks: RabatniBlock[]
  mpCenaBlocks: MpCenaBlock[]
}

export function ProracunCeneClient({
  productId,
  proizvodNaziv,
  materijali,
  pakovanja,
  bomStavke,
  ukupnaKolicina,
  prevozEnergija,
  radnaSnagaGrupe,
  opterecenje,
  fiksniStavke,
  ptrParams,
  miks,
  rabatneBlocks,
  mpCenaBlocks,
}: Props) {
  const [active, setActive] = useState<Tab>("sirovine")
  const [ukupnoPlate, setUkupnoPlate] = useState<number>(0)

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 overflow-x-auto border-b border-[#E5E7EB]">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              active === t.key
                ? "border-[#2563EB] text-[#2563EB]"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-[#E5E7EB] bg-white p-6">
        <div className={active === "sirovine" ? undefined : "hidden"}>
          <TrosakSirovinaTab
            productId={productId}
            materijali={materijali}
            bomStavke={bomStavke}
            ukupnaKolicina={ukupnaKolicina}
          />
        </div>
        <div className={active === "radna-snaga" ? undefined : "hidden"}>
          <TrosakRadneSnageTab
            productId={productId}
            grupe={radnaSnagaGrupe}
            opterecenje={opterecenje}
            onTotalChange={setUkupnoPlate}
          />
        </div>
        <div className={active === "prevoz" ? undefined : "hidden"}>
          <TrosakPrevozaEnergije productId={productId} prevozEnergija={prevozEnergija} />
        </div>
        <div className={active === "ambalaza" ? undefined : "hidden"}>
          <TrosakAmbalaze productId={productId} pakovanja={pakovanja} />
        </div>
        <div className={active === "ptr" ? undefined : "hidden"}>
          <TrosakPTRTab
            productId={productId}
            ukupnoPlate={ukupnoPlate}
            pakovanja={pakovanja}
            bomStavke={bomStavke}
            prevozEnergija={prevozEnergija}
            fiksniStavke={fiksniStavke}
            params={ptrParams}
            miks={miks}
          />
        </div>
        <div className={active === "rabatne" ? undefined : "hidden"}>
          <TrosakRabatneSkale
            productId={productId}
            pakovanja={pakovanja}
            bomStavke={bomStavke}
            prevozEnergija={prevozEnergija}
            ukupnoPlate={ukupnoPlate}
            fiksniStavke={fiksniStavke}
            ptrParams={ptrParams}
            blocks={rabatneBlocks}
          />
        </div>
        <div className={active === "krajnja-cena" ? undefined : "hidden"}>
          <MaloprodajnaCenaTab
            productId={productId}
            pakovanja={pakovanja}
            blocks={mpCenaBlocks}
          />
        </div>
      </div>
    </div>
  )
}
