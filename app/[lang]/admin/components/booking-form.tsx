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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Helper function to convert 12h format to 24h format
const convertTo24Hour = (hour: string, minutes: string, ampm: string): string => {
  let hour24 = parseInt(hour)
  if (ampm === "PM" && hour24 !== 12) hour24 += 12
  if (ampm === "AM" && hour24 === 12) hour24 = 0
  return `${hour24.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

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

  const handleServiceTypeChange = useCallback((serviceType: "transfer" | "disposizione") => {
    dispatch({ type: "SET_SERVICE_TYPE", payload: serviceType })
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
        meetAndGreet: state.options.meetAndGreet,
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

        {/* Service Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>{dictionary.serviceType.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <label className="flex items-start sm:items-center cursor-pointer">
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="serviceType"
                    value="transfer"
                    checked={state.serviceType === "transfer"}
                    onChange={(e) => handleServiceTypeChange(e.target.value as "transfer")}
                    className="mr-2 mt-1 sm:mt-0"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="font-medium">{dictionary.serviceType.transfer}</span>
                    <span className="text-sm text-gray-500 sm:ml-2">{dictionary.serviceType.transferDescription}</span>
                  </div>
                </div>
              </label>
              <label className="flex items-start sm:items-center cursor-pointer">
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="serviceType"
                    value="disposizione"
                    checked={state.serviceType === "disposizione"}
                    onChange={(e) => handleServiceTypeChange(e.target.value as "disposizione")}
                    className="mr-2 mt-1 sm:mt-0"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="font-medium">{dictionary.serviceType.disposition}</span>
                    <span className="text-sm text-gray-500 sm:ml-2">{dictionary.serviceType.dispositionDescription}</span>
                  </div>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Journey Details */}
        <JourneySection
          journey={state.journey}
          errors={getFieldErrors("journey")}
          onChange={handleJourneyChange}
          serviceType={state.serviceType}
          options={state.options}
          onOptionsChange={handleOptionsChange}
          dictionary={dictionary.journey}
        />

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
          dictionary={dictionary.vehicles}
        />

        {/* Pricing Display */}
        <PricingDisplay
          pricing={pricing}
          isCalculating={isCalculating}
          errors={getFieldErrors("pricing").map((e) => e.message)}
          dictionary={dictionary.pricing}
        />

        {/* Additional Options */}
        <AdditionalOptionsSection
          options={state.options}
          errors={getFieldErrors("options")}
          onChange={handleOptionsChange}
          dictionary={dictionary.options}
        />

        {/* Submit Section */}
        <SubmitSection
          isValid={isValid}
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
  )
}
