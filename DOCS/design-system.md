# design-system.md — ERP Dizajn Sistem

## Referentni UI
Baziran na čistom, minimalnom ERP stilu — beli sidebar, siva pozadina, bele kartice.

---

## Boje

### Primarne
```css
--background:     #F4F5F7   /* siva pozadina stranice */
--sidebar-bg:     #FFFFFF   /* beli sidebar */
--card-bg:        #FFFFFF   /* bele kartice */
--border:         #E5E7EB   /* suptilna linija */
```

### Brand Boje
```css
--primary:        #2563EB   /* plava — dugmad, aktivni link */
--primary-hover:  #1D4ED8
--primary-light:  #EFF6FF   /* svetlo plava pozadina */
```

### Semantičke Boje
```css
--success:        #16A34A   /* zelena — pozitivne vrednosti, završeno */
--success-light:  #F0FDF4
--danger:         #DC2626   /* crvena — negativno, greška, brisanje */
--danger-light:   #FEF2F2
--warning:        #D97706   /* narandžasta — upozorenje, na čekanju */
--warning-light:  #FFFBEB
--neutral:        #6B7280   /* siva — sekundarni tekst, ikone */
```

### Tekst
```css
--text-primary:   #111827   /* naslovi, glavni tekst */
--text-secondary: #6B7280   /* opisi, labele, meta info */
--text-muted:     #9CA3AF   /* placeholder, disabled */
```

---

## Tipografija
```css
Font: Inter (Google Fonts) — fallback: system-ui, sans-serif

--text-xs:    12px / font-weight: 400   /* meta info, timestamps */
--text-sm:    14px / font-weight: 400   /* tabele, labele */
--text-base:  16px / font-weight: 400   /* body tekst */
--text-lg:    18px / font-weight: 600   /* naslovi kartica */
--text-xl:    20px / font-weight: 700   /* naslovi stranica */
--text-2xl:   24px / font-weight: 700   /* KPI brojevi mali */
--text-3xl:   30px / font-weight: 800   /* KPI brojevi veliki */
```

---

## Razmaci i Zaobljenost
```css
--radius-sm:   6px    /* dugmad, input polja, bedže */
--radius-md:   10px   /* manje kartice, dropdowni */
--radius-lg:   14px   /* glavne kartice */
--radius-full: 9999px /* pill bedže */

--shadow-sm:  0 1px 3px rgba(0,0,0,0.08)   /* kartice */
--shadow-md:  0 4px 12px rgba(0,0,0,0.10)  /* modali, dropdown */

Padding kartica:  24px
Gap između kartica: 20px
Sidebar širina: 220px
Content padding: 32px
```

---

## Komponente

### Sidebar
```
Pozadina: bela (#FFFFFF)
Border desno: 1px solid #E5E7EB
Logo zona: 64px visina, padding 20px
Nav link neaktivan: tekst #6B7280, hover pozadina #F4F5F7
Nav link aktivan: tekst #2563EB, pozadina #EFF6FF, bold
Ikone: 18px, Lucide React
Sekcija label ("Navigation"): text-xs, uppercase, text #9CA3AF
```

### KPI Kartica
```
Pozadina: bela, rounded-lg, shadow-sm
Padding: 24px
Raspored:
  - Gornji red: naziv (text-sm, text-secondary) + ikona desno (neutral)
  - Sredina: veliki broj (text-3xl, bold, text-primary)
  - Dno: trend badge (zeleno ↑ / crveno ↓) + "od prošlog meseca"
```

Tailwind primer:
```tsx
<div className="bg-white rounded-xl shadow-sm p-6">
  <div className="flex justify-between items-start mb-4">
    <span className="text-sm text-gray-500">Ukupno sati</span>
    <Clock className="h-5 w-5 text-gray-400" />
  </div>
  <p className="text-3xl font-bold text-gray-900">342</p>
  <p className="text-sm text-green-600 mt-2">↑ +12% od prošlog meseca</p>
</div>
```

### Aktivnosti Lista (Recent Activity)
```
Kartica: bela, rounded-xl, shadow-sm
Svaki red: padding 16px, border-bottom: 1px solid #F3F4F6
Ikona levo: 20px kružić (zelena ✓, žuta ⚠, crvena ✗)
Tekst: 14px bold + opis u 12px text-secondary
Vreme desno: text-xs, text-muted
Hover: pozadina #F9FAFB
```

