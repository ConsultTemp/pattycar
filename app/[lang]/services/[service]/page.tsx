import Image from "next/image"
import { getDictionary } from "@/lib/dictionary"
import type { Locale } from "@/i18n-config"
import type { Metadata } from "next"
import { generateSEOMetadata } from "@/lib/seo-config"
import { Heart, Clock, Phone, Shield, Lock, Globe, Briefcase, Star, Hotel, Users, Calendar } from 'lucide-react'
import { notFound } from "next/navigation"
import type { JSX } from "react"
import BookingForm from "@/components/booking-form"
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Import service images
import transferNccHero from "../../../../public/services/transfer-hero.jpg"
import transferNccPar from "../../../../public/services/transfer-par.jpg"
import eventsHero from "../../../../public/services/events-hero.jpg"
import eventsPar from "../../../../public/services/events-par.jpg"
import diplomaticHero from "../../../../public/services/diplomatic-hero.jpg"
import diplomaticPar from "../../../../public/services/diplomatic-par.jpg"
import luxuryHotelsHero from "../../../../public/services/hotel-hero.jpg"
import luxuryHotelsPar from "../../../../public/services/hotel-par.jpg"
import businessHero from "../../../../public/services/company-hero.jpg"
import businessPar from "../../../../public/services/company-par.jpg"

type Params = Promise<{ lang: Locale, service: string }>

// Define valid service slugs
const validServices = ["transfer-ncc", "events", "diplomatic", "luxury-hotels", "business"]

// Map service slugs to their index in the dictionary
const serviceIndexMap: Record<string, number> = {
  "transfer-ncc": 0,
  events: 1,
  diplomatic: 2,
  "luxury-hotels": 3,
  business: 4,
}

// Map service slugs to their images
const serviceImages: Record<string, { hero: any; par: any }> = {
  "transfer-ncc": { hero: transferNccHero, par: transferNccPar },
  events: { hero: eventsHero, par: eventsPar },
  diplomatic: { hero: diplomaticHero, par: diplomaticPar },
  "luxury-hotels": { hero: luxuryHotelsHero, par: luxuryHotelsPar },
  business: { hero: businessHero, par: businessPar },
}

// Map icons to their components
const iconComponents: Record<string, JSX.Element> = {
  heart: <Heart className="w-12 h-12 mb-4 text-red-700" />,
  clock: <Clock className="w-12 h-12 mb-4 text-red-700" />,
  phone: <Phone className="w-12 h-12 mb-4 text-red-700" />,
  shield: <Shield className="w-12 h-12 mb-4 text-red-700" />,
  lock: <Lock className="w-12 h-12 mb-4 text-red-700" />,
  globe: <Globe className="w-12 h-12 mb-4 text-red-700" />,
  briefcase: <Briefcase className="w-12 h-12 mb-4 text-red-700" />,
  star: <Star className="w-12 h-12 mb-4 text-red-700" />,
  hotel: <Hotel className="w-12 h-12 mb-4 text-red-700" />,
  users: <Users className="w-12 h-12 mb-4 text-red-700" />,
  calendar: <Calendar className="w-12 h-12 mb-4 text-red-700" />,
}

export async function generateStaticParams() {
  const services = ["transfer-ncc", "events", "diplomatic", "luxury-hotels", "business"]
  const locales = ["en", "it", "ar"]

  return locales.flatMap((lang) =>
    services.map((service) => ({
      lang,
      service,
    }))
  )
}

export async function generateMetadata(props:{ params: Params }): Promise<Metadata | null> {
    let params = await props.params
    if (!params || !params.lang) {
        params = {lang: 'it', service: 'transfer-ncc'}
    }
  const { lang, service } = params

  // Check if service is valid
  if (!validServices.includes(service)) {
    return {
      title: "Service Not Found",
      description: "The requested service could not be found",
    }
  }

  const dictionary = await getDictionary(lang)
  const seoData = generateSEOMetadata("services", lang)

  // Get service data from dictionary
  const serviceIndex = serviceIndexMap[service]
  const serviceTitle = dictionary.services.items[serviceIndex].title
  const serviceDescription = dictionary.services.items[serviceIndex].description

  return {
    title: `${serviceTitle} | Patty Car`,
    description: serviceDescription,
    keywords: [...seoData.keywords],
    alternates: {
      canonical: `/${lang}/services/${service}`,
      languages: {
        "en-US": `/en/services/${service}`,
        "it-IT": `/it/services/${service}`,
        "ar-SA": `/ar/services/${service}`,
      },
    },
    openGraph: {
      title: `${serviceTitle} | Patty Car`,
      description: serviceDescription,
      url: `https://pattycar.com/${lang}/services/${service}`,
      siteName: "Patty Car",
      locale: lang === "it" ? "it_IT" : lang === "en" ? "en_US" : "ar_SA",
      type: "website",
      images: [
        {
          url: `/images/services/${service}.jpg`,
          width: 1200,
          height: 630,
          alt: `${serviceTitle} - Patty Car`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${serviceTitle} | Patty Car`,
      description: serviceDescription,
      images: [`/images/services/${service}.jpg`],
    },
  }
}

export default async function ServicePage(props:{ params: Params }) {
    let params = await props.params
    if (!params || !params.lang) {
        params = {lang: 'it', service: "transfer-ncc"}
    }
    // Check if service is valid
  if (!validServices.includes(params.service)) {
    notFound()
  }

  const dictionary = await getDictionary(params.lang)

  // Get service data from dictionary
  const serviceIndex = serviceIndexMap[params.service]
  const serviceData = dictionary.serviceDetail[params.service as keyof typeof dictionary.serviceDetail]

  if (!serviceData) {
    notFound()
  }

  // Get service images
  const images = serviceImages[params.service]

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-screen">
        <div className="absolute inset-0 z-0">
          <Image
            src={images.hero || "/placeholder.svg"}
            alt={serviceData.title}
            fill
            priority
            className="object-cover brightness-75"
            sizes="100vw"
          />
        </div>

        <div className="absolute inset-0 bg-black/30 z-10"></div>

        <div className="relative z-20 container mx-auto px-4 h-full flex flex-col justify-center text-white pt-24">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-light uppercase tracking-wider">{dictionary.navigation[1].label}</p>
            <h1 className="text-3xl md:text-6xl font-light my-6 atacama">{serviceData.title}</h1>
            <p className="text-sm md:text-sm font-light">{serviceData.subtitle}</p>
          </div>
        </div>
      </section>

      {/* Intro and Description Section */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-darkGray text-center">{serviceData.description}</p>
          </div>
        </div>
      </section>

      {/* Features Sections */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {serviceData.sections.map((section: any, index: number) => (
              <div key={index} className="text-center">
                <div className="flex justify-center">{iconComponents[section.icon]}</div>
                <h2 className={`text-3xl mb-4 atacama ${index == 1 ? "text-red-700": ""}`}>{section.title}</h2>
                <p className="text-darkGray text-sm">{section.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlight Section with Image */}
      <section className="py-16 bg-white mx-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
              <p className="text-sm text-darkGray leading-relaxed mb-6 text-left">{serviceData.highlight.text}</p>
            </div>
            <div className="w-full md:w-1/2 relative h-96">
              <Image
                src={images.par || "/placeholder.svg"}
                alt={serviceData.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Conclusion Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm text-darkGray">{serviceData.conclusion}</p>
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-16 bg-white">
        <BookingForm dictionary={dictionary.booking}/>
      </section>
    </>
  )
}
