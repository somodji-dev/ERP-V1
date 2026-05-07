export interface AmbalazaStavka {
  id: string
  pakovanje_id: string
  naziv: string
  kolicina: number
  jedinica: string
  cena: number
}

export interface AmbalazaPakovanje {
  id: string
  proizvod_id: string
  naziv: string
  masa: number
  stavke: AmbalazaStavka[]
}
