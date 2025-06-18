import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("=== DISTANCE API CALLED ===")

  try {
    const body = await request.json()
    console.log("Request body received:", JSON.stringify(body, null, 2))

    const { origins, destinations } = body

    console.log("Extracted origins:", origins)
    console.log("Extracted destinations:", destinations)

    if (!origins || !destinations) {
      console.log("❌ Missing origins or destinations")
      return NextResponse.json({ error: "Origins and destinations are required" }, { status: 400 })
    }

    if (Array.isArray(origins) && origins.length === 0) {
      console.log("❌ Origins array is empty")
      return NextResponse.json({ error: "Origins array cannot be empty" }, { status: 400 })
    }

    if (Array.isArray(destinations) && destinations.length === 0) {
      console.log("❌ Destinations array is empty")
      return NextResponse.json({ error: "Destinations array cannot be empty" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      console.error("❌ GOOGLE_API_KEY not found in environment variables")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    console.log("✅ API key found")

    // Gestisci sia array che stringhe singole
    const originsStr = Array.isArray(origins) ? origins.join("|") : origins
    const destinationsStr = Array.isArray(destinations) ? destinations.join("|") : destinations

    console.log("Origins string:", originsStr)
    console.log("Destinations string:", destinationsStr)

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(originsStr)}&destinations=${encodeURIComponent(destinationsStr)}&key=${apiKey}&language=it&units=metric&avoid=tolls`

    console.log("🌐 Calling Google Distance Matrix API")
    console.log("URL (without key):", url.replace(apiKey, "***"))

    const response = await fetch(url)

    console.log("📡 Response status:", response.status)
    console.log("📡 Response ok:", response.ok)

    if (!response.ok) {
      console.error(`❌ Google Distance Matrix API HTTP error: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error("Error response:", errorText)
      return NextResponse.json(
        { error: "Distance Matrix API HTTP error", details: response.statusText },
        { status: 500 },
      )
    }

    const data = await response.json()
    console.log("📊 Google Distance Matrix API full response:", JSON.stringify(data, null, 2))

    if (data.status !== "OK") {
      console.error("❌ Google Distance Matrix API error:", data.status, data.error_message)
      return NextResponse.json(
        { error: "Distance Matrix API error", details: data.error_message || data.status },
        { status: 500 },
      )
    }

    console.log("✅ API response status OK")

    // Estrai il primo risultato
    const element = data.rows?.[0]?.elements?.[0]
    console.log("📍 First element:", JSON.stringify(element, null, 2))

    if (!element) {
      console.error("❌ No element found in response")
      return NextResponse.json({ error: "No route data found" }, { status: 400 })
    }

    if (element.status !== "OK") {
      console.error("❌ Element status not OK:", element.status)
      return NextResponse.json({ error: "Route calculation failed", details: element.status }, { status: 400 })
    }

    const distanceKm = Math.round((element.distance.value / 1000) * 100) / 100
    const durationText = element.duration.text
    const distanceText = element.distance.text

    console.log(`✅ Calculated - Distance: ${distanceKm}km, Duration: ${durationText}`)

    const result = {
      distance: {
        km: distanceKm,
        text: distanceText,
        duration: durationText,
      },
    }

    console.log("📤 Returning result:", JSON.stringify(result, null, 2))
    console.log("=== DISTANCE API SUCCESS ===")

    return NextResponse.json(result)
  } catch (error) {
    console.error("💥 Error in distance API:", error)
    console.error("💥 Error stack:", error instanceof Error ? error.stack : "No stack")
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
