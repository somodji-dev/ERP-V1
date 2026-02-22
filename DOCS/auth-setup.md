# auth-setup.md — Autentifikacija i Prava Pristupa

## Pristup Sistemu

### Username-Based Login (Bez Email-a)
Aplikacija koristi **username** umesto email-a za prijavu. Za mali broj korisnika (3-5) ovo je najjednostavnije rešenje.

**Primer korisnika:**
```
Username: admin          → Password: admin123
Username: kancelarija    → Password: kancelarija123
Username: proizvodnja    → Password: proizvodnja123
```

---

## Baza Podataka

### `user_roles`
```sql
CREATE TABLE user_roles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users UNIQUE NOT NULL,
  username        text UNIQUE NOT NULL,
  display_name    text NOT NULL,
  aktivan         boolean DEFAULT true,
  employee_id     uuid REFERENCES employees,
  created_at      timestamp DEFAULT now(),
  last_login      timestamp
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_username ON user_roles(username);
```

### `user_permissions` — Granularna Kontrola Pristupa
```sql
CREATE TABLE user_permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users NOT NULL,
  modul       text NOT NULL,  -- 'dashboard' | 'radnici' | 'cashflow' | 'proizvodnja' | 'podesavanja'
  view        boolean DEFAULT false,
  create      boolean DEFAULT false,
  edit        boolean DEFAULT false,
  delete      boolean DEFAULT false,
  
  UNIQUE(user_id, modul)
);

CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
```

---

## Moduli i Prava

### Dostupni Moduli
1. **dashboard** — Početna stranica
2. **radnici** — Radnici & Plate
3. **cashflow** — Cash Flow Analiza
4. **proizvodnja** — Proizvodnja i Radni Nalozi
5. **podesavanja** — Podešavanja sistema

### Tipovi Prava
- **VIEW** — Vidi modul u navigaciji i može pristupiti stranicama
- **CREATE** — Može dodavati nove stavke (radnike, transakcije, naloge)
- **EDIT** — Može menjati postojeće stavke
- **DELETE** — Može brisati/stornovati stavke

**Pravilo:** Ako korisnik nema `view = true`, modul je **potpuno nevidljiv** — ni u navigaciji ni direktnim pristupom.

---

## Inicijalni Podaci (Seed)

```sql
-- Admin korisnik (kreiran van aplikacije, u Supabase Dashboard)
-- Email: admin@internal.erp
-- Password: (postavi manuelno)

INSERT INTO user_roles (user_id, username, display_name, aktivan) VALUES
('00000000-0000-0000-0000-000000000001', 'admin', 'Administrator', true);

-- Admin prava (sve)
INSERT INTO user_permissions (user_id, modul, view, create, edit, delete) VALUES
('00000000-0000-0000-0000-000000000001', 'dashboard', true, true, true, true),
('00000000-0000-0000-0000-000000000001', 'radnici', true, true, true, true),
('00000000-0000-0000-0000-000000000001', 'cashflow', true, true, true, true),
('00000000-0000-0000-0000-000000000001', 'proizvodnja', true, true, true, true),
('00000000-0000-0000-0000-000000000001', 'podesavanja', true, true, true, true);
```

**Napomena:** UUID `00000000-0000-0000-0000-000000000001` zameni pravim UUID-om admin korisnika nakon kreiranja u Supabase-u.

---

## Row Level Security (RLS) Policies

### user_roles
```sql
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Korisnici vide samo svoj red
CREATE POLICY "Users can view own role"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Samo admin može menjati role
CREATE POLICY "Only admin can manage roles"
ON user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_id = auth.uid()
    AND modul = 'podesavanja'
    AND edit = true
  )
);
```

### user_permissions
```sql
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Korisnici vide samo svoja prava
CREATE POLICY "Users can view own permissions"
ON user_permissions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Samo admin može menjati prava
CREATE POLICY "Only admin can manage permissions"
ON user_permissions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_id = auth.uid()
    AND modul = 'podesavanja'
    AND edit = true
  )
);
```

### employees
```sql
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Korisnici sa view pravom na radnici mogu videti
CREATE POLICY "Users with radnici view can see employees"
ON employees FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_id = auth.uid()
    AND modul = 'radnici'
    AND view = true
  )
);

-- Samo korisnici sa edit pravom mogu menjati
CREATE POLICY "Users with radnici edit can modify"
ON employees FOR INSERT, UPDATE
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_id = auth.uid()
    AND modul = 'radnici'
    AND edit = true
  )
);

-- Samo admin može brisati (soft delete)
CREATE POLICY "Only admin can delete employees"
ON employees FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_id = auth.uid()
    AND modul = 'radnici'
    AND delete = true
  )
)
WITH CHECK (aktivan = false);  -- Samo soft delete (aktivan → false)
```

### Ostale Tabele — Isti Pattern
Primeni isti RLS pattern za:
- `work_logs`, `advances`, `bonuses`, `payroll_reports` → modul `radnici`
- `cash_snapshots`, `excel_partners` → modul `cashflow`
- `work_orders`, `work_order_items`, `work_order_hours` → modul `proizvodnja`

