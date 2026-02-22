import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/user"
import { Sidebar } from "@/components/layout/Sidebar"
import { DashboardShell } from "@/components/layout/DashboardShell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login?reason=session_missing")

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      <DashboardShell sidebarSlot={<Sidebar />} contentSlot={children} />
    </div>
  )
}
