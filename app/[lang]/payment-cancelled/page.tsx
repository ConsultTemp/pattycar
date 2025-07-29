import Link from "next/link"
import { XCircle } from "lucide-react"
import { getDictionary } from "@/lib/dictionary"

interface PaymentCancelledPageProps {
  params: {
    lang: "en" | "it" | "ar"
  }
}

export default async function PaymentCancelledPage({ params }: PaymentCancelledPageProps) {
  const dictionary = await getDictionary(params.lang)
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{dictionary.payment.cancelled.title}</h1>
        <p className="text-gray-600 mb-6">{dictionary.payment.cancelled.description}</p>
        <div className="space-y-3">
          <Link
            href={`/${params.lang}/onlocation/booking`}
            className="block w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition-colors"
          >
            {dictionary.payment.cancelled.retryBooking}
          </Link>
          <Link
            href={`/${params.lang}`}
            className="block w-full border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 transition-colors"
          >
            {dictionary.payment.cancelled.backToHome}
          </Link>
        </div>
      </div>
    </div>
  )
}
