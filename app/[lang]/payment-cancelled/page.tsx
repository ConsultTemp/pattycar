import Link from "next/link"
import { XCircle } from "lucide-react"

export default function PaymentCancelledPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Pagamento Annullato</h1>
        <p className="text-gray-600 mb-6">Il pagamento è stato annullato. Puoi riprovare quando vuoi.</p>
        <div className="space-y-3">
          <Link
            href="/it/on-location/booking"
            className="block w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition-colors"
          >
            Riprova Prenotazione
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
