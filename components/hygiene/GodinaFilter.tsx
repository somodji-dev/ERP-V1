"use client"

import { useRouter } from "next/navigation"

export function GodinaFilter({
  godina,
  years,
}: {
  godina: number
  years: number[]
}) {
  const router = useRouter()
  return (
    <select
      value={String(godina)}
      onChange={(e) => router.push(`/proizvodnja/higijena?godina=${e.target.value}`)}
      className="rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm"
    >
      {years.map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  )
}
