"use client"

import Link from "next/link"
import { ProracunCeneClient } from "./ProracunCeneClient"
import type { MaterijaliCena } from "@/lib/types/materijali-cene"
import type { Proizvod } from "@/lib/types/proizvodi"
import type { AmbalazaPakovanje } from "@/lib/types/ambalaza"
import type { BomStavka } from "@/lib/types/bom"
import type { PrevozEnergija } from "@/lib/types/prevoz-energija"
import type { RadnaSnagaGrupa } from "@/lib/types/radna-snaga"
import type { PtrFiksniStavka, PtrParams, PtrMiksRow } from "@/lib/types/ptr"
import type { RabatniBlock } from "@/lib/types/rabatne-skale"
import type { MpCenaBlock } from "@/lib/types/mp-cena"

interface Props {
  proizvod: Proizvod
  materijali: MaterijaliCena[]
  pakovanja: AmbalazaPakovanje[]
  bomStavke: BomStavka[]
  prevozEnergija: PrevozEnergija
  radnaSnagaGrupe: RadnaSnagaGrupa[]
  opterecenje: number
  fiksniStavke: PtrFiksniStavka[]
  ptrParams: PtrParams
  miks: PtrMiksRow[]
  rabatneBlocks: RabatniBlock[]
  mpCenaBlocks: MpCenaBlock[]
}

export function ProracunCeneDetaljClient({
  proizvod,
  materijali,
  pakovanja,
  bomStavke,
  prevozEnergija,
  radnaSnagaGrupe,
  opterecenje,
  fiksniStavke,
  ptrParams,
  miks,
  rabatneBlocks,
  mpCenaBlocks,
}: Props) {
  return (
    <div>
      <div className="mb-6">
        <Link href="/cene-proizvoda" className="text-sm text-[#6B7280] hover:text-[#2563EB]">
          ← Nazad na listu
        </Link>
        <h1 className="mt-2 text-xl font-bold text-[#111827]">{proizvod.naziv}</h1>
        {proizvod.opis && <p className="text-sm text-[#6B7280]">{proizvod.opis}</p>}
      </div>
      <ProracunCeneClient
        productId={proizvod.id}
        proizvodNaziv={proizvod.naziv}
        materijali={materijali}
        pakovanja={pakovanja}
        bomStavke={bomStavke}
        ukupnaKolicina={proizvod.bom_ukupna_kolicina}
        prevozEnergija={prevozEnergija}
        radnaSnagaGrupe={radnaSnagaGrupe}
        opterecenje={opterecenje}
        fiksniStavke={fiksniStavke}
        ptrParams={ptrParams}
        miks={miks}
        rabatneBlocks={rabatneBlocks}
        mpCenaBlocks={mpCenaBlocks}
      />
    </div>
  )
}
