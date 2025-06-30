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
    const autocompleteUrl = "https://places.googleapis.com/v1/places:autocomplete"

    console.log("=== CALLING GOOGLE PLACES AUTOCOMPLETE API ===")
    console.log("URL:", autocompleteUrl)
    console.log("Input:", input)

    const requestBody = {
      input: input,
      languageCode: "it",
      regionCode: "IT"
    }

    console.log("Request body:", JSON.stringify(requestBody, null, 2))

    const autocompleteResponse = await fetch(autocompleteUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat"
      },
      body: JSON.stringify(requestBody),
    })

    console.log("=== AUTOCOMPLETE RESPONSE STATUS ===")
    console.log("Status:", autocompleteResponse.status, autocompleteResponse.statusText)

    const autocompleteText = await autocompleteResponse.text()
    console.log("=== RAW AUTOCOMPLETE RESPONSE ===")
    console.log(autocompleteText)

    if (!autocompleteResponse.ok) {
      console.error("=== AUTOCOMPLETE API ERROR ===")
      console.error(`Status: ${autocompleteResponse.status} ${autocompleteResponse.statusText}`)
      console.error("Response:", autocompleteText)
      
      return NextResponse.json({ 
        error: "Places API error", 
        details: `${autocompleteResponse.status}: ${autocompleteResponse.statusText}`,
        apiResponse: autocompleteText
      }, { status: autocompleteResponse.status })
    }

    let autocompleteData
    try {
      autocompleteData = JSON.parse(autocompleteText)
    } catch (parseError) {
      console.error("=== JSON PARSE ERROR ===")
      console.error("Parse error:", parseError)
      console.error("Raw response:", autocompleteText)
      return NextResponse.json({ 
        error: "Invalid JSON response from Places API",
        details: autocompleteText
      }, { status: 500 })
    }

    console.log("=== PARSED AUTOCOMPLETE RESPONSE ===")
    console.log(JSON.stringify(autocompleteData, null, 2))

    // Trasforma i risultati nel formato atteso e ottieni dettagli per ogni luogo
    const predictions = []
    const suggestions = autocompleteData.suggestions?.filter((suggestion: any) => suggestion.placePrediction) || []

    console.log(`=== PROCESSING ${suggestions.length} SUGGESTIONS ===`)

    for (const suggestion of suggestions) {
      const place = suggestion.placePrediction
      
      // Ottieni dettagli del luogo per avere address_components
      let addressComponents = []
      let coordinates = null
      
      try {
        console.log(`Getting details for place ID: ${place.placeId}`)
        
        const detailsUrl = `https://places.googleapis.com/v1/places/${place.placeId}`
        const detailsResponse = await fetch(detailsUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "addressComponents,location"
          }
        })

        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json()
          console.log(`Details for ${place.placeId}:`, JSON.stringify(detailsData, null, 2))
          
          addressComponents = detailsData.addressComponents || []
          coordinates = detailsData.location ? {
            lat: detailsData.location.latitude,
            lng: detailsData.location.longitude
          } : null
        } else {
          console.warn(`Failed to get details for ${place.placeId}: ${detailsResponse.status}`)
        }
      } catch (detailError) {
        console.warn(`Error getting details for ${place.placeId}:`, detailError)
      }

      // Estrai località dal address_components
      let locality = null
      let administrativeArea = null
      
      for (const component of addressComponents) {
        if (component.types?.includes('locality')) {
          locality = component.longText
        } else if (component.types?.includes('administrative_area_level_3')) {
          administrativeArea = component.longText
        } else if (component.types?.includes('administrative_area_level_2') && !locality && !administrativeArea) {
          administrativeArea = component.longText
        }
      }

      const extractedLocality = locality || administrativeArea

      predictions.push({
        place_id: place.placeId,
        description: place.text?.text || "",
        main_text: place.structuredFormat?.mainText?.text || place.text?.text || "",
        secondary_text: place.structuredFormat?.secondaryText?.text || "",
        address_components: addressComponents,
        coordinates: coordinates,
        extracted_locality: extractedLocality,
        locality_info: {
          locality: locality,
          administrative_area: administrativeArea
        }
      })
    }

    console.log("=== FINAL PREDICTIONS WITH LOCALITIES ===")
    console.log(`Found ${predictions.length} predictions:`)
    predictions.forEach((p: any, i: number) => {
      console.log(`${i + 1}. ${p.description} (Locality: ${p.extracted_locality})`)
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