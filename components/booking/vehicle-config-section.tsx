"use client"

import { memo } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, User2, Luggage, Backpack, Zap } from "lucide-react"
import type { VehicleConfig, ValidationError } from "@/lib/booking-types"
import { getAllowedVehicleTypes } from "@/lib/event-pricing"
import { isOlympicPeriod, getOlympicVehicleTypes, OLYMPIC_VEHICLE_TYPES, getCeremonyVehicleTypes, isCeremonyDate } from "@/lib/olympic-pricing"

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
          maxLuggage: 4,
          description: '6 passengers (4 with luggage)',
          category: 'standard'
        }
      ]
    } else if (isInterCluster && isOlympic) {
      // INTER-CLUSTER: Only Sedan and Minivan as per official pricing table
      vehicleTypes = [
        {
          value: 'olympic-sedan',
          label: 'Sedan',
          maxPassengers: 3,
          maxLuggage: 2,
          maxSmallLuggage: 1,
          description: '3 passengers max',
          category: 'standard'
        },
        {
          value: 'olympic-minivan',
          label: 'Mini Van',
          maxPassengers: 6,
          maxLuggage: 4,
          description: '6 passengers (4 with luggage)',
          category: 'standard'
        }
      ]
    } else if (isOlympic) {
      // During Olympic period, use Olympic vehicle types
      const allowedTypes = getAllowedVehicleTypes(journeyDate)
      vehicleTypes = Object.values(OLYMPIC_VEHICLE_TYPES)
        .filter(vehicle => allowedTypes.includes(vehicle.id))
        .map(vehicle => ({
          value: vehicle.id,
          label: vehicle.displayName,
          maxPassengers: vehicle.maxPassengers,
          maxLuggage: vehicle.maxLuggage,
          maxSmallLuggage: vehicle.maxSmallLuggage,
          description: vehicle.description,
          category: vehicle.category
        }))
    } else {
      // Standard period, use regular vehicle types
      const allowedTypes = getAllowedVehicleTypes(journeyDate)
      vehicleTypes = allVehicleTypes.filter(vehicle => allowedTypes.includes(vehicle.value))
    }

    const getFieldError = (field: string) => {
      const error = errors.find((error) => error.field === `vehicles.${field}`)
      if (!error) return undefined
      
      // Return translated messages instead of raw Zod messages
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