### Dugmad
```
Primary:   bg-blue-600  text-white  hover:bg-blue-700   rounded-md px-4 py-2
Secondary: bg-white     text-gray-700  border  hover:bg-gray-50  rounded-md px-4 py-2
Danger:    bg-red-600   text-white  hover:bg-red-700    rounded-md px-4 py-2
Ghost:     transparent  text-gray-600  hover:bg-gray-100

Veličine: sm (px-3 py-1.5 text-sm) | md (px-4 py-2) | lg (px-6 py-3 text-lg)
Uvek: disabled:opacity-50 disabled:cursor-not-allowed
```

### Input Polja
```
Border: 1px solid #E5E7EB
Focus: border #2563EB + ring-2 ring-blue-100
Pozadina: bela
Border radius: rounded-md (6px)
Padding: px-3 py-2
Font: text-sm
Error stanje: border-red-400 + tekst ispod text-xs text-red-500
```

### Tabele
```
Zaglavlje: bg-gray-50, text-xs uppercase, text-gray-500, font-semibold
Redovi: bela pozadina, border-bottom #F3F4F6, hover:bg-gray-50
Padding ćelija: px-4 py-3
Font: text-sm text-gray-700
Brojevi/iznosi: font-medium, desno poravnati
```

### Status Bedže
```tsx
// Tailwind pill pattern
Otvoren:    "bg-gray-100  text-gray-600"
U toku:     "bg-blue-100  text-blue-700"
Završen:    "bg-green-100 text-green-700"
Otkazan:    "bg-red-100   text-red-600"
Hitan:      "bg-red-100   text-red-700 font-semibold"
Nacrt:      "bg-gray-100  text-gray-500"
Finalizovan:"bg-blue-100  text-blue-700"
Isplaćen:   "bg-green-100 text-green-700"

// Primer
<span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
  Završen
</span>
```

### Modal / Dialog
```
Overlay: bg-black/40 backdrop-blur-sm
Kartica: bg-white rounded-xl shadow-md p-6 max-w-md
Naslov: text-lg font-semibold mb-4
Footer dugmad: desno poravnata, gap-3
```

### Sheet (bočni panel za forme)
```
Širina: 480px (sm: full width)
Pozadina: bela
Header: padding 24px, border-bottom
Content: padding 24px, overflow-y-auto
Footer: padding 24px, border-top, sticky bottom
```

---

## Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (220px)  │  Header: naziv stranice          │
│                   │─────────────────────────────────│
│  Navigation       │  KPI Kartice (4 u redu, grid)   │
│                   │                                  │
│  - Dashboard      │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──┐│
│  - Radnici        │  │ KPI  │ │ KPI  │ │ KPI  │ │KP││
│  - Cash Flow      │  └──────┘ └──────┘ └──────┘ └──┘│
│  - Proizvodnja    │                                  │
│  - Podešavanja    │  ┌─────────────────┐ ┌─────────┐│
│                   │  │ Poslednje       │ │ Quick   ││
│                   │  │ Aktivnosti      │ │ Stats   ││
│                   │  │                 │ │         ││
│                   │  └─────────────────┘ └─────────┘│
└─────────────────────────────────────────────────────┘
```

---

## KPI Kartice po Modulu

### Dashboard (globalne)
```
1. Ukupno sati (tekući mesec)     → ikona: Clock
2. Neto isplate (tekući mesec)    → ikona: Banknote
3. Aktivni radni nalozi           → ikona: ClipboardList
4. Neto Cash Flow (tekući mesec)  → ikona: TrendingUp
```

### Modul Radnici
```
1. Aktivni radnici                → ikona: Users
2. Ukupno sati (mesec)            → ikona: Clock
3. Ukupno isplaćeno (mesec)       → ikona: Banknote
4. Prekovremeni sati              → ikona: AlertCircle
```

### Modul Cash Flow
```
1. Ukupni prihodi (mesec)         → ikona: TrendingUp (zelena)
2. Ukupni rashodi (mesec)         → ikona: TrendingDown (crvena)
3. Neto (mesec)                   → ikona: DollarSign
4. Neto YTD (od početka godine)   → ikona: BarChart2
```

### Modul Proizvodnja
```
1. Aktivni nalozi                 → ikona: ClipboardList
2. Završeni ovaj mesec            → ikona: CheckCircle (zelena)
3. Nalozi koji kasne              → ikona: AlertTriangle (crvena)
4. Ukupno sati na nalozima        → ikona: Clock
```


