"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { MapPin, Plane, Train, Loader2, AlertCircle, Star } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { matchGooglePlaceToService, hasMeetGreetService, type LocationMatchResult } from "@/lib/location-matching-corrected"

// EU Countries - ISO 3166-1 alpha-2 country codes
const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
])

// Function to check if a Google Place is in the EU
function isGooglePlaceInEU(place: Place): boolean {
  // First check for non-EU keywords in the description (failsafe)
  const nonEUKeywords = [
    'switzerland', 'svizzera', 'schweiz', 'suisse', 'suiza',
    'united kingdom', 'uk', 'regno unito', 'great britain',
    'norway', 'norvegia', 'norge',
    'serbia', 'albania', 'bosnia', 'kosovo', 'montenegro',
    'russia', 'ukraine', 'belarus', 'moldova',
    'turkey', 'turchia', 'türkiye'
  ]
  
  const description = place.description.toLowerCase()
  for (const keyword of nonEUKeywords) {
    if (description.includes(keyword)) {
      console.log(`🚫 Non-EU keyword found in description: ${place.description} -> ${keyword}`)
      return false
    }
  }
  
  // If no address components, ACCEPT by default (assume EU)
  if (!place.address_components || place.address_components.length === 0) {
    console.log('✅ No address components, accepting by default:', place.description)
    return true
  }
  
  // Look for country component
  for (const component of place.address_components) {
    if (component.types?.includes('country')) {
      const countryCode = component.short_name || component.long_name
      
      // Make sure countryCode is defined before using it
      if (!countryCode) {
        console.log('✅ Country component has no name, accepting by default:', component)
        continue
      }
      
      const isEU = EU_COUNTRIES.has(countryCode.toUpperCase())
      
      console.log(`🌍 Country check: ${place.description} -> ${countryCode} -> ${isEU ? 'EU ✅' : 'NON-EU 🚫'}`)
      return isEU
    }
  }
  
  // No country component found, ACCEPT by default (assume EU)
  console.log('✅ No country component, accepting by default:', place.description)
  return true
}

