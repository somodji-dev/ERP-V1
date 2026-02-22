"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { setUserActiveAction, resetUserPasswordAction } from "@/app/actions/users"
import { Key, UserCheck, UserX } from "lucide-react"
import { format } from "date-fns"

type UserRow = {
  id: string
  user_id: string
  username: string
  display_name: string
  aktivan: boolean
  created_at: string
  last_login: string | null
  module_count: number
}

export function KorisniciListClient({
  users,
  canEdit: canEditUsers,
}: {
  users: UserRow[]
  canEdit: boolean
}) {
  const { toast } = useToast()
  const [resettingUserId, setResettingUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  async function handleSetActive(userId: string, aktivan: boolean) {
    try {
      await setUserActiveAction(userId, aktivan)
      toast({
        title: aktivan ? "Korisnik aktiviran" : "Korisnik deaktiviran",
      })
      window.location.reload()
    } catch (e) {
      toast({
        title: "Greška",
        description: e instanceof Error ? e.message : "Neuspelo.",
        variant: "destructive",
      })
    }
  }

  function openResetDialog(userId: string) {
    setResettingUserId(userId)
    setNewPassword("")
    setDialogOpen(true)
  }

  async function handleResetPassword() {
    if (!resettingUserId || !newPassword.trim()) return
    if (newPassword.length < 6) {
      toast({
        title: "Lozinka mora imati najmanje 6 karaktera",
        variant: "destructive",
      })
      return
    }
    try {
      await resetUserPasswordAction(resettingUserId, newPassword)
      toast({ title: "Lozinka je promenjena" })
      setDialogOpen(false)
      setResettingUserId(null)
    } catch (e) {
      toast({
        title: "Greška",
        description: e instanceof Error ? e.message : "Neuspelo.",
        variant: "destructive",
      })
    }
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-12 text-center shadow-sm">
        <p className="text-sm text-[#6B7280]">Nema korisnika. Dodajte prvog korisnika.</p>
        {canEditUsers && (
          <Button asChild className="mt-4 bg-[#2563EB] hover:bg-[#1D4ED8]">
            <Link href="/podesavanja/korisnici/novi">Novi korisnik</Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-[#E5E7EB] bg-[#F9FAFB]">
              <TableHead className="text-xs font-semibold uppercase text-[#6B7280]">
                Korisnik
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-[#6B7280]">
                Username
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-[#6B7280]">
                Moduli
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-[#6B7280]">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-[#6B7280]">
                Poslednja prijava
              </TableHead>
              {canEditUsers && (
                <TableHead className="w-[80px] text-xs font-semibold uppercase text-[#6B7280]">
                  Akcije
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.user_id} className="border-[#F3F4F6]">
                <TableCell className="font-medium text-[#111827]">
                  {u.display_name}
                </TableCell>
                <TableCell className="text-[#6B7280]">{u.username}</TableCell>
                <TableCell className="text-[#6B7280]">
                  {u.module_count} / 5
                </TableCell>
                <TableCell>
                  <span
                    className={
                      u.aktivan
                        ? "rounded-full bg-[#F0FDF4] px-2.5 py-0.5 text-xs font-medium text-[#16A34A]"
                        : "rounded-full bg-[#FEF2F2] px-2.5 py-0.5 text-xs font-medium text-[#DC2626]"
                    }
                  >
                    {u.aktivan ? "Aktivan" : "Neaktivan"}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-[#9CA3AF]">
                  {u.last_login
                    ? format(new Date(u.last_login), "dd.MM.yyyy HH:mm")
                    : "—"}
                </TableCell>
                {canEditUsers && (
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" asChild className="border-[#E5E7EB]">
                        <Link href={`/podesavanja/korisnici/${u.user_id}`}>
                          Uredi prava
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#E5E7EB]"
                        onClick={() => openResetDialog(u.user_id)}
                      >
                        <Key className="mr-1 h-3 w-3" />
                        Lozinka
                      </Button>
                      {u.aktivan ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#FECACA] text-[#DC2626] hover:bg-[#FEF2F2]"
                          onClick={() => handleSetActive(u.user_id, false)}
                        >
                          <UserX className="mr-1 h-3 w-3" />
                          Deaktiviraj
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#BBF7D0] text-[#16A34A] hover:bg-[#F0FDF4]"
                          onClick={() => handleSetActive(u.user_id, true)}
                        >
                          <UserCheck className="mr-1 h-3 w-3" />
                          Aktiviraj
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset lozinke</AlertDialogTitle>
            <AlertDialogDescription>
              Unesite novu lozinku (min. 6 karaktera). Korisnik će moći da se prijavi sa novom lozinkom.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nova lozinka"
              className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm"
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              className="bg-[#2563EB] hover:bg-[#1D4ED8]"
            >
              Sačuvaj
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
