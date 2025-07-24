"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { MapPin, Plane, Train, Loader2, AlertCircle, Star } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
// import { matchGooglePlaceToService, hasMeetGreetService, hasOlympicPricing, type LocationMatchResult } from "@/lib/location-matching-corrected"

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

  // Check address components for country code
  for (const component of place.address_components) {
    if (component.types.includes('country')) {
      const countryCode = component.short_name
      const isEU = EU_COUNTRIES.has(countryCode)
      console.log(`🏳️ Country found: ${component.long_name} (${countryCode}) -> EU: ${isEU}`)
      return isEU
    }
  }
  
  // If no country found in address components, accept by default
  console.log('✅ No country found in address components, accepting by default:', place.description)
  return true
}

// Place interface from Google Places API
interface Place {
  place_id: string
  description: string
  matched_substrings?: Array<{ offset: number; length: number }>
  structured_formatting?: {
    main_text: string
    secondary_text: string
  }
  address_components: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
  coordinates?: { lat: number; lng: number }
}

interface LocationSelectorProps {
  label?: string
  value?: {
    address: string
    placeId: string | null
    coordinates: { lat: number; lng: number } | null
    locationId?: string
    isCustom: boolean
  }
  onLocationSelect: (location: {
    address: string
    placeId: string | null
    coordinates: { lat: number; lng: number } | null
    locationId?: string
    isCustom: boolean
  }) => void
  placeholder?: string
  customPlaceholder?: string
  error?: string
  className?: string
  journeyDate?: Date
  dictionary?: any
}

