import { redirect } from "next/navigation"
import { verifySession } from "@/lib/auth-config"
import { getDictionary } from "@/lib/dictionary"
import type { Locale } from "@/i18n-config"
import BookingForm from "@/app/[lang]/on-location/components/booking-form"

export default async function AdminBookingPage({ params }: { params: { lang: Locale } }) {
  const lang = params.lang || "it"
  const dictionary = await getDictionary(lang)

  // Verifica autenticazione
  const isAuthenticated = await verifySession()

  if (!isAuthenticated) {
    redirect(`/${lang}/on-location`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 my-16">

        <BookingForm dictionary={dictionary.booking.admin} />
      </div>
    </div>
  )
}

export const metadata = {
  title: "Booking - Area Riservata",
  description: "Form di prenotazione",
  robots: "noindex, nofollow",
}
