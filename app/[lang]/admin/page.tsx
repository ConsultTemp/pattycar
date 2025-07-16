import { redirect } from "next/navigation"
import { verifyAdminAuth } from "@/lib/auth-server"
import { getDictionary } from "@/lib/dictionary"
import type { Locale } from "@/i18n-config"
import AdminLoginForm from "@/components/admin-login-form-supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminPage({ params }: { params: { lang: Locale } }) {
  const lang = params.lang || "it"
  const dictionary = await getDictionary(lang)
  
  // Check if admin is already authenticated
  const isAuthenticated = await verifyAdminAuth()
  
  if (isAuthenticated) {
    redirect(`/${lang}/admin/dashboard`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-800">
            {dictionary.admin?.login?.title || "Admin Login"}
          </CardTitle>
          <CardDescription className="text-slate-600">
            {dictionary.admin?.login?.description || "Access the admin dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminLoginForm lang={lang} dictionary={dictionary} />
        </CardContent>
      </Card>
    </div>
  )
}

export const metadata = {
  title: "Admin Login - Patty Car",
  description: "Admin authentication",
  robots: "noindex, nofollow",
} 