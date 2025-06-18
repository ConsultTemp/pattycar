"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, MapPin, Clock, Route } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { PlacesAutocomplete } from "@/components/places-autocomplete"
import type { Journey, ValidationError } from "@/lib/booking-types"
import { useEffect, useState } from "react"

interface JourneySectionProps {
  journey: Journey
  errors: ValidationError[]
  onChange: (journey: Partial<Journey>) => void
  serviceType: "transfer" | "disposizione"
  dictionary: any
}

export function JourneySection({ journey, errors, onChange, serviceType, dictionary }: JourneySectionProps) {
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false)

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
    if (!journey.time || !journey.minutes || !journey.endTime || !journey.endMinutes) return true

    const startTotalMinutes = Number.parseInt(journey.time) * 60 + Number.parseInt(journey.minutes)
    const endTotalMinutes = Number.parseInt(journey.endTime) * 60 + Number.parseInt(journey.endMinutes)

    return endTotalMinutes > startTotalMinutes
  }

  const isEndTimeDisabled = () => {
    return serviceType === "disposizione" && (!journey.time || !journey.minutes)
  }

  return (
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date */}
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

          {/* Start Time */}
          <div className="space-y-2">
            <Label htmlFor="time">{serviceType === "transfer" ? dictionary.startTimeLabel : dictionary.startServiceLabel}</Label>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <Input
                id="time"
                type="number"
                min="0"
                max="23"
                value={journey.time}
                onChange={(e) => onChange({ time: e.target.value })}
                placeholder="HH"
                className="w-20"
              />
              <span>:</span>
              <Input
                type="number"
                min="0"
                max="59"
                step="5"
                value={journey.minutes}
                onChange={(e) => onChange({ minutes: e.target.value })}
                placeholder="MM"
                className="w-20"
              />
            </div>
          </div>

          {/* End Time - Only for Disposition */}
          {serviceType === "disposizione" && (
            <div className="space-y-2">
              <Label htmlFor="endTime">{dictionary.endTimeLabel}</Label>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <Input
                  id="endTime"
                  type="number"
                  min="0"
                  max="23"
                  value={journey.endTime || ""}
                  onChange={(e) => onChange({ endTime: e.target.value })}
                  placeholder="HH"
                  className="w-20"
                  disabled={isEndTimeDisabled()}
                />
                <span>:</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  step="5"
                  value={journey.endMinutes || ""}
                  onChange={(e) => onChange({ endMinutes: e.target.value })}
                  placeholder="MM"
                  className="w-20"
                  disabled={isEndTimeDisabled()}
                />
              </div>
              {!isEndTimeValid() && (
                <p className="text-sm text-red-500">{dictionary.endTimeInvalid}</p>
              )}
              {isEndTimeDisabled() && <p className="text-sm text-gray-500">{dictionary.selectStartTime}</p>}
            </div>
          )}
        </div>

        {/* Duration Info - Only for Disposition */}
        {serviceType === "disposizione" &&
          journey.time &&
          journey.minutes &&
          journey.endTime &&
          journey.endMinutes &&
          isEndTimeValid() && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">{dictionary.serviceDuration}</span>
              </div>
              <div className="text-sm text-green-700">
                {(() => {
                  const startTotalMinutes = Number.parseInt(journey.time) * 60 + Number.parseInt(journey.minutes)
                  const endTotalMinutes = Number.parseInt(journey.endTime) * 60 + Number.parseInt(journey.endMinutes)
                  const durationMinutes = endTotalMinutes - startTotalMinutes
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
                        <strong>{dictionary.hourlyRate}</strong> 100€/ora
                      </p>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  )
}
