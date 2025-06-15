"use client"

import { useReducer, useCallback } from "react"
import { useLanguage } from "@/components/language-provider"
import { bookingReducer, initialBookingState } from "@/lib/booking-reducer"
import { useFormValidation } from "@/hooks/use-form-validation"
import { usePriceCalculation } from "@/hooks/use-price-calculation"
import { useErrorHandler } from "@/hooks/use-error-handler"
import { CustomerInfoSection } from "@/components/booking/customer-info-section"
import { JourneySection } from "@/components/booking/journey-section"
import { VehicleConfigSection } from "@/components/booking/vehicle-config-section"
import { PricingDisplay } from "@/components/booking/pricing-display"
import { AdditionalOptionsSection } from "@/components/booking/additional-options-section"
import { SubmitSection } from "@/components/booking/submit-section"
import { format } from "date-fns"

export default function BookingForm({ dictionary }: { dictionary: any }) {
  const { lang } = useLanguage()
  const [state, dispatch] = useReducer(bookingReducer, initialBookingState)

  const { validateAll, isValid, getFieldErrors } = useFormValidation(state)
  const { pricing, isCalculating } = usePriceCalculation(state, dispatch)
  const { handleError, getErrorMessage } = useErrorHandler()

  // Memoized handlers
  const handleCustomerChange = useCallback((customer: any) => {
    dispatch({ type: "SET_CUSTOMER", payload: customer })
  }, [])

  const handleJourneyChange = useCallback((journey: any) => {
    dispatch({ type: "SET_JOURNEY", payload: journey })
  }, [])

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
      // Prepare booking details for API compatibility
      const bookingData = {
        pickup: `${state.journey.departure.city} - ${state.journey.departure.location}`,
        destination: `${state.journey.destination.city} - ${state.journey.destination.location}`,
        date: state.journey.date ? format(state.journey.date, "yyyy-MM-dd") : "",
        time: state.journey.time && state.journey.minutes ? `${state.journey.time}:${state.journey.minutes}` : "",
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
        meetAndGreet: state.options.meetAndGreet,
        sameVehicleType: state.vehicles.sameType,
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
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto p-8 bg-green-50 border border-green-200 text-center">
            <h3 className="text-xl mb-4 text-green-800">
              {dictionary.successMessage || "Prenotazione inviata con successo!"}
            </h3>
            <p className="text-green-700 mb-6">
              {dictionary.successDescription || "Ti contatteremo a breve per confermare la prenotazione."}
            </p>
            <button
              onClick={() => dispatch({ type: "SET_SUBMIT_STATUS", payload: "idle" })}
              className="bg-black text-white px-6 py-2 hover:bg-gray-800 transition-colors duration-300"
            >
              {dictionary.newBooking || "Nuova prenotazione"}
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl text-center mb-8 atacama">{dictionary.title || "Prenota il tuo trasferimento"}</h2>
        <p className="text-center text-darkGray font-light mb-12">
          {dictionary.subtitle || "Compila il modulo per richiedere un preventivo"}
        </p>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Customer Information */}
          <CustomerInfoSection
            customer={state.customer}
            errors={getFieldErrors("customer")}
            onChange={handleCustomerChange}
          />

          {/* Journey Details */}
          <JourneySection journey={state.journey} errors={getFieldErrors("journey")} onChange={handleJourneyChange} />

          {/* Vehicle Configuration */}
          <VehicleConfigSection
            vehicleCount={state.vehicles.count}
            sameType={state.vehicles.sameType}
            singleConfig={state.vehicles.singleConfig}
            multipleConfigs={state.vehicles.multipleConfigs}
            errors={getFieldErrors("vehicles")}
            onCountChange={handleVehicleCountChange}
            onToggleSameType={handleToggleSameType}
            onSingleConfigChange={handleSingleConfigChange}
            onMultipleConfigChange={handleMultipleConfigChange}
            onAddVehicle={handleAddVehicle}
            onRemoveVehicle={handleRemoveVehicle}
          />

          {/* Pricing Display */}
          <PricingDisplay
            pricing={pricing}
            isCalculating={isCalculating}
            errors={getFieldErrors("pricing").map((e) => e.message)}
          />

          {/* Additional Options */}
          <AdditionalOptionsSection
            options={state.options}
            errors={getFieldErrors("options")}
            onChange={handleOptionsChange}
          />

          {/* Submit Section */}
          <SubmitSection
            isValid={isValid}
            isSubmitting={state.ui.isSubmitting}
            pricing={pricing}
            submitError={
              state.ui.submitStatus === "error"
                ? "Errore durante la creazione della sessione di pagamento. Riprova."
                : undefined
            }
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </section>
  )
}