---

## Helper Funkcije (TypeScript)

### lib/auth/permissions.ts
```typescript
export async function getUserPermissions(userId: string) {
  const { data, error } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', userId)
  
  if (error) throw error
  return data
}

export function canViewModule(permissions: any[], modulName: string): boolean {
  const perm = permissions.find(p => p.modul === modulName)
  return perm?.view === true
}

export function canCreate(permissions: any[], modulName: string): boolean {
  const perm = permissions.find(p => p.modul === modulName)
  return perm?.create === true
}

export function canEdit(permissions: any[], modulName: string): boolean {
  const perm = permissions.find(p => p.modul === modulName)
  return perm?.edit === true
}

export function canDelete(permissions: any[], modulName: string): boolean {
  const perm = permissions.find(p => p.modul === modulName)
  return perm?.delete === true
}
```

### lib/auth/user.ts
```typescript
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  return { ...user, ...userRole }
}
```

---

## Login Stranica

### `/login`
```typescript
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Konvertuj username u fake email za Supabase
    const email = `${username}@internal.erp`
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      setError('Pogrešan username ili password')
      setLoading(false)
      return
    }
    
    // Update last_login
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('user_roles')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', user.id)
    }
    
    // Redirect na dashboard
    window.location.href = '/dashboard'
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">E</span>
          </div>
          <h1 className="text-2xl font-bold">ERP System</h1>
          <p className="text-gray-500 text-sm">Prijavite se na sistem</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Prijava...' : 'Prijavi se'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

## Sidebar — Filtriranje Po Pravima

### components/Sidebar.tsx
```typescript
export async function Sidebar() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  
  const permissions = await getUserPermissions(user.id)
  
  return (
    <aside className="w-220 bg-white border-r">
      <div className="p-4">
        <h1 className="font-bold">ERP System</h1>
      </div>
      
      <nav className="px-3">
        {canViewModule(permissions, 'dashboard') && (
          <NavItem href="/dashboard" icon="home">Dashboard</NavItem>
        )}
        
        {canViewModule(permissions, 'radnici') && (
          <NavItem href="/radnici" icon="users">Radnici & Plate</NavItem>
        )}
        
        {canViewModule(permissions, 'cashflow') && (
          <NavItem href="/cash-flow" icon="trending-up">Cash Flow</NavItem>
        )}
        
        {canViewModule(permissions, 'proizvodnja') && (
          <NavItem href="/proizvodnja" icon="clipboard">Proizvodnja</NavItem>
        )}
        
        {canViewModule(permissions, 'podesavanja') && (
          <NavItem href="/podesavanja" icon="settings">Podešavanja</NavItem>
        )}
      </nav>
      
      <div className="absolute bottom-0 p-4 border-t w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{user.username}</p>
            <p className="text-xs text-gray-500">{user.display_name}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-600 mt-2">
          Odjavi se
        </button>
      </div>
    </aside>
  )
}
```

---

## Guard Na Stranicama

### app/radnici/page.tsx (Primer)
```typescript
export default async function RadniciPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  
  const permissions = await getUserPermissions(user.id)
  
  // Provera pristupa
  if (!canViewModule(permissions, 'radnici')) {
    redirect('/dashboard')
  }
  
  // Provera prava za UI
  const canAddEmployee = canCreate(permissions, 'radnici')
  const canEditEmployee = canEdit(permissions, 'radnici')
  
  return (
    <div>
      <h1>Radnici</h1>
      {canAddEmployee && <Button>+ Novi radnik</Button>}
      {/* ... */}
    </div>
  )
}
```

---

## Podešavanja → Korisnici

### `/podesavanja/korisnici`

**Lista korisnika:**
```typescript
export default async function KorisniciPage() {
  const currentUser = await getCurrentUser()
  const permissions = await getUserPermissions(currentUser.id)
  
  if (!canViewModule(permissions, 'podesavanja')) {
    redirect('/dashboard')
  }
  
  const { data: users } = await supabase
    .from('user_roles')
    .select('*')
    .order('created_at', { ascending: false })
  
  return (
    <div>
      <h1>Korisnici i Prava</h1>
      <Button onClick={openNewUserModal}>+ Novi korisnik</Button>
      
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  )
}
```

---

## Kreiranje Novog Korisnika

### Server Action
```typescript
// app/actions/users.ts
'use server'

