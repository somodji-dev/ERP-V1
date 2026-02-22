/**
 * Layout za auth stranice (login) — bez sidebar-a, minimalan.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
      {children}
    </div>
  )
}
