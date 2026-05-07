import { notFound } from "next/navigation"
import { getMaterijaliCene } from "@/app/actions/materijali-cene"
import { getProizvod } from "@/app/actions/proizvodi"
import { getAmbalazaByProizvod } from "@/app/actions/ambalaza"
import { getBomByProizvod } from "@/app/actions/bom"
import { getPrevozEnergija } from "@/app/actions/prevoz-energija"
import { getRadnaSnagaByProizvod, getCeneConfig } from "@/app/actions/radna-snaga"
import { getFiksniByProizvod, getPtrParams, getMiksByProizvod } from "@/app/actions/ptr"
import { getRabatneSkaleByProizvod } from "@/app/actions/rabatne-skale"
import { getMpCenaByProizvod } from "@/app/actions/mp-cena"
import { hydrateGrupe } from "@/lib/types/radna-snaga"
import { ProracunCeneDetaljClient } from "@/components/financials/ProracunCeneDetaljClient"

export default async function CeneProizvodaDetaljPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [
    proizvod,
    materijali,
    pakovanja,
    bomStavke,
    prevozEnergija,
    radnaSnagaSaved,
    ceneConfig,
    fiksniStavke,
    ptrParams,
    miks,
    rabatneBlocks,
    mpCenaBlocks,
  ] = await Promise.all([
    getProizvod(id),
    getMaterijaliCene(),
    getAmbalazaByProizvod(id),
    getBomByProizvod(id),
    getPrevozEnergija(id),
    getRadnaSnagaByProizvod(id),
    getCeneConfig(),
    getFiksniByProizvod(id),
    getPtrParams(id),
    getMiksByProizvod(id),
    getRabatneSkaleByProizvod(id),
    getMpCenaByProizvod(id),
  ])

  if (!proizvod) notFound()

  const radnaSnagaGrupe = hydrateGrupe(id, radnaSnagaSaved)

  return (
    <ProracunCeneDetaljClient
      proizvod={proizvod}
      materijali={materijali}
      pakovanja={pakovanja}
      bomStavke={bomStavke}
      prevozEnergija={prevozEnergija}
      radnaSnagaGrupe={radnaSnagaGrupe}
      opterecenje={ceneConfig.opterecenje_plata_procenat}
      fiksniStavke={fiksniStavke}
      ptrParams={ptrParams}
      miks={miks}
      rabatneBlocks={rabatneBlocks}
      mpCenaBlocks={mpCenaBlocks}
    />
  )
}
