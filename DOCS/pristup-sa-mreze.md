# Pristup ERP-u sa drugih računara (LAN)

Da bi drugi računari u istoj mreži (Wi‑Fi/LAN) mogli da otvore ERP, server mora da sluša na svim mrežnim interfejsima. To je već podešeno u `package.json` (`-H 0.0.0.0`).

## 1. Pokretanje servera

Na računaru gde radi projekat:

**Development:**
```bash
npm run dev
```

**Production (prethodno `npm run build`):**
```bash
npm run start
```

Oba skripta sada slušaju na `0.0.0.0`, pa su dostupna i sa drugih uređaja u mreži.

## 2. Adresa za pristup

1. Na računaru gde server radi otvori komandnu liniju i proveri IP adresu:
   - **Windows:** `ipconfig` → traži „IPv4 Address” (npr. `192.168.1.105`)
   - **macOS/Linux:** `ip addr` ili `ifconfig`

2. Sa drugog računara u istoj mreži otvori browser i ukucaj:
   ```
   http://[IP]:3000
   ```
   Npr. `http://192.168.1.105:3000` (port 3000 je podrazumevani za Next.js).

## 3. Windows firewall

Ako sa drugog računara ne može da se učita stranica:

- Na računaru gde server radi otvori **Windows Defender Firewall** → **Advanced settings** → **Inbound Rules**.
- Dodaj pravilo: **New Rule** → **Port** → **TCP**, port **3000** → **Allow the connection** → imenuj npr. „Next.js ERP”.
- Ili privremeno isključi firewall za privatnu mrežu da proveriš da li je to uzrok.

## 4. Supabase Auth (login/redirect)

Kad pristupaš preko IP adrese (npr. `http://192.168.1.105:3000`), Supabase mora da dozvoli tu adresu za redirect nakon prijave:

1. [Supabase Dashboard](https://supabase.com/dashboard) → tvoj projekat.
2. **Authentication** → **URL Configuration**.
3. U **Redirect URLs** dodaj (zameni IP svojim):
   ```
   http://192.168.1.105:3000/**
   http://192.168.1.105:3000
   ```
   Možeš dodati i više adresa (različiti računari ili drugi portovi).
4. **Site URL** može ostati `http://localhost:3000`; za pristup preko mreže možeš dodatno postaviti npr. `http://192.168.1.105:3000` ako želiš da bude podrazumevana.

Bez ovoga, nakon logina Supabase može da vrati grešku tipa „redirect URL not allowed”.

## 5. Kratko

| Korak | Šta uraditi |
|-------|-------------|
| Server | Na host računaru: `npm run dev` ili `npm run start` |
| Adresa | Sa drugog računara: `http://[IP-host-računara]:3000` |
| Firewall | Dozvoli TCP port 3000 (inbound) na host računaru |
| Supabase | U Redirect URLs dodaj `http://[IP]:3000` i `http://[IP]:3000/**` |

Ako kasnije želiš stalnu adresu (npr. `http://erp.lokalno`) možeš podesiti DNS ili fiksni IP u LAN-u i istu adresu dodati u Supabase Redirect URLs.
