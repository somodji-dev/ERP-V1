import { Suspense } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { RadniciListClient } from "@/components/radnici/RadniciListClient"
import { RadniciKpiCards } from "@/components/radnici/RadniciKpiCards"
import type { Employee } from "@/lib/types/radnici"

async function RadniciListData() {
  const supabase = await createClient()
  const { data: employees, error } = await supabase
    .from("employees")
    .select("*")
    .order("ime", { ascending: true })

  if (error) {
    return (
      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="pt-6">
          <p className="text-sm text-red-600">Greška pri učitavanju: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  const list = (employees ?? []) as Employee[]
  return <RadniciListClient initialEmployees={list} />
}

function RadniciTableSkeleton() {
  return (
    <Card className="border-[#E5E7EB] bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 rounded-md bg-[#F3F4F6] animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border-[#E5E7EB] bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="h-4 w-24 rounded bg-[#F3F4F6] animate-pulse mb-3" />
            <div className="h-8 w-16 rounded bg-[#F3F4F6] animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function RadniciPage() {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-[#111827]">Radnici & Plate</h1>
        <Button asChild className="bg-[#2563EB] hover:bg-[#1D4ED8] shrink-0">
          <Link href="/radnici/novi">
            <UserPlus className="mr-2 h-4 w-4" />
            Novi radnik
          </Link>
        </Button>
      </div>

      <Suspense fallback={<KpiSkeleton />}>
        <RadniciKpiCards />
      </Suspense>

      <div className="mt-5">
        <Suspense fallback={<RadniciTableSkeleton />}>
          <RadniciListData />
        </Suspense>
      </div>
    </div>
  )
}
