"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import { CalendarIcon, MapPin, Clock, Route } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { PlacesAutocomplete } from "@/components/places-autocomplete"
import { LocationSelector } from "@/components/location-selector"
import { timeUtils } from "@/lib/time-utils"
import type { Journey, ValidationError, BookingOptions, ServiceType } from "@/lib/booking-types"
import { useEffect, useState } from "react"
import { isOlympicPeriod } from "@/lib/olympic-pricing"

interface JourneySectionProps {
  journey: Journey
  errors: ValidationError[]
  optionsErrors?: ValidationError[]
  hasAttemptedSubmit: boolean
  onChange: (journey: Partial<Journey>) => void
  serviceType: ServiceType
  options: BookingOptions
  onOptionsChange: (options: Partial<BookingOptions>) => void
  dictionary: any
  isDestinationDisabled?: () => boolean
}

export function JourneySection({ journey, errors, optionsErrors = [], hasAttemptedSubmit, onChange, serviceType, options, onOptionsChange, dictionary, isDestinationDisabled }: JourneySectionProps) {
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false)
  const [is24HourFormat, setIs24HourFormat] = useState(false)

  // Check if we're in Olympic period for special disposition logic
  const isOlympicPeriod_local = journey.date ? isOlympicPeriod(journey.date) : false
  const isDispositionService = serviceType === "disposizione" || serviceType === "ceremony-disposition"
  const useOlympicDurationLogic = isOlympicPeriod_local && isDispositionService

  // Set default minutes to "00" if not already set
  useEffect(() => {
    if (!journey.minutes) {
      onChange({ minutes: "00" })
    }
    if ((serviceType === "disposizione" || serviceType === "ceremony-disposition") && !journey.endMinutes) {
      onChange({ endMinutes: "00" })
    }
  }, [journey.minutes, journey.endMinutes, serviceType, onChange])

  // Auto-calculate end time when start time or duration changes (Olympic logic)
  useEffect(() => {
    if (useOlympicDurationLogic && journey.time && journey.minutes && journey.serviceDuration) {
      const durationHours = parseInt(journey.serviceDuration)
      
      // Use unified time conversion
      const startTime = timeUtils.to24h(journey.time, journey.minutes, journey.timeAmPm)
      const totalEndMinutes = startTime.totalMinutes + (durationHours * 60)
      
      // Convert back to hour/minute format
      const endHour24 = Math.floor(totalEndMinutes / 60) % 24
      const endMinutes = totalEndMinutes % 60
      
      if (is24HourFormat) {
        onChange({
          endTime: endHour24.toString().padStart(2, '0'),
          endMinutes: endMinutes.toString().padStart(2, '0'),
          endTimeAmPm: undefined
        })
      } else {
        const { hour12, ampm } = timeUtils.to12h(endHour24)
        onChange({
          endTime: hour12,
          endMinutes: endMinutes.toString().padStart(2, '0'),
          endTimeAmPm: ampm
        })
      }
    }
  }, [journey.time, journey.minutes, journey.timeAmPm, journey.serviceDuration, is24HourFormat, useOlympicDurationLogic, onChange])

  // Convert between formats when switching
  const handleFormatChange = (new24HourFormat: boolean) => {
    setIs24HourFormat(new24HourFormat)
    
    // Convert existing times
    if (journey.time && journey.minutes) {
      if (new24HourFormat && journey.timeAmPm) {
        // Converting from 12h to 24h
        const converted = timeUtils.to24h(journey.time, journey.minutes, journey.timeAmPm)
        onChange({
          time: converted.hour24.toString().padStart(2, '0'),
          minutes: (journey.minutes || "00").padStart(2, '0'),
          timeAmPm: undefined
        })
      } else if (!new24HourFormat && !journey.timeAmPm) {
        // Converting from 24h to 12h
        const hour24 = parseInt(journey.time)
        const converted = timeUtils.to12h(hour24)
        onChange({
          time: converted.hour12,
          minutes: journey.minutes,
          timeAmPm: converted.ampm
        })
      }
    }

    // Convert end time for disposizione
    if ((serviceType === "disposizione" || serviceType === "ceremony-disposition") && journey.endTime && journey.endMinutes) {
      if (new24HourFormat && journey.endTimeAmPm) {
        // Converting from 12h to 24h
        const converted = timeUtils.to24h(journey.endTime, journey.endMinutes, journey.endTimeAmPm)
        onChange({
          endTime: converted.hour24.toString().padStart(2, '0'),
          endMinutes: (journey.endMinutes || "00").padStart(2, '0'),
          endTimeAmPm: undefined
        })
      } else if (!new24HourFormat && !journey.endTimeAmPm) {
        // Converting from 24h to 12h
        const hour24 = parseInt(journey.endTime)
        const converted = timeUtils.to12h(hour24)
        onChange({
          endTime: converted.hour12,
          endMinutes: journey.endMinutes,
          endTimeAmPm: converted.ampm
        })
      }
    }
  }

  // Geocode addresses when they change (for event pricing matching) - ONLY for custom addresses
  useEffect(() => {
    const geocodeAddress = async (address: string, type: 'pickup' | 'destination') => {
      if (!address || address.length < 3) return

      try {
        const response = await fetch('/api/geocode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.coordinates) {
            onChange({
              [type]: {
                ...journey[type],
                coordinates: data.coordinates
              }
            })
          }
        }
      } catch (error) {
        }
    }

    // Only geocode if:
    // 1. We have an address
    // 2. No coordinates yet
    // 3. It's a CUSTOM address (not from listino)
    if (journey.pickup?.address && 
        !journey.pickup.coordinates && 
        journey.pickup.isCustom) {
      geocodeAddress(journey.pickup.address, 'pickup')
    }

    if (journey.destination?.address && 
        !journey.destination.coordinates && 
        journey.destination.isCustom) {
      geocodeAddress(journey.destination.address, 'destination')
    }
  }, [
    journey.pickup?.address, 
    journey.destination?.address,
    !!journey.pickup?.coordinates,
    !!journey.destination?.coordinates,
    journey.pickup?.isCustom,
    journey.destination?.isCustom
  ])

  // Calculate distance only for transfers and inter-cluster
  useEffect(() => {
    const calculateDistance = async () => {
      if (serviceType !== "transfer" && serviceType !== "inter-cluster") return

      if (
        journey.pickup?.address &&
        journey.destination?.address &&
        journey.pickup.address !== journey.destination.address &&
        journey.pickup.placeId &&
        journey.destination.placeId
      ) {
        setIsCalculatingDistance(true)

        try {
          const requestBody = {
            origins: [journey.pickup.address],
            destinations: [journey.destination.address],
          }

          const response = await fetch("/api/distance", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          })

          if (response.ok) {
            const data = await response.json()
            onChange({
              distance: {
                km: data.distance.km,
                text: data.distance.text,
                duration: data.distance.duration,
              },
            })
          }
        } catch (error) {
          } finally {
          setIsCalculatingDistance(false)
        }
      }
    }

    calculateDistance()
  }, [
    serviceType,
    journey.pickup?.address,
    journey.destination?.address,
    journey.pickup?.placeId,
    journey.destination?.placeId,
    onChange,
  ])

  const getFieldError = (field: string) => {
    const error = errors.find((error) => error.field.includes(field))
    if (!error) return undefined
    
    // Return translated messages instead of raw Zod messages
    switch (field) {
      case "pickup":
        return dictionary.pickupRequired
      case "destination":
        return dictionary.destinationRequired
      case "time":
      case "startTime":
        return dictionary.startTimeRequired
      case "endTime":
        return dictionary.endTimeRequired
      case "duration":
      case "serviceDuration":
        return dictionary.durationRequired
      default:
        return error.message
    }
  }

  const getOptionsFieldError = (field: string) => {
    const error = optionsErrors.find((error) => error.field.includes(field))
    if (!error) return undefined
    
    // Return translated messages instead of raw Zod messages
    switch (field) {
      case "flight":
        return dictionary.flightRequired
      default:
        return error.message
    }
  }

  const hasFieldError = (field: string) => {
    return hasAttemptedSubmit && !!getFieldError(field)
  }

  const hasOptionsFieldError = (field: string) => {
    return hasAttemptedSubmit && !!getOptionsFieldError(field)
  }

  const isEndTimeValid = () => {
    if (serviceType !== "disposizione" && serviceType !== "ceremony-disposition") return true
    if (!journey.time || !journey.minutes || !journey.endTime || !journey.endMinutes) return true
    if (!is24HourFormat && (!journey.timeAmPm || !journey.endTimeAmPm)) return true

    const startTime = timeUtils.to24h(journey.time, journey.minutes, journey.timeAmPm)
    const endTime = timeUtils.to24h(journey.endTime, journey.endMinutes, journey.endTimeAmPm)

    return endTime.totalMinutes > startTime.totalMinutes
  }

  const isEndTimeDisabled = () => {
    const isDispositionType = serviceType === "disposizione" || serviceType === "ceremony-disposition"
    if (is24HourFormat) {
      return isDispositionType && (!journey.time || !journey.minutes)
    } else {
      return isDispositionType && (!journey.time || !journey.minutes || !journey.timeAmPm)
    }
  }

  // Helper to get service title
  const getServiceTitle = () => {
    if (serviceType === "transfer" || serviceType === "inter-cluster") {
      return dictionary.title || "Dettagli Viaggio"
    }
    return dictionary.titleService || "Dettagli Servizio"
  }

  // Helper to get service icon  
  const getServiceIcon = () => {
    switch (serviceType) {
      case "inter-cluster":
        return ""
      case "disposizione":
        return ""
      case "ceremony-disposition":
        return ""
      default:
        return <Route className="h-5 w-5" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getServiceIcon()}
          {getServiceTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pickup Address */}
        <LocationSelector
          label={
            serviceType === "transfer" || serviceType === "inter-cluster"
              ? dictionary.pickupLabel 
              : dictionary.meetingPointLabel
          }
          value={{
            address: journey.pickup?.address || "",
            placeId: journey.pickup?.placeId || "",
            coordinates: journey.pickup?.coordinates,
            locationId: journey.pickup?.locationId,
            isCustom: journey.pickup?.isCustom
          }}
          onChange={(value) => {
            onChange({
              pickup: {
                address: value.address,
                placeId: value.placeId,
                coordinates: value.coordinates,
                locationId: value.locationId,
                isCustom: value.isCustom
              }
            })
          }}
          placeholder={
            serviceType === "transfer" || serviceType === "inter-cluster"
              ? dictionary.pickupPlaceholder 
              : dictionary.meetingPlaceholder
          }
          customPlaceholder={
            serviceType === "transfer" || serviceType === "inter-cluster"
              ? dictionary.pickupPlaceholder 
              : dictionary.meetingPlaceholder
          }
          error={hasFieldError("pickup") ? getFieldError("pickup") : undefined}
          journeyDate={journey.date}
          dictionary={dictionary}
        />

        {/* Destination Address - Always shown */}
        <LocationSelector
          label={
            serviceType === "transfer" || serviceType === "inter-cluster"
              ? dictionary.destinationLabel 
              : dictionary.dropoffLabel
          }
          value={{
            address: journey.destination?.address || "",
            placeId: journey.destination?.placeId || "",
            coordinates: journey.destination?.coordinates,
            locationId: journey.destination?.locationId,
            isCustom: journey.destination?.isCustom
          }}
          onChange={(value) => {
            onChange({
              destination: {
                address: value.address,
                placeId: value.placeId,
                coordinates: value.coordinates,
                locationId: value.locationId,
                isCustom: value.isCustom
              }
            })
          }}
          placeholder={
            serviceType === "transfer" || serviceType === "inter-cluster"
              ? dictionary.selectDestination || "Select destination"
              : dictionary.selectDropoffPoint || "Seleziona punto di rientro"
          }
          customPlaceholder={
            serviceType === "transfer" || serviceType === "inter-cluster"
              ? dictionary.destinationPlaceholder 
              : dictionary.dropoffPlaceholder
          }
          error={hasFieldError("destination") ? getFieldError("destination") : undefined}
          journeyDate={journey.date}
          dictionary={dictionary}
          disabled={isDestinationDisabled?.()}
        />

        {/* Distance Info - Only for Transfer types */}
        {(serviceType === "transfer" || serviceType === "inter-cluster") && (journey.distance || isCalculatingDistance) && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">{dictionary.routeInfo}</span>
            </div>
            {isCalculatingDistance ? (
              <p className="text-sm text-blue-700">{dictionary.calculatingDistance}</p>
            ) : (
              journey.distance && (
                <div className="space-y-1 text-sm text-blue-700">
                  <p>
                    <strong>{dictionary.distance}</strong> {journey.distance.text} ({journey.distance.km} km)
                  </p>
                  <p>
                    <strong>{dictionary.estimatedDuration}</strong> {journey.distance.duration}
                  </p>
                </div>
              )
            )}
          </div>
        )}

        {/* Route Info - Only for Disposition types */}
        {(serviceType === "disposizione" || serviceType === "ceremony-disposition") && journey.pickup?.address && journey.destination?.address && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Route className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-purple-900">{dictionary.serviceRoute}</span>
            </div>
            <div className="space-y-1 text-sm text-purple-700">
              <p>
                <strong>{dictionary.from}</strong> {journey.pickup.address}
              </p>
              <p>
                <strong>{dictionary.to}</strong> {journey.destination.address}
              </p>
              <p className="text-xs text-purple-600 mt-2">
                {dictionary.priceNote}
              </p>
            </div>
          </div>
        )}

        {/* Date and Time */}
        <div className="space-y-4">

          {/* Time Format Switch */}
          {/* <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <Label htmlFor="time-format" className="text-sm font-medium">
              {dictionary.timeFormat || "Time format:"}
            </Label>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${!is24HourFormat ? 'font-medium' : 'text-gray-500'}`} style={{color: !is24HourFormat ? '#b91c1c' : undefined}}>
                {dictionary.timeFormat12h || "12h (AM/PM)"}
              </span>
              <div className="relative">
                <Switch
                  id="time-format"
                  checked={is24HourFormat}
                  onCheckedChange={handleFormatChange}
                  className="!rounded-full !h-6 !w-11 !border-0 focus-visible:!ring-0 focus-visible:!ring-offset-0"
                  style={{
                    backgroundColor: is24HourFormat ? '#b91c1c' : '#d1d5db'
                  }}
                />
                <style dangerouslySetInnerHTML={{
                  __html: `
                    #time-format {
                      border-radius: 9999px !important;
                    }
                    #time-format span[data-state] {
                      background-color: white !important;
                      border-radius: 50% !important;
                      width: 20px !important;
                      height: 20px !important;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
                      transition: transform 0.2s ease !important;
                    }
                    #time-format span[data-state="unchecked"] {
                      transform: translateX(2px) !important;
                    }
                    #time-format span[data-state="checked"] {
                      transform: translateX(22px) !important;
                    }
                  `
                }} />
              </div>
              <span className={`text-sm ${is24HourFormat ? 'font-medium' : 'text-gray-500'}`} style={{color: is24HourFormat ? '#b91c1c' : undefined}}>
                {dictionary.timeFormat24h || "24h (European)"}
              </span>
            </div>
          </div> */}

          {/* Time Section */}
          <div className={`grid gap-6 ${(serviceType === "disposizione" || serviceType === "ceremony-disposition") ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="time" className={hasFieldError("time") || (hasAttemptedSubmit && !journey.time) ? "text-red-500" : ""}>{(serviceType === "transfer" || serviceType === "inter-cluster") ? dictionary.startTimeLabel : dictionary.startServiceLabel}</Label>
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <Input
                  id="time"
                  type="number"
                  min={is24HourFormat ? "0" : "1"}
                  max={is24HourFormat ? "23" : "12"}
                  value={journey.time}
                  onChange={(e) => {
                    const value = e.target.value
                    const min = is24HourFormat ? 0 : 1
                    const max = is24HourFormat ? 23 : 12
                    // Permetti campo vuoto o valori validi
                    if (value === "" || (parseInt(value) >= min && parseInt(value) <= max)) {
                      onChange({ time: value })
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value
                    if (value === "") return
                    
                    const numValue = parseInt(value)
                    const min = is24HourFormat ? 0 : 1
                    const max = is24HourFormat ? 23 : 12
                    
                    // Correggi se fuori range
                    if (numValue < min) {
                      onChange({ time: min.toString() })
                    } else if (numValue > max) {
                      onChange({ time: max.toString() })
                    } else if (is24HourFormat && numValue >= 0 && numValue <= 23) {
                      // In formato 24h, formatta sempre con 2 cifre (00, 01, 02, ..., 23)
                      onChange({ time: numValue.toString().padStart(2, '0') })
                    }
                  }}
                  placeholder={is24HourFormat ? "00" : "12"}
                  className={`w-20 text-center ${hasFieldError("time") || (hasAttemptedSubmit && !journey.time) ? "border-red-500" : ""}`}
                />
                <span className="flex-shrink-0">:</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={journey.minutes === "00" ? "" : (journey.minutes || "")}
                  onChange={(e) => {
                    const value = e.target.value
                    // Permetti campo vuoto o valori validi (0-59)
                    if (value === "") {
                      onChange({ minutes: "00" })
                    } else if (parseInt(value) >= 0 && parseInt(value) <= 59) {
                      onChange({ minutes: value })
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value
                    if (value === "") {
                      onChange({ minutes: "00" })
                    } else {
                      const numValue = parseInt(value)
                      // Se il valore è fuori range, correggi
                      if (numValue < 0) onChange({ minutes: "00" })
                      if (numValue > 59) onChange({ minutes: "59" })
                      // Aggiungi zero davanti se necessario
                      if (numValue >= 0 && numValue <= 59) {
                        onChange({ minutes: numValue.toString().padStart(2, '0') })
                      }
                    }
                  }}
                  placeholder="00"
                  className={`w-20 text-center ${hasFieldError("time") || (hasAttemptedSubmit && !journey.time) ? "border-red-500" : ""}`}
                />
                {!is24HourFormat && (
                  <Select
                    value={journey.timeAmPm || "AM"}
                    onValueChange={(value) => onChange({ timeAmPm: value })}
                  >
                    <SelectTrigger className="w-20 flex-shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              {hasAttemptedSubmit && !journey.time && (
                <p className="text-red-500 text-sm mt-1" role="alert">
                  {dictionary.startTimeRequired}
                </p>
              )}
            </div>

            {/* End Time - Only for Disposition */}
            {(serviceType === "disposizione" || serviceType === "ceremony-disposition") && (
              <div className="space-y-2">
                {useOlympicDurationLogic ? (
                  /* Olympic Logic: Duration Selection */
                  <>
                    <Label htmlFor="serviceDuration" className={hasAttemptedSubmit && !journey.serviceDuration ? "text-red-500" : ""}>{dictionary.serviceDuration} *</Label>
                    <Select
                      value={journey.serviceDuration || ""}
                      onValueChange={(value) => onChange({ serviceDuration: value })}
                    >
                      <SelectTrigger className={`w-full ${hasAttemptedSubmit && !journey.serviceDuration ? "border-red-500" : ""}`}>
                        <SelectValue placeholder={dictionary.selectDuration || "Seleziona durata"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4 {dictionary.serviceHours || "ore"}</SelectItem>
                        <SelectItem value="6">6 {dictionary.serviceHours || "ore"}</SelectItem>
                        <SelectItem value="8">8 {dictionary.serviceHours || "ore"}</SelectItem>
                      </SelectContent>
                    </Select>
                    {hasAttemptedSubmit && !journey.serviceDuration && (
                      <p className="text-red-500 text-sm mt-1" role="alert">
                        {dictionary.durationRequired}
                      </p>
                    )}
                  </>
                ) : (
                  /* Standard Logic: Manual End Time */
                  <>
                    <Label htmlFor="endTime" className={hasAttemptedSubmit && !journey.endTime ? "text-red-500" : ""}>{dictionary.endTimeLabel}</Label>
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <Input
                    id="endTime"
                    type="number"
                    min={is24HourFormat ? "0" : "1"}
                    max={is24HourFormat ? "23" : "12"}
                    value={journey.endTime || ""}
                    onChange={(e) => {
                      const value = e.target.value
                      const min = is24HourFormat ? 0 : 1
                      const max = is24HourFormat ? 23 : 12
                      // Permetti campo vuoto o valori validi
                      if (value === "" || (parseInt(value) >= min && parseInt(value) <= max)) {
                        onChange({ endTime: value })
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value
                      if (value === "") return
                      
                      const numValue = parseInt(value)
                      const min = is24HourFormat ? 0 : 1
                      const max = is24HourFormat ? 23 : 12
                      
                      // Correggi se fuori range
                      if (numValue < min) {
                        onChange({ endTime: min.toString() })
                      } else if (numValue > max) {
                        onChange({ endTime: max.toString() })
                      } else if (is24HourFormat && numValue >= 0 && numValue <= 23) {
                        // In formato 24h, formatta sempre con 2 cifre (00, 01, 02, ..., 23)
                        onChange({ endTime: numValue.toString().padStart(2, '0') })
                      }
                    }}
                    placeholder={is24HourFormat ? "00" : "12"}
                        className={`w-20 text-center ${hasAttemptedSubmit && !journey.endTime ? "border-red-500" : ""}`}
                    disabled={isEndTimeDisabled()}
                  />
                  <span className="flex-shrink-0">:</span>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={journey.endMinutes === "00" ? "" : (journey.endMinutes || "")}
                    onChange={(e) => {
                      const value = e.target.value
                      // Permetti campo vuoto o valori validi (0-59)
                      if (value === "") {
                        onChange({ endMinutes: "00" })
                      } else if (parseInt(value) >= 0 && parseInt(value) <= 59) {
                        onChange({ endMinutes: value })
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value
                      if (value === "") {
                        onChange({ endMinutes: "00" })
                      } else {
                        const numValue = parseInt(value)
                        // Se il valore è fuori range, correggi
                        if (numValue < 0) onChange({ endMinutes: "00" })
                        if (numValue > 59) onChange({ endMinutes: "59" })
                        // Aggiungi zero davanti se necessario
                        if (numValue >= 0 && numValue <= 59) {
                          onChange({ endMinutes: numValue.toString().padStart(2, '0') })
                        }
                      }
                    }}
                    placeholder="00"
                        className={`w-20 text-center ${hasAttemptedSubmit && !journey.endTime ? "border-red-500" : ""}`}
                    disabled={isEndTimeDisabled()}
                  />
                  {!is24HourFormat && (
                    <Select
                      value={journey.endTimeAmPm || "AM"}
                      onValueChange={(value) => onChange({ endTimeAmPm: value })}
                      disabled={isEndTimeDisabled()}
                    >
                      <SelectTrigger className="w-20 flex-shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                    {hasAttemptedSubmit && !journey.endTime && (
                      <p className="text-red-500 text-sm mt-1" role="alert">
                        {dictionary.endTimeRequired}
                      </p>
                    )}
                {!isEndTimeValid() && (
                  <p className="text-sm text-red-500">{dictionary.endTimeInvalid}</p>
                )}
                {isEndTimeDisabled() && <p className="text-sm text-gray-500">{dictionary.selectStartTime}</p>}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Duration Info - Only for Disposition */}
        {(serviceType === "disposizione" || serviceType === "ceremony-disposition") &&
          journey.time &&
          journey.minutes &&
          (is24HourFormat || journey.timeAmPm) &&
          (
            useOlympicDurationLogic 
              ? (journey.serviceDuration && journey.endTime && journey.endMinutes) 
              : (journey.endTime && journey.endMinutes && (is24HourFormat || journey.endTimeAmPm) && isEndTimeValid())
          ) && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">{dictionary.serviceDuration}</span>
              </div>
              <div className="text-sm text-green-700">
                {useOlympicDurationLogic ? (
                  /* Olympic Logic: Use selected duration */
                  <div className="space-y-1">
                    <p>
                      <strong>{dictionary.selectedTime || "Tempo selezionato"}:</strong> {journey.serviceDuration}h
                    </p>
                    <p>
                      <strong>{dictionary.hourlyRate}</strong>
                    </p>
                  </div>
                ) : (
                  /* Standard Logic: Calculate duration from times */
                  (() => {
                  const startTime = timeUtils.to24h(journey.time, journey.minutes, journey.timeAmPm)
                    const endTime = timeUtils.to24h(journey.endTime!, journey.endMinutes!, journey.endTimeAmPm)
                  const durationMinutes = endTime.totalMinutes - startTime.totalMinutes
                  const hours = Math.floor(durationMinutes / 60)
                  const minutes = durationMinutes % 60
                  const billingHours = Math.ceil(durationMinutes / 60)

                  return (
                    <div className="space-y-1">
                      <p>
                        <strong>{dictionary.effectiveDuration}</strong> {hours}h {minutes}m
                      </p>
                      <p>
                        <strong>{dictionary.billableHours}</strong> {billingHours}h ({dictionary.roundedUp || "arrotondato per eccesso"})
                      </p>
                      <p>
                        <strong>{dictionary.hourlyRate}</strong>
                      </p>
                    </div>
                  )
                  })()
                )}
              </div>
            </div>
          )}

        {/* Flight and Departure City */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Flight/Train Number */}
          <div className="space-y-2">
            <Label htmlFor="flight" className={hasOptionsFieldError("flight") ? "text-red-500" : ""}>{dictionary.flightLabel}</Label>
            <Input
              type="text"
              id="flight"
              value={options.flight || ""}
              onChange={(e) => onOptionsChange({ flight: e.target.value })}
              placeholder={dictionary.flightPlaceholder}
              className={hasOptionsFieldError("flight") ? "border-red-500" : ""}
            />
            <p className="text-xs text-gray-500 mt-1">
              {dictionary.flightNote}
            </p>
            {hasOptionsFieldError("flight") && (
              <p className="text-red-500 text-sm mt-1" role="alert">
                {getOptionsFieldError("flight")}
              </p>
            )}
          </div>

          {/* Departure City */}
          <div className="space-y-2">
            <Label htmlFor="departureCity">{dictionary.departureCityLabel}</Label>
            <Input
              type="text"
              id="departureCity"
              value={options.departureCity || ""}
              onChange={(e) => onOptionsChange({ departureCity: e.target.value })}
              placeholder={dictionary.departureCityPlaceholder}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

