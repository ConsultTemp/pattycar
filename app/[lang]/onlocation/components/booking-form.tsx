"use client"

import { useReducer, useCallback, useMemo, useState, useEffect } from "react"
import { timeUtils } from "@/lib/time-utils"
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
import { resolveLocationForPricing, getLocationById } from "@/lib/event-pricing"
import { isOlympicPeriod, isCeremonyDate, getCeremonyName, findOlympicRoute, findOlympicCeremony, isRouteBookable } from "@/lib/olympic-pricing"

// Helper function to convert to 24h format string (for form submission)
const formatTime24Hour = (hour: string, minutes: string, ampm: string): string => {
  const converted = timeUtils.to24h(hour, minutes, ampm)
  return `${converted.hour24.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`
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
const getAvailableServiceTypes = (date?: Date, dictionary?: any): ServiceTypeOption[] => {
  if (!date) {
    return []
  }

  if (!isOlympicPeriod(date)) {
    // Standard period: Transfer + Disposizione
    return [
      {
        value: "transfer",
        label: dictionary?.serviceType?.transfer?.label || "Transfer",
        description: dictionary?.serviceType?.transfer?.description || "Point-to-point transfer",
        icon: ""
      },
      {
        value: "disposizione",
        label: dictionary?.serviceType?.disposition?.label || "Disposition",
        description: dictionary?.serviceType?.disposition?.description || "Time-based service with driver",
        icon: ""
      }
    ]
  }

  // Olympic period: base services
  const olympicServices: ServiceTypeOption[] = [
    {
      value: "transfer",
      label: dictionary?.serviceType?.transfer?.label || "Transfer",
      description: dictionary?.serviceType?.transfer?.olympicDescription || "Transfer with special prices",
      icon: "",
    },
    {
      value: "altri-servizi",
      label: dictionary?.serviceType?.otherServices?.label || "Other Services",
      description: dictionary?.serviceType?.otherServices?.description || "Disposition and Transfer between cities",
      icon: "",
    }
  ]

  // Check if it's a ceremony date and add ceremony service
  /* if (isCeremonyDate(date)) {
    const ceremony = findOlympicCeremony(date)
    if (ceremony) {
      // Get specific ceremony label based on ceremony ID
      let ceremonyLabel = ""
      let ceremonyDescription = ""

      if (ceremony.id === "opening-ceremony") {
        ceremonyLabel = dictionary?.serviceType?.ceremonyNames?.["opening-ceremony"] ||
          dictionary?.serviceType?.ceremonyDispositionOpening ||
          "Opening Ceremony Disposition"
        ceremonyDescription = dictionary?.serviceType?.ceremony?.openingDescription ||
          dictionary?.serviceType?.ceremony?.description ||
          "Special service for opening ceremony"
      } else if (ceremony.id === "closing-ceremony") {
        ceremonyLabel = dictionary?.serviceType?.ceremonyNames?.["closing-ceremony"] ||
          dictionary?.serviceType?.ceremonyDispositionClosing ||
          "Closing Ceremony Disposition"
        ceremonyDescription = dictionary?.serviceType?.ceremony?.closingDescription ||
          dictionary?.serviceType?.ceremony?.description ||
          "Special service for closing ceremony"
      } else {
        // Fallback for any other ceremony
        ceremonyLabel = dictionary?.serviceType?.dispositionCeremony ||
          dictionary?.serviceType?.ceremony?.label ||
          "Ceremony Disposition"
        ceremonyDescription = dictionary?.serviceType?.ceremony?.description ||
          "Special service for ceremonies and events"
      }

      olympicServices.push({
        value: "ceremony-disposition",
        label: ceremonyLabel,
        description: ceremonyDescription,
        icon: "",
      })
    }
  } */

  return olympicServices
}

export default function BookingForm({ dictionary }: { dictionary: any }) {
  const { lang } = useLanguage()
  const [state, dispatch] = useReducer(bookingReducer, initialBookingState)
  const [cancellationAccepted, setCancellationAccepted] = useState(false)

  const { validateAll, isValid, getFieldErrors } = useFormValidation(state, {
    cancellationAccepted,
    tripDistance: state.journey.distance,
    pickupCoordinates: state.journey.pickup?.coordinates,
    destinationCoordinates: state.journey.destination?.coordinates,
    serviceType: state.serviceType
  })
  const { pricing, isCalculating } = usePriceCalculation(state, dispatch)
  const { handleError, getErrorMessage } = useErrorHandler()

  // Get available service types based on selected date - memoized to recalculate when date changes
  const availableServiceTypes = useMemo(() => {
    return getAvailableServiceTypes(state.journey.date, dictionary)
  }, [state.journey.date, dictionary])

  // Check if we're in Olympic period and "altri-servizi" is selected OR sub-services are active
  const isOlympicPeriod_local = state.journey.date ? isOlympicPeriod(state.journey.date) : false
  const showSubServices = isOlympicPeriod_local && (
    state.serviceType === "altri-servizi" ||
    state.serviceType === "disposizione" ||
    state.serviceType === "inter-cluster"
  )
  const isCeremonyDate_local = state.journey.date ? isCeremonyDate(state.journey.date) : false

  // Check if route is bookable (during Olympic period only)
  const routeIsNotBookable = useMemo(() => {
    if (!isOlympicPeriod_local || !state.journey.pickup?.address || !state.journey.destination?.address) {
      return false
    }

    // Use same location resolution logic as pricing calculation
    const resolvedPickup = resolveLocationForPricing(
      state.journey.pickup.locationId,
      state.journey.pickup.coordinates
    )
    const resolvedDestination = resolveLocationForPricing(
      state.journey.destination.locationId,
      state.journey.destination.coordinates
    )

    if (resolvedPickup.resolvedLocationId && resolvedDestination.resolvedLocationId) {
      return !isRouteBookable(resolvedPickup.resolvedLocationId, resolvedDestination.resolvedLocationId)
    }
    return false
  }, [
    isOlympicPeriod_local, 
    state.journey.pickup?.address, 
    state.journey.pickup?.locationId,
    state.journey.pickup?.coordinates,
    state.journey.destination?.address,
    state.journey.destination?.locationId,
    state.journey.destination?.coordinates
  ])

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
      const newAvailableServices = getAvailableServiceTypes(journey.date, dictionary)
      const currentServiceAvailable = newAvailableServices.some(s => s.value === state.serviceType)
      if (!currentServiceAvailable) {
        dispatch({ type: "SET_SERVICE_TYPE", payload: newAvailableServices[0]?.value || "transfer" })
      }
    }
  }, [state.serviceType, dictionary])

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

  const handleWaterTaxiChange = useCallback((enabled: boolean) => {
    dispatch({ type: "SET_WATER_TAXI", payload: enabled })
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
  }, [dispatch])

  // Auto-set and lock drop off location for ceremony dates
  useEffect(() => {
    if (!state.journey.date || state.serviceType !== "ceremony-disposition") {
      return
    }

    const ceremony = findOlympicCeremony(state.journey.date)
    if (!ceremony) {
      return
    }

    // Get the ceremony venue location details
    const venueLocation = getLocationById(ceremony.venueLocationId)
    if (!venueLocation) {
      console.warn(`Venue location not found for ceremony: ${ceremony.venueLocationId}`)
      return
    }

    // Check if destination is already set to the correct ceremony venue
    const isCorrectVenueSet = state.journey.destination?.locationId === ceremony.venueLocationId

    if (!isCorrectVenueSet) {
      // Auto-set the destination to the ceremony venue
      dispatch({
        type: "SET_JOURNEY",
        payload: {
          destination: {
            address: venueLocation.displayName,
            placeId: "", // Not from Google Places
            coordinates: venueLocation.coordinates,
            locationId: venueLocation.id,
            isCustom: false
          }
        }
      })
    }
  }, [state.journey.date, state.serviceType, state.journey.destination?.locationId])

  // Helper function to determine if destination should be disabled for ceremonies
  const isDestinationDisabledForCeremony = useCallback((): boolean => {
    return Boolean(state.journey.date &&
      state.serviceType === "ceremony-disposition" &&
      isCeremonyDate(state.journey.date))
  }, [state.journey.date, state.serviceType])

  const handleSubmit = useCallback(async () => {
    // Mark that user has attempted to submit (for UI styling)
    dispatch({ type: "SET_ATTEMPTED_SUBMIT", payload: true })

    // Clear previous errors
    dispatch({ type: "CLEAR_ERRORS" })

    // CRITICAL: Block submission if route is not bookable
    if (routeIsNotBookable) {
      dispatch({ type: "SET_SUBMIT_STATUS", payload: "error" })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Validate form (now includes cancellation policy and distance validation)
    const errors = validateAll()

    // Debug log for validation
    console.log("Form validation:", {
      totalErrors: errors.length,
      errors: errors,
      isValid: isValid,
      cancellationAccepted: cancellationAccepted,
      state: {
        serviceType: state.serviceType,
        hasDate: !!state.journey.date,
        hasPickup: !!state.journey.pickup?.address,
        hasDestination: !!state.journey.destination?.address,
        hasTime: !!state.journey.time,
        hasCustomer: !!state.customer.name && !!state.customer.email && !!state.customer.phone,
        vehicleConfig: state.vehicles
      }
    })

    // IMPORTANT: Block submission if there are any validation errors
    if (errors.length > 0) {
      dispatch({ type: "SET_VALIDATION_ERRORS", payload: errors })
      dispatch({ type: "SET_SUBMIT_STATUS", payload: "error" })
      // Scroll smoothly to top of page to show validation errors
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    dispatch({ type: "SET_SUBMIT_STATUS", payload: "submitting" })

    try {

      // Prepare booking details for API compatibility
      console.log('🔍 DEBUG FORM SUBMISSION:')
      console.log('  - destination:', state.journey.destination)
      console.log('  - departureTime:', state.journey.departureTime)
      console.log('  - departureMinutes:', state.journey.departureMinutes)
      console.log('  - departureTimeAmPm:', state.journey.departureTimeAmPm)

      const bookingData = {
        serviceType: state.serviceType,
        pickup: state.journey.pickup.address,
        destination: state.journey.destination.address,
        date: state.journey.date ? format(state.journey.date, "yyyy-MM-dd") : "",
        time: state.journey.time && state.journey.minutes && state.journey.timeAmPm
          ? formatTime24Hour(state.journey.time, state.journey.minutes, state.journey.timeAmPm)
          : "",
        departureTime: state.journey.departureTime && state.journey.departureMinutes
          ? (state.journey.departureTimeAmPm 
              ? formatTime24Hour(state.journey.departureTime, state.journey.departureMinutes, state.journey.departureTimeAmPm)
              : `${state.journey.departureTime}:${state.journey.departureMinutes}`)
          : "",
        departureMinutes: state.journey.departureMinutes || "",
        departureTimeAmPm: state.journey.departureTimeAmPm || "",
        endTime:
          state.serviceType === "disposizione" && state.journey.endTime && state.journey.endMinutes && state.journey.endTimeAmPm
            ? formatTime24Hour(state.journey.endTime, state.journey.endMinutes, state.journey.endTimeAmPm)
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
        billingType: state.options.billingType || "private",
        billingInfo: state.options.billingInfo || "",
        companyName: state.options.companyName || "",
        companyAddress: state.options.companyAddress || "",
        vatNumber: state.options.vatNumber || "",
        notes: state.options.notes || "",
        meetAndGreet: state.options.meetAndGreet, // Legacy field
        meetGreetConfig: state.options.meetGreetConfig, // New enhanced config
        phonePrefix: state.customer.phonePrefix || "",
        phoneNumber: state.customer.phone || "",
        sameVehicleType: state.vehicles.sameType,
        waterTaxi: state.vehicles.waterTaxi,
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
    }
  }, [state, validateAll, handleError, getErrorMessage, pricing, cancellationAccepted, routeIsNotBookable])

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
        <p className="text-sm text-gray-600 mt-4 font-medium">
          {dictionary.requiredFieldsNote}
        </p>
      </div>

      <div className="space-y-6">
        {/* Customer Information */}
        <CustomerInfoSection
          customer={state.customer}
          errors={getFieldErrors("customer")}
          hasAttemptedSubmit={state.ui.hasAttemptedSubmit}
          onChange={handleCustomerChange}
          dictionary={{...dictionary.customer, validationErrors: dictionary.submit?.validationErrors}}
        />

        {/* Date Selection - Critical first step */}
        <DateSection
          date={state.journey.date}
          errors={getFieldErrors("journey")}
          hasAttemptedSubmit={state.ui.hasAttemptedSubmit}
          onChange={(date) => handleJourneyChange({ date })}
          dictionary={{...dictionary.date, validationErrors: dictionary.submit?.validationErrors}}
        />

        {/* Service Type Selection - Only enabled when date is selected */}
        <div className={!state.journey.date ? "opacity-50 pointer-events-none" : ""}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {dictionary.serviceType.title}
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
                  {dictionary?.serviceType?.subServices?.title || "Choose Service Type"}
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
                        <span className="text-lg"></span>
                        <span className="font-medium">{dictionary?.serviceType?.disposition?.label || "Disposition"}</span>

                      </div>
                      <p className="text-sm text-gray-500">{dictionary?.serviceType?.disposition?.olympicDescription || "Time-based service with Olympic rates"}</p>
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
                        <span className="font-medium">{dictionary?.serviceType?.interCluster?.label || "Transfer between cities"}</span>

                      </div>
                      <p className="text-sm text-gray-500">{dictionary?.serviceType?.interCluster?.description || "Transfer between Olympic venues"}</p>
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
            optionsErrors={getFieldErrors("options")}
            hasAttemptedSubmit={state.ui.hasAttemptedSubmit}
            onChange={handleJourneyChange}
            serviceType={state.serviceType}
            options={state.options}
            onOptionsChange={handleOptionsChange}
            dictionary={{...dictionary.journey, validationErrors: dictionary.submit?.validationErrors}}
            isDestinationDisabled={isDestinationDisabledForCeremony}
            pricing={pricing}
          />
        </div>

        {/* Meet & Greet Section - Available when service is detected and route is bookable */}
        {state.journey.date && !routeIsNotBookable && (
          <MeetGreetSection
            config={state.options.meetGreetConfig}
            journey={state.journey}
            errors={getFieldErrors("meetGreetConfig").map(e => e.message)}
            onChange={handleMeetGreetConfigChange}
            pricing={pricing}
            dictionary={dictionary.meetGreet || {}}
          />
        )}

        {/* Vehicle Configuration - Only enabled when date is selected and route is bookable */}
        <div className={!state.journey.date || routeIsNotBookable ? "opacity-50 pointer-events-none" : ""}>
          {(() => {
            // Determine if current route is East Cluster or Inter-Cluster
            let isEastCluster = false
            let isInterCluster = false

            if (isOlympicPeriod_local) {
              // Use same location resolution logic as pricing calculation
              const resolvedPickup = resolveLocationForPricing(
                state.journey.pickup.locationId,
                state.journey.pickup.coordinates
              )
              const resolvedDestination = resolveLocationForPricing(
                state.journey.destination.locationId,
                state.journey.destination.coordinates
              )

              if (resolvedPickup.resolvedLocationId && resolvedDestination.resolvedLocationId) {
                // Try to find Olympic route with resolved locations
                let olympicRoute = findOlympicRoute(
                  resolvedPickup.resolvedLocationId,
                  resolvedDestination.resolvedLocationId
                )

                // Apply same fallback logic as pricing calculation
                if (!olympicRoute) {
                  const meetGreetToGenericMap: Record<string, string> = {
                    'venezia-santa-lucia': 'venezia',
                    'venezia-marco-polo': 'venezia',
                    'milano-centrale': 'milano',
                    'milano-malpensa': 'malpensa',
                    'milano-linate': 'linate',
                    'verona-porta-nuova': 'verona'
                  }

                  const fallbackPickupId = meetGreetToGenericMap[resolvedPickup.resolvedLocationId] || resolvedPickup.resolvedLocationId
                  const fallbackDestinationId = meetGreetToGenericMap[resolvedDestination.resolvedLocationId] || resolvedDestination.resolvedLocationId

                  if (fallbackPickupId !== resolvedPickup.resolvedLocationId || fallbackDestinationId !== resolvedDestination.resolvedLocationId) {
                    olympicRoute = findOlympicRoute(fallbackPickupId, fallbackDestinationId)
                  }
                }

                // IMPORTANT: Both East Cluster and Inter-Cluster routes limit vehicles to sedan/minivan
                isEastCluster = olympicRoute?.isEastCluster === true
                isInterCluster = olympicRoute?.isInterCluster === true

                console.log("🏔️ VEHICLE CONFIG - East/Inter Cluster Check:", {
                  pickup: resolvedPickup.resolvedLocationId,
                  destination: resolvedDestination.resolvedLocationId,
                  foundRoute: !!olympicRoute,
                  isEastCluster: olympicRoute?.isEastCluster,
                  isInterCluster: olympicRoute?.isInterCluster,
                  limitVehiclesForEastCluster: isEastCluster,
                  limitVehiclesForInterCluster: isInterCluster
                })
              }
            }

            return (
              <VehicleConfigSection
                vehicleCount={state.vehicles.count}
                sameType={state.vehicles.sameType}
                singleConfig={state.vehicles.singleConfig}
                multipleConfigs={state.vehicles.multipleConfigs}
                errors={getFieldErrors("vehicles")}
                hasAttemptedSubmit={state.ui.hasAttemptedSubmit}
                journeyDate={state.journey.date}
                serviceType={state.serviceType}
                isEastCluster={isEastCluster}
                isInterCluster={isInterCluster}
                pickupLocationId={state.journey.pickup.locationId}
                destinationLocationId={state.journey.destination.locationId}
                pickupAddress={state.journey.pickup.address}
                destinationAddress={state.journey.destination.address}
                pickupCoordinates={state.journey.pickup.coordinates}
                destinationCoordinates={state.journey.destination.coordinates}
                waterTaxi={state.vehicles.waterTaxi}
                onWaterTaxiChange={handleWaterTaxiChange}
                onCountChange={handleVehicleCountChange}
                onToggleSameType={handleToggleSameType}
                onSingleConfigChange={handleSingleConfigChange}
                onMultipleConfigChange={handleMultipleConfigChange}
                onAddVehicle={handleAddVehicle}
                onRemoveVehicle={handleRemoveVehicle}
                dictionary={{...dictionary.vehicles, validationErrors: dictionary.submit?.validationErrors}}
              />
            )
          })()}
        </div>

        {/* Pricing Display - Only shown when date is selected and route is bookable */}
        {state.journey.date && !routeIsNotBookable && (
          <PricingDisplay
            pricing={pricing}
            isCalculating={isCalculating}
            errors={[]}
            dictionary={dictionary.pricing}
          />
        )}

        {/* Additional Options - Only enabled when date is selected and route is bookable */}
        <div className={!state.journey.date || routeIsNotBookable ? "opacity-50 pointer-events-none" : ""}>
          <AdditionalOptionsSection
            options={state.options}
            errors={getFieldErrors("options")}
            hasAttemptedSubmit={state.ui.hasAttemptedSubmit}
            onChange={handleOptionsChange}
            dictionary={{...dictionary.options, validationErrors: dictionary.submit?.validationErrors}}
          />
        </div>

        {/* Submit Section - Only enabled when date is selected and route is bookable */}
        <div className={!state.journey.date || routeIsNotBookable ? "opacity-50 pointer-events-none" : ""}>
          <SubmitSection
            isValid={isValid}
            isSubmitting={state.ui.isSubmitting}
            pricing={pricing}
            submitError={
              state.ui.submitStatus === "error"
                ? dictionary.submit.error
                : undefined
            }
            cancellationAccepted={cancellationAccepted}
            onCancellationChange={setCancellationAccepted}
            onSubmit={handleSubmit}
            dictionary={dictionary.submit}
            validationErrors={state.ui.errors}
          />
        </div>
      </div>
    </div>
  )
}