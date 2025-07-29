import { Suspense } from "react"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { getDictionary } from "@/lib/dictionary"

interface PaymentSuccessPageProps {
  params: {
    lang: "en" | "it" | "ar"
  }
}

function PaymentSuccessContent({ dictionary, lang }: { dictionary: any, lang: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{dictionary.payment.success.title}</h1>
        <p className="text-gray-600 mb-6">
          {dictionary.payment.success.description}
        </p>
        <div className="space-y-3">
          <Link
            href={`/${lang}/onlocation/booking`}
            className="block w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition-colors"
          >
            {dictionary.payment.success.newBooking}
          </Link>
          <Link
            href={`/${lang}`}
            className="block w-full border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 transition-colors"
          >
            {dictionary.payment.success.backToHome}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default async function PaymentSuccessPage({ params }: PaymentSuccessPageProps) {
  const dictionary = await getDictionary(params.lang)
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent dictionary={dictionary} lang={params.lang} />
    </Suspense>
  )
}