import { getDictionary } from '@/lib/dictionary'

type SupportedLocale = "en" | "it" | "ar"

export default async function CancellationPage({
  params: { lang },
}: {
  params: { lang: SupportedLocale }
}) {
  const dictionary = await getDictionary(lang)

  return (
    <div className="container mx-auto px-4 py-32">
      <h1 className="text-4xl font-bold text-center mb-4">{dictionary.cancellation.title}</h1>
      <p className="text-xl text-center text-gray-600 mb-12">{dictionary.cancellation.subtitle}</p>

      <div className="max-w-3xl mx-auto space-y-6 text-center">
        {dictionary.cancellation.sections.map((section, index) => (
          <div key={index} className="bg-white p-6 rounded-lg">
            <h2 className="text-lg font-bold mb-4">{section.content}</h2>
            {section.items && (
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 