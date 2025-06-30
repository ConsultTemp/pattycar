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
          {pricing.isOlympicPricing ? "Olympic Pricing" : pricing.isEventPricing ? "Event Pricing" : dictionary.totalPrice}
          {pricing.isOlympicPricing && (
            <Badge variant="secondary" className="ml-2 bg-gradient-to-r from-blue-500 to-green-500 text-white">
              🏔️ Milano-Cortina 2026
            </Badge>
          )}
          {pricing.isEventPricing && !pricing.isOlympicPricing && (
            <Badge variant="secondary" className="ml-2">
              <Star className="w-3 h-3 mr-1" />
              Special Event
            </Badge>
          )}
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
            <span className="font-medium text-blue-900">{pricing.eventRoute.name}</span>
          </div>
          <div className="text-sm text-blue-700">
            <p><strong>Route:</strong> {pricing.eventRoute.from} → {pricing.eventRoute.to}</p>
            {pricing.eventRoute.notes && (
              <p className="text-xs mt-1 text-blue-600">{pricing.eventRoute.notes}</p>
            )}
            {pricing.eventRoute.name?.includes('Cerimonia') && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <p className="font-medium text-yellow-800">ℹ️ Pricing Cerimonia:</p>
                <p className="text-yellow-700">
                  • <strong>PREZZO FISSO</strong> per servizio completo di cerimonia<br/>
                  • Include: disponibilità da 2h prima + attesa durante cerimonia<br/>
                  • Transfer extra solo se partenza da città diversa<br/>
                  • <strong>NON include transfer di ritorno</strong><br/>
                  • <em>Non si applicano ore aggiuntive per il servizio standard</em>
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
            <span className="font-medium">🌙 Night service surcharge applied</span>
            <span className="text-xs block">Service time between 19:30 PM - 07:30 AM (+20%)</span>
          </div>
        </div>
      )}

      {/* Meet & Greet Price Display */}
      {pricing.meetGreetPrice && pricing.meetGreetPrice > 0 && (
        <div className="mb-3 p-3 bg-green-100 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-green-600" />
            <span className="font-medium text-green-900">Meet & Greet Service</span>
          </div>
          <div className="text-sm text-green-700">
            <p><strong>Total Service Price:</strong> €{pricing.meetGreetPrice}</p>
            {pricing.breakdown.vehicleCount > 1 && (
              <p className="text-xs text-green-600">
                Applied to {pricing.breakdown.vehicleCount} vehicle{pricing.breakdown.vehicleCount > 1 ? 's' : ''} 
                (€{formatPrice(pricing.meetGreetPrice / pricing.breakdown.vehicleCount)} per vehicle)
              </p>
            )}
            <p className="text-xs text-green-600">Included in total price above</p>
          </div>
        </div>
      )}

      {showBreakdown && (
        <div className="text-sm space-y-2">
          <div className="bg-white p-4 rounded-lg border space-y-3">
            <div className="font-bold text-lg text-gray-800">💰 DETTAGLIO SERVIZI</div>
            <div className="space-y-2">
              
              {/* CERIMONIA: Disposizione base SEMPRE per cerimonie */}
              {pricing.eventRoute?.name?.includes('Cerimonia') && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <div>
                    <div className="font-medium">Disposizione cerimonia base</div>
                    <div className="text-sm text-gray-600">
                      Servizio completo cerimonia (include 2h prima + attesa durante cerimonia )
                    </div>
                  </div>
                  <div className="font-bold">€{formatPrice(pricing.vehicleBreakdowns?.reduce((sum: number, vb: any) => sum + (vb.ceremonyBasePrice || 0), 0) || pricing.breakdown.basePrice || 0)}</div>
                </div>
              )}

              {/* CERIMONIA: Transfer extra SE presente */}
              {pricing.eventRoute?.name?.includes('Cerimonia') && ((pricing.vehicleBreakdowns?.some((vb: any) => vb.transferCost > 0)) || (pricing.eventRoute?.notes?.includes('→'))) && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <div>
                    <div className="font-medium">Transfer extra località</div>
                    <div className="text-sm text-gray-600">
                      Transfer per località diverse dalla città base della cerimonia
                      {pricing.eventRoute?.notes?.includes('→') && (
                        <div className="mt-1">
                          <strong>Tratte:</strong> {pricing.eventRoute.notes.split('|')[0].trim()}
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
                      {pricing.breakdown.durationHours ? 'Disposizione a tempo' : 'Transfer'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {pricing.breakdown.durationHours ? (
                        <>
                          {pricing.breakdown.durationHours} ore di servizio
                          {pricing.eventRoute?.from && pricing.eventRoute?.to && (
                            <div>{pricing.eventRoute.from} → {pricing.eventRoute.to}</div>
                          )}
                        </>
                      ) : (
                        <>
                          Trasferimento punto a punto
                          {pricing.eventRoute?.from && pricing.eventRoute?.to && (
                            <div>{pricing.eventRoute.from} → {pricing.eventRoute.to}</div>
                          )}
                          {pricing.breakdown.distanceKm && (
                            <div>{pricing.breakdown.distanceKm} km</div>
                          )}
                        </>
                      )}
                      {/* Show individual vehicle breakdown if available (different vehicles) */}
                      {pricing.vehicleBreakdowns && pricing.vehicleBreakdowns.length > 0 ? (
                        <div className="mt-1">
                          {pricing.vehicleBreakdowns.map((vb: any, index: number) => (
                            <div key={index} className="text-xs">
                              Vehicle {vb.vehicleIndex} ({vb.type}): €{formatPrice(vb.price || (pricing.breakdown.durationHours ? vb.durationHours * vb.hourlyRate : vb.basePrice || 0))}
                              {pricing.breakdown.durationHours && vb.hourlyRate && (
                                <span> ({vb.durationHours}h × €{vb.hourlyRate}/h)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Show simple multiplication only for same vehicle types */
                        pricing.breakdown.vehicleCount > 1 && (
                          <div>{pricing.breakdown.vehicleCount} veicoli × €{formatPrice(pricing.breakdown.basePrice / pricing.breakdown.vehicleCount)}</div>
                        )
                      )}
                    </div>
                  </div>
                  <div className="font-bold">€{formatPrice(pricing.breakdown.basePrice)}</div>
                </div>
              )}

              {/* TRANSFER COST: Per disposizioni standard con transfer Milano Centrale */}
              {!pricing.eventRoute?.name?.includes('Cerimonia') && 
               pricing.breakdown.durationHours && 
               (pricing.breakdown as any).transferCost && 
               (pricing.breakdown as any).transferCost > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <div>
                    <div className="font-medium">Transfer Milano Centrale</div>
                    <div className="text-sm text-gray-600">
                      {(pricing.breakdown as any).transferRoute || 'Transfer da Milano Centrale al punto servizio'}
                      {pricing.breakdown.vehicleCount > 1 && (
                        <div>{pricing.breakdown.vehicleCount} veicoli</div>
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
                    <div className="font-medium">Supplemento notturno</div>
                    <div className="text-sm text-gray-600">Servizio 21:00-06:00 (+{pricing.breakdown.nightSurchargeRate || 20}%)</div>
                  </div>
                  <div className="font-bold">€{formatPrice(pricing.breakdown.nightSurcharge)}</div>
                </div>
              )}

              {/* MEET & GREET */}
              {pricing.meetGreetPrice && pricing.meetGreetPrice > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <div>
                    <div className="font-medium">Meet & Greet Service</div>
                    <div className="text-sm text-gray-600">
                      Servizio di accoglienza
                      {pricing.breakdown.vehicleCount > 1 && (
                        <div>{pricing.breakdown.vehicleCount} veicoli × €{formatPrice(pricing.meetGreetPrice / pricing.breakdown.vehicleCount)}</div>
                      )}
                    </div>
                  </div>
                  <div className="font-bold">€{formatPrice(pricing.meetGreetPrice)}</div>
                </div>
              )}

              {/* SUBTOTALE */}
              <div className="flex justify-between items-center py-3 bg-gray-50 rounded font-medium">
                <div className="text-gray-800">SUBTOTALE</div>
                <div className="text-lg">€{formatPrice(pricing.breakdown.subtotal)}</div>
              </div>

              {/* IVA */}
              {pricing.breakdown.vatAmount && pricing.breakdown.vatAmount > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <div>
                    <div className="font-medium">IVA</div>
                    <div className="text-sm text-gray-600">10%  €{formatPrice(pricing.breakdown.subtotal)}</div>
                  </div>
                  <div className="font-bold">€{formatPrice(pricing.breakdown.vatAmount)}</div>
                </div>
              )}

              {/* TOTALE FINALE */}
              <div className="flex justify-between items-center py-3 bg-blue-50 rounded border-2 border-blue-200">
                <div className="font-bold text-xl text-blue-900">TOTALE</div>
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



