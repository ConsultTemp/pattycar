"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, Plane, Train } from "lucide-react"
import { getLocationById, findLocationByCoordinates, type Location } from "@/lib/event-pricing"

interface PlacesAutocompleteProps {
  value: string
  onChange: (address: string, coordinates?: { lat: number; lng: number }, locationId?: string) => void
  placeholder?: string
  className?: string
  error?: boolean
  disabled?: boolean
}

interface GooglePlace {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
  types: string[]
}

interface PlaceDetails {
  geometry: {
    location: {
      lat(): number
      lng(): number
    }
  }
  name: string
  formatted_address: string
  types: string[]
  place_id: string
}

export default function PlacesAutocomplete({
  value,
  onChange,
  placeholder = "Enter location...",
  className = "",
  error = false,
  disabled = false
}: PlacesAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<GooglePlace[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Initialize Google Places service
  const initializeGooglePlaces = useCallback(() => {
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      return {
        autocompleteService: new window.google.maps.places.AutocompleteService(),
        placesService: new window.google.maps.places.PlacesService(
          document.createElement('div')
        )
      }
    }
    return null
  }, [])

  // Search for places using Google Places API
  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    
    try {
      const services = initializeGooglePlaces()
      if (!services) {
        console.warn("Google Places API not available")
        setSuggestions([])
        setIsLoading(false)
        return
      }

      const request = {
        input: query,
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: ['IT'] }, // Restrict to Italy
        fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types']
      }

      services.autocompleteService.getPlacePredictions(request, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          // Filter and prioritize results
          const filteredPredictions = predictions
            .filter(prediction => {
              // Prioritize airports, train stations, and cities
              const types = prediction.types
              return types.includes('airport') || 
                     types.includes('train_station') || 
                     types.includes('locality') ||
                     types.includes('administrative_area_level_1') ||
                     types.includes('administrative_area_level_2') ||
                     types.includes('establishment')
            })
            .slice(0, 8) // Limit to 8 results

          setSuggestions(filteredPredictions)
        } else {
          setSuggestions([])
        }
        setIsLoading(false)
      })
    } catch (error) {
      console.error("Error searching places:", error)
      setSuggestions([])
      setIsLoading(false)
    }
  }, [initializeGooglePlaces])

  // Get place details and coordinates
  const getPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    return new Promise((resolve) => {
      const services = initializeGooglePlaces()
      if (!services) {
        resolve(null)
        return
      }

      const request = {
        placeId: placeId,
        fields: ['geometry', 'name', 'formatted_address', 'types', 'place_id']
      }

      services.placesService.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place as PlaceDetails)
        } else {
          resolve(null)
        }
      })
    })
  }, [initializeGooglePlaces])

  // Map Google Place to our internal location system
  const mapToInternalLocation = useCallback((place: PlaceDetails): { locationId?: string; coordinates: { lat: number; lng: number } } => {
    const coordinates = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    }

    // First try to find by coordinates (with tolerance)
    const coordinateMatch = findLocationByCoordinates(coordinates, 0.05) // 0.05 degree tolerance (~5km)
    if (coordinateMatch) {
      console.log("🎯 COORDINATE MATCH FOUND:", coordinateMatch.id, coordinateMatch.displayName)
      return {
        locationId: coordinateMatch.id,
        coordinates: coordinateMatch.coordinates
      }
    }

    // Try to match by name patterns (for major airports and stations)
    const placeName = place.name.toLowerCase()
    const address = place.formatted_address.toLowerCase()
    
    // Airport matching
    if (place.types.includes('airport')) {
      if (placeName.includes('malpensa') || address.includes('malpensa')) {
        const malpensa = getLocationById('malpensa-airport')
        if (malpensa) return { locationId: 'malpensa-airport', coordinates: malpensa.coordinates }
      }
      if (placeName.includes('linate') || address.includes('linate')) {
        const linate = getLocationById('linate-airport')
        if (linate) return { locationId: 'linate-airport', coordinates: linate.coordinates }
      }
      if (placeName.includes('bergamo') || placeName.includes('orio al serio') || address.includes('bergamo')) {
        const bergamo = getLocationById('bergamo-airport')
        if (bergamo) return { locationId: 'bergamo-airport', coordinates: bergamo.coordinates }
      }
      if (placeName.includes('marco polo') || (placeName.includes('venezia') && place.types.includes('airport'))) {
        const venezia = getLocationById('venezia-airport')
        if (venezia) return { locationId: 'venezia-airport', coordinates: venezia.coordinates }
      }
      if (placeName.includes('treviso') || placeName.includes('canova')) {
        const treviso = getLocationById('treviso-airport')
        if (treviso) return { locationId: 'treviso-airport', coordinates: treviso.coordinates }
      }
    }

    // Train station matching
    if (place.types.includes('train_station') || placeName.includes('stazione') || placeName.includes('centrale')) {
      if ((placeName.includes('milano') && placeName.includes('centrale')) || 
          (address.includes('milano') && placeName.includes('centrale'))) {
        const milanocentrale = getLocationById('milano-centrale')
        if (milanocentrale) return { locationId: 'milano-centrale', coordinates: milanocentrale.coordinates }
      }
      if ((placeName.includes('venezia') && placeName.includes('santa lucia')) || 
          (address.includes('venezia') && placeName.includes('santa lucia'))) {
        const veneziastation = getLocationById('venezia-santa-lucia')
        if (veneziastation) return { locationId: 'venezia-santa-lucia', coordinates: veneziastation.coordinates }
      }
    }

    // City center matching
    if (place.types.includes('locality') || place.types.includes('administrative_area_level_1')) {
      if (placeName.includes('milano') || address.includes('milano')) {
        const milano = getLocationById('milano-center')
        if (milano) {
          // Check if within Milano hinterland (10km from center)
          const distanceFromCenter = Math.sqrt(
            Math.pow(coordinates.lat - milano.coordinates.lat, 2) + 
            Math.pow(coordinates.lng - milano.coordinates.lng, 2)
          ) * 111 // Rough conversion to km
          
          if (distanceFromCenter <= 10) {
            return { locationId: 'milano-center', coordinates: milano.coordinates }
          }
        }
      }

      // Olympic venues
      if (placeName.includes('cortina')) {
        const cortina = getLocationById('cortina')
        if (cortina) return { locationId: 'cortina', coordinates: cortina.coordinates }
      }
      if (placeName.includes('anterselva')) {
        const anterselva = getLocationById('anterselva')
        if (anterselva) return { locationId: 'anterselva', coordinates: anterselva.coordinates }
      }
      if (placeName.includes('predazzo')) {
        const predazzo = getLocationById('predazzo')
        if (predazzo) return { locationId: 'predazzo', coordinates: predazzo.coordinates }
      }
      if (placeName.includes('tesero')) {
        const tesero = getLocationById('tesero')
        if (tesero) return { locationId: 'tesero', coordinates: tesero.coordinates }
      }
      if (placeName.includes('livigno')) {
        const livigno = getLocationById('livigno')
        if (livigno) return { locationId: 'livigno', coordinates: livigno.coordinates }
      }
      if (placeName.includes('bormio')) {
        const bormio = getLocationById('bormio')
        if (bormio) return { locationId: 'bormio', coordinates: bormio.coordinates }
      }
      if (placeName.includes('verona')) {
        const verona = getLocationById('verona')
        if (verona) return { locationId: 'verona', coordinates: verona.coordinates }
      }
    }

    // Return original coordinates if no match found
    console.log("⚠️ NO INTERNAL LOCATION MATCH:", placeName, place.types)
    return { coordinates }
  }, [])

  // Handle place selection
  const handlePlaceSelect = useCallback(async (place: GooglePlace) => {
    setIsOpen(false)
    setIsLoading(true)

    const details = await getPlaceDetails(place.place_id)
    if (details) {
      const { locationId, coordinates } = mapToInternalLocation(details)
      
      console.log("📍 PLACE SELECTED:", {
        address: details.formatted_address,
        coordinates,
        locationId,
        hasServices: locationId ? getLocationById(locationId)?.services : 'none'
      })
      
      onChange(details.formatted_address, coordinates, locationId)
    } else {
      // Fallback to just the description
      onChange(place.description)
    }
    
    setIsLoading(false)
    setSuggestions([])
  }, [getPlaceDetails, mapToInternalLocation, onChange])

  // Handle input change with debounce
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue) // Update parent immediately
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Set new timeout for search
    timeoutRef.current = setTimeout(() => {
      searchPlaces(newValue)
      setIsOpen(true)
    }, 300)
  }, [onChange, searchPlaces])

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (value && suggestions.length > 0) {
      setIsOpen(true)
    }
  }, [value, suggestions.length])

  // Handle input blur (with delay to allow click on suggestions)
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setIsOpen(false)
    }, 150)
  }, [])

  // Get place type icon
  const getPlaceIcon = (types: string[]) => {
    if (types.includes('airport')) return <Plane className="w-4 h-4 text-blue-500" />
    if (types.includes('train_station')) return <Train className="w-4 h-4 text-green-500" />
    return <MapPin className="w-4 h-4 text-gray-500" />
  }

  // Check if place has Meet & Greet services
  const hasServices = (place: GooglePlace): boolean => {
    // Check common service locations by types
    return place.types.includes('airport') || place.types.includes('train_station')
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`${className} ${error ? 'border-red-500' : ''}`}
        disabled={disabled}
      />
      
      {isOpen && (suggestions.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              Searching...
            </div>
          )}
          
          {suggestions.map((place) => (
            <button
              key={place.place_id}
              onClick={() => handlePlaceSelect(place)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getPlaceIcon(place.types)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {place.structured_formatting.main_text}
                    </p>
                    {hasServices(place) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Meet & Greet
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {place.structured_formatting.secondary_text}
                  </p>
                </div>
              </div>
            </button>
          ))}
          
          {!isLoading && suggestions.length === 0 && value.length >= 3 && (
            <div className="px-4 py-3 text-sm text-gray-500">
              No locations found. Try a different search term.
            </div>
          )}
        </div>
      )}
    </div>
  )
}