"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOutIcon } from "lucide-react"

export default function AdminLogout({ lang }: { lang: string }) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch("/api/admin-logout", {
        method: "POST",
      })
      router.push(`/${lang}/on-location`)
    } catch (error) {
      console.error("Errore durante il logout", error)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
      <LogOutIcon className="h-4 w-4" />
      Logout
    </Button>
  )
}