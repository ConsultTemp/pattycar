import { Suspense } from "react"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

function PaymentSuccessContent() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Pagamento Completato!</h1>
        <p className="text-gray-600 mb-6">
          La tua prenotazione è stata confermata. Riceverai una email di conferma a breve.
        </p>
        <div className="space-y-3">
          <Link
            href="/it/on-location/booking"
            className="block w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition-colors"
          >
            Nuova Prenotazione
          </Link>
          <Link
            href="/it"
            className="block w-full border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 transition-colors"
          >
            Torna alla Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  )
}