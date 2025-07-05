"use client"

import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/language-provider"
import { Phone, Mail, MapPin } from "lucide-react"
import logo from "../public/logopatty.png"

export default function Footer() {
  const { dictionary, lang } = useLanguage()
  const currentYear = new Date().getFullYear()

  // Main navigation links
  const mainNavLinks = [
    { key: "home", href: "/", label: dictionary.navigation[0].label },
    { key: "fleet", href: "/fleet", label: dictionary.navigation[2].label },
    { key: "book", href: "/book", label: dictionary.navigation[3]?.label || "About Us" },
    { key: "contact", href: "/contact", label: dictionary.navigation[4]?.label || "Contact" },
  ]

  return (
    <footer className="bg-white text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Logo and company info */}
          <div className="flex flex-col items-start">
            <Link href={`/${lang}`} className="mb-4">
              <Image src={logo || "/placeholder.svg"} alt="Patty Car" width={150} height={40} className="h-10 w-auto" />
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              {dictionary.footer.companyDescription || "Luxury car service with driver since 1998"}
            </p>
            <div className="flex items-center text-sm text-gray-400 mb-2">
              <Phone size={16} className="mr-2" />
              <span>{dictionary.contact?.phoneNumber || "+39 339 418 7813"}</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Mail size={16} className="mr-2" />
              <span>{dictionary.contact?.emailAddress || "pattycar@pattycar.com"}</span>
            </div>
          </div>

          {/* Main links */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-black">{dictionary.footer.mainLinks || "Main Links"}</h3>
            <ul className="space-y-2">
              {mainNavLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    href={`/${lang}${link.href}`}
                    className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-black">{dictionary.footer.legalLinks || "Legal"}</h3>
            <ul className="space-y-2">
              {dictionary.footer.links.map((link: any) => (
                <li key={link.key}>
                  <Link
                    href={`/${lang}${link.href}`}
                    className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact form or additional info */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-black">{dictionary.footer.contactUs || "Contact Us"}</h3>
            <p className="text-sm text-gray-400 mb-4">
              {dictionary.contact?.subtitle || "We are at your disposal for any information."}
            </p>
            <Link
              href={`/${lang}/contact`}
              className="inline-block text-sm px-4 py-2 border border-red-700 text-red-700 hover:bg-red-700 hover:text-gray-300 transition-colors"
            >
              {dictionary.contact?.submitButton || "Send Message"}
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-500">
            © {currentYear} - Patty Car. {dictionary.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  )
}
