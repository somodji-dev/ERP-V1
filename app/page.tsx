// TODO: Re-enable auth later (currently mocked for development)

import { redirect } from "next/navigation"

export default function HomePage() {
  redirect("/dashboard")
}
