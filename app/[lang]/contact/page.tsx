import Image from "next/image"
import { getDictionary } from "@/lib/dictionary"
import type { Locale } from "@/i18n-config"
import type { Metadata } from "next"
import { generateSEOMetadata } from "@/lib/seo-config"
import { Phone, Mail } from "lucide-react"
import contacts from '../../../public/contacts.jpg'
import ContactForm from "@/components/contact-form"

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
type Params = Promise<{ lang: Locale }>

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
    const params = await props.params
    const dictionary = await getDictionary(params.lang)
    const seoData = generateSEOMetadata("contact", params.lang)

    return {
        title: `${dictionary.contact.title} | Patty Car`,
        description: seoData.description,
        keywords: seoData.keywords,
        alternates: {
            canonical: `/${params.lang}/contact`,
            languages: {
                "en-US": "/en/contact",
                "it-IT": "/it/contact",
                "ar-SA": "/ar/contact",
            },
        },
        icons: {
            icon: [
              { url: '/favicon.ico' }, 
              { url: '/logopatty.png' }
            ],
            apple: { url: '/favicon.ico' },
            shortcut: { url: '/favicon.ico' }
          },
        openGraph: {
            title: `${dictionary.contact.title} | Patty Car`,
            description: seoData.description,
            url: `https://pattycar.com/${params.lang}/contact`,
            siteName: "Patty Car",
            locale: params.lang === "it" ? "it_IT" : params.lang === "en" ? "en_US" : "ar_SA",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: `${dictionary.contact.title} | Patty Car`,
            description: seoData.description,
        },
    }
}

export default async function ContactPage(props: { params: Params }) {
    let params = await props.params
    if (!params || !params.lang) {
        params = {lang: 'it'}
    }
    const dictionary = await getDictionary(params.lang)

    return (
        <div className="pt-24">
            {/* Header */}
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-4xl font-light mb-4 atacama">{dictionary.contact.title}</h1>
                <p className="text-sm text-darkGray font-light max-w-2xl mx-auto">{dictionary.contact.subtitle}</p>
            </div>

            {/* Contact Info */}
            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    <div className="bg-white p-6 border border-gray-100">
                        <div className="flex items-center mb-4">
                            <Phone className="w-4 h-4 mr-2 text-red-700" />
                            <h3 className="text-base font-light text-red-700">{dictionary.contact.phoneTitle}</h3>
                        </div>
                        <p className="text-base font-light">{dictionary.contact.phoneNumber}</p>
                    </div>

                    <div className="bg-white p-6 border border-gray-100">
                        <div className="flex items-center mb-4">
                            <Mail className="w-4 h-4 mr-2 text-red-700" />
                            <h3 className="text-base font-light text-red-700">{dictionary.contact.emailTitle}</h3>
                        </div>
                        <p className="text-base font-light">{dictionary.contact.emailAddress}</p>
                    </div>
                </div>
            </div>

            {/* Contact Form */}
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white p-6 border border-gray-100">
                        <h2 className="text-base font-light text-red-700 mb-6">{dictionary.contact.formTitle}</h2>
                        <ContactForm dictionary={dictionary} />
                    </div>
                </div>
            </div>

            {/* Company Info */}
            <div className="mt-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="relative h-96">
                            <Image
                                src={contacts}
                                alt="Patty Car Service"
                                fill
                                className="object-cover"
                                sizes="100vw"
                            />
                            <div className="absolute inset-0 bg-black/30"></div>
                        </div>

                        <div className="py-16">
                            <div className="max-w-3xl mx-auto">
                                <p className="text-sm text-darkGray text-center font-light mb-6">{dictionary.contact.companyInfo1}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}