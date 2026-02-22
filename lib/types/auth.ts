/**
 * Tipovi za auth i permisije (prema docs/auth-setup.md).
 * user_roles: user_id, username, display_name, aktivan, employee_id, last_login
 * user_permissions: user_id, modul, view, create, edit, delete
 */

export type ModulName =
  | "dashboard"
  | "radnici"
  | "cashflow"
  | "proizvodnja"
  | "podesavanja"

export interface UserPermission {
  id: string
  user_id: string
  modul: ModulName
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
}

export interface UserRole {
  id: string
  user_id: string
  username: string
  display_name: string
  aktivan: boolean
  employee_id: string | null
  created_at: string
  last_login: string | null
}

export interface CurrentUser {
  id: string
  email: string
  username: string
  display_name: string
  aktivan: boolean
  employee_id: string | null
  last_login: string | null
}
