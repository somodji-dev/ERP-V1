# Objavljivanje ERP-a na server (pristup 24/7)

Da bi ERP radio i kada ti je računar ugašen, treba da ga **hostuješ** na nekom servisu.

- **GitHub** služi za čuvanje koda (repozitorijum), ne za pokretanje aplikacije.
- **Hosting** (npr. Vercel) je mesto gde aplikacija stvarno radi i gde dobijaš link tipa `https://tvoj-erp.vercel.app`.

Preporuka za Next.js: **GitHub (kod) + Vercel (server)**. Vercel ima besplatan tier i odličnu podršku za Next.js.

---

## Korak 1: Kod na GitHub

1. Otvori [github.com](https://github.com) i uloguj se. Napravi novi repozitorijum (npr. `rio-erp`), bez README ako već imaš kod lokalno.
2. Na svom računaru u folderu projekta (npr. `d:\Cursor\RIO__ERP`) uradi:

**Ako još nemaš Git u projektu:**
```bash
git init
git add .
git commit -m "Prvi commit - RIO ERP"
git branch -M main
git remote add origin https://github.com/TVOJ_USERNAME/IME-REPOZITORIJUMA.git
git push -u origin main
```

**Ako već imaš `git init` (npr. Cursor ga je napravio):**
```bash
git add .
git commit -m "Prvi commit - RIO ERP"
git branch -M main
git remote add origin https://github.com/TVOJ_USERNAME/IME-REPOZITORIJUMA.git
git push -u origin main
```

Zameni `TVOJ_USERNAME` svojim GitHub korisničkim imenom i `IME-REPOZITORIJUMA` tačnim imenom repozitorijuma (npr. `rio-erp`). Ako koristiš SSH ili već imaš remote, prilagodi komande.

**Napomena:** `.env.local` ne treba da ide u Git (već bi trebalo da je u `.gitignore`). Taj fajl ne guraš; tajne (ključevi) ćeš uneti u Vercel u sledećem koraku.

---

## Korak 2: Projekat na Vercel (gde aplikacija radi)

1. Otvori [vercel.com](https://vercel.com) i prijavi se (najlakše preko GitHub naloga).
2. **Add New** → **Project** → **Import** repozitorijum sa GitHuba (npr. `rio-erp`).
3. Vercel će prepoznati Next.js; ostavi podrazumevane opcije i klikni **Deploy** (prvi put može da „pukne” jer nema env varijabli — to popravljamo u koraku 4).
4. **Settings** → **Environment Variables** i dodaj iste varijable kao u `.env.local`:

   | Ime | Vrednost |
   |-----|----------|
   | `NEXT_PUBLIC_SUPABASE_URL` | tvoj Supabase URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tvoj anon key (ili NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) |
   | `SUPABASE_SERVICE_ROLE_KEY` | tvoj service role key (za kreiranje korisnika i reset lozinke) |

   Ostavi **Production** (i po želji Preview) označeno, pa **Save**.

5. Ponovo pokreni deploy: **Deployments** → tri tačkice na poslednjem deployu → **Redeploy**. Posle ovoga aplikacija bi trebalo da radi na adresi tipa `https://rio-erp.vercel.app` (ili kako si nazvao projekat).

---

## Korak 3: Supabase – dozvoli novu adresu za login

Supabase mora da dozvoli redirect na tvoju novu adresu:

1. [Supabase Dashboard](https://supabase.com/dashboard) → tvoj projekat.
2. **Authentication** → **URL Configuration**.
3. U **Site URL** stavi production adresu, npr. `https://rio-erp.vercel.app`.
4. U **Redirect URLs** dodaj:
   - `https://rio-erp.vercel.app`
   - `https://rio-erp.vercel.app/**`

(Zameni `rio-erp.vercel.app` svojom stvarnom Vercel domenom.)

---

## Korak 4: Kasnije izmene

Kad nešto promeniš u kodu:

```bash
git add .
git commit -m "Opis izmene"
git push
```

Vercel će sam pokrenuti novi deploy (ako je projekat povezan sa GitHub repozitorijumom). Posle nekoliko minuta promene su uživo na istoj adresi.

---

## Rezime

| Šta | Gde |
|-----|-----|
| **Kod** | GitHub (repozitorijum) |
| **Pokretanje aplikacije** | Vercel (ili drugi hosting) |
| **Baza i auth** | Supabase (već koristiš) |

GitHub nije mesto gde aplikacija „radi” — on samo čuva kod. Da bi ERP bio dostupan 24/7, mora da radi na serveru; za to je Vercel dobar i besplatan izbor za Next.js.

Ako želiš drugi hosting (Railway, Render, DigitalOcean, itd.), princip je isti: kod može ostati na GitHubu, a na tom servisu konfigurišeš build (Next.js) i env varijable (Supabase URL i ključevi), pa u Supabase dodaš tu novu adresu u Redirect URLs.
