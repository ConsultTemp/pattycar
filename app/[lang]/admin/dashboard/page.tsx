import { redirect } from "next/navigation"
import { verifyAdminAuth } from "@/lib/auth-server"
import { getAllBookings } from "@/lib/database"
import { getDictionary } from "@/lib/dictionary"
import type { Locale } from "@/i18n-config"
import AdminDashboard from "@/components/admin-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default async function AdminDashboardPage({ params }: { params: { lang: Locale } }) {
  const lang = params.lang || "it"
  const dictionary = await getDictionary(lang)
  
  // Check if admin is authenticated
  const isAuthenticated = await verifyAdminAuth()
  
  if (!isAuthenticated) {
    redirect(`/${lang}/admin`)
  }

  // Fetch all bookings
  const bookingsResult = await getAllBookings()
  
  if (!bookingsResult.success) {
    return (
      <div className="min-h-screen bg-white pt-20 p-4">
        <div className="container mx-auto max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">{dictionary.admin?.dashboard?.error || "Error"}</CardTitle>
              <CardDescription>{dictionary.admin?.dashboard?.errorDescription || "Failed to load bookings"}</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>
                  {bookingsResult.error || dictionary.admin?.dashboard?.errorMessage || "Unable to fetch bookings from database"}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="container mx-auto max-w-7xl p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            {dictionary.admin?.dashboard?.title || "Admin Dashboard"}
          </h1>
          <p className="text-slate-600">
            {dictionary.admin?.dashboard?.description || "Manage all paid bookings and customer information"}
          </p>
        </div>
        
        <AdminDashboard 
          bookings={bookingsResult.data || []}
          lang={lang}
          dictionary={dictionary}
        />
      </div>
    </div>
  )
}

export const metadata = {
  title: "Admin Dashboard - Patty Car",
  description: "Admin dashboard for managing bookings",
  robots: "noindex, nofollow",
} 