interface Place {
  place_id: string
  description: string
  main_text: string
  secondary_text: string
  address_components?: any[]
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

export function LocationSelectorCorrected({
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
  
  // Refs for better control
  const isSelectingOptionRef = useRef(false)
  const isTypingRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastPropValueRef = useRef<string>(value.address || "")
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounce dell'input per Google Places API
  const debouncedInputValue = useDebounce(inputValue, 500)
  
  // Debounce per aggiornamenti al parent - più lungo per evitare interferenze
  const debouncedInputForParent = useDebounce(inputValue, 800)

  // Sync input ONLY when prop changes from external source (not from our own updates)
  useEffect(() => {
    const newPropValue = value.address || ""
    
    // Only sync if:
    // 1. We're not currently typing
    // 2. We're not selecting an option
    // 3. The prop value actually changed from what we last knew
    // 4. The current input value is different from the new prop value
    if (!isTypingRef.current && 
        !isSelectingOptionRef.current && 
        newPropValue !== lastPropValueRef.current &&
        inputValue !== newPropValue) {
      
      console.log('🔄 Syncing input with prop value:', newPropValue)
      setInputValue(newPropValue)
    }
    
    lastPropValueRef.current = newPropValue
  }, [value.address, inputValue])

  // Update parent with debounced input (only when user stops typing)
  useEffect(() => {
    // Don't update parent if we're selecting an option or typing
    if (isSelectingOptionRef.current || isTypingRef.current) {
      return
    }
    
    // Don't update if the debounced value is the same as current parent value
    if (debouncedInputForParent === value.address) {
      return
    }
    
    // CRITICAL: Don't update if we have a valid selection (locationId or placeId)
    // This prevents overwriting a valid selection with a "custom" one
    if (value.locationId || (value.placeId && value.placeId !== "")) {
      return
    }
    
    console.log('📤 Updating parent with debounced value:', debouncedInputForParent)
    
    if (!debouncedInputForParent.trim()) {
      // If input is empty, clear the selection
      onChange({
        address: "",
        placeId: "",
        coordinates: undefined,
        locationId: undefined,
        isCustom: true
      })
    } else {
      // If input has content, mark as custom (will be updated if they select an option)
      onChange({
        address: debouncedInputForParent,
        placeId: "",
        coordinates: undefined,
        locationId: undefined,
        isCustom: true
      })
    }
  }, [debouncedInputForParent, onChange, value.address, value.locationId, value.placeId])

  // Search Google Places when input changes
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
        // When clicking outside, mark as not typing
        isTypingRef.current = false
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = null
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
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
      
      // Filter out non-EU locations silently
      const euResults = (data.predictions || []).filter((place: Place) => isGooglePlaceInEU(place))
      
      console.log('✅ EU filtered results:', euResults.length, 'out of', (data.predictions || []).length)
      setGooglePlaces(euResults)
    } catch (error) {
      console.error("Error fetching places:", error)
      setGoogleError(error instanceof Error ? error.message : "Errore nella ricerca")
      setGooglePlaces([])
    } finally {
      setIsLoadingGoogle(false)
    }
  }, [])

  // Handle Google Places selection - NUOVA LOGICA CORRETTA
  const handleGooglePlaceSelect = (place: Place) => {
    console.log('🎯 Selecting Google place:', place.description)
    
    // Prevent any interference during selection
    isSelectingOptionRef.current = true
    isTypingRef.current = false
    
    // Clear any typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    
    // NUOVO: Usa il sistema di matching corretto
    const matchResult = matchGooglePlaceToService({
      place_id: place.place_id,
      description: place.description,
      main_text: place.main_text,
      secondary_text: place.secondary_text,
      coordinates: place.coordinates
    })

    // Update input immediately
    setInputValue(place.description)
    lastPropValueRef.current = place.description

    if (matchResult.hasSpecialServices && matchResult.locationId) {
      // Location con servizi speciali (Meet & Greet, Olympic pricing, ecc.)
      console.log('✅ Using special services for:', place.description, '-> mapped to:', matchResult.locationId)
      
      onChange({
        address: place.description,
        placeId: place.place_id,
        coordinates: matchResult.coordinates || place.coordinates,
        locationId: matchResult.locationId,
        isCustom: false
      })
    } else {
      // Location custom - usa calcolo distanza standard
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
    }, 100)
  }

  // Handle input change - COMPLETELY LOCAL NOW
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    
    // Don't update if we're currently selecting an option
    if (isSelectingOptionRef.current) {
      return
    }
    
    // Mark as typing and clear any previous typing timeout
    isTypingRef.current = true
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set timeout to mark as not typing after user stops
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
      typingTimeoutRef.current = null
    }, 1000) // 1 second after stopping typing
    
    // Always update input value immediately for responsive UI
    setInputValue(newValue)
    
    // Clear any previous Google error
    setGoogleError(null)

    // If user is typing and we had a valid selection, clear it immediately
    // (This prevents keeping old selections when user starts typing new text)
    if (newValue !== value.address && (value.locationId || value.placeId)) {
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

  // Handle input blur
  const handleInputBlur = () => {
    // Mark as not typing when losing focus
    isTypingRef.current = false
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    
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

  // Icon for location type based on special services
  const getLocationIcon = (place: Place) => {
    const matchResult = matchGooglePlaceToService({
      place_id: place.place_id,
      description: place.description,
      main_text: place.main_text,
      secondary_text: place.secondary_text,
      coordinates: place.coordinates
    })

    if (matchResult.hasSpecialServices) {
      if (matchResult.services.meetGreetArrivals || matchResult.services.meetGreetDepartures) {
        // Airport or train station with Meet & Greet
        if (place.description.toLowerCase().includes('airport') || 
            place.description.toLowerCase().includes('aeroporto')) {
          return <Plane className="h-4 w-4 text-blue-600" />
        } else {
          return <Train className="h-4 w-4 text-green-600" />
        }
      } else if (matchResult.services.olympicTransfers) {
        // Olympic venue
        return <Star className="h-4 w-4 text-gold-600" />
      }
    }
    
    return <MapPin className="h-4 w-4 text-gray-400" />
  }

  // Show special services info
  const getSpecialServicesInfo = (place: Place) => {
    const matchResult = matchGooglePlaceToService({
      place_id: place.place_id,
      description: place.description,
      main_text: place.main_text,
      secondary_text: place.secondary_text,
      coordinates: place.coordinates
    })

    if (!matchResult.hasSpecialServices) return null

    const services: string[] = []
    
    if (matchResult.services.meetGreetArrivals || matchResult.services.meetGreetDepartures) {
      services.push('Meet & Greet')
    }
    
    if (matchResult.services.olympicTransfers) {
      services.push('Olympic Pricing')
    }
    
    if (matchResult.services.specialPricing) {
      services.push('Special Rates')
    }

    return services.length > 0 ? (
      <div className="text-xs text-blue-600 mt-1">
        {services.join(' • ')}
      </div>
    ) : null
  }

  const hasResults = googlePlaces.length > 0
  const showNoResults = isOpen && inputValue.length >= 3 && !hasResults && !isLoadingGoogle && !googleError

  return (
    <div className="space-y-2">
      <Label htmlFor={label} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      
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

        {/* Messaggio di errore */}
        {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
        {googleError && <div className="mt-1 text-sm text-orange-600">⚠️ {googleError}</div>}

        {/* Dropdown con i risultati Google Places */}
        {isOpen && googlePlaces.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {googlePlaces.map((place) => (
              <button
                key={place.place_id}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                onMouseDown={handleOptionMouseDown}
                onClick={() => handleGooglePlaceSelect(place)}
              >
                <div className="flex items-start space-x-3">
                  {getLocationIcon(place)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{place.main_text}</div>
                    {place.secondary_text && <div className="text-xs text-gray-500 truncate">{place.secondary_text}</div>}
                    {getSpecialServicesInfo(place)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Messaggio quando non ci sono risultati */}
        {showNoResults && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500 text-sm">
            Nessun indirizzo trovato
          </div>
        )}
      </div>
    </div>
  )
}