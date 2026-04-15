"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <Button onClick={() => window.print()} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
      <Printer className="mr-2 h-4 w-4" />
      Štampaj
    </Button>
  )
}
