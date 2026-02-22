# RIO ERP

Next.js 14 ERP aplikacija sa TypeScript i Tailwind CSS.

## Instalacija

1. Instaliraj dependency-je:
```bash
npm install
```

2. Konfiguriši Supabase:
   - Kopiraj `.env.example` u `.env.local`
   - Dodaj svoje Supabase URL i anon key

3. Pokreni development server:
```bash
npm run dev
```

4. **Pre svakog `git push`** automatski se pokreće `npm run build` (Husky pre-push hook). Ako build padne, push se prekida — isto kao na Vercel-u.

## Objavljivanje na server (pristup 24/7)

Da bi ERP radio i kada je tvoj računar ugašen, treba ga hostovati (npr. Vercel). GitHub služi za **kod**, ne za pokretanje aplikacije. Koraci: **[docs/deploy-server.md](docs/deploy-server.md)**.

## Pristup sa drugih računara (LAN)

Da bi ERP bio dostupan sa drugih računara u istoj mreži, vidi **[docs/pristup-sa-mreze.md](docs/pristup-sa-mreze.md)** — tu su koraci za IP adresu, firewall i Supabase redirect URL.

## Struktura Projekta

- `/app` - Next.js App Router stranice
- `/components` - React komponente
- `/lib` - Utility funkcije i Supabase klijenti
- `/hooks` - Custom React hooks
