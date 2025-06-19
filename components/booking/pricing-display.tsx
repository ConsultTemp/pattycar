"use client"

import { memo, useState } from "react"
import { Calculator, Loader2 } from "lucide-react"
import type { PricingResult } from "@/lib/booking-types"

interface PricingDisplayProps {
  pricing: PricingResult | null
  isCalculating: boolean
  errors: string[]
  dictionary: any
}

export const PricingDisplay = memo<PricingDisplayProps>(({ pricing, isCalculating, errors, dictionary }) => {
  const [showBreakdown, setShowBreakdown] = useState(false)

  if (errors.length > 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-800 mb-2">{dictionary.error}</h3>
        {errors.map((error, index) => (
          <p key={index} className="text-red-700 text-sm">
            {error}
          </p>
        ))}
      </div>
    )
  }

  if (isCalculating) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Loader2 className="w-5 h-5 text-blue-600 mr-2 animate-spin" />
          <span className="text-blue-800">{dictionary.calculating}</span>
        </div>
      </div>
    )
  }

  if (!pricing) {
    return null
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-blue-800 flex items-center">
          <Calculator className="w-5 h-5 mr-2" />
          {dictionary.totalPrice}
        </h3>
        <button
          type="button"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {showBreakdown ? dictionary.hideDetails : dictionary.showDetails}
        </button>
      </div>

      <div className="text-3xl font-bold text-blue-900 mb-1">€{pricing.totalPrice}</div>
      <div className="text-sm text-blue-700 mb-2">{dictionary.vatIncluded}</div>

      {showBreakdown && (
        <div className="text-sm text-blue-700 space-y-1">
          <div>{dictionary.basePrice} €{pricing.breakdown.basePrice}</div>
          {pricing.vehicleBreakdowns ? (
            // Individual vehicles breakdown
            <div className="space-y-2 mt-2">
              <div className="font-semibold">{dictionary.vehicleDetails}</div>
              {pricing.vehicleBreakdowns.map((vb: any) => (
                <div key={vb.vehicleIndex} className="bg-blue-100 p-2 rounded">
                  <div className="font-medium">
                    {dictionary.vehicleNumber || "Veicolo"} {vb.vehicleIndex} ({vb.type})
                  </div>
                  <div className="text-xs space-y-1">
                    <div>
                      {dictionary.passengers} {vb.passengers} (x{vb.passengerMultiplier})
                    </div>
                    <div>
                      {dictionary.luggage} {vb.luggage} (x{vb.luggageMultiplier})
                    </div>
                    <div>{dictionary.vehicleMultiplier} x{vb.vehicleMultiplier}</div>
                    <div className="font-semibold">{dictionary.price} €{vb.price}</div>
                  </div>
                </div>
              ))}
              <div className="border-t pt-2 space-y-1">
                <div>{dictionary.subtotal} €{pricing.breakdown.subtotal}</div>
                <div>{dictionary.vat} ({Math.round(pricing.breakdown.vatRate * 100)}%) €{pricing.breakdown.vatAmount}</div>
                <div className="font-semibold">{dictionary.totalPrice} €{pricing.totalPrice}</div>
              </div>
            </div>
          ) : (
            // Standard breakdown
            <>
              <div>{dictionary.vehicleMultiplier} x{pricing.breakdown.vehicleMultiplier}</div>
              <div>{dictionary.passengerMultiplier} x{pricing.breakdown.passengerMultiplier}</div>
              <div>{dictionary.luggageMultiplier} x{pricing.breakdown.luggageMultiplier}</div>
              <div>{dictionary.vehicleCount} {pricing.breakdown.vehicleCount}</div>
              <div className="border-t pt-1 space-y-1">
                <div>{dictionary.pricePerVehicle} €{pricing.breakdown.pricePerVehicle}</div>
                <div>{dictionary.subtotal} €{pricing.breakdown.subtotal}</div>
                <div>{dictionary.vat} ({Math.round(pricing.breakdown.vatRate * 100)}%) €{pricing.breakdown.vatAmount}</div>
                <div className="font-semibold">{dictionary.totalPrice} €{pricing.totalPrice}</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
})

PricingDisplay.displayName = "PricingDisplay"
