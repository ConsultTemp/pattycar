"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { MapPin, Plane, Train, Loader2, AlertCircle, Star } from "lucide-react"
import { getAllLocations, getLocationById, getAvailableLocations, type Location } from "@/lib/event-pricing"
import { isOlympicPeriod } from "@/lib/olympic-pricing"
import { useDebounce } from "@/hooks/use-debounce"
import { shouldUseListinoPricing } from "@/lib/locality-mapping"

interface Place {
  place_id: string
  description: string
  main_text: string
  secondary_text: string
  address_components?: any[]
  coordinates?: { lat: number; lng: number }
  extracted_locality?: string | null
  locality_info?: {
    locality: string | null
    administrative_area: string | null
  }
}

interface ListinoLocation {
  id: string
  displayName: string
  type: Location['type']
  services: Location['services']
  coordinates?: { lat: number; lng: number }
}

interface LocationSelectorProps {
  label: string
  value: {
    address: string
    placeId: string
    coordinates?: { lat: number; lng: number }
    locationId?: string
    isCustom?: boolean
  }
  onChange: (value: {
    address: string
    placeId: string
    coordinates?: { lat: number; lng: number }
    locationId?: string
    isCustom?: boolean
  }) => void
  placeholder: string
  customPlaceholder: string
  error?: string
  className?: string
  journeyDate?: Date
  dictionary?: any
}

