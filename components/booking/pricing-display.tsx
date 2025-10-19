"use client"

import { memo, useState } from "react"
import { Calculator, Loader2, Star, Users, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { PricingResult } from "@/lib/booking-types"

// Helper function per arrotondare al centesimo (2 decimali)
const roundToTwoDecimals = (num: number): number => {
  return Math.round(num * 100) / 100
}

// Helper function per formattare il prezzo con sempre 2 decimali
const formatPrice = (num: number): string => {
  return roundToTwoDecimals(num).toFixed(2)
}

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

      {/* Event Route Information */}
      {pricing.isEventPricing && pricing.eventRoute && (
        <div className="mb-3 p-3 bg-blue-100 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900">
              {(() => {
                // Mapping del nome italiano all'ID della cerimonia per ottenere la traduzione corretta
                if (pricing.eventRoute.name?.includes('Apertura')) {
                  return dictionary.ceremonyNames?.['opening-ceremony'] || pricing.eventRoute.name
                } else if (pricing.eventRoute.name?.includes('Chiusura')) {
                  return dictionary.ceremonyNames?.['closing-ceremony'] || pricing.eventRoute.name
                } else {
                  return pricing.eventRoute.name
                }
              })()}
            </span>
          </div>
          <div className="text-sm text-blue-700">
            <p><strong>{dictionary.route}</strong> {pricing.eventRoute.from} → {pricing.eventRoute.to}</p>
            {pricing.eventRoute.notes && (
              <p className="text-xs mt-1 text-blue-600">{pricing.eventRoute.notes}</p>
            )}
            {pricing.eventRoute.name?.includes('Cerimonia') && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <p className="font-medium text-yellow-800">ℹ️ {dictionary.ceremonySurcharge}</p>
                <p className="text-yellow-700">
                  • <strong>{dictionary.fixedPrice}</strong> {dictionary.completeCeremonyService}<br />
                  • {dictionary.transferExtraInfo}<br />
                  • <strong>{dictionary.includesRoundtripAndWaiting}</strong><br />
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-3xl font-bold text-blue-900 mb-1">€{formatPrice(pricing.totalPrice)}</div>
      <div className="text-sm text-blue-700 mb-2">{dictionary.vatIncluded}</div>

      {/* Night Surcharge Indicator */}
      {((pricing.breakdown.nightSurcharge && pricing.breakdown.nightSurcharge > 0) ||
        (pricing.vehicleBreakdowns && pricing.vehicleBreakdowns.some((vb: any) => vb.nightSurcharge > 0))) && (
          <div className="mb-3 p-2 bg-orange-100 rounded-lg">
            <div className="text-sm text-orange-700">
              <span className="font-medium">{dictionary.nightServiceSurcharge}</span>
              <span className="text-xs block">{dictionary.nightServiceInfo}</span>
            </div>
          </div>
        )}

      {/* Meet & Greet Price Display */}
      {pricing.meetGreetPrice && pricing.meetGreetPrice > 0 && (
        <div className="mb-3 p-3 bg-green-100 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-green-600" />
            <span className="font-medium text-green-900">{dictionary.meetGreetService}</span>
          </div>
          <div className="text-sm text-green-700">
            <p><strong>{dictionary.totalServicePrice}:</strong> €{pricing.meetGreetPrice}</p>
            {pricing.breakdown.vehicleCount > 1 && (
              <p className="text-xs text-green-600">
                {dictionary.appliedToVehicles.replace('{count}', pricing.breakdown.vehicleCount.toString())}
                (€{formatPrice(pricing.meetGreetPrice / pricing.breakdown.vehicleCount)} {dictionary.perVehicle})
              </p>
            )}
            <p className="text-xs text-green-600">{dictionary.includedInTotal}</p>
          </div>
        </div>
      )}

      {showBreakdown && (
        <div className="text-sm space-y-2">
          <div className="bg-white p-4 rounded-lg border space-y-3">
            <div className="font-bold text-lg text-gray-800">💰 {dictionary.serviceDetails}</div>
            <div className="space-y-2">

              {/* CERIMONIA: Disposizione base SEMPRE per cerimonie */}
              {pricing.eventRoute?.name?.includes('Cerimonia') && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <div>
                    <div className="font-medium">{dictionary.pricingBreakdownLabels?.ceremonyBaseDisposition}</div>
                    <div className="text-sm text-gray-600">
                      {dictionary.pricingBreakdownLabels?.ceremonyCompleteService}
                    </div>
                  </div>
                  <div className="font-bold">€{formatPrice(
                    (() => {
                      const totalCeremonyPrice = pricing.vehicleBreakdowns?.reduce((sum: number, vb: any) => sum + (vb.ceremonyBasePrice || 0), 0) || pricing.breakdown.basePrice || 0
                      const nightSurcharge = pricing.breakdown.nightSurcharge || 0
                      return totalCeremonyPrice - nightSurcharge
                    })()
                  )}</div>
                </div>
              )}

              {/* CERIMONIA: Transfer extra SE presente */}
              {pricing.eventRoute?.name?.includes('Cerimonia') && ((pricing.vehicleBreakdowns?.some((vb: any) => vb.transferCost > 0)) || (pricing.eventRoute?.notes?.includes('→'))) && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <div>
                    <div className="font-medium">{dictionary.pricingBreakdownLabels?.extraLocationTransfer}</div>
                    <div className="text-sm text-gray-600">
                      {dictionary.pricingBreakdownLabels?.extraLocationTransferDescription}
                      {pricing.eventRoute?.notes?.includes('→') && (
                        <div className="mt-1">
                          <strong>{dictionary.pricingBreakdownLabels?.routes}</strong> {pricing.eventRoute.notes.split('|')[0].trim()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="font-bold">€{formatPrice(pricing.vehicleBreakdowns?.reduce((sum: number, vb: any) => sum + (vb.transferCost || 0), 0) || 0)}</div>
                </div>
              )}

              {/* SERVIZIO BASE: Transfer o Disposizione normale (se NON cerimonia) */}
              {!pricing.eventRoute?.name?.includes('Cerimonia') && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <div>
                    <div className="font-medium">
                      {pricing.breakdown.durationHours ? dictionary.pricingBreakdownLabels?.hourlyDisposition : dictionary.pricingBreakdownLabels?.transfer}
                    </div>
                    <div className="text-sm text-gray-600">
                      {pricing.breakdown.durationHours ? (
                        <>
                          {pricing.breakdown.durationHours} {dictionary.pricingBreakdownLabels?.serviceHours}
                          {pricing.eventRoute?.from && pricing.eventRoute?.to && (
                            <div>{pricing.eventRoute.from} → {pricing.eventRoute.to}</div>
                          )}
                        </>
                      ) : (
                        <>
                          {dictionary.pricingBreakdownLabels?.pointToPointTransfer}
                          {pricing.eventRoute?.from && pricing.eventRoute?.to && (
                            <div>{pricing.eventRoute.from} → {pricing.eventRoute.to}</div>
                          )}
                          {pricing.breakdown.distanceKm && (
                            <div>{pricing.breakdown.distanceKm} {dictionary.pricingBreakdownLabels?.km}</div>
                          )}
                        </>
                      )}
                      {/* Show individual vehicle breakdown if available (different vehicles) */}
                      {pricing.vehicleBreakdowns && pricing.vehicleBreakdowns.length > 0 ? (
                        <div className="mt-1">
                          {pricing.vehicleBreakdowns.map((vb: any, index: number) => {
                            const vehiclePrice = vb.price || vb.basePrice || (pricing.breakdown.durationHours ? vb.durationHours * vb.hourlyRate : 0)
                            const vehicleNightSurcharge = vb.nightSurcharge || 0
                            const basePriceWithoutNight = vehiclePrice - vehicleNightSurcharge
                            
                            return (
                              <div key={index} className="text-xs">
                                {dictionary.pricingBreakdownLabels?.vehicle} {vb.vehicleIndex} : €{formatPrice(basePriceWithoutNight)}
                                {pricing.breakdown.durationHours && vb.hourlyRate && (
                                  <span> ({vb.durationHours}{dictionary.pricingBreakdownLabels?.hours} × €{vb.hourlyRate}{dictionary.pricingBreakdownLabels?.hourlyRate})</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        /* Show simple multiplication only for same vehicle types */
                        pricing.breakdown.vehicleCount > 1 && (
                          <div>{pricing.breakdown.vehicleCount} {dictionary.pricingBreakdownLabels?.vehicles} × €{formatPrice((pricing.breakdown.pricePerVehicle || pricing.breakdown.basePrice / pricing.breakdown.vehicleCount))}</div>
                        )
                      )}
                    </div>
                  </div>
                  <div className="font-bold">
                    €{formatPrice(
                      (() => {
                        let totalPrice = 0
                        if (pricing.vehicleBreakdowns && pricing.vehicleBreakdowns.length > 0) {
                          totalPrice = pricing.vehicleBreakdowns.reduce((sum: number, vb: any) => sum + (vb.price || vb.basePrice || (pricing.breakdown.durationHours ? vb.durationHours * vb.hourlyRate : 0)), 0)
                        } else {
                          totalPrice = pricing.breakdown.pricePerVehicle && pricing.breakdown.vehicleCount ? pricing.breakdown.pricePerVehicle * pricing.breakdown.vehicleCount : pricing.breakdown.basePrice
                        }
                        // Per prezzi olimpici, NON sottrarre night surcharge (è già separato)
                        // Per altri prezzi, sottrai perché è incluso nel basePrice
                        if (!pricing.isOlympicPricing) {
                          const nightSurcharge = pricing.breakdown.nightSurcharge || 0
                          return totalPrice - nightSurcharge
                        }
                        return totalPrice
                      })()
                    )}
                  </div>
                </div>
              )}

              {/* TRANSFER COST: Per disposizioni standard con transfer Milano Centrale */}
              {!pricing.eventRoute?.name?.includes('Cerimonia') &&
                pricing.breakdown.durationHours &&
                (pricing.breakdown as any).transferCost &&
                (pricing.breakdown as any).transferCost > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div>
                      <div className="font-medium">{dictionary.pricingBreakdownLabels?.milanoTransfer}</div>
                      <div className="text-sm text-gray-600">
                        {(pricing.breakdown as any).transferRoute || dictionary.pricingBreakdownLabels?.milanoTransferDescription}
                        {pricing.breakdown.vehicleCount > 1 && (
                          <div>{pricing.breakdown.vehicleCount} {dictionary.pricingBreakdownLabels?.vehicles}</div>
                        )}
                      </div>
                    </div>
                    <div className="font-bold">€{formatPrice((pricing.breakdown as any).transferCost)}</div>
                  </div>
                )}

              {/* SUPPLEMENTO NOTTURNO */}
              {pricing.breakdown.nightSurcharge && pricing.breakdown.nightSurcharge > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <div>
                    <div className="font-medium">{dictionary.pricingBreakdownLabels?.nightSurcharge}</div>
                    <div className="text-sm text-gray-600">{dictionary.pricingBreakdownLabels?.nightServiceHours} (+20%)</div>
                  </div>
                  <div className="font-bold">€{formatPrice(pricing.breakdown.nightSurcharge)}</div>
                </div>
              )}

              {/* MEET & GREET */}
              {pricing.meetGreetPrice && pricing.meetGreetPrice > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <div>
                    <div className="font-medium">{dictionary.pricingBreakdownLabels?.meetGreetService}</div>
                    <div className="text-sm text-gray-600">
                      {dictionary.pricingBreakdownLabels?.receptionService}
                      {pricing.breakdown.vehicleCount > 1 && (
                        <div>{pricing.breakdown.vehicleCount} {dictionary.pricingBreakdownLabels?.vehicles} × €{formatPrice(pricing.meetGreetPrice / pricing.breakdown.vehicleCount)}</div>
                      )}
                    </div>
                  </div>
                  <div className="font-bold">€{formatPrice(pricing.meetGreetPrice)}</div>
                </div>
              )}

              {/* SUBTOTALE */}
              <div className="flex justify-between items-center py-3 bg-gray-50 rounded font-medium">
                <div className="text-gray-800">{dictionary.pricingBreakdownLabels?.subtotalLabel}</div>
                <div className="text-lg">€{formatPrice(pricing.breakdown.subtotal)}</div>
              </div>

              {/* IVA */}
              {pricing.breakdown.vatAmount && pricing.breakdown.vatAmount > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <div>
                    <div className="font-medium">{dictionary.pricingBreakdownLabels?.vatLabel}</div>
                    <div className="text-sm text-gray-600">{dictionary.vatCalculation?.replace('{amount}', formatPrice(pricing.breakdown.subtotal))}</div>
                  </div>
                  <div className="font-bold">€{formatPrice(pricing.breakdown.vatAmount)}</div>
                </div>
              )}

              {/* TOTALE FINALE */}
              <div className="flex justify-between items-center py-3 bg-blue-50 rounded border-2 border-blue-200">
                <div className="font-bold text-xl text-blue-900">{dictionary.pricingBreakdownLabels?.totalLabel}</div>
                <div className="font-bold text-2xl text-blue-900">€{formatPrice(pricing.totalPrice)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

PricingDisplay.displayName = "PricingDisplay"