export function LocationSelector({
  label,
  value = { address: "", placeId: null, coordinates: null, locationId: undefined, isCustom: false },
  onLocationSelect,
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

  // Sync with external value changes but avoid interference during user typing
  useEffect(() => {
    const newAddress = value.address || ""
    
    // Only update if:
    // 1. We're not currently selecting an option
    // 2. We're not actively typing
    // 3. The prop value actually changed from what we remember
    if (!isSelectingOptionRef.current && 
        !isTypingRef.current && 
        newAddress !== lastPropValueRef.current) {
      console.log('📥 Syncing with external value change:', lastPropValueRef.current, '->', newAddress)
      setInputValue(newAddress)
      lastPropValueRef.current = newAddress
    }
  }, [value.address])

  // Notify parent of manual typing (delayed to avoid conflicts)
  useEffect(() => {
    if (isTypingRef.current && 
        !isSelectingOptionRef.current && 
        debouncedInputForParent !== lastPropValueRef.current) {
      
      console.log('⌨️ Notifying parent of manual typing:', debouncedInputForParent)
      
      // Update with basic custom location data
      onLocationSelect({
        address: debouncedInputForParent,
        placeId: null,
        coordinates: null,
        locationId: undefined,
        isCustom: true
      })
      
      lastPropValueRef.current = debouncedInputForParent
    }
  }, [debouncedInputForParent, onLocationSelect])

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    console.log('✏️ Input change:', newValue)
    
    // Mark as typing and clear selection flag
    isTypingRef.current = true
    isSelectingOptionRef.current = false
    
    // Clear any existing typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set timeout to clear typing flag
    typingTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Typing timeout reached')
      isTypingRef.current = false
    }, 1000)
    
    setInputValue(newValue)
    
    if (newValue.length > 0) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
      setGooglePlaces([])
      setGoogleError(null)
    }
  }, [])

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    console.log('🎯 Input focused')
    if (inputValue.length > 0) {
      setIsOpen(true)
    }
  }, [inputValue])

  // Handle input blur with delay
  const handleInputBlur = useCallback(() => {
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        console.log('👋 Input blurred - closing dropdown')
        setIsOpen(false)
      }
    }, 200)
  }, [])

  // Google Places API search
  useEffect(() => {
    const searchGooglePlaces = async (query: string) => {
      if (query.length < 3) return

      console.log('🔍 Searching Google Places for:', query)
      setIsLoadingGoogle(true)
      setGoogleError(null)

      try {
        const response = await fetch('/api/places', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input: query })
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        console.log('📍 Google Places API response:', data)

        if (data.predictions && Array.isArray(data.predictions)) {
          // Filter for EU locations only
          const euPlaces = data.predictions.filter((place: Place) => isGooglePlaceInEU(place))
          console.log(`🇪🇺 Filtered ${data.predictions.length} → ${euPlaces.length} EU places`)
          setGooglePlaces(euPlaces)
        } else {
          console.warn('⚠️ Invalid Google Places response structure:', data)
          setGooglePlaces([])
        }
      } catch (error) {
        console.error('❌ Google Places API error:', error)
        setGoogleError(`Errore nella ricerca: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
        setGooglePlaces([])
      } finally {
        setIsLoadingGoogle(false)
      }
    }

    if (debouncedInputValue && !isSelectingOptionRef.current) {
      searchGooglePlaces(debouncedInputValue)
    } else {
      setGooglePlaces([])
      setGoogleError(null)
      setIsLoadingGoogle(false)
    }
  }, [debouncedInputValue])

  // Handle Google Places selection
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
    
    // Simplified location matching - temporarily disabled
    const matchResult = {
      locationId: undefined,
      isCustom: true
    }

    console.log('📊 Location matching result (simplified):', matchResult)

    // Update input immediately
    setInputValue(place.description)
    lastPropValueRef.current = place.description

    // Always use the Google Place data with our matching result
    onLocationSelect({
      address: place.description,
      placeId: place.place_id,
      coordinates: place.coordinates || matchResult.coordinates,
      locationId: matchResult.type === 'service-location' ? matchResult.serviceLocation?.id : undefined,
      isCustom: matchResult.type === 'custom-location'
    })
    
    // Close dropdown and clear results
    setIsOpen(false)
    setGooglePlaces([])
    setGoogleError(null)
    
    // Clear selection flag after a short delay
    setTimeout(() => {
      isSelectingOptionRef.current = false
    }, 100)
  }

  // Get icon for location type - simplified
  const getLocationIcon = (place: Place) => {
    // Simplified icon detection based on description
    const description = place.description.toLowerCase()
    
    // Check for airport keywords
    if (description.includes('airport') || description.includes('aeroporto') || 
        description.includes('malpensa') || description.includes('linate') || 
        description.includes('orio') || description.includes('marco polo') ||
        description.includes('treviso')) {
              return <Plane className="h-4 w-4 text-blue-600" />
    }
    
    // Check for train station keywords
    if (description.includes('stazione') || description.includes('station') || 
        description.includes('centrale') || description.includes('garibaldi') || 
        description.includes('santa lucia') || description.includes('porta nuova')) {
      return <Train className="h-4 w-4 text-green-600" />
    }
    
    // Check for Olympic venue keywords
    if (description.includes('cortina') || description.includes('bormio') || 
        description.includes('livigno') || description.includes('anterselva')) {
      return <Star className="h-4 w-4 text-yellow-600" />
    }
    
    // Default location icon
    return <MapPin className="h-4 w-4 text-gray-500" />
  }

  // Get special services info for location - simplified
  const getSpecialServicesInfo = (place: Place) => {
    const services = []
    const description = place.description.toLowerCase()
    
    // Check for airports and major train stations (likely to have Meet & Greet)
    if (description.includes('aeroporto') || description.includes('airport') || 
        description.includes('malpensa') || description.includes('linate') || 
        description.includes('centrale') || description.includes('marco polo')) {
      services.push('Meet & Greet')
    }
    
    // Check for Olympic venues
    if (description.includes('cortina') || description.includes('bormio') || 
        description.includes('livigno') || description.includes('anterselva')) {
      services.push('Olympic Pricing')
    }
    
    return services
  }

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative w-full ${className || ''}`}>
      {label && (
        <Label htmlFor="location-input" className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </Label>
      )}
      
      <div className="relative">
        <Input
          ref={inputRef}
          id="location-input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder || "Cerca una location..."}
          className={`w-full ${error ? 'border-red-500' : ''}`}
          autoComplete="off"
        />
        
        {/* Loading indicator */}
        {isLoadingGoogle && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown with results */}
      {isOpen && (googlePlaces.length > 0 || isLoadingGoogle || googleError) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          
          {/* Loading state */}
          {isLoadingGoogle && (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Ricerca in corso...
            </div>
          )}

          {/* Error state */}
          {googleError && (
            <div className="px-4 py-3 text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {googleError}
            </div>
          )}

          {/* Google Places Results */}
          {googlePlaces.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 border-b flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Google Places (EU Only)
              </div>
              {googlePlaces.map((place) => {
                const specialServices = getSpecialServicesInfo(place)
                
                return (
                  <div
                    key={place.place_id}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    onClick={() => handleGooglePlaceSelect(place)}
                  >
                    <div className="flex items-start gap-3">
                      {getLocationIcon(place)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {place.structured_formatting?.main_text || place.description}
                        </div>
                        {place.structured_formatting?.secondary_text && (
                          <div className="text-xs text-gray-500 truncate">
                            {place.structured_formatting.secondary_text}
                          </div>
                        )}
                        {specialServices.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {specialServices.map((service) => (
                              <span
                                key={service}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                              >
                                {service}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {/* No results */}
          {!isLoadingGoogle && !googleError && googlePlaces.length === 0 && inputValue.length >= 2 && (
            <div className="px-4 py-3 text-sm text-gray-500">
              Nessun risultato trovato per "{inputValue}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Export a corrected version that matches the BookingForm expectations
export function LocationSelectorCorrected({
  onLocationSelect,
  placeholder,
  dictionary
}: {
  onLocationSelect: (location: {
    address: string
    placeId: string | null
    coordinates: { lat: number; lng: number } | null
    locationId?: string
    isCustom: boolean
  }) => void
  placeholder?: string
  dictionary?: any
}) {
  return (
    <LocationSelector
      onLocationSelect={onLocationSelect}
      placeholder={placeholder}
      dictionary={dictionary}
    />
  )
} 