import { redirect } from "next/navigation"
import { verifySession } from "@/lib/auth-config"
import AdminLoginForm from "@/components/admin-login-form"
import type { Locale } from "@/i18n-config"

export default async function AdminPage({ params }: { params: { lang: Locale } }) {
  const lang = params.lang || "it"

  // Verifica se l'utente è già autenticato
  const isAuthenticated = await verifySession()

  if (isAuthenticated) {
    redirect(`/${lang}/onlocation/booking`)
  }

  return <AdminLoginForm lang={lang} />
}

export const metadata = {
  title: "Admin Access - Patty Car",
  description: "Area riservata",
  robots: "noindex, nofollow",
}
