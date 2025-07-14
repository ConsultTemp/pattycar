import { getDictionary } from "@/lib/dictionary"
import type { Locale } from "@/i18n-config"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

type Params = Promise<{ lang: Locale }>

export default async function PaymentSuccessPage(props: { params: Params }) {
  let params = await props.params
  if (!params || !params.lang) {
    params = { lang: 'it' }
  }
  const dictionary = await getDictionary(params.lang)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Payment Successful!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Your booking has been confirmed and you will receive a confirmation email shortly.
            </p>
            <div className="mt-6">
              <Link
                href={`/${params.lang}`}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}