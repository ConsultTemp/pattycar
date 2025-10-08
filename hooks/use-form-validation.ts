"use client"

import { useCallback, useMemo } from "react"
import {
  type BookingState,
  type ValidationError,
  customerSchema,
  createJourneySchema,
  vehiclesSchema,
  optionsSchema,
} from "@/lib/booking-types"
import { isOlympicPeriod } from "@/lib/olympic-pricing"
import { validateTripDistance } from "@/lib/utils"

interface AdditionalValidationParams {
  cancellationAccepted?: boolean
  tripDistance?: {
    km: number
    text: string
    duration: string
  }
  pickupCoordinates?: { lat: number; lng: number }
  destinationCoordinates?: { lat: number; lng: number }
  serviceType?: string
}

export function useFormValidation(state: BookingState, additionalParams: AdditionalValidationParams = {}) {
  const validateCustomer = useCallback(() => {
    const errors: ValidationError[] = []
    const result = customerSchema.safeParse(state.customer)

    if (!result.success) {
      result.error.errors.forEach((error) => {
        errors.push({
          field: `customer.${error.path.join(".")}`,
          message: error.message,
        })
      })
    }

    return errors
  }, [state.customer])

  const validateJourney = useCallback(() => {
    const errors: ValidationError[] = []
    
    // Use conditional schema based on service type and date
    const isOlympic = state.journey.date ? isOlympicPeriod(state.journey.date) : false
    const journeySchema = createJourneySchema(state.serviceType, isOlympic)
    
    const result = journeySchema.safeParse(state.journey)

    if (!result.success) {
      result.error.errors.forEach((error) => {
        errors.push({
          field: `journey.${error.path.join(".")}`,
          message: error.message,
        })
      })
    }

    // Additional custom validation for address uniqueness
    if (state.journey.pickup?.address && state.journey.destination?.address && 
        state.journey.pickup.address === state.journey.destination.address) {
      errors.push({
        field: "journey.destination",
        message: "sameAddresses",
      })
    }

    // Check if destination is airport/station for departure time validation
    const isDestinationAirportOrStation = (() => {
      if (!state.journey.destination) return false
      
      // Check if it's from listino and has locationId that indicates airport/station
      if (!state.journey.destination.isCustom && state.journey.destination.locationId) {
        const locationId = state.journey.destination.locationId
        return locationId.includes('aeroporto') || 
               locationId.includes('airport') || 
               locationId.includes('stazione') || 
               locationId.includes('centrale') ||
               locationId.includes('linate') ||
               locationId.includes('malpensa') ||
               locationId.includes('marco-polo') ||
               locationId.includes('orio')
      }
      
      // For custom Google Places, check the types from Google Places API
      if (state.journey.destination.isCustom && state.journey.destination) {
        // Use Google's official place types
        if (!state.journey.destination.types || state.journey.destination.types.length === 0) {
          return false
        }
        
        // Check for airport types
        if (state.journey.destination.types.includes('airport')) {
          return true
        }
        
        // Check for station types
        if (state.journey.destination.types.includes('transit_station') ||
            state.journey.destination.types.includes('train_station') ||
            state.journey.destination.types.includes('subway_station') ||
            state.journey.destination.types.includes('light_rail_station')) {
          return true
        }
      }
      
      return false
    })()

    // Validation for departure time fields when destination is airport/station
    if (isDestinationAirportOrStation) {
      const hasDepartureTime = !!(state.journey.departureTime && state.journey.departureTime.trim() !== "")
      const hasPickupTime = !!(state.journey.time && state.journey.time.trim() !== "")
      
      // Both departure time (flight/train) and pickup departure time are required
      // Only show error on the field that is actually missing
      if (!hasDepartureTime) {
        errors.push({
          field: "journey.departureTime",
          message: "departureTimeRequired",
        })
      }
      
      if (!hasPickupTime) {
        errors.push({
          field: "journey.time",
          message: "pickupDepartureTimeRequired",
        })
      }
      
      // Check AM/PM for departure time if needed
      if (hasDepartureTime && state.journey.departureMinutes) {
        const departureTimeNum = parseInt(state.journey.departureTime)
        if (departureTimeNum >= 1 && departureTimeNum <= 12 && !state.journey.departureTimeAmPm) {
          errors.push({
            field: "journey.departureTimeAmPm",
            message: "selectAmPm",
          })
        }
      }
    }

    // Additional validation for time format (AM/PM when not 24h)
    if (state.journey.time && state.journey.minutes) {
      // Check if we need AM/PM (assuming we need it if time is 1-12)
      const timeNum = parseInt(state.journey.time)
      if (timeNum >= 1 && timeNum <= 12 && !state.journey.timeAmPm) {
        errors.push({
          field: "journey.timeAmPm",
          message: "selectAmPm",
        })
      }
    }

    // Additional validation for disposition services end time
    if ((state.serviceType === "disposizione" || state.serviceType === "ceremony-disposition") && !isOlympic) {
      if (state.journey.endTime && state.journey.endMinutes) {
        const endTimeNum = parseInt(state.journey.endTime)
        if (endTimeNum >= 1 && endTimeNum <= 12 && !state.journey.endTimeAmPm) {
          errors.push({
            field: "journey.endTimeAmPm",
            message: "selectEndAmPm",
          })
        }
      }
    }

    return errors
  }, [state.journey, state.serviceType])

  const validateVehicles = useCallback(() => {
    const errors: ValidationError[] = []

    if (state.vehicles.count === 0) {
      errors.push({
        field: "vehicles.count",
        message: "vehicleCountRequired",
      })
      return errors
    }

    const vehicleData =
      state.vehicles.sameType || state.vehicles.count === 1
        ? {
            sameType: true as const,
            count: state.vehicles.count,
            config: state.vehicles.singleConfig,
          }
        : {
            sameType: false as const,
            count: state.vehicles.count,
            configs: state.vehicles.multipleConfigs,
          }

    const result = vehiclesSchema.safeParse(vehicleData)

    if (!result.success) {
      result.error.errors.forEach((error) => {
        errors.push({
          field: `vehicles.${error.path.join(".")}`,
          message: error.message,
        })
      })
    }

    // Additional validation for vehicle count consistency
    if (state.vehicles.count > 1 && !state.vehicles.sameType) {
      if (state.vehicles.multipleConfigs.length !== state.vehicles.count) {
        errors.push({
          field: "vehicles.configs",
          message: "allVehicleConfigRequired",
        })
      }
    }

    return errors
  }, [state.vehicles])

  const validateOptions = useCallback(() => {
    const errors: ValidationError[] = []
    const result = optionsSchema.safeParse(state.options)

    if (!result.success) {
      result.error.errors.forEach((error) => {
        errors.push({
          field: `options.${error.path.join(".")}`,
          message: error.message,
        })
      })
    }

    return errors
  }, [state.options])

  const validateAdditional = useCallback(() => {
    const errors: ValidationError[] = []
    
    // Validate cancellation policy acceptance
    if (!additionalParams.cancellationAccepted) {
      errors.push({
        field: "cancellationAccepted",
        message: "cancellationPolicyRequired"
      })
    }
    
    // Validate distance for transfer and inter-cluster services
    const shouldValidateDistance = (additionalParams.serviceType === "transfer" || additionalParams.serviceType === "inter-cluster") && additionalParams.tripDistance
    
    if (shouldValidateDistance && additionalParams.tripDistance && additionalParams.pickupCoordinates && additionalParams.destinationCoordinates) {
      const distanceValidation = validateTripDistance(
        additionalParams.tripDistance.km,
        additionalParams.pickupCoordinates,
        additionalParams.destinationCoordinates
      )
      
      if (!distanceValidation.isValid) {
        errors.push({
          field: "journey.distance",
          message: "invalidTripDistance"
        })
      }
    }
    
    return errors
  }, [additionalParams])

  const validateAll = useCallback(() => {
    return [...validateCustomer(), ...validateJourney(), ...validateVehicles(), ...validateOptions(), ...validateAdditional()]
  }, [validateCustomer, validateJourney, validateVehicles, validateOptions, validateAdditional])

  const isValid = useMemo(() => {
    return validateAll().length === 0
  }, [validateAll])

  const getFieldErrors = useCallback(
    (fieldPrefix: string) => {
      return state.ui.errors.filter((error) => error.field.startsWith(fieldPrefix))
    },
    [state.ui.errors],
  )

  return {
    validateAll,
    validateCustomer,
    validateJourney,
    validateVehicles,
    validateOptions,
    isValid,
    getFieldErrors,
    errors: state.ui.errors,
  }
}
