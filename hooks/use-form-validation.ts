"use client"

import { useCallback, useMemo } from "react"
import {
  type BookingState,
  type ValidationError,
  customerSchema,
  journeySchema,
  vehiclesSchema,
  optionsSchema,
} from "@/lib/booking-types"

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
    const result = journeySchema.safeParse(state.journey)

    if (!result.success) {
      result.error.errors.forEach((error) => {
        errors.push({
          field: `journey.${error.path.join(".")}`,
          message: error.message,
        })
      })
    }

    return errors
  }, [state.journey])

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
