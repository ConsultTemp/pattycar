import { getDictionary } from '@/lib/dictionary'

type SupportedLocale = "en" | "it" | "ar"

export default async function GuidelinesPage({
  params,
}: {
  params: Promise<{ lang: SupportedLocale }>
}) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <div className="container mx-auto px-4 py-32">
      <h1 className="text-4xl font-bold text-center mb-4">{dictionary.guidelines.title}</h1>
      <p className="text-xl text-center text-gray-600 mb-12">{dictionary.guidelines.subtitle}</p>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* ARRIVALS SECTION */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-primary">{dictionary.guidelines.arrivals.title}</h2>
          
          {/* Airport Arrivals */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">{dictionary.guidelines.arrivals.airport.title}</h3>
            <p className="text-gray-700 mb-4">{dictionary.guidelines.arrivals.airport.waitingTime}</p>
            
            <p className="font-semibold text-gray-800 mb-2">{dictionary.guidelines.arrivals.airport.ratesTitle}</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4 mb-4">
              {dictionary.guidelines.arrivals.airport.rates.map((rate, index) => (
                <li key={index}>{rate}</li>
              ))}
            </ul>
            
            <p className="text-gray-700 mb-2">{dictionary.guidelines.arrivals.airport.maxDelay}</p>
            <p className="text-gray-700 italic">{dictionary.guidelines.arrivals.airport.payment}</p>
          </div>

          {/* Train Station Arrivals */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-3">{dictionary.guidelines.arrivals.trainStation.title}</h3>
            <p className="text-gray-700 mb-4">{dictionary.guidelines.arrivals.trainStation.waitingTime}</p>
            
            <p className="font-semibold text-gray-800 mb-2">{dictionary.guidelines.arrivals.trainStation.ratesTitle}</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4 mb-4">
              {dictionary.guidelines.arrivals.trainStation.rates.map((rate, index) => (
                <li key={index}>{rate}</li>
              ))}
            </ul>
            
            <p className="text-gray-700 mb-2">{dictionary.guidelines.arrivals.trainStation.maxDelay}</p>
            <p className="text-gray-700 italic">{dictionary.guidelines.arrivals.trainStation.payment}</p>
          </div>
        </div>

        {/* DEPARTURES SECTION */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-primary">{dictionary.guidelines.departures.title}</h2>
          <p className="text-gray-700 mb-4">{dictionary.guidelines.departures.waitingTime}</p>
          
          <p className="font-semibold text-gray-800 mb-2">{dictionary.guidelines.departures.ratesTitle}</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4 mb-4">
            {dictionary.guidelines.departures.rates.map((rate, index) => (
              <li key={index}>{rate}</li>
            ))}
          </ul>
          
          <p className="text-gray-700">{dictionary.guidelines.departures.maxWaiting}</p>
        </div>

        {/* MODIFICATIONS SECTION */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-primary">{dictionary.guidelines.modifications.title}</h2>
          <p className="text-gray-700 mb-4">{dictionary.guidelines.modifications.content}</p>
          <p className="text-gray-700 mb-2">
            <span className="font-semibold">{dictionary.guidelines.modifications.noShowLabel}</span> {dictionary.guidelines.modifications.noShow}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">{dictionary.guidelines.modifications.airportChangeLabel}</span> {dictionary.guidelines.modifications.airportChange}
          </p>
        </div>

        {/* CANCELLATION POLICY SECTION */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-primary">{dictionary.guidelines.cancellationPolicy.title}</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-green-600 font-bold text-lg mr-3">✓</span>
              <p className="text-gray-700">{dictionary.guidelines.cancellationPolicy.fullRefund}</p>
            </div>
            <div className="flex items-start">
              <span className="text-orange-600 font-bold text-lg mr-3">⚠</span>
              <p className="text-gray-700">{dictionary.guidelines.cancellationPolicy.halfRefund}</p>
            </div>
            <div className="flex items-start">
              <span className="text-red-600 font-bold text-lg mr-3">✕</span>
              <p className="text-gray-700">{dictionary.guidelines.cancellationPolicy.noRefund}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 

