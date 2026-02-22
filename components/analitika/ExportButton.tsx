"use client"

import { Button } from "@/components/ui/button"
import { FileSpreadsheet } from "lucide-react"

type ExportButtonProps = {
  onExportExcel: () => void
  label?: string
  disabled?: boolean
}

export function ExportButton({ onExportExcel, label = "Export Excel", disabled }: ExportButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="border-[#E5E7EB]"
      onClick={onExportExcel}
      disabled={disabled}
    >
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}
