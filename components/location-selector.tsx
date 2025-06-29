"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { MapPin, Plane, Train, Loader2, AlertCircle } from "lucide-react"
import { getAllLocations, getLocationById, getAvailableLocations, type Location } from "@/lib/event-pricing"
import { isOlympicPeriod } from "@/lib/olympic-pricing"
import { useDebounce } from "@/hooks/use-debounce"

interface Place {
  place_id: string
  description: string
  main_text: string
  secondary_text: string
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
  
  // Ref per prevenire la chiusura quando si clicca su un'opzione
  const isSelectingRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastSelectedValueRef = useRef<string>("")

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

  // Effetto per cercare su Google quando cambia l'input con debounce
  useEffect(() => {
    // Non cercare se stiamo selezionando un'opzione
    if (isSelectingRef.current) {
      return
    }
    
    // Non cercare se il valore è quello che abbiamo appena selezionato
    if (debouncedInputValue === lastSelectedValueRef.current) {
      return
    }
    
    if (debouncedInputValue && debouncedInputValue.length >= 3) {
      searchGooglePlaces(debouncedInputValue)
    } else {
      setGooglePlaces([])
      setGoogleError(null)
    }
  }, [debouncedInputValue])

  // Effetto per gestire i click fuori dal componente
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

      setGooglePlaces(data.predictions || [])
    } catch (error) {
      console.error("Error fetching places:", error)
      setGoogleError(error instanceof Error ? error.message : "Errore nella ricerca")
      setGooglePlaces([])
    } finally {
      setIsLoadingGoogle(false)
    }
  }, [])

  // Handle listino location selection
  const handleListinoLocationSelect = (location: Location) => {
    isSelectingRef.current = true
    lastSelectedValueRef.current = location.displayName
    
    setInputValue(location.displayName)
        onChange({
          address: location.displayName,
          placeId: `location_${location.id}`,
          coordinates: location.coordinates,
          locationId: location.id,
          isCustom: false
        })
    setIsOpen(false)
    
    setTimeout(() => {
      isSelectingRef.current = false
    }, 300)
  }

  // Handle Google Places selection
  const handleGooglePlaceSelect = (place: Place) => {
    isSelectingRef.current = true
    lastSelectedValueRef.current = place.description
    
    setInputValue(place.description)
    onChange({
      address: place.description,
      placeId: place.place_id,
      coordinates: undefined, // Will be geocoded later
      locationId: undefined,
      isCustom: true
    })
    setIsOpen(false)
    setGooglePlaces([])
    setGoogleError(null)
    setIsLoadingGoogle(false)
    
    setTimeout(() => {
      isSelectingRef.current = false
    }, 300)
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    
    if (!isSelectingRef.current) {
      if (newValue !== lastSelectedValueRef.current) {
        lastSelectedValueRef.current = ""
      }
      
      setInputValue(newValue)
      onChange({
        address: newValue,
        placeId: "",
        coordinates: undefined,
        locationId: undefined,
        isCustom: true
      })
      setGoogleError(null)

      if (newValue.length >= 1) {
        setIsOpen(true)
      } else {
        setGooglePlaces([])
        setIsOpen(false)
      }
    }
  }

  // Handle input focus
  const handleInputFocus = () => {
    if (inputValue.length >= 1) {
      setIsOpen(true)
    }
  }

  // Handle input blur
  const handleInputBlur = () => {
    if (!isSelectingRef.current) {
      setTimeout(() => {
        if (!isSelectingRef.current) {
          setIsOpen(false)
        }
      }, 150)
    }
  }

  // Handle option mousedown
  const handleOptionMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isSelectingRef.current = true
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

  // Sync with external changes
  useEffect(() => {
    setInputValue(value.address || "")
  }, [value.address])

  const hasResults = filteredListinoLocations.length > 0 || googlePlaces.length > 0
  const showNoResults = isOpen && inputValue.length >= 3 && !hasResults && !isLoadingGoogle && !googleError

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <div className={`relative w-full ${className}`} ref={containerRef}>
        <div className="relative">
          <Input
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
            
            {/* Listino Locations First */}
            {filteredListinoLocations.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                  {dictionary?.listinoResults || "Destinazioni del listino"}
                </div>
                {filteredListinoLocations.map((location) => (
                  <button
                    key={`listino-${location.id}`}
                    type="button"
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100"
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
                {googlePlaces.map((place) => (
                  <button
                    key={`google-${place.place_id}`}
                    type="button"
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
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
                  ))}
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
        {dictionary?.unifiedSearchHelp || "Cerca tra le nostre destinazioni o inserisci un indirizzo personalizzato"}
      </p>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
} 