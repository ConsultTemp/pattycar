"use client"

import { useCallback, useEffect, useMemo } from "react"
import { debounce } from "lodash"
import type { BookingState, PricingResult } from "@/lib/booking-types"
import {
  calculateTotalPrice,
  calculateMultipleVehiclesPrice,
  calculateDispositionPrice,
  calculateMultipleVehiclesDispositionPrice,
} from "@/lib/pricing-config"

// Helper function to convert 12h format to 24h format
const convertTo24Hour = (hour: string, minutes: string, ampm: string): { hour24: number, totalMinutes: number } => {
  let hour24 = parseInt(hour)
  if (ampm === "PM" && hour24 !== 12) hour24 += 12
  if (ampm === "AM" && hour24 === 12) hour24 = 0
  return { hour24, totalMinutes: hour24 * 60 + parseInt(minutes) }
}

export function usePriceCalculation(state: BookingState, dispatch: (action: any) => void) {
  const isReadyForPricing = useCallback((state: BookingState): boolean => {
    const { journey, vehicles, serviceType } = state

    // Basic validation
    if (!journey.pickup.address || !journey.destination.address || vehicles.count === 0) {
      return false
    }

    // Same pickup and destination check
    if (journey.pickup.address === journey.destination.address) {
      return false
    }

    // Service type specific validation
    if (serviceType === "transfer") {
      // Transfer needs distance
      if (!journey.distance?.km) {
        return false
      }
    } else if (serviceType === "disposizione") {
      // Disposition needs start and end time
      if (!journey.time || !journey.minutes || !journey.timeAmPm || !journey.endTime || !journey.endMinutes || !journey.endTimeAmPm) {
        return false
      }
      // Check end time is after start time using 12h to 24h conversion
      const startTime = convertTo24Hour(journey.time, journey.minutes, journey.timeAmPm)
      const endTime = convertTo24Hour(journey.endTime, journey.endMinutes, journey.endTimeAmPm)
      if (endTime.totalMinutes <= startTime.totalMinutes) {
        return false
      }
    }

    // Vehicle configuration validation
    if (vehicles.count === 1 || vehicles.sameType) {
      const config = vehicles.singleConfig
      return !!(config.type && config.passengers > 0)
    } else {
      return (
        vehicles.multipleConfigs.length === vehicles.count &&
        vehicles.multipleConfigs.every((config) => config.type && config.passengers > 0)
      )
    }
  }, [])

  const calculatePrice = useCallback(
    async (state: BookingState): Promise<PricingResult | null> => {
      if (!isReadyForPricing(state)) {
        return null
      }

      const { journey, vehicles, serviceType } = state

      try {
        if (serviceType === "transfer") {
          // Transfer pricing (distance-based)
          if (vehicles.count === 1 || vehicles.sameType) {
            const config = vehicles.singleConfig
            return calculateTotalPrice(
              journey.distance!.km,
              config.type,
              config.passengers,
              config.luggage,
              vehicles.count,
            )
          } else {
            return calculateMultipleVehiclesPrice(journey.distance!.km, vehicles.multipleConfigs)
          }
        } else if (serviceType === "disposizione") {
          // Disposition pricing (time-based)
          if (vehicles.count === 1 || vehicles.sameType) {
            const config = vehicles.singleConfig
            return calculateDispositionPrice(
              journey.time!,
              journey.minutes!,
              journey.timeAmPm!,
              journey.endTime!,
              journey.endMinutes!,
              journey.endTimeAmPm!,
              config.type,
              config.passengers,
              config.luggage,
              vehicles.count,
            )
          } else {
            return calculateMultipleVehiclesDispositionPrice(
              journey.time!,
              journey.minutes!,
              journey.timeAmPm!,
              journey.endTime!,
              journey.endMinutes!,
              journey.endTimeAmPm!,
              vehicles.multipleConfigs,
            )
          }
        }

        return null
      } catch (error) {
        console.error("Price calculation error:", error)
        return null
      }
    },
    [isReadyForPricing],
  )

  const debouncedCalculate = useMemo(
    () =>
      debounce(async (state: BookingState) => {
        dispatch({ type: "SET_CALCULATING_PRICE", payload: true })

        try {
          const pricing = await calculatePrice(state)
          dispatch({ type: "SET_PRICING", payload: pricing })
        } catch (error) {
          dispatch({ type: "SET_PRICING", payload: null })
        } finally {
          dispatch({ type: "SET_CALCULATING_PRICE", payload: false })
        }
      }, 300),
    [calculatePrice, dispatch],
  )

  useEffect(() => {
    debouncedCalculate(state)

    return () => {
      debouncedCalculate.cancel()
    }
  }, [state, debouncedCalculate])

  return {
    isReadyForPricing: isReadyForPricing(state),
    pricing: state.ui.pricing,
    isCalculating: state.ui.isCalculatingPrice,
  }
}
