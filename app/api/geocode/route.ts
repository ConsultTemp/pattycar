import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address } = body

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      console.error("GOOGLE_API_KEY not found in environment variables")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=it&region=IT`

    const response = await fetch(url)

    if (!response.ok) {
      console.error(`Google Geocoding API HTTP error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: "Geocoding API HTTP error", details: response.statusText },
        { status: 500 }
      )
    }

    const data = await response.json()

    if (data.status !== "OK") {
      console.error("Google Geocoding API error:", data.status, data.error_message)
      return NextResponse.json(
        { error: "Geocoding API error", details: data.error_message || data.status },
        { status: 500 }
      )
    }

    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ error: "No results found" }, { status: 404 })
    }

    const location = data.results[0].geometry.location
    
    return NextResponse.json({
      coordinates: {
        lat: location.lat,
        lng: location.lng
      },
      formattedAddress: data.results[0].formatted_address
    })
  } catch (error) {
    console.error("Error in geocode API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
} 