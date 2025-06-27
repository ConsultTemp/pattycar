"use client"

import { useReducer, useCallback, useMemo } from "react"
import { useLanguage } from "@/components/language-provider"
import { bookingReducer, initialBookingState } from "@/lib/booking-reducer"
import { useFormValidation } from "@/hooks/use-form-validation"
import { usePriceCalculation } from "@/hooks/use-price-calculation"
import { useErrorHandler } from "@/hooks/use-error-handler"
import { CustomerInfoSection } from "@/components/booking/customer-info-section"
import { DateSection } from "@/components/booking/date-section"
import { JourneySection } from "@/components/booking/journey-section"
import { VehicleConfigSection } from "@/components/booking/vehicle-config-section"
import { PricingDisplay } from "@/components/booking/pricing-display"
import { AdditionalOptionsSection } from "@/components/booking/additional-options-section"
import { MeetGreetSection } from "@/components/booking/meet-greet-section"
import { SubmitSection } from "@/components/booking/submit-section"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MeetGreetConfig, ServiceType } from "@/lib/booking-types"
import { isOlympicPeriod, isCeremonyDate, getCeremonyName } from "@/lib/olympic-pricing"

// Helper function to convert 12h format to 24h format
const convertTo24Hour = (hour: string, minutes: string, ampm: string): string => {
  let hour24 = parseInt(hour)
  if (ampm === "PM" && hour24 !== 12) hour24 += 12
  if (ampm === "AM" && hour24 === 12) hour24 = 0
  return `${hour24.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

// Service type definition
type ServiceTypeOption = {
  value: ServiceType
  label: string
  description: string
  icon: string
  badge?: string
}

// Get available service types based on date
const getAvailableServiceTypes = (date?: Date): ServiceTypeOption[] => {
  if (!date) {
    return []
  }
  
  if (!isOlympicPeriod(date)) {
    // Standard period: Transfer + Disposizione
    return [
      { 
        value: "transfer", 
        label: "Transfer", 
        description: "Trasferimento punto a punto",
        icon: "🚗"
      },
      { 
        value: "disposizione", 
        label: "Disposizione", 
        description: "Servizio a tempo con autista",
        icon: "⏰"
      }
    ]
  }

  // Olympic period: base services
  const olympicServices: ServiceTypeOption[] = [
    { 
      value: "transfer", 
      label: "Transfer", 
      description: "Trasferimento con prezzi olimpici",
      icon: "🚗",
      badge: "OLIMPIADI 2026"
    },
    { 
      value: "altri-servizi", 
      label: "Altri Servizi", 
      description: "Disposizione e Inter-Cluster",
      icon: "🏔️",
      badge: "OLIMPIADI 2026"
    }
  ]

  // Check if it's a ceremony date and add ceremony service
  if (isCeremonyDate(date)) {
    const ceremonyName = getCeremonyName(date)
    olympicServices.push({
      value: "ceremony-disposition",
      label: ceremonyName || "Disposizione Cerimonia",
      description: "Servizio speciale per cerimonie olimpiche",
      icon: "🏆",
      badge: "CERIMONIA"
    })
  }

  return olympicServices
}

export default function BookingForm({ dictionary }: { dictionary: any }) {
  const { lang } = useLanguage()
  const [state, dispatch] = useReducer(bookingReducer, initialBookingState)

  const { validateAll, isValid, getFieldErrors } = useFormValidation(state)
  const { pricing, isCalculating } = usePriceCalculation(state, dispatch)
  const { handleError, getErrorMessage } = useErrorHandler()

  // Get available service types based on selected date - memoized to recalculate when date changes
  const availableServiceTypes = useMemo(() => {
    return getAvailableServiceTypes(state.journey.date)
  }, [state.journey.date])
  
  // Check if we're in Olympic period and "altri-servizi" is selected OR sub-services are active
  const isOlympicPeriod_local = state.journey.date ? isOlympicPeriod(state.journey.date) : false
  const showSubServices = isOlympicPeriod_local && (
    state.serviceType === "altri-servizi" || 
    state.serviceType === "disposizione" || 
    state.serviceType === "inter-cluster"
  )
  const isCeremonyDate_local = state.journey.date ? isCeremonyDate(state.journey.date) : false

  // Memoized handlers
  const handleCustomerChange = useCallback((customer: any) => {
    dispatch({ type: "SET_CUSTOMER", payload: customer })
  }, [])

  const handleServiceTypeChange = useCallback((serviceType: ServiceType) => {
    dispatch({ type: "SET_SERVICE_TYPE", payload: serviceType })
  }, [])

  const handleJourneyChange = useCallback((journey: any) => {
    dispatch({ type: "SET_JOURNEY", payload: journey })
    
    // If date changed, check if current service type is still available
    if (journey.date) {
      const newAvailableServices = getAvailableServiceTypes(journey.date)
      const currentServiceAvailable = newAvailableServices.some(s => s.value === state.serviceType)
      if (!currentServiceAvailable) {
        dispatch({ type: "SET_SERVICE_TYPE", payload: newAvailableServices[0]?.value || "transfer" })
      }
    }
  }, [state.serviceType])

  const handleVehicleCountChange = useCallback((count: number) => {
    dispatch({ type: "SET_VEHICLE_COUNT", payload: count })
  }, [])

  const handleToggleSameType = useCallback(() => {
    dispatch({ type: "TOGGLE_SAME_VEHICLE_TYPE" })
  }, [])

  const handleSingleConfigChange = useCallback((config: any) => {
    dispatch({ type: "UPDATE_SINGLE_VEHICLE_CONFIG", payload: config })
  }, [])

  const handleMultipleConfigChange = useCallback((index: number, config: any) => {
    dispatch({ type: "UPDATE_MULTIPLE_VEHICLE_CONFIG", payload: { index, config } })
  }, [])

  const handleAddVehicle = useCallback(() => {
    dispatch({ type: "ADD_VEHICLE_CONFIG" })
  }, [])

  const handleRemoveVehicle = useCallback((index: number) => {
    dispatch({ type: "REMOVE_VEHICLE_CONFIG", payload: index })
  }, [])

  const handleOptionsChange = useCallback((options: any) => {
    dispatch({ type: "SET_OPTIONS", payload: options })
  }, [])

  const handleMeetGreetConfigChange = useCallback((config: Partial<MeetGreetConfig>) => {
    dispatch({ type: "UPDATE_MEET_GREET_CONFIG", payload: config })
    // Also update the legacy meetAndGreet flag for backward compatibility
    if (config.enabled !== undefined) {
      dispatch({ type: "SET_OPTIONS", payload: { meetAndGreet: config.enabled } })
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    // Clear previous errors
    dispatch({ type: "CLEAR_ERRORS" })

    // Validate form
    const errors = validateAll()
    if (errors.length > 0) {
      dispatch({ type: "SET_VALIDATION_ERRORS", payload: errors })
      return
    }

    dispatch({ type: "SET_SUBMIT_STATUS", payload: "submitting" })

    try {
      // 🔍 DEBUG: Log dei dati customer prima del submit
      console.log("🔍 DEBUG state.customer prima del submit:", JSON.stringify(state.customer, null, 2))

      // Prepare booking details for API compatibility
      const bookingData = {
        serviceType: state.serviceType,
        pickup: state.journey.pickup.address,
        destination: state.journey.destination.address,
        date: state.journey.date ? format(state.journey.date, "yyyy-MM-dd") : "",
        time: state.journey.time && state.journey.minutes && state.journey.timeAmPm 
          ? convertTo24Hour(state.journey.time, state.journey.minutes, state.journey.timeAmPm) 
          : "",
        endTime:
          state.serviceType === "disposizione" && state.journey.endTime && state.journey.endMinutes && state.journey.endTimeAmPm
            ? convertTo24Hour(state.journey.endTime, state.journey.endMinutes, state.journey.endTimeAmPm)
            : "",
        passengers:
          state.vehicles.sameType || state.vehicles.count === 1
            ? state.vehicles.singleConfig.passengers.toString()
            : state.vehicles.multipleConfigs.reduce((sum, config) => sum + config.passengers, 0).toString(),
        vehicleType:
          state.vehicles.sameType || state.vehicles.count === 1 ? state.vehicles.singleConfig.type : "multiple",
        vehicleCount: state.vehicles.count.toString(),
        luggage:
          state.vehicles.sameType || state.vehicles.count === 1
            ? state.vehicles.singleConfig.luggage.toString()
            : state.vehicles.multipleConfigs.reduce((sum, config) => sum + config.luggage, 0).toString(),
        flight: state.options.flight || "",
        billingInfo: state.options.billingInfo || "",
        notes: state.options.notes || "",
        meetAndGreet: state.options.meetAndGreet, // Legacy field
        meetGreetConfig: state.options.meetGreetConfig, // New enhanced config
        phonePrefix: state.customer.phonePrefix || "",
        phoneNumber: state.customer.phone || "",
        sameVehicleType: state.vehicles.sameType,
        distance: state.journey.distance
          ? {
              km: state.journey.distance.km,
              text: state.journey.distance.text,
              duration: state.journey.distance.duration,
            }
          : null,
        individualVehicles:
          !state.vehicles.sameType && state.vehicles.count > 1
            ? state.vehicles.multipleConfigs.map((config, index) => ({
                id: `vehicle-${index + 1}`,
                type: config.type,
                passengers: config.passengers,
                luggage: config.luggage,
              }))
            : null,
      }

      // 🔍 DEBUG: Log del bookingData finale
      console.log("🔍 DEBUG bookingData finale:", JSON.stringify(bookingData, null, 2))

      // Create Stripe checkout session with correct payload structure
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: pricing?.totalPrice || 0,
          customerEmail: state.customer.email,
          customerName: state.customer.name,
          bookingData: bookingData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to create checkout session`)
      }

      const { url } = await response.json()

      if (!url) {
        throw new Error("No checkout URL received from server")
      }

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error) {
      const bookingError = handleError(error)
      dispatch({ type: "SET_SUBMIT_STATUS", payload: "error" })
      console.error("Booking submission error:", getErrorMessage(bookingError))
    }
  }, [state, validateAll, handleError, getErrorMessage, pricing])

  // Success state
  if (state.ui.submitStatus === "success") {
    return (
      <div className="max-w-4xl mx-auto p-4 bg-green-50 border border-green-200 text-center rounded-lg">
        <h3 className="text-xl mb-4 text-green-800">
          {dictionary.success.title}
        </h3>
        <p className="text-green-700 mb-6">
          {dictionary.success.description}
        </p>
        <button
          onClick={() => dispatch({ type: "SET_SUBMIT_STATUS", payload: "idle" })}
          className="bg-black text-white px-6 py-2 hover:bg-gray-800 transition-colors duration-300 rounded"
        >
          {dictionary.success.newBooking}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl mb-4 atacama">{dictionary.formTitle}</h2>
        <p className="text-darkGray font-light">
          {dictionary.formSubtitle}
        </p>
      </div>

      <div className="space-y-6">
        {/* Customer Information */}
        <CustomerInfoSection
          customer={state.customer}
          errors={getFieldErrors("customer")}
          onChange={handleCustomerChange}
          dictionary={dictionary.customer}
        />

        {/* Date Selection - Critical first step */}
        <DateSection
          date={state.journey.date}
          errors={getFieldErrors("journey")}
          onChange={(date) => handleJourneyChange({ date })}
          dictionary={dictionary.date || {
            title: "Data del servizio",
            dateLabel: "Seleziona data",
            selectDate: "Scegli una data",
            dateImportance: "La data è fondamentale: da essa dipendono i prezzi e la disponibilità dei servizi. Seleziona prima la data per procedere.",
            dateSelected: "Data selezionata! Ora puoi procedere con la configurazione del viaggio."
          }}
        />

        {/* Service Type Selection - Only enabled when date is selected */}
        <div className={!state.journey.date ? "opacity-50 pointer-events-none" : ""}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {dictionary.serviceType.title}
                {state.journey.date && isOlympicPeriod(state.journey.date) && (
                  <span className="px-2 py-1 bg-gradient-to-r from-blue-500 to-green-500 text-white text-xs rounded-full">
                    🏔️ PERIODO OLIMPICO
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableServiceTypes.map((serviceType) => (
                  <label 
                    key={serviceType.value} 
                    className="flex items-start cursor-pointer p-4 border rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <input
                      type="radio"
                      name="serviceType"
                      value={serviceType.value}
                      checked={state.serviceType === serviceType.value}
                      onChange={(e) => handleServiceTypeChange(e.target.value as ServiceType)}
                      disabled={!state.journey.date}
                      className="mr-3 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{serviceType.icon}</span>
                        <span className="font-medium">{serviceType.label}</span>
                        {serviceType.badge && (
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            serviceType.badge === "SPECIAL EVENT" 
                              ? "bg-red-100 text-red-800" 
                              : "bg-gradient-to-r from-blue-500 to-green-500 text-white"
                          }`}>
                            {serviceType.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{serviceType.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sub-service selection for Olympic "Altri Servizi" */}
        {showSubServices && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🏔️ Scegli il Tipo di Servizio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-start cursor-pointer p-4 border rounded-lg hover:border-blue-300 transition-colors">
                    <input
                      type="radio"
                      name="subServiceType"
                      value="disposizione"
                      checked={state.serviceType === "disposizione"}
                      onChange={(e) => handleServiceTypeChange("disposizione")}
                      className="mr-3 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">⏰</span>
                        <span className="font-medium">Disposizione</span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gradient-to-r from-blue-500 to-green-500 text-white">
                          OLIMPIADI 2026
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Servizio a tempo con tariffe olimpiche</p>
                    </div>
                  </label>

                  <label className="flex items-start cursor-pointer p-4 border rounded-lg hover:border-blue-300 transition-colors">
                    <input
                      type="radio"
                      name="subServiceType"
                      value="inter-cluster"
                      checked={state.serviceType === "inter-cluster"}
                      onChange={(e) => handleServiceTypeChange("inter-cluster")}
                      className="mr-3 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🚠</span>
                        <span className="font-medium">Inter-Cluster</span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gradient-to-r from-blue-500 to-green-500 text-white">
                          OLIMPIADI 2026
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Transfer tra sedi olimpiche</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Journey Details - Only enabled when date is selected */}
        <div className={!state.journey.date ? "opacity-50 pointer-events-none" : ""}>
          <JourneySection
            journey={state.journey}
            errors={getFieldErrors("journey")}
            onChange={handleJourneyChange}
            serviceType={state.serviceType}
            options={state.options}
            onOptionsChange={handleOptionsChange}
            dictionary={dictionary.journey}
          />
        </div>

        {/* Vehicle Configuration - Only enabled when date is selected */}
        <div className={!state.journey.date ? "opacity-50 pointer-events-none" : ""}>
          <VehicleConfigSection
            vehicleCount={state.vehicles.count}
            sameType={state.vehicles.sameType}
            singleConfig={state.vehicles.singleConfig}
            multipleConfigs={state.vehicles.multipleConfigs}
            errors={getFieldErrors("vehicles")}
            journeyDate={state.journey.date}
            serviceType={state.serviceType}
            onCountChange={handleVehicleCountChange}
            onToggleSameType={handleToggleSameType}
            onSingleConfigChange={handleSingleConfigChange}
            onMultipleConfigChange={handleMultipleConfigChange}
            onAddVehicle={handleAddVehicle}
            onRemoveVehicle={handleRemoveVehicle}
            dictionary={dictionary.vehicles}
          />
        </div>

        {/* Pricing Display - Only shown when date is selected */}
        {state.journey.date && (
          <PricingDisplay
            pricing={pricing}
            isCalculating={isCalculating}
            errors={[]}
            dictionary={dictionary.pricing}
          />
        )}

        {/* Meet & Greet Section - Only available during Olympic period */}
        {state.journey.date && isOlympicPeriod(state.journey.date) && (
          <MeetGreetSection
            config={state.options.meetGreetConfig}
            journey={state.journey}
            errors={getFieldErrors("meetGreetConfig").map(e => e.message)}
            onChange={handleMeetGreetConfigChange}
            pricing={pricing}
            dictionary={dictionary.meetGreet || {}}
          />
        )}

        {/* Additional Options - Only enabled when date is selected */}
        <div className={!state.journey.date ? "opacity-50 pointer-events-none" : ""}>
          <AdditionalOptionsSection
            options={state.options}
            errors={getFieldErrors("options")}
            onChange={handleOptionsChange}
            dictionary={dictionary.options}
          />
        </div>

        {/* Submit Section - Only enabled when date is selected */}
        <div className={!state.journey.date ? "opacity-50 pointer-events-none" : ""}>
          <SubmitSection
            isValid={isValid && !!state.journey.date}
            isSubmitting={state.ui.isSubmitting}
            pricing={pricing}
            submitError={
              state.ui.submitStatus === "error"
                ? dictionary.submit.error
                : undefined
            }
            onSubmit={handleSubmit}
            dictionary={dictionary.submit}
          />
        </div>
      </div>
    </div>
  )
}