export async function createUser(formData: FormData) {
  const username = formData.get('username') as string
  const displayName = formData.get('displayName') as string
  const password = formData.get('password') as string
  
  // Kreiranje u Supabase Auth
  const fakeEmail = `${username}@internal.erp`
  
  const { data: authUser, error } = await supabase.auth.admin.createUser({
    email: fakeEmail,
    password: password,
    email_confirm: true
  })
  
  if (error) throw error
  
  // Kreiranje u user_roles
  await supabase.from('user_roles').insert({
    user_id: authUser.user.id,
    username: username,
    display_name: displayName,
    aktivan: true
  })
  
  return authUser.user
}
```

### Modal Komponenta
```typescript
function NewUserModal() {
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    const user = await createUser(formData)
    
    // Otvori modal za podešavanje prava
    openPermissionsModal(user.id)
  }
  
  return (
    <Dialog>
      <form onSubmit={handleSubmit}>
        <Input name="displayName" label="Ime za prikaz" required />
        <Input name="username" label="Username" required />
        <Input name="password" type="password" label="Password" required />
        <Button type="submit">Kreiraj</Button>
      </form>
    </Dialog>
  )
}
```

---

## Podešavanje Prava

### Modal Sa Checkbox-ima
```typescript
function PermissionsModal({ userId }: { userId: string }) {
  const [permissions, setPermissions] = useState({
    dashboard: { view: false, create: false, edit: false, delete: false },
    radnici: { view: false, create: false, edit: false, delete: false },
    cashflow: { view: false, create: false, edit: false, delete: false },
    proizvodnja: { view: false, create: false, edit: false, delete: false },
    podesavanja: { view: false, create: false, edit: false, delete: false },
  })
  
  async function savePermissions() {
    // Briši stara prava
    await supabase
      .from('user_permissions')
      .delete()
      .eq('user_id', userId)
    
    // Dodaj nova
    const records = Object.entries(permissions).map(([modul, rights]) => ({
      user_id: userId,
      modul,
      ...rights
    }))
    
    await supabase.from('user_permissions').insert(records)
  }
  
  return (
    <Dialog>
      {Object.entries(permissions).map(([modul, rights]) => (
        <div key={modul}>
          <h3>{modul}</h3>
          <Checkbox
            checked={rights.view}
            onChange={(val) => updatePermission(modul, 'view', val)}
          >
            Pregled (View)
          </Checkbox>
          <Checkbox
            checked={rights.create}
            onChange={(val) => updatePermission(modul, 'create', val)}
          >
            Dodavanje (Create)
          </Checkbox>
          {/* ... ostala prava */}
        </div>
      ))}
      <Button onClick={savePermissions}>Sačuvaj prava</Button>
    </Dialog>
  )
}
```

---

## Izmena Password-a

### Server Action
```typescript
export async function updateUserPassword(userId: string, newPassword: string) {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword
  })
  
  if (error) throw error
}
```

---

## Deaktivacija Korisnika

```typescript
export async function deactivateUser(userId: string) {
  await supabase
    .from('user_roles')
    .update({ aktivan: false })
    .eq('user_id', userId)
}
```

Deaktivirani korisnici ne mogu se prijaviti (provera u login flow-u).

---

## Praktični Workflow

### Setup Prvog Admin Korisnika (Manuelno u Supabase)
1. Otvori Supabase Dashboard → Authentication → Users
2. Klikni "Add user" → Email: `admin@internal.erp`, Password: `admin123`
3. Kopiraj UUID novog korisnika
4. Otvori SQL Editor, pokreni:
```sql
INSERT INTO user_roles (user_id, username, display_name)
VALUES ('KOPIRANI_UUID', 'admin', 'Administrator');

INSERT INTO user_permissions (user_id, modul, view, create, edit, delete)
VALUES
  ('KOPIRANI_UUID', 'dashboard', true, true, true, true),
  ('KOPIRANI_UUID', 'radnici', true, true, true, true),
  ('KOPIRANI_UUID', 'cashflow', true, true, true, true),
  ('KOPIRANI_UUID', 'proizvodnja', true, true, true, true),
  ('KOPIRANI_UUID', 'podesavanja', true, true, true, true);
```
5. Loguj se sa: Username `admin`, Password `admin123`

### Dodavanje Ostalih Korisnika (Kroz UI)
1. Loguješ se kao admin
2. Podešavanja → Korisnici → [+ Novi korisnik]
3. Uneseš ime, username, password
4. Podesiš prava po modulima
5. Sačuvaš

---

## Napomene Za Development

### Mock Auth (Opciono Za Brži Development)
```typescript
// lib/auth/mock.ts
export function mockAuth() {
  if (process.env.NODE_ENV === 'development') {
    return {
      id: '00000000-0000-0000-0000-000000000001',
      username: 'admin',
      display_name: 'Administrator'
    }
  }
  return null
}
```

Koristi mock dok gradiš module, pa aktiviraj pravi auth kada testiraš.

---

## Checklist — Auth Setup

- [ ] Kreirati `user_roles` tabelu
- [ ] Kreirati `user_permissions` tabelu
- [ ] Postaviti RLS policies na sve tabele
- [ ] Napraviti login stranicu
- [ ] Napraviti helper funkcije za permissions
- [ ] Napraviti sidebar sa filterom
- [ ] Napraviti `/podesavanja/korisnici` stranicu
- [ ] Testirati sa 3 korisnika (admin, kancelarija, proizvodnja)
