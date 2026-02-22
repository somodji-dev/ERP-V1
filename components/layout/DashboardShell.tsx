"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

interface DashboardShellProps {
  sidebarSlot: React.ReactNode
  contentSlot: React.ReactNode
}

export function DashboardShell({ sidebarSlot, contentSlot }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <>
      {/* Hamburger — samo ispod md (768px) */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-[100] flex h-11 w-11 items-center justify-center rounded-lg border-2 border-[#E5E7EB] bg-white text-[#111827] shadow-md md:hidden"
        aria-label="Otvori meni"
      >
        <Menu className="h-6 w-6" strokeWidth={2} />
      </button>

      {/* Overlay — samo na mobilu kada je meni otvoren */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Zatvori meni"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-[90] bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar — na mobilu drawer, na desktopu uvek vidljiv; kada zatvoren ne hvata klikove */}
      <div
        className={`fixed left-0 top-0 z-[95] h-screen w-[220px] transition-transform duration-200 ease-out md:pointer-events-auto md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none"
        }`}
      >
        {sidebarSlot}
      </div>

      {/* Glavni sadržaj — na mobilu puna širina, od md margina za sidebar */}
      <main className="min-h-screen pl-4 pr-4 pt-20 pb-8 md:ml-[220px] md:px-8 md:pt-8 md:pb-8">
        {contentSlot}
      </main>
    </>
  )
}
