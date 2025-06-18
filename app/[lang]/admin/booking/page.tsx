import { redirect } from "next/navigation"
import { verifySession } from "@/lib/auth-config"
import { getDictionary } from "@/lib/dictionary"
import type { Locale } from "@/i18n-config"
import BookingForm from "@/app/[lang]/admin/components/booking-form"

export default async function AdminBookingPage({ params }: { params: { lang: Locale } }) {
  const lang = params.lang || "it"
  const dictionary = await getDictionary(lang)

  // Verifica autenticazione
  const isAuthenticated = await verifySession()

  if (!isAuthenticated) {
    redirect(`/${lang}/admin`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-32">
      <div className="container mx-auto">
        <div className="mb-6">
          <p className="text-gray-600">{dictionary.booking.admin.title}</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <BookingForm dictionary={dictionary.booking.admin} />
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: "Booking - Area Riservata",
  description: "Form di prenotazione",
  robots: "noindex, nofollow",
}
