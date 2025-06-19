"use client"

import { memo } from "react"
import { Button } from "@/components/ui/button"
import { CreditCard, Loader2 } from "lucide-react"
import type { PricingResult } from "@/lib/booking-types"

interface SubmitSectionProps {
  isValid: boolean
  isSubmitting: boolean
  pricing: PricingResult | null
  submitError?: string
  onSubmit: () => void
  dictionary: any
}

export const SubmitSection = memo<SubmitSectionProps>(({ isValid, isSubmitting, pricing, submitError, onSubmit, dictionary }) => {
  const canSubmit = isValid && pricing && !isSubmitting

  return (
    <div className="text-center space-y-4">
      {/* Contact Information */}
      <div className="text-sm text-gray-600 mb-4">
        <p>{dictionary.contactInfo}</p>
      </div>

      {/* Cancellation Policy */}
      <div className="text-xs text-gray-500 mb-6 max-w-2xl mx-auto">
        <p className="mb-2">{dictionary.cancellationPolicy}</p>
      </div>

      <Button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className={`px-8 py-3 flex items-center justify-center mx-auto text-white ${
          !canSubmit ? "opacity-70 cursor-not-allowed" : ""
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
            {pricing && <span className="ml-2 font-bold">€{pricing.totalPrice}</span>}
          </>
        )}
      </Button>

      {submitError && (
        <p className="text-red-600 text-sm" role="alert">
          {submitError}
        </p>
      )}

      {!isValid && (
        <p className="text-gray-500 text-sm">{dictionary.validationMessage}</p>
      )}
    </div>
  )
})

SubmitSection.displayName = "SubmitSection"
