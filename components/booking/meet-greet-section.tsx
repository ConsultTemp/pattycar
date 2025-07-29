"use client"

import { useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Info, MapPin, Clock, Users, Luggage, AlertTriangle, CheckCircle2 } from "lucide-react"
import { findMeetGreetService, findMeetGreetServiceByLocation, resolveLocationForPricing, calculateMeetGreetPrice, isNightTime, type MeetGreetServiceWithId } from "@/lib/event-pricing"
import type { MeetGreetConfig, Journey, PricingResult } from "@/lib/booking-types"

interface MeetGreetSectionProps {
  config: MeetGreetConfig
  journey: Journey
  errors: string[]
  onChange: (config: Partial<MeetGreetConfig>) => void
  pricing?: PricingResult | null
  dictionary: any
}

export function MeetGreetSection({
  config,
  journey,
  errors,
  onChange,
  pricing,
  dictionary
}: MeetGreetSectionProps) {
  // ENHANCED: Automatically detect Meet & Greet service with Milano area support
  const availableService = useMemo(() => {
    // Resolve pickup and destination (handles Milano metropolitan area)
    const resolvedPickup = resolveLocationForPricing(
      journey.pickup?.locationId, 
      journey.pickup?.coordinates
    )
    const resolvedDestination = resolveLocationForPricing(
      journey.destination?.locationId, 
      journey.destination?.coordinates
    )

    // Try location-based matching first (now handles Milano area correctly)
    if (resolvedPickup.resolvedLocationId || resolvedDestination.resolvedLocationId) {
      const service = findMeetGreetServiceByLocation(
        resolvedPickup.resolvedLocationId,
        resolvedDestination.resolvedLocationId
      )
      if (service) return service
    }

    // Fallback to coordinate-based matching
    if (resolvedPickup.resolvedCoordinates && resolvedDestination.resolvedCoordinates) {
      return findMeetGreetService(resolvedPickup.resolvedCoordinates, resolvedDestination.resolvedCoordinates)
    }

    return null
  }, [
    journey.pickup?.locationId, 
    journey.destination?.locationId,
    journey.pickup?.coordinates, 
    journey.destination?.coordinates
  ])

  // Auto-configure service when detected
  useEffect(() => {
    if (availableService && config.enabled && config.serviceId !== availableService.serviceId) {
      onChange({
        serviceId: availableService.serviceId,
        selectedService: availableService.type,
        passengers: Math.max(1, config.passengers),
        children: config.children,
        infants: config.infants,
        extraLuggage: config.extraLuggage,
        extraHours: config.extraHours,
        specialServices: config.specialServices || {}
      })
    }
  }, [availableService, config.enabled, config.serviceId, onChange])

  // Selected service is now the automatically detected one
  const selectedService = config.enabled ? availableService : null

  // Detect if journey is at night time
  const isNightService = useMemo(() => {
    if (!journey.time || !journey.minutes || !journey.timeAmPm) return false
    const timeStr = `${journey.time.padStart(2, '0')}:${journey.minutes.padStart(2, '0')} ${journey.timeAmPm}`
    return isNightTime(timeStr)
  }, [journey.time, journey.minutes, journey.timeAmPm])

  // Calculate pricing for selected service
  const meetGreetPricing = useMemo(() => {
    if (!selectedService || !config.enabled) return null
    
    return calculateMeetGreetPrice(selectedService, {
      passengers: config.passengers,
      children: config.children,
      infants: config.infants,
      extraLuggage: config.extraLuggage,
      extraHours: config.extraHours,
      specialServices: config.specialServices,
      isNight: isNightService,
      serviceDate: journey.date // Pass service date for holiday surcharge
    }, dictionary)
  }, [selectedService, config, isNightService, journey.date])

  // Detect if journey is on a holiday
  const isHolidayService = useMemo(() => {
    if (!journey.date) return false
    // Check if the date is a holiday based on pricing calculation
    // This will be determined by the pricing system
    return meetGreetPricing?.breakdown.some(item => 
      item.description?.toLowerCase().includes('festiv') || 
      item.description?.toLowerCase().includes('holiday') ||
      item.description?.toLowerCase().includes('domenica') ||
      item.description?.toLowerCase().includes('sabato')
    ) || false
  }, [journey.date, meetGreetPricing])

  // Validation functions
  const getPassengerLimit = (serviceType?: string) => {
    if (!selectedService) return 8
    
    return selectedService.maxPassengers
  }

  const getLuggageLimit = () => {
    if (!selectedService) return 10
    return selectedService.maxLuggageForNightSurcharge
  }

  // Check if current configuration exceeds limits
  const passengerLimit = getPassengerLimit()
  const luggageLimit = getLuggageLimit()
  const totalPassengers = config.passengers + config.children + config.infants
  
  const isPassengerLimitExceeded = totalPassengers > passengerLimit
  const isLuggageLimitExceeded = config.extraLuggage > luggageLimit

  // Service selection is now automatic - no need for this function
  // Keeping for backward compatibility but it's not used anymore

  // Handle special services for Venice combo logic
  const handleSpecialServiceChange = (serviceKey: string, enabled: boolean) => {
    if (!selectedService) return

    const newSpecialServices = { ...config.specialServices }

    // Venice special case: Fast Track + VIP Lounge must be together
    if (selectedService.location.includes("Venezia") && selectedService.type.includes("departures")) {
      if (serviceKey === "fastTrack" || serviceKey === "vipLounge") {
        // If enabling either, enable both
        if (enabled) {
          newSpecialServices.veniceCombo = true
          delete newSpecialServices.fastTrack
          delete newSpecialServices.vipLounge
        } else {
          // If disabling, disable both
          delete newSpecialServices.veniceCombo
          delete newSpecialServices.fastTrack
          delete newSpecialServices.vipLounge
        }
      }
    } else {
      // Standard logic for other airports
      if (enabled) {
        newSpecialServices[serviceKey as keyof typeof newSpecialServices] = true
      } else {
        delete newSpecialServices[serviceKey as keyof typeof newSpecialServices]
      }
    }

    onChange({ specialServices: newSpecialServices })
  }

  // FIXED: Show automatically detected service (NO CHOICE)
  const renderServiceInfo = () => {
    if (!availableService) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {dictionary.notAvailable}
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <div className="space-y-4">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <strong>{dictionary.autoDetected}</strong> {availableService.location}
          </AlertDescription>
        </Alert>

        <div className="p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">{availableService.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {availableService.type.includes("arrivals") ? dictionary.arrivals : dictionary.departures}
              </Badge>
              <Badge variant="secondary">€{availableService.basePrice}</Badge>
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-2">
            <p>• {dictionary.includesService.replace('{luggage}', availableService.includedLuggage)}</p>
            <p>• {dictionary.extraPassenger.replace('{price}', availableService.extraPassengerPrice)}</p>
            <p>• {dictionary.extraLuggage.replace('{price}', availableService.extraLuggagePrice)}</p>
            {isNightService && (
              <p>• <strong>{dictionary.nightServiceDetected.replace('{start}', availableService.nightSurchargeHours.start).replace('{end}', availableService.nightSurchargeHours.end)}</strong></p>
            )}
            {isHolidayService && (
              <p>• <strong>{dictionary.meetGreet?.holidayServiceDetected || "HOLIDAY SUPPLEMENT APPLIED"}</strong></p>
            )}
          </div>

          {/* Constraints */}
          {availableService.constraints.length > 0 && (
            <div className="text-xs text-amber-600 space-y-1">
              {availableService.constraints.map((constraint: string, idx: number) => (
                <div key={idx} className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{dictionary.constraintTranslations?.[constraint] || constraint}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Render passenger configuration
  const renderPassengerConfig = () => {
    if (!selectedService) return null

    return (
      <div className="space-y-4">
        <h4 className="font-medium">{dictionary.passengerConfiguration}</h4>
        
        {/* Passenger limits warning */}
        {isPassengerLimitExceeded && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {dictionary.maxPassengersAllowed.replace('{max}', passengerLimit.toString())}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {dictionary.meetGreet?.adults || dictionary.adults}
            </label>
            <input
              type="number"
              min="1"
              max={passengerLimit}
              value={config.passengers || ""}
              onChange={(e) => {
                const value = e.target.value
                if (value === "") {
                  // Allow empty field during typing
                  onChange({ passengers: 0 })
                } else {
                  const numValue = parseInt(value) || 0
                  const validValue = Math.min(Math.max(numValue, 1), passengerLimit)
                  onChange({ passengers: validValue })
                }
              }}
              onBlur={(e) => {
                // On blur, ensure at least 1 passenger if field is empty
                if (!e.target.value || parseInt(e.target.value) < 1) {
                  onChange({ passengers: 1 })
                }
              }}
              placeholder={dictionary.exampleNumber || "Es. 2"}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              disabled={isPassengerLimitExceeded}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {dictionary.meetGreet?.children || dictionary.children} <Badge variant="secondary">{dictionary.meetGreet?.halfRate || dictionary.halfRate}</Badge>
            </label>
            <input
              type="number"
              min="0"
              max={Math.max(0, passengerLimit - config.passengers - config.infants)}
              value={config.children || ""}
              onChange={(e) => {
                const value = e.target.value
                if (value === "") {
                  onChange({ children: 0 })
                } else {
                  const numValue = parseInt(value) || 0
                  const maxChildren = Math.max(0, passengerLimit - config.passengers - config.infants)
                  const validValue = Math.min(Math.max(numValue, 0), maxChildren)
                  onChange({ children: validValue })
                }
              }}
              placeholder={dictionary.exampleNumber || "Es. 1"}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              disabled={isPassengerLimitExceeded}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {dictionary.meetGreet?.infants || dictionary.infants} <Badge variant="secondary">{dictionary.freeRate}</Badge>
            </label>
            <input
              type="number"
              min="0"
              max={Math.max(0, passengerLimit - config.passengers - config.children)}
              value={config.infants || ""}
              onChange={(e) => {
                const value = e.target.value
                if (value === "") {
                  onChange({ infants: 0 })
                } else {
                  const numValue = parseInt(value) || 0
                  const maxInfants = Math.max(0, passengerLimit - config.passengers - config.children)
                  const validValue = Math.min(Math.max(numValue, 0), maxInfants)
                  onChange({ infants: validValue })
                }
              }}
              placeholder={dictionary.exampleNumber || "Es. 1"}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              disabled={isPassengerLimitExceeded}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>{dictionary.totalPassengersCount.replace('{current}', totalPassengers.toString()).replace('{max}', passengerLimit.toString())}</span>
        </div>
      </div>
    )
  }

  // Render luggage configuration
  const renderLuggageConfig = () => {
    if (!selectedService) return null

    const showNightLuggageLimit = isNightService && selectedService.maxLuggageForNightSurcharge > 0

    return (
      <div className="space-y-4">
                    <h4 className="font-medium">{dictionary.meetGreet?.luggageConfiguration || dictionary.luggageConfiguration}</h4>
        
        <div className="text-sm text-green-600 mb-2">
          <CheckCircle2 className="h-4 w-4 inline mr-1" />
          {dictionary.includedLuggagePerPerson.replace('{count}', selectedService.includedLuggage.toString())}
        </div>

        {/* Night luggage limit warning */}
        {showNightLuggageLimit && isLuggageLimitExceeded && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              {dictionary.maxLuggageNightSurcharge.replace('{max}', luggageLimit.toString())}
              {dictionary.currentExtraLuggage?.replace('{count}', config.extraLuggage.toString()) || `Current extra luggage: ${config.extraLuggage}`}
            </AlertDescription>
          </Alert>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            {dictionary.extraLuggageLabel} <Badge variant="outline">{dictionary.eachPrice.replace('{price}', selectedService.extraLuggagePrice.toString())}</Badge>
          </label>
          <input
            type="number"
            min="0"
            max={showNightLuggageLimit ? luggageLimit : 50}
            value={config.extraLuggage || ""}
            onChange={(e) => {
              const value = e.target.value
              if (value === "") {
                onChange({ extraLuggage: 0 })
              } else {
                const numValue = parseInt(value) || 0
                const maxLuggage = showNightLuggageLimit ? luggageLimit : 50
                const validValue = Math.min(Math.max(numValue, 0), maxLuggage)
                onChange({ extraLuggage: validValue })
              }
            }}
            placeholder={dictionary.exampleNumber || "Es. 2"}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          />
          {showNightLuggageLimit && (
            <p className="text-xs text-gray-500 mt-1">
              {dictionary.maxPiecesNightSurcharge.replace('{max}', luggageLimit.toString()).replace('{start}', selectedService.nightSurchargeHours.start).replace('{end}', selectedService.nightSurchargeHours.end)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {dictionary.meetGreet?.extraHoursForDelays || dictionary.extraHoursLabel} <Badge variant="outline">{dictionary.eachPrice.replace('{price}', selectedService.extraHourPrice.toString())}</Badge>
          </label>
          <input
            type="number"
            min="0"
            max="12"
            value={config.extraHours || ""}
            onChange={(e) => {
              const value = e.target.value
              if (value === "") {
                onChange({ extraHours: 0 })
              } else {
                const numValue = parseInt(value) || 0
                const validValue = Math.min(Math.max(numValue, 0), 12)
                onChange({ extraHours: validValue })
              }
            }}
            placeholder={dictionary.exampleNumber || "Es. 1"}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          />
          <p className="text-xs text-gray-500 mt-1">
            {dictionary.afterIncludedHours.replace('{hours}', selectedService.includedHours.toString())}
          </p>
        </div>
      </div>
    )
  }

  // Render special services
  const renderSpecialServices = () => {
    if (!selectedService?.specialServices) return null

    const services = selectedService.specialServices
    // Calculate number of passengers counting for special services (adults + children, excluding infants)
    const passengersForSpecialServices = config.passengers + config.children

    // Check if there are any available special services (excluding TARMAC)
    const hasAvailableServices = services.combo || services.fastTrack || services.vipLounge || services.greeterOnly

    // If no special services are available, don't render anything
    if (!hasAvailableServices) return null

    return (
      <div className="space-y-4">
        <h4 className="font-medium">{dictionary.specialServices}</h4>

        <div className="space-y-3">


          {/* Venice Combo Service */}
          {services.combo && (
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!config.specialServices?.veniceCombo}
                    onChange={(e) => handleSpecialServiceChange('veniceCombo', e.target.checked)}
                    className="text-black"
                  />
                  <span className="font-medium">{services.combo.name}</span>
                  <Badge variant="secondary">
                    €{services.combo.price} × {passengersForSpecialServices} = €{services.combo.price * passengersForSpecialServices}
                  </Badge>
                  <Badge variant="outline">{dictionary.mandatoryTogether}</Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {dictionary.includesServices.replace('{services}', services.combo.includes.join(" + "))}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {dictionary.veniceComboNote}
              </p>
            </div>
          )}

          {/* Standard Fast Track */}
          {services.fastTrack && !services.combo && (
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!config.specialServices?.fastTrack}
                  onChange={(e) => handleSpecialServiceChange('fastTrack', e.target.checked)}
                  className="text-black"
                />
                <span className="font-medium">Fast Track</span>
                <Badge variant="secondary">
                  €{services.fastTrack.price} × {passengersForSpecialServices} = €{services.fastTrack.price * passengersForSpecialServices}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {dictionary.pricePerPassenger}
              </p>
            </div>
          )}

          {/* Standard VIP Lounge */}
          {services.vipLounge && !services.combo && (
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!config.specialServices?.vipLounge}
                  onChange={(e) => handleSpecialServiceChange('vipLounge', e.target.checked)}
                  className="text-black"
                />
                <span className="font-medium">VIP Lounge</span>
                <Badge variant="secondary">
                  €{services.vipLounge.price} × {passengersForSpecialServices} = €{services.vipLounge.price * passengersForSpecialServices}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {dictionary.pricePerPassenger}
              </p>
            </div>
          )}

          {/* Greeter Only (Venice Railway) */}
          {services.greeterOnly && (
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!config.specialServices?.greeterOnly}
                  onChange={(e) => handleSpecialServiceChange('greeterOnly', e.target.checked)}
                  className="text-black"
                />
                <span className="font-medium">Greeter Only</span>
                <Badge variant="secondary">€{services.greeterOnly.price}</Badge>
                <Badge variant="outline">{dictionary.porterOnDemand}</Badge>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Render pricing breakdown
  const renderPricingBreakdown = () => {
    if (!meetGreetPricing) return null

    return (
      <div className="space-y-3">
        <h4 className="font-medium">{dictionary.pricingBreakdown}</h4>
        
        <div className="space-y-2 text-sm">
          {meetGreetPricing.breakdown.map((item: any, index: number) => (
            <div key={index} className="flex justify-between">
              <span>{item.description}</span>
              <span>€{item.amount.toFixed(2)}</span>
            </div>
          ))}
          
          <Separator />
          
          <div className="flex justify-between font-medium text-base">
            <span>{dictionary.totalMeetGreetLabel}</span>
            <span>€{meetGreetPricing.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {dictionary.meetGreetService}
          {isNightService && (
            <Badge variant="outline" className="text-orange-600 border-orange-600 text-lg font-bold px-3 py-1">
              <Clock className="h-4 w-4 mr-1" />
              {dictionary.nightService || "SERVIZIO NOTTURNO"}
            </Badge>
          )}
          {isHolidayService && (
            <Badge variant="outline" className="text-purple-600 border-purple-600 text-lg font-bold px-3 py-1">
              <AlertTriangle className="h-4 w-4 mr-1" />
                              {dictionary.meetGreet?.holidayService || "HOLIDAY SERVICE"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="enableMeetGreet"
            checked={config.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
            className="text-black"
          />
          <label htmlFor="enableMeetGreet" className="font-medium">
            {dictionary.enableService}
          </label>
        </div>

        {config.enabled && (
          <>
            {/* Service Information */}
            {renderServiceInfo()}

            {selectedService && (
              <>
                <Separator />
                
                {/* Service Details */}
                <div className="space-y-4">
                  <h4 className="font-medium">{dictionary.serviceDetails}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    {selectedService.details.map((detail: string, index: number) => (
                      <p key={index}>• {dictionary.detailTranslations?.[detail] || detail}</p>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Passenger Configuration */}
                {renderPassengerConfig()}

                <Separator />

                {/* Luggage Configuration */}
                {renderLuggageConfig()}

                {/* Special Services */}
                {selectedService.specialServices && (
                  <>
                    <Separator />
                    {renderSpecialServices()}
                  </>
                )}

                <Separator />

                {/* Pricing Breakdown */}
                {renderPricingBreakdown()}
              </>
            )}
          </>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {errors.map((error: string, index: number) => (
                <div key={index}>{error}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 