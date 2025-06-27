import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/on-location/", "/_next/", "/private/"],
    },
    sitemap: "https://pattycar.com/sitemap.xml",
    host: "https://pattycar.com",
  }
}

