"use client"

import { useCallback } from "react"
import type { BookingState } from "@/lib/booking-types"
import { timeUtils } from "@/lib/time-utils"
import { isOlympicPeriod } from "@/lib/olympic-pricing"

export interface ValidationError {
  field: string
  message: string
}

export function useFormValidation(state: BookingState) {
  // Validate customer information
  const validateCustomer = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = []
    const { customer } = state

    if (!customer.name?.trim()) {
      errors.push({ field: "customer.name", message: "Name is required" })
    } else if (customer.name.trim().length < 2) {
      errors.push({ field: "customer.name", message: "Name must be at least 2 characters" })
    }

    if (!customer.email?.trim()) {
      errors.push({ field: "customer.email", message: "Email is required" })
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(customer.email.trim())) {
        errors.push({ field: "customer.email", message: "Please enter a valid email address" })
      }
    }

    if (!customer.phone?.trim()) {
      errors.push({ field: "customer.phone", message: "Phone number is required" })
    } else {
      // Basic phone validation - at least 6 digits
      const phoneDigits = customer.phone.replace(/\D/g, '')
      if (phoneDigits.length < 6) {
        errors.push({ field: "customer.phone", message: "Please enter a valid phone number" })
      }
    }

    return errors
  }, [state.customer])

  // Validate journey information
  const validateJourney = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = []
    const { journey, serviceType } = state

    // Date validation
    if (!journey.date) {
      errors.push({ field: "journey.date", message: "Date is required" })
    } else {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const selectedDate = new Date(journey.date.getFullYear(), journey.date.getMonth(), journey.date.getDate())
      
      if (selectedDate < today) {
        errors.push({ field: "journey.date", message: "Date cannot be in the past" })
      }
    }

    // Pickup address validation
    if (!journey.pickup.address?.trim()) {
      errors.push({ field: "journey.pickup", message: "Pickup location is required" })
    }

    // Destination address validation (not required for Olympic dispositions)
    const isOlympicDisposition = journey.date && isOlympicPeriod(journey.date) && serviceType === "disposizione"
    if (!isOlympicDisposition && !journey.destination.address?.trim()) {
      errors.push({ field: "journey.destination", message: "Destination is required" })
    }

    // Same pickup and destination check
    if (journey.pickup.address && journey.destination.address && 
        journey.pickup.address === journey.destination.address) {
      errors.push({ field: "journey.destination", message: "Destination must be different from pickup location" })
    }

    // Time validation for transfers
    if ((serviceType === "transfer" || serviceType === "inter-cluster") && journey.time && journey.minutes !== undefined && journey.timeAmPm) {
      // Basic time format validation
      const hour = parseInt(journey.time)
      const minute = parseInt(journey.minutes)
      
      if (isNaN(hour) || hour < 1 || hour > 12) {
        errors.push({ field: "journey.time", message: "Please select a valid hour" })
      }
      
      if (isNaN(minute) || minute < 0 || minute > 59) {
        errors.push({ field: "journey.minutes", message: "Please select valid minutes" })
      }
    }

    // Time validation for dispositions
    if (serviceType === "disposizione" || serviceType === "ceremony-disposition") {
      // Start time validation
      if (!journey.time || journey.minutes === undefined || journey.minutes === null || !journey.timeAmPm) {
        if (!isOlympicDisposition) { // Only require for non-Olympic dispositions
          errors.push({ field: "journey.time", message: "Start time is required" })
        }
      } else {
        const hour = parseInt(journey.time)
        const minute = parseInt(journey.minutes)
        
        if (isNaN(hour) || hour < 1 || hour > 12) {
          errors.push({ field: "journey.time", message: "Please select a valid start hour" })
        }
        
        if (isNaN(minute) || minute < 0 || minute > 59) {
          errors.push({ field: "journey.minutes", message: "Please select valid start minutes" })
        }
      }

      // End time validation
      if (!journey.endTime || journey.endMinutes === undefined || journey.endMinutes === null || !journey.endTimeAmPm) {
        if (!isOlympicDisposition) { // Only require for non-Olympic dispositions
          errors.push({ field: "journey.endTime", message: "End time is required" })
        }
      } else {
        const hour = parseInt(journey.endTime)
        const minute = parseInt(journey.endMinutes)
        
        if (isNaN(hour) || hour < 1 || hour > 12) {
          errors.push({ field: "journey.endTime", message: "Please select a valid end hour" })
        }
        
        if (isNaN(minute) || minute < 0 || minute > 59) {
          errors.push({ field: "journey.endMinutes", message: "Please select valid end minutes" })
        }
      }

      // Validate end time is after start time (if both are provided)
      if (journey.time && journey.minutes !== null && journey.timeAmPm && 
          journey.endTime && journey.endMinutes !== null && journey.endTimeAmPm) {
        try {
          const startTime = timeUtils.to24h(journey.time, journey.minutes, journey.timeAmPm)
          const endTime = timeUtils.to24h(journey.endTime, journey.endMinutes, journey.endTimeAmPm)
          
          if (endTime.totalMinutes <= startTime.totalMinutes) {
            errors.push({ field: "journey.endTime", message: "End time must be after start time" })
          }

          // Check minimum duration (30 minutes)
          const durationMinutes = endTime.totalMinutes - startTime.totalMinutes
          if (durationMinutes < 30) {
            errors.push({ field: "journey.endTime", message: "Minimum service duration is 30 minutes" })
          }
        } catch (error) {
          console.error("Time validation error:", error)
        }
      }
    }

    return errors
  }, [state.journey, state.serviceType])

  // Validate vehicle configuration
  const validateVehicles = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = []
    const { vehicles } = state

    if (vehicles.count < 1) {
      errors.push({ field: "vehicles.count", message: "At least one vehicle is required" })
    }

    if (vehicles.count > 10) {
      errors.push({ field: "vehicles.count", message: "Maximum 10 vehicles allowed" })
    }

    // Single vehicle or same type validation
    if (vehicles.count === 1 || vehicles.sameType) {
      const config = vehicles.singleConfig
      
      if (!config.type) {
        errors.push({ field: "vehicles.singleConfig.type", message: "Vehicle type is required" })
      }

      if (!config.passengers || config.passengers < 1) {
        errors.push({ field: "vehicles.singleConfig.passengers", message: "Number of passengers is required" })
      }

      if (config.passengers > 50) {
        errors.push({ field: "vehicles.singleConfig.passengers", message: "Maximum 50 passengers per vehicle" })
      }

      if (config.luggage < 0) {
        errors.push({ field: "vehicles.singleConfig.luggage", message: "Luggage count cannot be negative" })
      }

      if (config.luggage > 20) {
        errors.push({ field: "vehicles.singleConfig.luggage", message: "Maximum 20 luggage pieces per vehicle" })
      }
    } else {
      // Multiple different vehicles validation
      if (vehicles.multipleConfigs.length !== vehicles.count) {
        errors.push({ field: "vehicles.multipleConfigs", message: "Configuration required for all vehicles" })
      }

      vehicles.multipleConfigs.forEach((config, index) => {
        if (!config.type) {
          errors.push({ field: `vehicles.multipleConfigs.${index}.type`, message: `Vehicle ${index + 1} type is required` })
        }

        if (!config.passengers || config.passengers < 1) {
          errors.push({ field: `vehicles.multipleConfigs.${index}.passengers`, message: `Vehicle ${index + 1} passenger count is required` })
        }

        if (config.passengers > 50) {
          errors.push({ field: `vehicles.multipleConfigs.${index}.passengers`, message: `Vehicle ${index + 1} maximum 50 passengers` })
        }

        if (config.luggage < 0) {
          errors.push({ field: `vehicles.multipleConfigs.${index}.luggage`, message: `Vehicle ${index + 1} luggage count cannot be negative` })
        }

        if (config.luggage > 20) {
          errors.push({ field: `vehicles.multipleConfigs.${index}.luggage`, message: `Vehicle ${index + 1} maximum 20 luggage pieces` })
        }
      })
    }

    return errors
  }, [state.vehicles])

  // Validate additional options
  const validateOptions = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = []
    const { options } = state

    // Flight number validation (if provided)
    if (options.flight && options.flight.trim()) {
      const flightRegex = /^[A-Z]{2,3}\d{1,4}$/i
      if (!flightRegex.test(options.flight.trim())) {
        errors.push({ field: "options.flight", message: "Please enter a valid flight number (e.g., BA123, LH456)" })
      }
    }

    // Notes length validation
    if (options.notes && options.notes.length > 500) {
      errors.push({ field: "options.notes", message: "Notes cannot exceed 500 characters" })
    }

    return errors
  }, [state.options])

  // Validate Meet & Greet configuration
  const validateMeetGreetConfig = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = []
    const { options } = state

    if (options.meetGreetConfig.enabled) {
      // Passengers validation
      if (!options.meetGreetConfig.passengers || options.meetGreetConfig.passengers < 1) {
        errors.push({ field: "meetGreetConfig.passengers", message: "Number of passengers is required for Meet & Greet" })
      }

      if (options.meetGreetConfig.passengers > 15) {
        errors.push({ field: "meetGreetConfig.passengers", message: "Maximum 15 passengers for Meet & Greet service" })
      }

      // Children validation
      if (options.meetGreetConfig.children < 0) {
        errors.push({ field: "meetGreetConfig.children", message: "Children count cannot be negative" })
      }

      // Infants validation
      if (options.meetGreetConfig.infants < 0) {
        errors.push({ field: "meetGreetConfig.infants", message: "Infants count cannot be negative" })
      }

      // Extra luggage validation
      if (options.meetGreetConfig.extraLuggage < 0) {
        errors.push({ field: "meetGreetConfig.extraLuggage", message: "Extra luggage count cannot be negative" })
      }

      if (options.meetGreetConfig.extraLuggage > 10) {
        errors.push({ field: "meetGreetConfig.extraLuggage", message: "Maximum 10 extra luggage pieces" })
      }

      // Total passengers check
      const totalPassengers = options.meetGreetConfig.passengers + options.meetGreetConfig.children
      if (totalPassengers > 15) {
        errors.push({ field: "meetGreetConfig.passengers", message: "Total passengers (adults + children) cannot exceed 15" })
      }
    }

    return errors
  }, [state.options])

  // Get field-specific errors
  const getFieldErrors = useCallback((fieldPrefix: string): ValidationError[] => {
    const allErrors = validateAll()
    return allErrors.filter(error => error.field.startsWith(fieldPrefix))
  }, [state])

  // Validate all fields
  const validateAll = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = []
    
    errors.push(...validateCustomer())
    errors.push(...validateJourney())
    errors.push(...validateVehicles())
    errors.push(...validateOptions())
    errors.push(...validateMeetGreetConfig())

    return errors
  }, [validateCustomer, validateJourney, validateVehicles, validateOptions, validateMeetGreetConfig])

  // Check if form is valid
  const isValid = useCallback((): boolean => {
    return validateAll().length === 0
  }, [validateAll])

  return {
    validateCustomer,
    validateJourney,
    validateVehicles,
    validateOptions,
    validateMeetGreetConfig,
    validateAll,
    getFieldErrors,
    isValid
  }
}