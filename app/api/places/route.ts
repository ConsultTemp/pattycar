import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { input } = body

    if (!input || input.length < 3) {
      return NextResponse.json({ predictions: [] })
    }

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      console.error("GOOGLE_API_KEY not found in environment variables")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Usa la nuova Places API - Autocomplete endpoint
    const url = "https://places.googleapis.com/v1/places:autocomplete"

    console.log("=== CALLING GOOGLE PLACES API ===")
    console.log("URL:", url)
    console.log("Input:", input)

    // Richiesta semplificata per evitare parametri non supportati
    const requestBody = {
      input: input,
      languageCode: "it",
      regionCode: "IT"
    }

    console.log("Request body:", JSON.stringify(requestBody, null, 2))

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat"
      },
      body: JSON.stringify(requestBody),
    })

    console.log("=== RESPONSE STATUS ===")
    console.log("Status:", response.status, response.statusText)
    console.log("Headers:", Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log("=== RAW RESPONSE ===")
    console.log(responseText)

    if (!response.ok) {
      console.error("=== API ERROR ===")
      console.error(`Status: ${response.status} ${response.statusText}`)
      console.error("Response:", responseText)
      
      return NextResponse.json({ 
        error: "Places API error", 
        details: `${response.status}: ${response.statusText}`,
        apiResponse: responseText
      }, { status: response.status })
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("=== JSON PARSE ERROR ===")
      console.error("Parse error:", parseError)
      console.error("Raw response:", responseText)
      return NextResponse.json({ 
        error: "Invalid JSON response from Places API",
        details: responseText
      }, { status: 500 })
    }

    console.log("=== PARSED RESPONSE ===")
    console.log(JSON.stringify(data, null, 2))

    // Trasforma i risultati nel formato atteso
    const predictions = data.suggestions
      ?.filter((suggestion: any) => suggestion.placePrediction)
      .map((suggestion: any) => {
        const place = suggestion.placePrediction
        return {
          place_id: place.placeId,
          description: place.text?.text || "",
          main_text: place.structuredFormat?.mainText?.text || place.text?.text || "",
          secondary_text: place.structuredFormat?.secondaryText?.text || "",
        }
      }) || []

    console.log("=== FINAL PREDICTIONS ===")
    console.log(`Found ${predictions.length} predictions:`)
    predictions.forEach((p: any, i: number) => {
      console.log(`${i + 1}. ${p.description}`)
    })

    return NextResponse.json({ predictions })
  } catch (error) {
    console.error("=== GENERAL ERROR ===")
    console.error("Error in places API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}