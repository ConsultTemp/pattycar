"use client"

import { memo } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, User2, Luggage, Backpack, Zap } from "lucide-react"
import type { VehicleConfig, ValidationError } from "@/lib/booking-types"
import { getAllowedVehicleTypes } from "@/lib/event-pricing"
import { isOlympicPeriod, getOlympicVehicleTypes, OLYMPIC_VEHICLE_TYPES, getCeremonyVehicleTypes, isCeremonyDate, getAvailableOlympicVehicleTypes, isInterClusterRoute } from "@/lib/olympic-pricing"

interface VehicleConfigSectionProps {
  vehicleCount: number
  sameType: boolean
  singleConfig: VehicleConfig
  multipleConfigs: VehicleConfig[]
  errors: ValidationError[]
  hasAttemptedSubmit: boolean
  journeyDate?: Date // Add journey date to filter vehicle types
  serviceType?: string // Add service type to determine ceremony vehicles
  isEastCluster?: boolean // Add flag to determine if route is East Cluster
  isInterCluster?: boolean // Add flag to determine if route is Inter-Cluster
  pickupLocationId?: string // NEW: Pickup location ID for inter-cluster filtering
  destinationLocationId?: string // NEW: Destination location ID for inter-cluster filtering
  pickupAddress?: string // NEW: Pickup address for Venice detection
  destinationAddress?: string // NEW: Destination address for Venice detection
  pickupCoordinates?: { lat: number; lng: number } // NEW: Pickup coordinates for Venice detection
  destinationCoordinates?: { lat: number; lng: number } // NEW: Destination coordinates for Venice detection
  waterTaxi: boolean // NEW: Water taxi service flag
  onWaterTaxiChange: (enabled: boolean) => void // NEW: Water taxi change handler
  onCountChange: (count: number) => void
  onToggleSameType: () => void
  onSingleConfigChange: (config: Partial<VehicleConfig>) => void
  onMultipleConfigChange: (index: number, config: Partial<VehicleConfig>) => void
  onAddVehicle: () => void
  onRemoveVehicle: (index: number) => void
  dictionary: any
}

const allVehicleTypes = [
  { value: "sedan", label: "Sedan", maxPassengers: 3, maxLuggage: 2, maxSmallLuggage: 1 },
  { value: "van", label: "Van", maxPassengers: 6, maxLuggage: 6 },
  { value: "minibus", label: "Mini Bus", maxPassengers: 8, maxLuggage: 8 },
  { value: "luxury-sedan", label: "Luxury Sedan", maxPassengers: 2, maxLuggage: 2 },
]

