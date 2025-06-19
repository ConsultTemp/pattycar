"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, MapPin, Clock, Route } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { PlacesAutocomplete } from "@/components/places-autocomplete"
import type { Journey, ValidationError, BookingOptions } from "@/lib/booking-types"
import { useEffect, useState } from "react"

interface JourneySectionProps {
  journey: Journey
  errors: ValidationError[]
  onChange: (journey: Partial<Journey>) => void
  serviceType: "transfer" | "disposizione"
  options: BookingOptions
  onOptionsChange: (options: Partial<BookingOptions>) => void
  dictionary: any
}

export function JourneySection({ journey, errors, onChange, serviceType, options, onOptionsChange, dictionary }: JourneySectionProps) {
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false)

  // Helper functions for time conversion
  const convertTo24Hour = (hour: string, minutes: string, ampm: string): { hour24: number, totalMinutes: number } => {
    let hour24 = parseInt(hour)
    if (ampm === "PM" && hour24 !== 12) hour24 += 12
    if (ampm === "AM" && hour24 === 12) hour24 = 0
    return { hour24, totalMinutes: hour24 * 60 + parseInt(minutes) }
  }

  const convertTo12Hour = (hour24: number): { hour12: string, ampm: string } => {
    if (hour24 === 0) return { hour12: "12", ampm: "AM" }
    if (hour24 < 12) return { hour12: hour24.toString(), ampm: "AM" }
    if (hour24 === 12) return { hour12: "12", ampm: "PM" }
    return { hour12: (hour24 - 12).toString(), ampm: "PM" }
  }

  // Calculate distance only for transfers
  useEffect(() => {
    const calculateDistance = async () => {
      if (serviceType !== "transfer") return

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
          console.error("Error calculating distance:", error)
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
    return errors.find((error) => error.field.includes(field))?.message
  }

  const isEndTimeValid = () => {
    if (serviceType !== "disposizione") return true
    if (!journey.time || !journey.minutes || !journey.timeAmPm || !journey.endTime || !journey.endMinutes || !journey.endTimeAmPm) return true

    const startTime = convertTo24Hour(journey.time, journey.minutes, journey.timeAmPm)
    const endTime = convertTo24Hour(journey.endTime, journey.endMinutes, journey.endTimeAmPm)

    return endTime.totalMinutes > startTime.totalMinutes
  }

  const isEndTimeDisabled = () => {
    return serviceType === "disposizione" && (!journey.time || !journey.minutes || !journey.timeAmPm)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            {serviceType === "transfer" ? dictionary.title : dictionary.titleService}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pickup Address */}
          <div className="space-y-2">
            <Label htmlFor="pickup">
              {serviceType === "transfer" ? dictionary.pickupLabel : dictionary.meetingPointLabel}
            </Label>
            <PlacesAutocomplete
              value={journey.pickup?.address || ""}
              onChange={(address, placeId) => {
                onChange({
                  pickup: {
                    address,
                    placeId: placeId || "",
                  },
                })
              }}
              placeholder={serviceType === "transfer" ? dictionary.pickupPlaceholder : dictionary.meetingPlaceholder}
              className={getFieldError("pickup") ? "border-red-500" : ""}
            />
            {getFieldError("pickup") && <p className="text-sm text-red-500">{getFieldError("pickup")}</p>}
          </div>

          {/* Destination Address - Always shown */}
          <div className="space-y-2">
            <Label htmlFor="destination">
              {serviceType === "transfer" ? dictionary.destinationLabel : dictionary.dropoffLabel}
            </Label>
            <PlacesAutocomplete
              value={journey.destination?.address || ""}
              onChange={(address, placeId) => {
                onChange({
                  destination: {
                    address,
                    placeId: placeId || "",
                  },
                })
              }}
              placeholder={
                serviceType === "transfer" ? dictionary.destinationPlaceholder : dictionary.dropoffPlaceholder
              }
              className={getFieldError("destination") ? "border-red-500" : ""}
            />
            {getFieldError("destination") && <p className="text-sm text-red-500">{getFieldError("destination")}</p>}
          </div>

          {/* Distance Info - Only for Transfer */}
          {serviceType === "transfer" && (journey.distance || isCalculatingDistance) && (
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

          {/* Route Info - Only for Disposition */}
          {serviceType === "disposizione" && journey.pickup?.address && journey.destination?.address && (
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
            {/* Date - Full width */}
            <div className="space-y-2">
              <Label>{dictionary.dateLabel}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${!journey.date && "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {journey.date ? format(journey.date, "PPP", { locale: it }) : dictionary.selectDate}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={journey.date}
                    onSelect={(date) => onChange({ date })}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Section */}
            <div className={`grid gap-6 ${serviceType === "disposizione" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
              {/* Start Time */}
              <div className="space-y-2">
                <Label htmlFor="time">{serviceType === "transfer" ? dictionary.startTimeLabel : dictionary.startServiceLabel}</Label>
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <Input
                    id="time"
                    type="number"
                    min="1"
                    max="12"
                    value={journey.time}
                    onChange={(e) => {
                      const value = e.target.value
                      // Permetti campo vuoto o valori validi (1-12)
                      if (value === "" || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
                        onChange({ time: value })
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value)
                      // Se il valore è fuori range, correggi
                      if (value < 1) onChange({ time: "1" })
                      if (value > 12) onChange({ time: "12" })
                    }}
                    placeholder="HH"
                    className="w-20 text-center"
                  />
                  <span className="flex-shrink-0">:</span>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={journey.minutes}
                    onChange={(e) => {
                      const value = e.target.value
                      // Permetti campo vuoto o valori validi (0-59)
                      if (value === "" || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
                        onChange({ minutes: value })
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value)
                      // Se il valore è fuori range, correggi
                      if (value < 0) onChange({ minutes: "0" })
                      if (value > 59) onChange({ minutes: "59" })
                    }}
                    placeholder="MM"
                    className="w-20 text-center"
                  />
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
                </div>
              </div>

              {/* End Time - Only for Disposition */}
              {serviceType === "disposizione" && (
                <div className="space-y-2">
                  <Label htmlFor="endTime">{dictionary.endTimeLabel}</Label>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <Input
                      id="endTime"
                      type="number"
                      min="1"
                      max="12"
                      value={journey.endTime || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        // Permetti campo vuoto o valori validi (1-12)
                        if (value === "" || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
                          onChange({ endTime: value })
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value)
                        // Se il valore è fuori range, correggi
                        if (value < 1) onChange({ endTime: "1" })
                        if (value > 12) onChange({ endTime: "12" })
                      }}
                      placeholder="HH"
                      className="w-20 text-center"
                      disabled={isEndTimeDisabled()}
                    />
                    <span className="flex-shrink-0">:</span>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={journey.endMinutes || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        // Permetti campo vuoto o valori validi (0-59)
                        if (value === "" || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
                          onChange({ endMinutes: value })
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value)
                        // Se il valore è fuori range, correggi
                        if (value < 0) onChange({ endMinutes: "0" })
                        if (value > 59) onChange({ endMinutes: "59" })
                      }}
                      placeholder="MM"
                      className="w-20 text-center"
                      disabled={isEndTimeDisabled()}
                    />
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
                  </div>
                  {!isEndTimeValid() && (
                    <p className="text-sm text-red-500">{dictionary.endTimeInvalid}</p>
                  )}
                  {isEndTimeDisabled() && <p className="text-sm text-gray-500">{dictionary.selectStartTime}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Duration Info - Only for Disposition */}
          {serviceType === "disposizione" &&
            journey.time &&
            journey.minutes &&
            journey.timeAmPm &&
            journey.endTime &&
            journey.endMinutes &&
            journey.endTimeAmPm &&
            isEndTimeValid() && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-900">{dictionary.serviceDuration}</span>
                </div>
                <div className="text-sm text-green-700">
                  {(() => {
                    const startTime = convertTo24Hour(journey.time, journey.minutes, journey.timeAmPm)
                    const endTime = convertTo24Hour(journey.endTime, journey.endMinutes, journey.endTimeAmPm)
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
                          <strong>{dictionary.billableHours}</strong> {billingHours}h (arrotondato per eccesso)
                        </p>
                        <p>
                          <strong>{dictionary.hourlyRate}</strong>
                        </p>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

          {/* Flight/Train Number */}
          <div className="space-y-2">
            <Label htmlFor="flight">{dictionary.flightLabel}</Label>
            <Input
              type="text"
              id="flight"
              value={options.flight || ""}
              onChange={(e) => onOptionsChange({ flight: e.target.value })}
              placeholder={dictionary.flightPlaceholder}
            />
          </div>
        </CardContent>
      </Card>

      {/* Meet & Greet - Outside the Card but inside the component */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="meetAndGreet"
          checked={options.meetAndGreet}
          onCheckedChange={(checked) => onOptionsChange({ meetAndGreet: checked as boolean })}
        />
        <label htmlFor="meetAndGreet" className="text-sm text-gray-600">
          {dictionary.meetGreetLabel}
        </label>
      </div>
    </div>
  )
}
