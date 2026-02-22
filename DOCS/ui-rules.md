# ui-rules.md — UI/UX Pravila

## 1. Numerički Input — Nikad Default 0
```typescript
// ❌ NIKAD
<Input type="number" value={vrednost || 0} />

// ✅ UVEK — prazan string kao default, placeholder umesto vrednosti
<Input
  type="number"
  value={vrednost === 0 || vrednost == null ? '' : vrednost}
  onChange={(e) => setVrednost(e.target.value === '' ? null : Number(e.target.value))}
  placeholder="0"
/>
```

## 2. Select — Uvek Placeholder Opcija
```typescript
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Izaberi radnika..." />
  </SelectTrigger>
  <SelectContent>
    {radnici.map(r => (
      <SelectItem key={r.id} value={r.id}>{r.ime} {r.prezime}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

## 3. Datum Polja — Uvek Kontrolisano
```typescript
<Input
  type="date"
  value={datum ?? ''}
  onChange={(e) => setDatum(e.target.value || null)}
/>
```

## 4. Forme — Reset Nakon Čuvanja
```typescript
const onSubmit = async (data) => {
  await sacuvaj(data)
  form.reset()
  setOpen(false)
}
```

## 5. Dugmad — Uvek Loading State
```typescript
<Button type="submit" disabled={isLoading}>
  {isLoading
    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Čuvanje...</>
    : 'Sačuvaj'
  }
</Button>
```

## 6. Brisanje — Uvek AlertDialog
```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Obriši</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Da li si siguran?</AlertDialogTitle>
      <AlertDialogDescription>Ova akcija se ne može poništiti.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Otkaži</AlertDialogCancel>
      <AlertDialogAction onClick={obrisi}>Obriši</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## 7. Prazne Liste — Uvek Empty State
```typescript
{podaci.length === 0 ? (
  <div className="text-center py-12 text-muted-foreground">
    <Icon className="mx-auto h-12 w-12 mb-4 opacity-50" />
    <p>Nema podataka za prikaz</p>
    <Button variant="outline" className="mt-4" onClick={dodajNovi}>
      Dodaj prvi unos
    </Button>
  </div>
) : (
  <DataTable data={podaci} />
)}
```

## 8. Supabase Greške — Uvek Toast
```typescript
const { data, error } = await supabase.from('employees').insert(noviRadnik)
if (error) {
  toast({ title: "Greška", description: error.message, variant: "destructive" })
  return
}
toast({ title: "Uspešno sačuvano!" })
```

## 9. Iznosi — Uvek formatCurrency
```typescript
// ✅ Uvek
<span>{formatCurrency(iznos)}</span>

// ❌ Nikad
<span>{iznos}</span>
<span>{iznos} RSD</span>

// Helper funkcija (u /lib/utils.ts)
export function formatCurrency(iznos: number): string {
  return iznos.toLocaleString('sr-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' RSD'
}
```

## 10. Tabele — Uvek .order() u Queriju
```typescript
const { data } = await supabase
  .from('employees')
  .select('*')
  .eq('aktivan', true)
  .order('prezime', { ascending: true })
```

## 11. Forme su u Sheet ili Dialog — Nikad Inline
- Novi unos → `Sheet` (bočni panel, bolje za forme sa više polja)
- Potvrda / kratka izmena → `Dialog`
- Nikad inline editovanje direktno u tabeli

## 12. Greška Validacije — Prikaži Ispod Polja
```typescript
// Zod + react-hook-form automatski — samo osiguraj da je FormMessage prisutan
<FormField
  control={form.control}
  name="iznos"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Iznos</FormLabel>
      <FormControl><Input {...field} /></FormControl>
      <FormMessage />  {/* ← obavezno */}
    </FormItem>
  )}
/>
```
