"use client"

import { memo } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, User2, Luggage } from "lucide-react"
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
}

const vehicleTypes = [
  { value: "sedan", label: "Sedan", maxPassengers: 3, maxLuggage: 3 },
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
  }) => {
    const getFieldError = (field: string) => {
      return errors.find((error) => error.field === `vehicles.${field}`)?.message
    }

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Configurazione Veicoli</h3>

        {/* Vehicle Count */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Numero di veicoli *</label>
          <Select value={vehicleCount.toString()} onValueChange={(value) => onCountChange(Number.parseInt(value))}>
            <SelectTrigger className={getFieldError("count") ? "border-red-500" : ""}>
              <SelectValue placeholder="Seleziona numero di veicoli" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? "veicolo" : "veicoli"}
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
              Tutti i veicoli dello stesso tipo
            </label>
          </div>
        )}

        {/* Single Configuration */}
        {(vehicleCount === 1 || sameType) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tipo di veicolo *</label>
              <Select value={singleConfig.type} onValueChange={(type) => onSingleConfigChange({ type })}>
                <SelectTrigger className={getFieldError("config.type") ? "border-red-500" : ""}>
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((vehicle) => (
                    <SelectItem key={vehicle.value} value={vehicle.value}>
                      <div className="flex items-center">
                        {vehicle.label} ({vehicle.maxPassengers} <User2 className="w-4 h-4 mx-1" /> {vehicle.maxLuggage}{" "}
                        <Luggage className="w-4 h-4 ml-1" />)
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
              <label className="block text-sm text-gray-600 mb-1">Passeggeri *</label>
              <Input
                type="number"
                min="1"
                value={singleConfig.passengers || ""}
                onChange={(e) =>
                  onSingleConfigChange({
                    passengers: Number.parseInt(e.target.value) || 0,
                  })
                }
                placeholder="Es. 2"
                className={getFieldError("config.passengers") ? "border-red-500" : ""}
              />
              {getFieldError("config.passengers") && (
                <p className="text-red-500 text-sm mt-1" role="alert">
                  {getFieldError("config.passengers")}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Bagagli *</label>
              <Input
                type="number"
                min="0"
                value={singleConfig.luggage || ""}
                onChange={(e) =>
                  onSingleConfigChange({
                    luggage: Number.parseInt(e.target.value) || 0,
                  })
                }
                placeholder="Es. 2"
                className={getFieldError("config.luggage") ? "border-red-500" : ""}
              />
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
              <h4 className="font-medium">Configurazione Individuale</h4>
              <Button type="button" onClick={onAddVehicle} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Veicolo
              </Button>
            </div>

            {multipleConfigs.map((config, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-medium">Veicolo {index + 1}</h5>
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
                    <label className="block text-sm text-gray-600 mb-1">Tipo Veicolo *</label>
                    <Select value={config.type} onValueChange={(type) => onMultipleConfigChange(index, { type })}>
                      <SelectTrigger className={getFieldError(`configs.${index}.type`) ? "border-red-500" : ""}>
                        <SelectValue placeholder="Seleziona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleTypes.map((vehicle) => (
                          <SelectItem key={vehicle.value} value={vehicle.value}>
                            {vehicle.label}
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
                    <label className="block text-sm text-gray-600 mb-1">Passeggeri *</label>
                    <Input
                      type="number"
                      min="1"
                      value={config.passengers || ""}
                      onChange={(e) =>
                        onMultipleConfigChange(index, {
                          passengers: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Es. 2"
                      className={getFieldError(`configs.${index}.passengers`) ? "border-red-500" : ""}
                    />
                    {getFieldError(`configs.${index}.passengers`) && (
                      <p className="text-red-500 text-sm mt-1" role="alert">
                        {getFieldError(`configs.${index}.passengers`)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Bagagli *</label>
                    <Input
                      type="number"
                      min="0"
                      value={config.luggage || ""}
                      onChange={(e) =>
                        onMultipleConfigChange(index, {
                          luggage: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Es. 2"
                      className={getFieldError(`configs.${index}.luggage`) ? "border-red-500" : ""}
                    />
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
