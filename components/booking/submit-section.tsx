"use client"

import { memo } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CreditCard, Loader2 } from "lucide-react"
import type { PricingResult, Journey } from "@/lib/booking-types"

// Helper function per formattare il prezzo con sempre 2 decimali
const formatPrice = (num: number): string => {
  return (Math.round(num * 100) / 100).toFixed(2)
}

// Milano center coordinates (Duomo)
const MILANO_CENTER = { lat: 45.4642, lng: 9.1900 }
const MILANO_PROVINCE_RADIUS_KM = 35 // Covers the whole metropolitan area
const MINIMUM_DISTANCE_KM = 80

// Calculate distance between two coordinates using Haversine formula
const calculateDistanceKm = (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Check if location is in Milano province
const isInMilanoProvince = (coordinates?: { lat: number; lng: number }): boolean => {
  if (!coordinates) return false
  const distanceFromMilano = calculateDistanceKm(MILANO_CENTER, coordinates)
  return distanceFromMilano <= MILANO_PROVINCE_RADIUS_KM
}

// Check if address text contains Milano
const addressContainsMilano = (address: string): boolean => {
  if (!address) return false
  const normalizedAddress = address.toLowerCase()
  return /\b(milano|milan|mi)\b/.test(normalizedAddress)
}

// Check if either pickup or destination involves Milano
const isEitherLocationMilano = (pickup?: { address: string; coordinates?: { lat: number; lng: number } }, destination?: { address: string; coordinates?: { lat: number; lng: number } }): boolean => {
  if (!pickup || !destination) return false
  
  // Check coordinates first (more reliable)
  if (isInMilanoProvince(pickup.coordinates) || isInMilanoProvince(destination.coordinates)) {
    return true
  }
  
  // Fallback to address analysis
  if (addressContainsMilano(pickup.address) || addressContainsMilano(destination.address)) {
    return true
  }
  
  return false
}

interface SubmitSectionProps {
  isValid: boolean
  isSubmitting: boolean
  pricing: PricingResult | null
  submitError?: string
  cancellationAccepted: boolean
  onCancellationChange: (accepted: boolean) => void
  onSubmit: () => void
  dictionary: any
  validationErrors?: Array<{field: string, message: string}>
  journey: Journey
}

export const SubmitSection = memo<SubmitSectionProps>(({ 
  isValid, 
  isSubmitting, 
  pricing, 
  submitError, 
  cancellationAccepted,
  onCancellationChange,
  onSubmit, 
  dictionary,
  validationErrors = [],
  journey
}) => {
  const cancellationError = validationErrors.find(error => error.field === "cancellationAccepted")

  // DISTANCE VALIDATION LOGIC
  const hasDistanceError = (() => {
    // If no distance available, can't validate
    if (!journey?.distance?.km) return false
    
    // If distance >= 80km, always valid
    if (journey.distance.km >= MINIMUM_DISTANCE_KM) return false
    
    // If distance < 80km, check if Milano is involved
    const hasMilanoLocation = isEitherLocationMilano(journey.pickup, journey.destination)
    
    // If Milano is involved, it's valid even if < 80km
    if (hasMilanoLocation) return false
    
    // Distance < 80km and no Milano = ERROR
    return true
  })()

  const distanceErrorMessage = hasDistanceError 
    ? `Il viaggio deve essere di almeno ${MINIMUM_DISTANCE_KM}km a meno che uno dei punti non sia nella provincia di Milano. Distanza attuale: ${journey?.distance?.km?.toFixed(1)}km.`
    : null

  // Button should be disabled if there's a distance error
  const isButtonDisabled = isSubmitting || hasDistanceError

  return (
    <div className="space-y-6">
      {/* Cancellation Policy - Evidenziata e allineata a sinistra */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="cancellationAccepted"
            checked={cancellationAccepted}
            onCheckedChange={(checked) => onCancellationChange(checked as boolean)}
            className="mt-1"
          />
          <div className="flex-1">
            <label 
              htmlFor="cancellationAccepted" 
              className="block text-sm font-medium text-gray-900 cursor-pointer"
            >
              {dictionary.cancellationPolicyTitle || "Cancellation Policy"}
            </label>
            <p className="text-sm text-gray-700 mt-1">
              {dictionary.cancellationPolicy}
            </p>
            {cancellationError && (
              <p className="text-red-600 text-sm mt-2" role="alert">
                {cancellationError.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Route Disclaimer */}
      <div className="text-center">
        <p className="text-red-600 text-sm mb-4">
          {dictionary.routeDisclaimer}
        </p>
      </div>

      {/* Submit Button */}
      <div className="text-center">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isButtonDisabled}
          className={`px-8 py-3 flex items-center justify-center mx-auto text-white ${
            isButtonDisabled ? "opacity-70 cursor-not-allowed" : ""
          }`}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {dictionary.processing}
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              {dictionary.button}
              {pricing && <span className="ml-2 font-bold">€{formatPrice(pricing.totalPrice)}</span>}
            </>
          )}
        </Button>

        {/* Additional Quotes Text */}
        <div className="text-sm text-gray-600 mt-4">
          <p>{dictionary.additionalQuotes}</p>
        </div>

        {/* Distance Error Message */}
        {distanceErrorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            <p className="text-red-700 text-sm font-semibold" role="alert">
              ⚠️ {distanceErrorMessage}
            </p>
          </div>
        )}

        {submitError && (
          <p className="text-red-600 text-sm mt-2" role="alert">
            {submitError}
          </p>
        )}
      </div>
    </div>
  )
})

SubmitSection.displayName = "SubmitSection"
