# module-proizvodnja.md — Proizvodnja & Radni Nalozi

## Stranice
```
/proizvodnja              → Lista radnih naloga sa filterima
/proizvodnja/novi         → Kreiranje novog naloga
/proizvodnja/[id]         → Detalj naloga + praćenje
/proizvodnja/analiza      → Analiza i izveštaji
```

---

## Prava Pristupa
| Akcija                  | Admin | Menadžer | Radnik |
|-------------------------|-------|----------|--------|
| Lista naloga            | ✅    | ✅       | ❌     |
| Kreiranje naloga        | ✅    | ✅       | ❌     |
| Izmena naloga           | ✅    | ✅       | ❌     |
| Brisanje naloga         | ✅    | ❌       | ❌     |
| Analiza                 | ✅    | ✅       | ❌     |

---

## Status Naloga
`'otvoren' → 'u_toku' → 'zavrsen' | 'otkazan'`

Vizuelno:
- Otvoren → siva bedža
- U toku → plava bedža
- Završen → zelena bedža
- Otkazan → crvena bedža

## Prioritet
`'nizak' | 'normalan' | 'visok' | 'hitan'`
- Hitan → crveni tekst u tabeli

---

## Ekran: /proizvodnja — Lista Naloga
Tabela sa kolonama: Broj naloga, Naziv, Status, Prioritet, Rok, Ukupno sati
Filteri: Status (multi-select), Prioritet, Period (od-do datum)
Pretraživanje: po broju naloga ili nazivu
Klik na red → otvara detalj naloga

---

## Ekran: /proizvodnja/novi — Novi Nalog
Forma:
1. Naziv (text, obavezno)
2. Opis (textarea)
3. Rok (date picker)
4. Prioritet (Select)
5. Stavke naloga (dinamička lista — dugme "Dodaj stavku")
   - Svaka stavka: opis, količina, jedinica

Broj naloga se auto-generiše: `RN-[GODINA]-[REDNI BROJ]`
npr. `RN-2025-042`

---

## Ekran: /proizvodnja/[id] — Detalj Naloga
Prikazati:
- Zaglavlje: broj, naziv, status (sa dugmetom za promenu), prioritet, rok
- Opis i stavke naloga
- **Tab: Radni sati** — tabela utrošenih sati po radniku i datumu
  - Dugme: Dodaj sate → Sheet forma (radnik, datum, sati, napomena)
- **Tab: Analiza** — ukupno sati, ukupan trošak (sati × satnica), procenat završenosti

---

## Ekran: /proizvodnja/analiza
- Bar chart: Broj naloga po statusu
- Bar chart: Utrošeni sati po nalogu (top 10)
- Tabela: Nalozi koji kasne (rok prošao, status nije 'zavrsen')
- Tabela: Najskuplji nalozi (po trošku sati)

---

## Logika
### Auto-generisanje broja naloga
```typescript
// U server action pri kreiranju naloga
const { count } = await supabase
  .from('work_orders')
  .select('*', { count: 'exact', head: true })
  .gte('created_at', `${godina}-01-01`)

const brojNaloga = `RN-${godina}-${String(count + 1).padStart(3, '0')}`
```

### Trošak naloga
```typescript
// Za svaki work_order_hours red, uzima satnicu radnika za taj datum
// Koristi isti getSatnicaZaDatum() helper kao u modulu Radnici
ukupanTrosak = Σ(sati × getSatnicaZaDatum('redovni', datum))
```
