"use client"

import { memo } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, User2, Luggage, Backpack } from "lucide-react"
import type { VehicleConfig, ValidationError } from "@/lib/booking-types"

interface VehicleConfigSectionProps {
  vehicleCount: number
  sameType: boolean
  singleConfig: VehicleConfig
  multipleConfigs: VehicleConfig[]
  errors: ValidationError[]
  onCountChange: (count: number) => void
  onToggleSameType: () => void
  onSingleConfigChange: (config: Partial<VehicleConfig>) => void
  onMultipleConfigChange: (index: number, config: Partial<VehicleConfig>) => void
  onAddVehicle: () => void
  onRemoveVehicle: (index: number) => void
  dictionary: any
}

const vehicleTypes = [
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
    onCountChange,
    onToggleSameType,
    onSingleConfigChange,
    onMultipleConfigChange,
    onAddVehicle,
    onRemoveVehicle,
    dictionary,
  }) => {
    const getFieldError = (field: string) => {
      return errors.find((error) => error.field === `vehicles.${field}`)?.message
    }

    // Helper function to get vehicle limits
    const getVehicleLimits = (vehicleType: string) => {
      const vehicle = vehicleTypes.find(v => v.value === vehicleType)
      if (!vehicle) return { maxPassengers: 8, maxLuggage: 8 }
      
      // Se ha bagagli piccoli, il totale è bagagli normali + bagagli piccoli
      const totalLuggage = vehicle.maxSmallLuggage ? vehicle.maxLuggage + vehicle.maxSmallLuggage : vehicle.maxLuggage
      return { maxPassengers: vehicle.maxPassengers, maxLuggage: totalLuggage }
    }

    // Helper function to get vehicle object
    const getVehicle = (vehicleType: string) => {
      return vehicleTypes.find(v => v.value === vehicleType)
    }

    // Helper function to get luggage message
    const getLuggageMessage = (vehicleType: string, isShort = false) => {
      const vehicle = getVehicle(vehicleType)
      if (!vehicle) return ""
      
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

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">{dictionary.title}</h3>

        {/* Vehicle Count */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">{dictionary.countLabel}</label>
          <Select value={vehicleCount.toString()} onValueChange={(value) => onCountChange(Number.parseInt(value))}>
            <SelectTrigger className={getFieldError("count") ? "border-red-500" : ""}>
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
          {getFieldError("count") && (
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
                <SelectTrigger className={getFieldError("config.type") ? "border-red-500" : ""}>
                  <SelectValue placeholder={dictionary.selectType} />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((vehicle) => (
                    <SelectItem key={vehicle.value} value={vehicle.value}>
                      <div className="flex items-center">
                        {vehicle.label} ({vehicle.maxPassengers} <User2 className="w-4 h-4 mx-1" />{" "}
                        {vehicle.maxSmallLuggage ? (
                          <span className="flex items-center">
                            {vehicle.maxLuggage} <Luggage className="w-4 h-4 mx-1" />
                            + {vehicle.maxSmallLuggage} <Backpack className="w-4 h-4 mx-1" />
                          </span>
                        ) : (
                          <span className="flex items-center">
                            {vehicle.maxLuggage} <Luggage className="w-4 h-4 ml-1" />
                          </span>
                        )})
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
                placeholder={singleConfig.type ? "Es. 2" : dictionary.selectVehiclePlaceholder}
                className={getFieldError("config.passengers") ? "border-red-500" : ""}
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
                placeholder={singleConfig.type ? "Es. 2" : dictionary.selectVehiclePlaceholder}
                className={getFieldError("config.luggage") ? "border-red-500" : ""}
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
                      <SelectTrigger className={getFieldError(`configs.${index}.type`) ? "border-red-500" : ""}>
                        <SelectValue placeholder={dictionary.selectType} />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleTypes.map((vehicle) => (
                          <SelectItem key={vehicle.value} value={vehicle.value}>
                            <div className="flex items-center">
                              {vehicle.label} ({vehicle.maxPassengers} <User2 className="w-4 h-4 mx-1" />{" "}
                              {vehicle.maxSmallLuggage ? (
                                <span className="flex items-center">
                                  {vehicle.maxLuggage} <Luggage className="w-4 h-4 mx-1" />
                                  + {vehicle.maxSmallLuggage} <Backpack className="w-4 h-4 mx-1" />
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  {vehicle.maxLuggage} <Luggage className="w-4 h-4 ml-1" />
                                </span>
                              )})
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
                      placeholder={config.type ? "Es. 2" : dictionary.selectVehiclePlaceholderShort}
                      className={getFieldError(`configs.${index}.passengers`) ? "border-red-500" : ""}
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
                      placeholder={config.type ? "Es. 2" : dictionary.selectVehiclePlaceholderShort}
                      className={getFieldError(`configs.${index}.luggage`) ? "border-red-500" : ""}
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
