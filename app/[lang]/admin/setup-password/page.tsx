import { redirect } from "next/navigation"
import { verifyAdminAuth } from "@/lib/auth-server"
import { getDictionary } from "@/lib/dictionary"
import type { Locale } from "@/i18n-config"
import SetupPasswordForm from "@/components/setup-password-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SetupPasswordPage({ 
  params,
  searchParams
}: { 
  params: { lang: Locale }
  searchParams: { token_hash?: string; type?: string }
}) {
  const lang = params.lang || "it"
  const dictionary = await getDictionary(lang)
  
  // Check if admin is already authenticated
  const isAuthenticated = await verifyAdminAuth()
  
  if (isAuthenticated) {
    redirect(`/${lang}/admin/dashboard`)
  }

  // Get token from query params
  const tokenHash = searchParams.token_hash
  const type = searchParams.type

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-800">
            {dictionary.admin?.setupPassword?.title || "Setup Password"}
          </CardTitle>
          <CardDescription className="text-slate-600">
            {dictionary.admin?.setupPassword?.description || "Create your password to access the system"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SetupPasswordForm 
            lang={lang} 
            dictionary={dictionary}
            tokenHash={tokenHash}
            type={type}
          />
        </CardContent>
      </Card>
    </div>
  )
} 