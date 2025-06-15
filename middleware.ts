import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { i18n } from "@/i18n-config"
import Negotiator from "negotiator"

function getLocale(request: NextRequest): string {
  // Negotiator expects plain object so we need to transform headers
  const negotiatorHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value))

  // Use negotiator and intl-localematcher to get best locale
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages()
  // @ts-ignore locales are readonly
  const locales: string[] = i18n.locales
  return "en"
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Extract the locale from the pathname if it exists
  const pathnameHasLocale = i18n.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )

  // Check if the locale in the pathname is valid
  const localeInPathname = pathname.split("/")[1]
  const isValidLocale = i18n.locales.includes(localeInPathname as any)

  // If pathname has no locale or has an invalid locale, redirect
  if (!pathnameHasLocale || !isValidLocale) {
    const locale = getLocale(request)

    // For paths without locale or with invalid locale, redirect to the correct locale
    let redirectPath = pathname
    if (pathnameHasLocale && !isValidLocale) {
      // If there's an invalid locale, remove it from the path
      redirectPath = pathname.replace(`/${localeInPathname}`, "")
    }

    // Construct the new URL with the correct locale
    return NextResponse.redirect(
      new URL(`/${locale}${redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`}`, request.url),
    )
  }

  // For valid locales, proceed with the request
  const response = NextResponse.next()

  // Add cache headers for static assets
  if (pathname.includes("/images/") || pathname.includes("/fonts/") || pathname.includes("/_next/static/")) {
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable")
  }

  // Add cache headers for HTML pages
  if (pathname.endsWith("/") || pathname.endsWith(".html")) {
    response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400")
  }

  return response
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
