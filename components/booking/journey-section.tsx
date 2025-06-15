"use client"

import { memo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { CalendarIcon, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Journey, ValidationError } from "@/lib/booking-types"
import { CITIES_AND_LOCATIONS } from "@/lib/pricing-config"

interface JourneySectionProps {
  journey: Journey
  errors: ValidationError[]
  onChange: (journey: Partial<Journey>) => void
}

const hours = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString(),
  label: i.toString(),
}))

const minutes = Array.from({ length: 60 }, (_, i) => ({
  value: i.toString(),
  label: i.toString(),
}))

export const JourneySection = memo<JourneySectionProps>(({ journey, errors, onChange }) => {
  const getFieldError = (field: string) => {
    return errors.find((error) => error.field === `journey.${field}`)?.message
  }

  const routeError = errors.find((error) => error.field === "journey.destination")?.message

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Dettagli Viaggio</h3>

      {/* Date and Time */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Data e Ora</label>
        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-gray-100 border-transparent hover:bg-gray-200",
                  !journey.date && "text-gray-500",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {journey.date ? format(journey.date, "PPP") : "Seleziona data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={journey.date}
                onSelect={(date) => onChange({ date })}
                className="bg-white"
              />
            </PopoverContent>
          </Popover>

          <Select value={journey.time} onValueChange={(time) => onChange({ time })}>
            <SelectTrigger className="w-1/3">
              <SelectValue placeholder="Ora" />
            </SelectTrigger>
            <SelectContent>
              {hours.map((hour) => (
                <SelectItem key={hour.value} value={hour.value}>
                  {hour.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={journey.minutes} onValueChange={(minutes) => onChange({ minutes })}>
            <SelectTrigger className="w-1/3">
              <SelectValue placeholder="Min" />
            </SelectTrigger>
            <SelectContent>
              {minutes.map((minute) => (
                <SelectItem key={minute.value} value={minute.value}>
                  {minute.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Departure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Città di partenza *</label>
          <Select
            value={journey.departure.city}
            onValueChange={(city) =>
              onChange({
                departure: { ...journey.departure, city, location: "" },
              })
            }
          >
            <SelectTrigger className={getFieldError("departure.city") ? "border-red-500" : ""}>
              <SelectValue placeholder="Seleziona città" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CITIES_AND_LOCATIONS).map(([cityKey, cityData]) => (
                <SelectItem key={cityKey} value={cityKey}>
                  {cityData.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {getFieldError("departure.city") && (
            <p className="text-red-500 text-sm mt-1" role="alert">
              {getFieldError("departure.city")}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Luogo di partenza *</label>
          <Select
            value={journey.departure.location}
            onValueChange={(location) =>
              onChange({
                departure: { ...journey.departure, location },
              })
            }
            disabled={!journey.departure.city}
          >
            <SelectTrigger className={getFieldError("departure.location") ? "border-red-500" : ""}>
              <SelectValue placeholder={!journey.departure.city ? "Seleziona prima la città" : "Seleziona luogo"} />
            </SelectTrigger>
            <SelectContent>
              {journey.departure.city &&
                Object.entries(CITIES_AND_LOCATIONS[journey.departure.city].locations).map(
                  ([locationKey, locationName]) => (
                    <SelectItem key={locationKey} value={locationKey}>
                      {locationName}
                    </SelectItem>
                  ),
                )}
            </SelectContent>
          </Select>
          {getFieldError("departure.location") && (
            <p className="text-red-500 text-sm mt-1" role="alert">
              {getFieldError("departure.location")}
            </p>
          )}
        </div>
      </div>

      {/* Destination */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Città di destinazione *</label>
          <Select
            value={journey.destination.city}
            onValueChange={(city) =>
              onChange({
                destination: { ...journey.destination, city, location: "" },
              })
            }
          >
            <SelectTrigger className={getFieldError("destination.city") ? "border-red-500" : ""}>
              <SelectValue placeholder="Seleziona città" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CITIES_AND_LOCATIONS).map(([cityKey, cityData]) => (
                <SelectItem key={cityKey} value={cityKey}>
                  {cityData.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {getFieldError("destination.city") && (
            <p className="text-red-500 text-sm mt-1" role="alert">
              {getFieldError("destination.city")}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Luogo di destinazione *</label>
          <Select
            value={journey.destination.location}
            onValueChange={(location) =>
              onChange({
                destination: { ...journey.destination, location },
              })
            }
            disabled={!journey.destination.city}
          >
            <SelectTrigger className={getFieldError("destination.location") ? "border-red-500" : ""}>
              <SelectValue placeholder={!journey.destination.city ? "Seleziona prima la città" : "Seleziona luogo"} />
            </SelectTrigger>
            <SelectContent>
              {journey.destination.city &&
                Object.entries(CITIES_AND_LOCATIONS[journey.destination.city].locations).map(
                  ([locationKey, locationName]) => (
                    <SelectItem key={locationKey} value={locationKey}>
                      {locationName}
                    </SelectItem>
                  ),
                )}
            </SelectContent>
          </Select>
          {getFieldError("destination.location") && (
            <p className="text-red-500 text-sm mt-1" role="alert">
              {getFieldError("destination.location")}
            </p>
          )}
        </div>
      </div>

      {/* Route Error */}
      {routeError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-700">{routeError}</span>
        </div>
      )}
    </div>
  )
})

JourneySection.displayName = "JourneySection"
