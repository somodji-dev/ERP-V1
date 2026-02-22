"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createUserAction } from "@/app/actions/users"
import { Loader2 } from "lucide-react"

const schema = z
  .object({
    username: z.string().min(1, "Username je obavezan").max(100),
    display_name: z.string().min(1, "Ime za prikaz je obavezno").max(200),
    password: z.string().min(6, "Lozinka mora imati najmanje 6 karaktera"),
    password_confirm: z.string(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Lozinke se ne poklapaju",
    path: ["password_confirm"],
  })

type FormValues = z.infer<typeof schema>

export function NewUserForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      display_name: "",
      password: "",
      password_confirm: "",
    },
  })

  async function onSubmit(values: FormValues) {
    setIsLoading(true)
    try {
      const { userId } = await createUserAction({
        username: values.username.trim(),
        display_name: values.display_name.trim(),
        password: values.password,
      })
      toast({ title: "Korisnik kreiran", description: "Podesite mu prava pristupa." })
      router.push(`/podesavanja/korisnici/${userId}`)
    } catch (e) {
      toast({
        title: "Greška",
        description: e instanceof Error ? e.message : "Neuspelo kreiranje.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <Card className="border border-[#E5E7EB] bg-white shadow-sm rounded-xl max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Novi korisnik</CardTitle>
        <p className="text-sm text-[#6B7280]">
          Kreirajte nalog. Posle toga podesite prava pristupa po modulima.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              {...form.register("username")}
              className="border-[#E5E7EB]"
              placeholder="npr. kancelarija"
              autoComplete="username"
            />
            {form.formState.errors.username && (
              <p className="text-xs text-red-500">{form.formState.errors.username.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="display_name">Ime za prikaz</Label>
            <Input
              id="display_name"
              {...form.register("display_name")}
              className="border-[#E5E7EB]"
              placeholder="npr. Kancelarija"
            />
            {form.formState.errors.display_name && (
              <p className="text-xs text-red-500">{form.formState.errors.display_name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Lozinka</Label>
            <Input
              id="password"
              type="password"
              {...form.register("password")}
              className="border-[#E5E7EB]"
              placeholder="min. 6 karaktera"
              autoComplete="new-password"
            />
            {form.formState.errors.password && (
              <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password_confirm">Ponovi lozinku</Label>
            <Input
              id="password_confirm"
              type="password"
              {...form.register("password_confirm")}
              className="border-[#E5E7EB]"
              placeholder=""
              autoComplete="new-password"
            />
            {form.formState.errors.password_confirm && (
              <p className="text-xs text-red-500">
                {form.formState.errors.password_confirm.message}
              </p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isLoading} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kreiranje...
                </>
              ) : (
                "Kreiraj korisnika"
              )}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/podesavanja/korisnici">Otkaži</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