export function LocationSelector({
  label,
  value,
  onChange,
  placeholder,
  customPlaceholder,
  error,
  className,
  journeyDate,
  dictionary
}: LocationSelectorProps) {
  const [inputValue, setInputValue] = useState(value.address || "")
  const [isOpen, setIsOpen] = useState(false)
  const [googlePlaces, setGooglePlaces] = useState<Place[]>([])
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)
  
  // Simplified refs for better control
  const isSelectingOptionRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastPropValueRef = useRef<string>("")

  // Debounce dell'input per evitare troppe chiamate API
  const debouncedInputValue = useDebounce(inputValue, 500)

  // Get available locations based on journey date
  const locations = getAvailableLocations(journeyDate)
  const isOlympic = journeyDate ? isOlympicPeriod(journeyDate) : false

  // Filter listino locations based on input - IMPROVED SEARCH
  const filteredListinoLocations = locations.filter(location => {
    if (!inputValue || inputValue.length < 1) return false
    
    const searchTerm = inputValue.toLowerCase().trim()
    
    // Search in displayName
    if (location.displayName.toLowerCase().includes(searchTerm)) {
      return true
    }
    
    // Search in name (contains full names like "Aeroporto di Milano Linate")
    if (location.name.toLowerCase().includes(searchTerm)) {
      return true
    }
    
    // Search by type keywords
    const typeKeywords = {
      'airport': ['aeroporto', 'airport', 'aereoporto', 'areoporto'],
      'station': ['stazione', 'station', 'centrale', 'ferroviaria', 'treno'],
      'city': ['città', 'city', 'centro', 'center']
    }
    
    const locationTypeKeywords = typeKeywords[location.type] || []
    if (locationTypeKeywords.some(keyword => searchTerm.includes(keyword))) {
      return true
    }
    
    // Search in specific location keywords
    const locationKeywords: Record<string, string[]> = {
      'linate': ['linate', 'lin'],
      'malpensa': ['malpensa', 'mxp'],
      'orio-al-serio': ['orio', 'bergamo', 'bgy'],
      'milano': ['milano', 'milan', 'duomo'],
      'cortina': ['cortina', 'ampezzo'],
      'venezia': ['venezia', 'venice', 'venecia'],
      'verona': ['verona', 'arena'],
      'livigno': ['livigno'],
      'bormio': ['bormio']
    }
    
    const keywords = locationKeywords[location.id] || []
    if (keywords.some(keyword => searchTerm.includes(keyword) || keyword.includes(searchTerm))) {
      return true
    }
    
    return false
  })

  // Sync input with external value changes - SIMPLIFIED
  useEffect(() => {
    // Only sync if we're not currently selecting an option AND the prop value actually changed
    if (!isSelectingOptionRef.current && value.address !== lastPropValueRef.current) {
      setInputValue(value.address || "")
      lastPropValueRef.current = value.address || ""
    }
  }, [value.address])

  // Search Google Places when input changes - IMPROVED
  useEffect(() => {
    // Don't search if we're selecting an option
    if (isSelectingOptionRef.current) {
      return
    }
    
    if (debouncedInputValue && debouncedInputValue.length >= 3) {
      searchGooglePlaces(debouncedInputValue)
    } else {
      setGooglePlaces([])
      setGoogleError(null)
    }
  }, [debouncedInputValue])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Funzione per cercare su Google Places
  const searchGooglePlaces = useCallback(async (query: string) => {
    if (!query || query.length < 3) return

    setIsLoadingGoogle(true)
    setGoogleError(null)

    try {
      const response = await fetch("/api/places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: query }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || `HTTP ${response.status}`)
      }

      if (data.error) {
        throw new Error(data.details || data.error)
      }

      console.log('🔍 Google Places results:', data.predictions)
      setGooglePlaces(data.predictions || [])
    } catch (error) {
      console.error("Error fetching places:", error)
      setGoogleError(error instanceof Error ? error.message : "Errore nella ricerca")
      setGooglePlaces([])
    } finally {
      setIsLoadingGoogle(false)
    }
  }, [])

  // Handle listino location selection - IMPROVED
  const handleListinoLocationSelect = (location: Location) => {
    console.log('🎯 Selecting listino location:', location.displayName)
    
    // Prevent any interference during selection
    isSelectingOptionRef.current = true
    
    // Update input and parent state
    setInputValue(location.displayName)
    lastPropValueRef.current = location.displayName
    
    onChange({
      address: location.displayName,
      placeId: `location_${location.id}`,
      coordinates: location.coordinates,
      locationId: location.id,
      isCustom: false
    })
    
    // Close dropdown and clear Google results
    setIsOpen(false)
    setGooglePlaces([])
    setGoogleError(null)
    
    // Clear selection flag after a short delay
    setTimeout(() => {
      isSelectingOptionRef.current = false
    }, 200)
  }

  // Handle Google Places selection - IMPROVED
  const handleGooglePlaceSelect = (place: Place) => {
    console.log('🎯 Selecting Google place:', place.description)
    
    // Prevent any interference during selection
    isSelectingOptionRef.current = true
    
    // Check se questo indirizzo Google dovrebbe usare il listino
    const listinoCheck = shouldUseListinoPricing(
      place.extracted_locality || null,
      place.address_components || [],
      place.coordinates || null,
      0.60 // 60% confidence threshold
    )

    console.log('📊 Listino check result:', listinoCheck)

    // Update input
    setInputValue(place.description)
    lastPropValueRef.current = place.description

    if (listinoCheck.useListino && listinoCheck.location) {
      // USA IL LISTINO - location mappata
      console.log('✅ Using listino pricing for:', place.description, '-> mapped to:', listinoCheck.locationId)
      
      onChange({
        address: place.description,
        placeId: place.place_id,
        coordinates: place.coordinates || listinoCheck.location.coordinates,
        locationId: listinoCheck.locationId!,
        isCustom: false
      })
    } else {
      // USA LA DISTANZA - indirizzo custom
      console.log('📏 Using distance calculation for:', place.description)
      
      onChange({
        address: place.description,
        placeId: place.place_id,
        coordinates: place.coordinates,
        locationId: undefined,
        isCustom: true
      })
    }
    
    // Close dropdown and clear results
    setIsOpen(false)
    setGooglePlaces([])
    setGoogleError(null)
    
    // Clear selection flag after a short delay
    setTimeout(() => {
      isSelectingOptionRef.current = false
    }, 200)
  }

  // Handle input change - SIMPLIFIED
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    
    // Don't update if we're currently selecting an option
    if (isSelectingOptionRef.current) {
      return
    }
    
    // Always update input value immediately for responsive UI
    setInputValue(newValue)
    
    // Clear any previous Google error
    setGoogleError(null)

    // Update parent state
    if (!newValue.trim()) {
      // If input is empty, clear the selection
      onChange({
        address: "",
        placeId: "",
        coordinates: undefined,
        locationId: undefined,
        isCustom: true
      })
    } else if (newValue !== value.address) {
      // If input has content and is different from current selection, mark as custom
      onChange({
        address: newValue,
        placeId: "",
        coordinates: undefined,
        locationId: undefined,
        isCustom: true
      })
    }

    // Open dropdown if there's content
    if (newValue.length >= 1) {
      setIsOpen(true)
    } else {
      setGooglePlaces([])
      setIsOpen(false)
    }
  }

  // Handle input focus
  const handleInputFocus = () => {
    if (inputValue.length >= 1) {
      setIsOpen(true)
    }
  }

  // Handle input blur - SIMPLIFIED
  const handleInputBlur = () => {
    // Close dropdown after a short delay to allow for option selection
    setTimeout(() => {
      if (!isSelectingOptionRef.current) {
        setIsOpen(false)
      }
    }, 200)
  }

  // Handle option mousedown - prevent blur
  const handleOptionMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  // Icon for location type
  const getLocationIcon = (type: Location['type']) => {
    switch (type) {
      case 'airport':
        return <Plane className="h-4 w-4" />
      case 'station':
        return <Train className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  // Function to determine if a Google place will use listino pricing (for display)
  const getGooglePlaceListinoInfo = (place: Place) => {
    const listinoCheck = shouldUseListinoPricing(
      place.extracted_locality || null,
      place.address_components || [],
      place.coordinates || null,
      0.60 // Same threshold as selection (60%)
    )
    return listinoCheck
  }

  const hasResults = filteredListinoLocations.length > 0 || googlePlaces.length > 0
  const showNoResults = isOpen && inputValue.length >= 3 && !hasResults && !isLoadingGoogle && !googleError

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <div className={`relative w-full ${className}`} ref={containerRef}>
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className={`pr-10 ${error ? "border-red-500" : ""}`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {isLoadingGoogle ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : googleError ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <MapPin className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Error message */}
        {googleError && <div className="mt-1 text-sm text-red-600">{googleError}</div>}

        {/* Unified dropdown with both listino and Google results */}
        {isOpen && (filteredListinoLocations.length > 0 || googlePlaces.length > 0) && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            
            {/* Listino Locations First - ALWAYS PRIORITIZED */}
            {filteredListinoLocations.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-green-600 bg-green-50 border-b flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {dictionary?.listinoResults || "Destinazioni del listino (prezzi fissi)"}
                </div>
                {filteredListinoLocations.map((location) => (
                  <button
                    key={`listino-${location.id}`}
                    type="button"
                    className="w-full px-4 py-3 text-left hover:bg-green-50 focus:bg-green-50 focus:outline-none border-b border-gray-100"
                    onMouseDown={handleOptionMouseDown}
                    onClick={() => handleListinoLocationSelect(location)}
                  >
                    <div className="flex items-start space-x-3">
                      {getLocationIcon(location.type)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{location.displayName}</div>
                        <div className="flex items-center gap-1 mt-1">
                          {location.services.gpMonza?.enabled && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">GP</span>
                          )}
                          {location.services.olympicVenue?.enabled && isOlympic && (
                            <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-green-500 text-white text-xs rounded">🏔️</span>
                          )}
                          {(location.services.meetGreetArrivals?.enabled || location.services.meetGreetDepartures?.enabled) && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded">M&G</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}

            {/* Google Places Results */}
            {googlePlaces.length > 0 && (
              <>
                {filteredListinoLocations.length > 0 && (
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                    {dictionary?.googleResults || "Altri indirizzi"}
                  </div>
                )}
                {googlePlaces.map((place) => {
                  const listinoInfo = getGooglePlaceListinoInfo(place)
                  const willUseListino = listinoInfo.useListino
                  const isGeographical = listinoInfo.matchType === 'geographical'
                  
                  return (
                    <button
                      key={`google-${place.place_id}`}
                      type="button"
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0`}
                      onMouseDown={handleOptionMouseDown}
                      onClick={() => handleGooglePlaceSelect(place)}
                    >
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{place.main_text}</div>
                          {place.secondary_text && <div className="text-xs text-gray-500 truncate">{place.secondary_text}</div>}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </>
            )}
          </div>
        )}

        {/* No results message */}
        {showNoResults && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500 text-sm">
            {dictionary?.noResultsFound || "Nessun risultato trovato"}
          </div>
        )}
      </div>

      {/* Help text */}
      <p className="text-xs text-gray-500">
        Start typing to search for a location...
      </p>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
} 