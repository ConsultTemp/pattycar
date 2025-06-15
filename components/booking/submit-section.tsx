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
}

export const SubmitSection = memo<SubmitSectionProps>(({ isValid, isSubmitting, pricing, submitError, onSubmit }) => {
  const canSubmit = isValid && pricing && !isSubmitting

  return (
    <div className="text-center space-y-4">
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
            Creazione sessione pagamento...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            Procedi al Pagamento
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
        <p className="text-gray-500 text-sm">Compila tutti i campi obbligatori (*) per procedere al pagamento</p>
      )}
    </div>
  )
})

SubmitSection.displayName = "SubmitSection"
