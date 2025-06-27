"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { MapPin, Plane, Train } from "lucide-react"
import { PlacesAutocomplete } from "@/components/places-autocomplete"
import { getAllLocations, getLocationById, getAvailableLocations, type Location } from "@/lib/event-pricing"
import { isOlympicPeriod } from "@/lib/olympic-pricing"

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
  journeyDate?: Date // Add journey date to show Olympic locations
}

export function LocationSelector({
  label,
  value,
  onChange,
  placeholder,
  customPlaceholder,
  error,
  className,
  journeyDate
}: LocationSelectorProps) {
  const [isCustom, setIsCustom] = useState(value.isCustom || false)
  const [selectedLocationId, setSelectedLocationId] = useState(value.locationId || "")

  // Get available locations based on journey date (includes Olympic locations during Olympic period)
  const locations = getAvailableLocations(journeyDate)
  const isOlympic = journeyDate ? isOlympicPeriod(journeyDate) : false

  // Group locations by type for better UX
  const groupedLocations = {
    cities: locations.filter(loc => loc.type === 'city'),
    airports: locations.filter(loc => loc.type === 'airport'),
    stations: locations.filter(loc => loc.type === 'station')
  }

  // Handle custom checkbox change
  const handleCustomChange = (checked: boolean) => {
    setIsCustom(checked)
    
    if (!checked && selectedLocationId) {
      // Switch back to listino - restore selected location
      const location = getLocationById(selectedLocationId)
      if (location) {
        onChange({
          address: location.displayName,
          placeId: `location_${location.id}`,
          coordinates: location.coordinates,
          locationId: location.id,
          isCustom: false
        })
      }
    } else if (checked) {
      // Switch to custom - clear everything
      onChange({
        address: "",
        placeId: "",
        coordinates: undefined,
        locationId: undefined,
        isCustom: true
      })
    }
  }

  // Handle location selection from listino
  const handleLocationSelect = (locationId: string) => {
    const location = getLocationById(locationId)
    if (location) {
      console.log("🎯 LocationSelector - Selected location from listino:", {
        locationId,
        location,
        sending: {
          address: location.displayName,
          placeId: `location_${location.id}`,
          coordinates: location.coordinates,
          locationId: location.id,
          isCustom: false
        }
      })
      
      setSelectedLocationId(locationId)
      onChange({
        address: location.displayName,
        placeId: `location_${location.id}`,
        coordinates: location.coordinates,
        locationId: location.id,
        isCustom: false
      })
    }
  }

  // Handle custom places input
  const handleCustomInput = (address: string, placeId?: string) => {
    onChange({
      address,
      placeId: placeId || "",
      coordinates: undefined, // Will be geocoded later
      locationId: undefined,
      isCustom: true
    })
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
    setIsCustom(value.isCustom || false)
    setSelectedLocationId(value.locationId || "")
  }, [value.isCustom, value.locationId])

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      {/* Custom Location Checkbox */}
      <div className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <Checkbox
          id={`custom-${label}`}
          checked={isCustom}
          onCheckedChange={handleCustomChange}
        />
        <Label htmlFor={`custom-${label}`} className="text-sm font-medium cursor-pointer">
          Inserisci posizione personalizzata
        </Label>
      </div>

      {/* Location Selection */}
      {!isCustom ? (
        <div className="space-y-2">
          <Select value={selectedLocationId} onValueChange={handleLocationSelect}>
            <SelectTrigger className={error ? "border-red-500" : ""}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {/* Cities */}
              {groupedLocations.cities.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-sm font-semibold text-gray-900">Città</div>
                  {groupedLocations.cities.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className="flex items-center gap-2">
                        {getLocationIcon(location.type)}
                        <span>{location.displayName}</span>
                        {/* Service badges */}
                        <div className="flex items-center gap-1 ml-auto">
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
                    </SelectItem>
                  ))}
                </>
              )}

              {/* Airports */}
              {groupedLocations.airports.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-sm font-semibold text-gray-900">Aeroporti</div>
                  {groupedLocations.airports.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className="flex items-center gap-2">
                        {getLocationIcon(location.type)}
                        <span>{location.displayName}</span>
                        <div className="flex items-center gap-1 ml-auto">
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
                    </SelectItem>
                  ))}
                </>
              )}

              {/* Railway Stations */}
              {groupedLocations.stations.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-sm font-semibold text-gray-900">Stazioni Ferroviarie</div>
                  {groupedLocations.stations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className="flex items-center gap-2">
                        {getLocationIcon(location.type)}
                        <span>{location.displayName}</span>
                        <div className="flex items-center gap-1 ml-auto">
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
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>

          {/* Help text for listino */}
          <p className="text-xs text-gray-500">
            Seleziona una destinazione dal nostro listino per prezzi fissi. 
            <span className="inline-flex items-center gap-1 ml-1">
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">GP</span>
              = GP Monza,
              {isOlympic && (
                <>
                  <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-green-500 text-white text-xs rounded">🏔️</span>
                  = Olimpiadi 2026,
                </>
              )}
              <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded">M&G</span>
              = Meet & Greet
            </span>
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <PlacesAutocomplete
            value={value.address}
            onChange={handleCustomInput}
            placeholder={customPlaceholder}
            className={error ? "border-red-500" : ""}
          />
          <p className="text-xs text-gray-500">
            Inserisci qualsiasi indirizzo. Il prezzo sarà calcolato in base alla distanza.
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
} 