"use client"

import { logoutAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import type { CurrentUser } from "@/lib/types/auth"

interface UserMenuProps {
  user: CurrentUser
}

export function UserMenu({ user }: UserMenuProps) {
  return (
    <div className="border-t border-[#E5E7EB] p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB] font-semibold text-sm">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#111827] truncate">
            {user.display_name}
          </p>
          <p className="text-xs text-[#6B7280] truncate">{user.username}</p>
        </div>
      </div>
      <form action={logoutAction}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="w-full justify-start text-[#6B7280] hover:text-[#111827] hover:bg-[#F4F5F7]"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Odjavi se
        </Button>
      </form>
    </div>
  )
}
