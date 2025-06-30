import { redirect } from "next/navigation"
import { verifySession } from "@/lib/auth-config"
import { getDictionary } from "@/lib/dictionary"
import type { Locale } from "@/i18n-config"
import BookingForm from "@/app/[lang]/onlocation/components/booking-form"
import Image from "next/image"
import mountainsImage from "@/public/mountains.jpg"

export default async function AdminBookingPage({ params }: { params: { lang: Locale } }) {
  const lang = params.lang || "it"
  const dictionary = await getDictionary(lang)

  // Verifica autenticazione
  const isAuthenticated = await verifySession()

  if (!isAuthenticated) {
    redirect(`/${lang}/onlocation`)
  }

  return (
    <>
      {/* Sfondo fisso con immagine delle montagne - solo per questa pagina */}
      <div className="fixed inset-0 z-[-1]">
        <Image
          src={mountainsImage}
          alt="Mountains background"
          fill
          className="object-cover"
          priority
        />
      </div>
      
      {/* Contenuto del form */}
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8 my-16 max-w-4xl">
          <div className="bg-white backdrop-blur-sm rounded-lg shadow-xl p-6">
            <BookingForm dictionary={dictionary.booking.admin} />
          </div>
        </div>
      </div>
    </>
  )
}

export const metadata = {
  title: "Booking - Area Riservata",
  description: "Form di prenotazione",
  robots: "noindex, nofollow",
}
