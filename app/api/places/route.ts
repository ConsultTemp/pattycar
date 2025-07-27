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
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Usa la nuova Places API - Autocomplete endpoint
    const autocompleteUrl = "https://places.googleapis.com/v1/places:autocomplete"

    const requestBody = {
      input: input,
      languageCode: "it",
      regionCode: "IT"
    }

    

    const autocompleteResponse = await fetch(autocompleteUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types"
      },
      body: JSON.stringify(requestBody),
    })

    const autocompleteText = await autocompleteResponse.text()
    if (!autocompleteResponse.ok) {
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
      return NextResponse.json({ 
        error: "Invalid JSON response from Places API",
        details: autocompleteText
      }, { status: 500 })
    }

    

    // Trasforma i risultati nel formato atteso e ottieni dettagli per ogni luogo
    const predictions = []
    const suggestions = autocompleteData.suggestions?.filter((suggestion: any) => suggestion.placePrediction) || []

    for (const suggestion of suggestions) {
      const place = suggestion.placePrediction
      
      // Ottieni dettagli del luogo per avere address_components
      let addressComponents = []
      let coordinates = null
      
      try {
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
          
          
          addressComponents = detailsData.addressComponents || []
          coordinates = detailsData.location ? {
            lat: detailsData.location.latitude,
            lng: detailsData.location.longitude
          } : null
        } else {
          }
      } catch (detailError) {
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
        },
        types: place.types || []
      })
    }


    return NextResponse.json({ predictions })
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