import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    

    const { origins, destinations } = body

    if (!origins || !destinations) {
      return NextResponse.json({ error: "Origins and destinations are required" }, { status: 400 })
    }

    if (Array.isArray(origins) && origins.length === 0) {
      return NextResponse.json({ error: "Origins array cannot be empty" }, { status: 400 })
    }

    if (Array.isArray(destinations) && destinations.length === 0) {
      return NextResponse.json({ error: "Destinations array cannot be empty" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Gestisci sia array che stringhe singole
    const originsStr = Array.isArray(origins) ? origins.join("|") : origins
    const destinationsStr = Array.isArray(destinations) ? destinations.join("|") : destinations

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(originsStr)}&destinations=${encodeURIComponent(destinationsStr)}&key=${apiKey}&language=en&units=metric`

    

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: "Distance Matrix API HTTP error", details: response.statusText },
        { status: 500 },
      )
    }

    const data = await response.json()
    

    if (data.status !== "OK") {
      return NextResponse.json(
        { error: "Distance Matrix API error", details: data.error_message || data.status },
        { status: 500 },
      )
    }

    // Estrai il primo risultato
    const element = data.rows?.[0]?.elements?.[0]
    

    if (!element) {
      return NextResponse.json({ error: "No route data found" }, { status: 400 })
    }

    if (element.status !== "OK") {
      return NextResponse.json({ error: "Route calculation failed", details: element.status }, { status: 400 })
    }

    const distanceKm = Math.round((element.distance.value / 1000) * 100) / 100
    const durationText = element.duration.text
    const distanceText = element.distance.text

    const result = {
      distance: {
        km: distanceKm,
        text: distanceText,
        duration: durationText,
      },
    }

    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