export const VehicleConfigSection = memo<VehicleConfigSectionProps>(
  ({
    vehicleCount,
    sameType,
    singleConfig,
    multipleConfigs,
    errors,
    hasAttemptedSubmit,
    journeyDate,
    serviceType,
    isEastCluster,
    pickupLocationId,
    destinationLocationId,
    pickupAddress,
    destinationAddress,
    pickupCoordinates,
    destinationCoordinates,
    waterTaxi,
    onWaterTaxiChange,
    onCountChange,
    onToggleSameType,
    onSingleConfigChange,
    onMultipleConfigChange,
    onAddVehicle,
    onRemoveVehicle,
    dictionary,
  }) => {
    // Determine vehicle types based on service type and date
    const isOlympic = journeyDate ? isOlympicPeriod(journeyDate) : false
    const isCeremony = journeyDate ? isCeremonyDate(journeyDate) : false
    const isCeremonyService = serviceType === "ceremony-disposition"
    const isInterCluster = serviceType === "inter-cluster"
    
    let vehicleTypes: any[]
    
    if (isCeremony && isCeremonyService) {
      // CEREMONY SERVICES: Use only the 3 vehicles from the ceremony price list
      vehicleTypes = getCeremonyVehicleTypes().map(vehicle => ({
        value: vehicle.value,
        label: vehicle.label,
        maxPassengers: vehicle.maxPassengers,
        maxLuggage: vehicle.maxLuggage,
        description: vehicle.description,
        ceremonyPrice: vehicle.ceremonyPrice,
        category: 'ceremony'
      }))
    } else if (isEastCluster && isOlympic) {
      // EAST CLUSTER: Only Sedan and Minivan as per eastern cluster pricing
      vehicleTypes = [
        {
          value: 'olympic-sedan',
          label: 'Sedan',
          maxPassengers: 2,
          maxLuggage: 2,
          description: '2 passengers max',
          category: 'standard'
        },
        {
          value: 'olympic-minivan',
          label: 'Mini Van',
          maxPassengers: 6,
          maxLuggage: 6,
          description: '6 passengers (4 with luggage)',
          category: 'standard'
        }
      ]
    } else if (isOlympic) {
      // During Olympic period, use Olympic vehicle types
      const allowedTypes = getAllowedVehicleTypes(journeyDate)
      
      // NEW: Get available Olympic vehicle types based on route (inter-cluster filtering)
      const availableOlympicTypes = getAvailableOlympicVehicleTypes(pickupLocationId, destinationLocationId)
      const isInterCluster = isInterClusterRoute(pickupLocationId || '', destinationLocationId || '')
      
      vehicleTypes = Object.values(OLYMPIC_VEHICLE_TYPES)
        .filter(vehicle => {
          // First filter by date-based allowed types
          if (!allowedTypes.includes(vehicle.id)) return false
          
          // Then filter by route-based available types (inter-cluster check)
          const olympicVehicleType = `olympic-${vehicle.name}` as 'olympic-sedan' | 'olympic-minivan' | 'olympic-van' | 'olympic-luxury'
          return availableOlympicTypes.includes(olympicVehicleType)
        })
        .map(vehicle => ({
          value: vehicle.id,
          label: vehicle.displayName,
          maxPassengers: vehicle.maxPassengers,
          maxLuggage: vehicle.maxLuggage,
          maxSmallLuggage: vehicle.maxSmallLuggage,
          description: vehicle.description,
          category: vehicle.category
        }))
      
      // FALLBACK: Se non ci sono veicoli olimpici, usa quelli standard
      if (vehicleTypes.length === 0) {
        vehicleTypes = allVehicleTypes.filter(vehicle => 
          ["sedan", "van", "minibus", "luxury-sedan"].includes(vehicle.value)
        )
      }
    } else {
      // Standard period, use regular vehicle types
      const allowedTypes = getAllowedVehicleTypes(journeyDate)
      vehicleTypes = allVehicleTypes.filter(vehicle => allowedTypes.includes(vehicle.value))
    }

    const getFieldError = (field: string) => {
      const error = errors.find((error) => error.field === `vehicles.${field}`)
      if (!error) return undefined
      
      // Return translated messages - first check if it's a validation key
      if (dictionary.validationErrors && dictionary.validationErrors[error.message]) {
        return dictionary.validationErrors[error.message]
      }
      
      // Fallback to existing dictionary keys for backward compatibility
      if (field === "count") {
        return dictionary.countRequired
      } else if (field.includes("type")) {
        return dictionary.typeRequired
      } else if (field.includes("passengers")) {
        return dictionary.passengersRequired
      } else {
        return error.message
      }
    }

    const hasFieldError = (field: string) => {
      return hasAttemptedSubmit && !!getFieldError(field)
    }

    // Helper function to get vehicle limits (supports both standard and Olympic vehicles)
    const getVehicleLimits = (vehicleType: string) => {
      const vehicle = vehicleTypes.find(v => v.value === vehicleType)
      if (!vehicle) return { maxPassengers: 8, maxLuggage: 8 }
      
      // For Olympic vehicles, use direct values; for standard vehicles, calculate totals
      if (isOlympic) {
        return { 
          maxPassengers: vehicle.maxPassengers, 
          maxLuggage: vehicle.maxLuggage 
        }
      } else {
        // Se ha bagagli piccoli, il totale è bagagli normali + bagagli piccoli
        const totalLuggage = vehicle.maxSmallLuggage ? vehicle.maxLuggage + vehicle.maxSmallLuggage : vehicle.maxLuggage
        return { maxPassengers: vehicle.maxPassengers, maxLuggage: totalLuggage }
      }
    }

    // Helper function to get vehicle object
    const getVehicle = (vehicleType: string) => {
      return vehicleTypes.find(v => v.value === vehicleType)
    }

    // Helper function to check if location is in Venice (excluding airport and station)
    const isVeniceLocation = (address?: string, locationId?: string, coordinates?: { lat: number; lng: number }): boolean => {
      if (!address && !locationId && !coordinates) {
        return false
      }
      
      // STEP 1: Exclude Venice Marco Polo airport and Venice Santa Lucia station by locationId
      // BUT: Only if the address actually mentions these places (not just auto-mapped by proximity)
      const excludedLocationIds = ['venezia-marco-polo', 'venezia-santa-lucia']
      if (locationId && excludedLocationIds.includes(locationId)) {
        // Double-check: If address doesn't mention the station/airport, it's just a proximity mapping
        // In that case, ignore the exclusion and treat it as generic Venice
        if (address) {
          const lowerAddress = address.toLowerCase()
          const actuallyMentionsExcludedPlace = 
            lowerAddress.includes('santa lucia') ||
            lowerAddress.includes('marco polo') ||
            lowerAddress.includes('aeroporto') ||
            lowerAddress.includes('airport') ||
            (lowerAddress.includes('stazione') && locationId === 'venezia-santa-lucia') ||
            (lowerAddress.includes('station') && locationId === 'venezia-santa-lucia')
          
          if (actuallyMentionsExcludedPlace) {
            return false
          }
          // Continue to other checks - don't exclude
        } else {
          // No address to verify, trust the locationId
          return false
        }
      }
      
      // STEP 2: PRIORITY - Check coordinates (most reliable method)
      if (coordinates) {
        const veniceCenter = { lat: 45.4408, lng: 12.3155 } // San Marco/Rialto area
        const airportCoords = { lat: 45.5053, lng: 12.3519 } // Marco Polo Airport
        const stationCoords = { lat: 45.4415, lng: 12.3208 } // Santa Lucia Station
        
        // Calculate distances using simple Pythagorean (good enough for small areas)
        const distanceFromCenter = Math.sqrt(
          Math.pow(coordinates.lat - veniceCenter.lat, 2) + 
          Math.pow(coordinates.lng - veniceCenter.lng, 2)
        )
        const distanceFromAirport = Math.sqrt(
          Math.pow(coordinates.lat - airportCoords.lat, 2) + 
          Math.pow(coordinates.lng - airportCoords.lng, 2)
        )
        const distanceFromStation = Math.sqrt(
          Math.pow(coordinates.lat - stationCoords.lat, 2) + 
          Math.pow(coordinates.lng - stationCoords.lng, 2)
        )
        
        // Check if we're AT the station (within ~200m = 0.002 degrees)
        if (distanceFromStation < 0.002) {
          return false
        }
        
        // Check if we're AT the airport (within ~300m = 0.003 degrees)
        if (distanceFromAirport < 0.003) {
          return false
        }
        
        // If within ~15km from Venice center (0.15 degrees ≈ 15km) and NOT near airport/station
        // This covers the entire Venice metropolitan area including islands
        if (distanceFromCenter < 0.15) {
          return true
        } else {
          return false
        }
      }
      
      // STEP 3: FALLBACK - Check address only if NO coordinates (rare case)
      // Only consider it Venice if "Venezia" or "Venice" is the CITY, not just a street name
      if (address) {
        const lowerAddress = address.toLowerCase().trim()
        
        // First, exclude if it contains airport/station keywords
        const isExcludedLocation = 
          lowerAddress.includes('marco polo') || 
          lowerAddress.includes('santa lucia') ||
          lowerAddress.includes('aeroporto') ||
          lowerAddress.includes('airport') ||
          lowerAddress.includes('stazione') ||
          lowerAddress.includes('station')
        
        if (isExcludedLocation) {
          return false
        }
        
        // Check if "Venezia" or "Venice" is the CITY (not just in a street name like "Porta Venezia")
        // Valid patterns: "Venezia", "Venice", ", Venezia", ", Venice", "Venezia, VE", "Venice, VE", etc.
        const isVeniceCity = 
          lowerAddress === 'venezia' ||
          lowerAddress === 'venice' ||
          lowerAddress === 'venezia, ve' ||
          lowerAddress === 'venice, ve' ||
          lowerAddress === 'venezia,ve' ||
          lowerAddress === 'venice,ve' ||
          lowerAddress === 'venezia ve' ||
          lowerAddress === 'venice ve' ||
          lowerAddress.endsWith(', venezia') ||
          lowerAddress.endsWith(', venice') ||
          lowerAddress.endsWith(',venezia') ||
          lowerAddress.endsWith(',venice') ||
          lowerAddress.endsWith(', venezia, ve') ||
          lowerAddress.endsWith(', venice, ve') ||
          lowerAddress.endsWith(',venezia,ve') ||
          lowerAddress.endsWith(',venice,ve') ||
          lowerAddress.endsWith(', venezia ve') ||
          lowerAddress.endsWith(', venice ve') ||
          lowerAddress.endsWith(' venezia, ve') ||
          lowerAddress.endsWith(' venice, ve') ||
          lowerAddress.includes(', venezia,') ||
          lowerAddress.includes(', venice,') ||
          lowerAddress.includes(',venezia,') ||
          lowerAddress.includes(',venice,') ||
          lowerAddress.includes(', venezia, ve') ||
          lowerAddress.includes(', venice, ve')
        
        if (isVeniceCity) {
          return true
        } else {
          return false
        }
      }
      
      return false
    }

    // Check if water taxi should be available (at least one location is Venice, excluding airport/station)
    const showWaterTaxi = isVeniceLocation(pickupAddress, pickupLocationId, pickupCoordinates) || 
                          isVeniceLocation(destinationAddress, destinationLocationId, destinationCoordinates)

    // Helper function to get luggage message (supports both standard and Olympic vehicles)
    const getLuggageMessage = (vehicleType: string, isShort = false) => {
      const vehicle = getVehicle(vehicleType)
      if (!vehicle) return ""
      
      if (isOlympic) {
        // Olympic vehicles: simple message with max luggage
        const template = isShort ? dictionary.maxLuggageShort : dictionary.maxLuggage
        return template.replace('{max}', vehicle.maxLuggage.toString())
      } else {
        if (vehicle.maxSmallLuggage) {
          // Sedan: messaggio specifico con grandi e piccoli bagagli
          const template = isShort ? dictionary.maxSedanLuggageShort : dictionary.maxSedanLuggage
          return template
            .replace('{maxLuggage}', vehicle.maxLuggage.toString())
            .replace('{maxSmallLuggage}', vehicle.maxSmallLuggage.toString())
        } else {
          // Altri veicoli: messaggio standard
          const template = isShort ? dictionary.maxLuggageShort : dictionary.maxLuggage
          const totalLuggage = getVehicleLimits(vehicleType).maxLuggage
          return template.replace('{max}', totalLuggage.toString())
        }
      }
    }

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">{dictionary.title}</h3>

        {/* Water Taxi Service - Only for Venice locations (excluding airport/station) */}
        {showWaterTaxi && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="waterTaxi" 
                checked={waterTaxi} 
                onCheckedChange={onWaterTaxiChange}
              />
              <div className="flex-1">
                <label 
                  htmlFor="waterTaxi" 
                  className="text-sm font-medium text-blue-900 cursor-pointer"
                >
                  {dictionary.waterTaxiLabel || "Water Taxi Service (+€200)"}
                </label>
                <p className="text-xs text-blue-700 mt-1">
                  {dictionary.waterTaxiDescription || "Add water taxi transport service for Venice"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Count */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">{dictionary.countLabel}</label>
          <Select value={vehicleCount.toString()} onValueChange={(value) => onCountChange(Number.parseInt(value))}>
            <SelectTrigger className={hasFieldError("count") ? "border-red-500" : ""}>
              <SelectValue placeholder={dictionary.selectCount} />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? dictionary.vehicle : dictionary.vehicles}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFieldError("count") && (
            <p className="text-red-500 text-sm mt-1" role="alert">
              {getFieldError("count")}
            </p>
          )}
        </div>

        {/* Same Vehicle Type Checkbox */}
        {vehicleCount > 1 && (
          <div className="flex items-center space-x-2">
            <Checkbox id="sameVehicleType" checked={sameType} onCheckedChange={onToggleSameType} />
            <label htmlFor="sameVehicleType" className="text-sm text-gray-600">
              {dictionary.sameTypeLabel}
            </label>
          </div>
        )}

        {/* Single Configuration */}
        {(vehicleCount === 1 || sameType) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
            <div>
              <label className="block text-sm text-gray-600 mb-1">{dictionary.typeLabel}</label>
              <Select 
                value={singleConfig.type} 
                onValueChange={(type) => {
                  // Quando cambia il tipo di veicolo, limita automaticamente passeggeri e bagagli ai nuovi limiti
                  const limits = getVehicleLimits(type)
                  const newConfig: Partial<VehicleConfig> = { type }
                  
                  // Se i passeggeri attuali superano il limite, riducili
                  if (singleConfig.passengers > limits.maxPassengers) {
                    newConfig.passengers = limits.maxPassengers
                  }
                  
                  // Se i bagagli attuali superano il limite, riducili
                  if (singleConfig.luggage > limits.maxLuggage) {
                    newConfig.luggage = limits.maxLuggage
                  }
                  
                  onSingleConfigChange(newConfig)
                }}
              >
                <SelectTrigger className={hasFieldError("config.type") ? "border-red-500" : ""}>
                  <SelectValue placeholder={dictionary.selectType} />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((vehicle) => (
                    <SelectItem key={vehicle.value} value={vehicle.value}>
                      <div className="flex flex-col gap-1 py-1 w-full">
                        <div className="flex items-center gap-2">
                          {/* Category icon */}
                          {vehicle.category === 'ceremony' && (
                            <span className="text-xs"></span>
                          )}
                          {vehicle.category === 'luxury' && (
                            <span className="text-xs"></span>
                          )}
                          
                          <span className="font-medium text-sm">{vehicle.label}</span>
                          
                          {/* Ceremony price */}
                          {vehicle.ceremonyPrice && (
                            <span className="text-xs text-blue-600 font-medium ml-auto">
                              €{vehicle.ceremonyPrice}
                            </span>
                          )}
                        </div>
                        
                        {/* Capacity info on separate line */}
                        <div className="text-xs text-gray-500">
                          <span>{vehicle.maxPassengers} {dictionary.passengers}</span>
                          {vehicle.maxSmallLuggage ? (
                            <span> • {vehicle.maxLuggage} large + {vehicle.maxSmallLuggage} small</span>
                          ) : (
                            <span> • {vehicle.maxLuggage} luggage</span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getFieldError("config.type") && (
                <p className="text-red-500 text-sm mt-1" role="alert">
                  {getFieldError("config.type")}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">{dictionary.passengersLabel}</label>
              <Input
                type="number"
                min="1"
                max={getVehicleLimits(singleConfig.type).maxPassengers}
                value={singleConfig.passengers || ""}
                disabled={!singleConfig.type}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "") {
                    // Permetti campo vuoto durante la digitazione
                    onSingleConfigChange({ passengers: 0 })
                  } else {
                    const numValue = parseInt(value) || 0
                    const limits = getVehicleLimits(singleConfig.type)
                    const validValue = Math.min(Math.max(numValue, 1), limits.maxPassengers)
                    onSingleConfigChange({ passengers: validValue })
                  }
                }}
                onBlur={(e) => {
                  // Al blur, assicurati che ci sia almeno 1 passeggero se il campo è vuoto
                  if (!e.target.value || parseInt(e.target.value) < 1) {
                    onSingleConfigChange({ passengers: 1 })
                  }
                }}
                placeholder={singleConfig.type ? dictionary.exampleNumber : dictionary.selectVehiclePlaceholder}
                className={hasFieldError("config.passengers") ? "border-red-500" : ""}
              />
              {!singleConfig.type ? (
                <p className="text-xs text-gray-500 mt-1">
                  {dictionary.selectVehicleFirst}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  {dictionary.maxPassengers.replace('{max}', getVehicleLimits(singleConfig.type).maxPassengers.toString())}
                </p>
              )}
              {getFieldError("config.passengers") && (
                <p className="text-red-500 text-sm mt-1" role="alert">
                  {getFieldError("config.passengers")}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">{dictionary.luggageLabel}</label>
              <Input
                type="number"
                min="0"
                max={getVehicleLimits(singleConfig.type).maxLuggage}
                value={singleConfig.luggage || ""}
                disabled={!singleConfig.type}
                onChange={(e) => {
                  const numValue = parseInt(e.target.value) || 0
                  const limits = getVehicleLimits(singleConfig.type)
                  const validValue = Math.min(Math.max(numValue, 0), limits.maxLuggage)
                  onSingleConfigChange({ luggage: validValue })
                }}
                placeholder={singleConfig.type ? dictionary.exampleNumber : dictionary.selectVehiclePlaceholder}
                className={hasFieldError("config.luggage") ? "border-red-500" : ""}
              />
              {!singleConfig.type ? (
                <p className="text-xs text-gray-500 mt-1">
                  {dictionary.selectVehicleFirst}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  {getLuggageMessage(singleConfig.type)}
                </p>
              )}
              {getFieldError("config.luggage") && (
                <p className="text-red-500 text-sm mt-1" role="alert">
                  {getFieldError("config.luggage")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Multiple Configurations */}
        {vehicleCount > 1 && !sameType && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{dictionary.individualConfig}</h4>
              <Button type="button" onClick={onAddVehicle} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                {dictionary.addVehicle}
              </Button>
            </div>

            {multipleConfigs.map((config, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-medium">{dictionary.vehicleNumber} {index + 1}</h5>
                  {multipleConfigs.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => onRemoveVehicle(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{dictionary.typeLabel}</label>
                    <Select 
                      value={config.type} 
                      onValueChange={(type) => {
                        // Quando cambia il tipo di veicolo, limita automaticamente passeggeri e bagagli ai nuovi limiti
                        const limits = getVehicleLimits(type)
                        const newConfig: Partial<VehicleConfig> = { type }
                        
                        // Se i passeggeri attuali superano il limite, riducili
                        if (config.passengers > limits.maxPassengers) {
                          newConfig.passengers = limits.maxPassengers
                        }
                        
                        // Se i bagagli attuali superano il limite, riducili
                        if (config.luggage > limits.maxLuggage) {
                          newConfig.luggage = limits.maxLuggage
                        }
                        
                        onMultipleConfigChange(index, newConfig)
                      }}
                    >
                      <SelectTrigger className={hasFieldError(`configs.${index}.type`) ? "border-red-500" : ""}>
                        <SelectValue placeholder={dictionary.selectType} />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleTypes.map((vehicle) => (
                          <SelectItem key={vehicle.value} value={vehicle.value}>
                            <div className="flex flex-col gap-1 py-1 w-full">
                              <div className="flex items-center gap-2">
                                {/* Category icon */}
                                {vehicle.category === 'ceremony' && (
                                  <span className="text-xs"></span>
                                )}
                                {vehicle.category === 'luxury' && (
                                  <span className="text-xs"></span>
                                )}
                                
                                <span className="font-medium text-sm">{vehicle.label}</span>
                                
                                {/* Ceremony price */}
                                {vehicle.ceremonyPrice && (
                                  <span className="text-xs text-blue-600 font-medium ml-auto">
                                    €{vehicle.ceremonyPrice}
                                  </span>
                                )}
                              </div>
                              
                              {/* Capacity info on separate line */}
                              <div className="text-xs text-gray-500">
                                <span>{vehicle.maxPassengers} {dictionary.passengers}</span>
                                {vehicle.maxSmallLuggage ? (
                                  <span> • {vehicle.maxLuggage} large + {vehicle.maxSmallLuggage} small</span>
                                ) : (
                                  <span> • {vehicle.maxLuggage} luggage</span>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {getFieldError(`configs.${index}.type`) && (
                      <p className="text-red-500 text-sm mt-1" role="alert">
                        {getFieldError(`configs.${index}.type`)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{dictionary.passengersLabel}</label>
                    <Input
                      type="number"
                      min="1"
                      max={getVehicleLimits(config.type).maxPassengers}
                      value={config.passengers || ""}
                      disabled={!config.type}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === "") {
                          // Permetti campo vuoto durante la digitazione
                          onMultipleConfigChange(index, { passengers: 0 })
                        } else {
                          const numValue = parseInt(value) || 0
                          const limits = getVehicleLimits(config.type)
                          const validValue = Math.min(Math.max(numValue, 1), limits.maxPassengers)
                          onMultipleConfigChange(index, { passengers: validValue })
                        }
                      }}
                      onBlur={(e) => {
                        // Al blur, assicurati che ci sia almeno 1 passeggero se il campo è vuoto
                        if (!e.target.value || parseInt(e.target.value) < 1) {
                          onMultipleConfigChange(index, { passengers: 1 })
                        }
                      }}
                      placeholder={config.type ? dictionary.exampleNumber : dictionary.selectVehiclePlaceholderShort}
                      className={hasFieldError(`configs.${index}.passengers`) ? "border-red-500" : ""}
                    />
                    {!config.type ? (
                      <p className="text-xs text-gray-500 mt-1">
                        {dictionary.selectVehicleFirstShort}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">
                        {dictionary.maxPassengersShort.replace('{max}', getVehicleLimits(config.type).maxPassengers.toString())}
                      </p>
                    )}
                    {getFieldError(`configs.${index}.passengers`) && (
                      <p className="text-red-500 text-sm mt-1" role="alert">
                        {getFieldError(`configs.${index}.passengers`)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{dictionary.luggageLabel}</label>
                    <Input
                      type="number"
                      min="0"
                      max={getVehicleLimits(config.type).maxLuggage}
                      value={config.luggage || ""}
                      disabled={!config.type}
                      onChange={(e) => {
                        const numValue = parseInt(e.target.value) || 0
                        const limits = getVehicleLimits(config.type)
                        const validValue = Math.min(Math.max(numValue, 0), limits.maxLuggage)
                        onMultipleConfigChange(index, { luggage: validValue })
                      }}
                      placeholder={config.type ? dictionary.exampleNumber : dictionary.selectVehiclePlaceholderShort}
                      className={hasFieldError(`configs.${index}.luggage`) ? "border-red-500" : ""}
                    />
                    {!config.type ? (
                      <p className="text-xs text-gray-500 mt-1">
                        {dictionary.selectVehicleFirstShort}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">
                        {getLuggageMessage(config.type, true)}
                      </p>
                    )}
                    {getFieldError(`configs.${index}.luggage`) && (
                      <p className="text-red-500 text-sm mt-1" role="alert">
                        {getFieldError(`configs.${index}.luggage`)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  },
)

VehicleConfigSection.displayName = "VehicleConfigSection"
