"use client"

import { useCallback, useEffect, useMemo } from "react"
import { debounce } from "lodash"
import type { BookingState, PricingResult } from "@/lib/booking-types"
import { calculateTotalPrice, calculateMultipleVehiclesPrice } from "@/lib/pricing-config"

export function usePriceCalculation(state: BookingState, dispatch: (action: any) => void) {
  const isReadyForPricing = useCallback((state: BookingState): boolean => {
    const { journey, vehicles } = state

    // Basic journey validation
    if (
      !journey.departure.city ||
      !journey.departure.location ||
      !journey.destination.city ||
      !journey.destination.location ||
      vehicles.count === 0
    ) {
      return false
    }

    // Same departure and destination check
    if (
      journey.departure.city === journey.destination.city &&
      journey.departure.location === journey.destination.location
    ) {
      return false
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

      const { journey, vehicles } = state

      try {
        if (vehicles.count === 1 || vehicles.sameType) {
          const config = vehicles.singleConfig
          return calculateTotalPrice(
            journey.departure.city,
            journey.departure.location,
            journey.destination.city,
            journey.destination.location,
            config.type,
            config.passengers,
            config.luggage,
            vehicles.count,
          )
        } else {
          return calculateMultipleVehiclesPrice(
            journey.departure.city,
            journey.departure.location,
            journey.destination.city,
            journey.destination.location,
            vehicles.multipleConfigs,
          )
        }
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
