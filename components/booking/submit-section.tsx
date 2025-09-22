"use client"

import { memo } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CreditCard, Loader2, AlertTriangle } from "lucide-react"
import type { PricingResult } from "@/lib/booking-types"

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
  validationErrors = []
}) => {
  const cancellationError = validationErrors.find(error => error.field === "cancellationAccepted")
  
  // Distance validation is now handled by the main validation system
  
  // Button is only disabled when submitting - validation errors are shown but don't disable the button
  const isButtonDisabled = isSubmitting

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
                {dictionary.validationErrors?.[cancellationError.message] || cancellationError.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Distance Validation Error - Now handled by main validation system */}

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
