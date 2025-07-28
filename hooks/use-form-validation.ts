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

export function useFormValidation(state: BookingState) {
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
        message: "Il punto di partenza e di arrivo non possono essere uguali",
      })
    }

    // Additional validation for time format (AM/PM when not 24h)
    if (state.journey.time && state.journey.minutes) {
      // Check if we need AM/PM (assuming we need it if time is 1-12)
      const timeNum = parseInt(state.journey.time)
      if (timeNum >= 1 && timeNum <= 12 && !state.journey.timeAmPm) {
        errors.push({
          field: "journey.timeAmPm",
          message: "Seleziona AM/PM",
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
            message: "Seleziona AM/PM per ora di fine",
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
        message: "Numero di veicoli richiesto",
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
          message: "Configurazione di tutti i veicoli richiesta",
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

  const validateAll = useCallback(() => {
    return [...validateCustomer(), ...validateJourney(), ...validateVehicles(), ...validateOptions()]
  }, [validateCustomer, validateJourney, validateVehicles, validateOptions])

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
