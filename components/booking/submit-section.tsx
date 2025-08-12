"use client"

import { memo } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CreditCard, Loader2, AlertTriangle } from "lucide-react"
import type { PricingResult } from "@/lib/booking-types"
import { validateTripDistance } from "@/lib/utils"

// Helper function per formattare il prezzo con sempre 2 decimali
const formatPrice = (num: number): string => {
  return (Math.round(num * 100) / 100).toFixed(2)
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
  // New props for distance validation
  tripDistance?: {
    km: number
    text: string
    duration: string
  }
  pickupCoordinates?: { lat: number; lng: number }
  destinationCoordinates?: { lat: number; lng: number }
  serviceType?: string
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
  tripDistance,
  pickupCoordinates,
  destinationCoordinates,
  serviceType
}) => {
  const cancellationError = validationErrors.find(error => error.field === "cancellationAccepted")
  
  // Validate distance for transfer and inter-cluster services
  const shouldValidateDistance = (serviceType === "transfer" || serviceType === "inter-cluster") && tripDistance
  
  const distanceValidation = shouldValidateDistance 
    ? validateTripDistance(tripDistance!.km, pickupCoordinates, destinationCoordinates)
    : { isValid: true }
  
  // Button should be disabled if form is not valid, distance is invalid, or is submitting
  const isButtonDisabled = isSubmitting || !isValid || !distanceValidation.isValid

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

      {/* Distance Validation Error */}
      {shouldValidateDistance && !distanceValidation.isValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900 mb-1">
                Distanza del viaggio non valida
              </h4>
              <p className="text-sm text-red-700">
                {distanceValidation.reason}
              </p>
            </div>
          </div>
        </div>
      )}

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
