"use client"

import { useCallback, useEffect, useMemo } from "react"
import { debounce } from "lodash"
import { timeUtils } from "@/lib/time-utils"
import type { BookingState, PricingResult } from "@/lib/booking-types"
import {
  calculateTotalPrice,
  calculateMultipleVehiclesPrice,
  calculateDispositionPrice,
  calculateMultipleVehiclesDispositionPrice,
} from "@/lib/pricing-config"
// Import from correct existing files
import {
  isOlympicPeriod
} from "@/lib/olympic-pricing"
import {
  type OlympicRoute
} from "@/lib/olympic-pricing-corrected"

// Export PricingResult for use in other components
export type { PricingResult } from "@/lib/booking-types"

// Helper function to check if time is night (19:30 - 07:30) - LEGACY PRICING LOGIC
const isNightTime = (hour: string, minutes: string, ampm?: string): boolean => {
  const { totalMinutes } = timeUtils.to24h(hour, minutes, ampm)
  // Night time: 19:30 (1170 minutes) to 07:30 (450 minutes)
  return totalMinutes >= 1170 || totalMinutes <= 450
}

// Helper function to calculate distance between two coordinates in kilometers
const calculateDistanceKm = (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number => {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c // Distance in kilometers
  return distance
}

// Vehicle type mapping for events
const mapVehicleTypeToEvent = (type: string): 'berlina' | 'monovolume' | 'minibus' => {
  console.log(`🚗 MAPPING VEHICLE TYPE: "${type}"`)
  
  let mapped: 'berlina' | 'monovolume' | 'minibus'
  
  switch (type.toLowerCase()) {
    case 'sedan':
    case 'berlina':
    case 'olympic-sedan':    // Olympic sedan → €94
      mapped = 'berlina'     // €94
      break
    case 'van':              
    case 'minivan':
    case 'monovolume':
    case 'olympic-minivan':  // Olympic minivan → €108
      mapped = 'monovolume'  // €108
      break
    case 'minibus':          
    case 'luxury-sedan':
    case 'luxury':
    case 'olympic-van':      // Olympic van → €135
    case 'olympic-luxury':   // Olympic luxury → €135
      mapped = 'minibus'     // €135
      break
    default:
      mapped = 'berlina'
      break
  }
  
  console.log(`✅ MAPPED: "${type}" → "${mapped}"`)
  return mapped
}

// Olympic vehicle type mapping (for disposition services that still use classic types)
const mapOlympicVehicleToClassic = (olympicType: string): 'berlina' | 'monovolume' | 'minibus' => {
  switch (olympicType) {
    case 'olympic-sedan':
    
      return 'berlina'
    case 'olympic-minivan':
      return 'monovolume'
    case 'olympic-van':
    case 'olympic-luxury':
      return 'minibus'
    default:
      return 'berlina'
  }
}

export function usePriceCalculation(state: BookingState, dispatch: (action: any) => void) {
  const isReadyForPricing = useCallback((state: BookingState): boolean => {
    const { journey, vehicles, serviceType } = state

    console.log("🔍 isReadyForPricing CHECK:", {
      serviceType,
      hasPickupAddress: !!journey.pickup.address,
      hasDestinationAddress: !!journey.destination.address,
      vehicleCount: vehicles.count,
      hasTime: !!journey.time,
      hasEndTime: !!journey.endTime,
      hasDistance: !!journey.distance?.km,
      hasDate: !!journey.date
    })

    // SPECIAL CASE: Olympic disposition - allow partial data during Olympic period
    const isOlympicDisposition = journey.date && isOlympicPeriod(journey.date) && serviceType === "disposizione"
    
    if (isOlympicDisposition) {
      console.log("🏅 OLYMPIC DISPOSITION - Using relaxed validation")
      // For Olympic dispositions, we only need pickup address and vehicle count
      if (!journey.pickup.address || vehicles.count === 0) {
        console.log("❌ isReadyForPricing: olympic disposition - missing pickup or vehicles")
        return false
      }
    } else {
      // Basic validation for non-Olympic or non-disposition services
      if (!journey.pickup.address || !journey.destination.address || vehicles.count === 0) {
        console.log("❌ isReadyForPricing: basic validation failed")
        return false
      }
    }

    // Same pickup and destination check
    if (journey.pickup.address === journey.destination.address) {
      console.log("❌ isReadyForPricing: same pickup and destination")
      return false
    }

    // Service type specific validation
    if (serviceType === "transfer") {
      // Transfer needs distance (unless using event pricing)
      if (!journey.distance?.km && !journey.date) {
        console.log("❌ isReadyForPricing: transfer missing distance and date")
        return false
      }
    } else if (serviceType === "disposizione") {
      // Disposition needs start and end time
      console.log("🕐 DISPOSITION TIME VALIDATION:", {
        time: journey.time,
        minutes: journey.minutes,
        timeAmPm: journey.timeAmPm,
        endTime: journey.endTime,
        endMinutes: journey.endMinutes,
        endTimeAmPm: journey.endTimeAmPm,
        isOlympicDisposition
      })
      
      if (isOlympicDisposition) {
        // For Olympic dispositions, allow calculation even without complete time data
        // We'll use default values in the calculation function
        console.log("🏅 OLYMPIC DISPOSITION - Allowing incomplete time data")
        
        // Only check if BOTH start and end are present, then validate they're correct
        const hasCompleteStartTime = journey.time && (journey.minutes !== undefined && journey.minutes !== null) && journey.timeAmPm
        const hasCompleteEndTime = journey.endTime && (journey.endMinutes !== undefined && journey.endMinutes !== null) && journey.endTimeAmPm
        
        if (hasCompleteStartTime && hasCompleteEndTime) {
          // If both are present, validate they're logical
          const startTime = timeUtils.to24h(journey.time!, journey.minutes!, journey.timeAmPm!)
          const endTime = timeUtils.to24h(journey.endTime!, journey.endMinutes!, journey.endTimeAmPm!)
          if (endTime.totalMinutes <= startTime.totalMinutes) {
            console.log("❌ isReadyForPricing: end time before start time")
            return false
          }
        }
      } else {
        // Regular disposition validation - needs complete time data
        if (!journey.time || journey.minutes === undefined || journey.minutes === null || !journey.timeAmPm || !journey.endTime || journey.endMinutes === undefined || journey.endMinutes === null || !journey.endTimeAmPm) {
          console.log("❌ isReadyForPricing: disposition missing time data - details:", {
            hasTime: !!journey.time,
            hasMinutes: journey.minutes !== undefined && journey.minutes !== null,
            hasTimeAmPm: !!journey.timeAmPm,
            hasEndTime: !!journey.endTime,
            hasEndMinutes: journey.endMinutes !== undefined && journey.endMinutes !== null,
            hasEndTimeAmPm: !!journey.endTimeAmPm
          })
          return false
        }
        // Check end time is after start time using 12h to 24h conversion
        const startTime = timeUtils.to24h(journey.time, journey.minutes, journey.timeAmPm)
        const endTime = timeUtils.to24h(journey.endTime, journey.endMinutes, journey.endTimeAmPm)
        if (endTime.totalMinutes <= startTime.totalMinutes) {
          console.log("❌ isReadyForPricing: end time before start time")
          return false
        }
      }
    }

    // Vehicle configuration validation
    if (vehicles.count === 1 || vehicles.sameType) {
      const config = vehicles.singleConfig
      const isValid = !!(config.type && config.passengers > 0)
      if (!isValid) {
        console.log("❌ isReadyForPricing: invalid single vehicle config")
        return false
      }
    } else {
      const isValid = (
        vehicles.multipleConfigs.length === vehicles.count &&
        vehicles.multipleConfigs.every((config) => config.type && config.passengers > 0)
      )
      if (!isValid) {
        console.log("❌ isReadyForPricing: invalid multiple vehicle config")
        return false
      }
    }

    console.log("✅ isReadyForPricing: ready")
    return true
  }, [])

  // UPDATED: Calculate Olympic ceremony pricing using corrected system
  // This functionality is temporarily disabled as ceremonies are handled by Olympic transfer pricing
  const calculateCeremonyPriceForBooking = useCallback(
    async (state: BookingState): Promise<PricingResult | null> => {
      console.log("⚠️ Ceremony pricing is now handled through Olympic transfer system")
      return null
    },
    []
  )

  // Helper function to map standard vehicle types to Olympic vehicle types
  const mapToOlympicVehicleType = (standardType: string): keyof OlympicRoute['prices'] => {
    // If already in Olympic format, validate it's allowed
    if (standardType.startsWith('olympic-')) {
      // During Olympic period, only sedan and minivan are allowed per price lists
      if (standardType === 'olympic-sedan' || standardType === 'olympic-minivan') {
        return standardType as keyof OlympicRoute['prices']
      }
      // Force invalid Olympic types to sedan
      return 'olympic-sedan'
    }
    
    // Map standard types to Olympic types (only sedan and minivan allowed)
    const mapping: Record<string, keyof OlympicRoute['prices']> = {
      'sedan': 'olympic-sedan',
      'van': 'olympic-minivan', 
      'minibus': 'olympic-minivan',    // Force minibus to minivan
      'luxury-sedan': 'olympic-sedan'  // Force luxury to sedan
    }
    return mapping[standardType] || 'olympic-sedan'
  }



  // Event pricing temporarily disabled - missing EventRoute and EventPricing types
  // const calculateEventPrice = ...

  // Event disposition pricing temporarily disabled - missing EventPricing type

  // Olympic pricing calculation - simplified version
  const calculateOlympicPriceCorrected = useCallback(
    async (state: BookingState, olympicRoute: OlympicRoute, meetGreetPrice: number, meetGreetBreakdown: any): Promise<PricingResult> => {
      const { vehicles, journey, options } = state
      
      console.log("🏔️ CALCULATING OLYMPIC PRICE (CORRECTED):", {
        route: `${olympicRoute.from} → ${olympicRoute.to}`,
        category: olympicRoute.category,
        prices: olympicRoute.prices
      })
      
      // Check if it's night time for surcharge calculation
      const isNight = journey.time && journey.minutes && journey.timeAmPm 
        ? isNightTime(journey.time, journey.minutes, journey.timeAmPm) 
        : false
      
      let totalPrice = 0
      let basePrice = 0
      const vehicleBreakdowns: any[] = []
      
      if (vehicles.count === 1 || vehicles.sameType) {
        // Single vehicle type
        const config = vehicles.singleConfig
        const olympicVehicleType = mapToOlympicVehicleType(config.type)
        const routePrice = olympicRoute.prices[olympicVehicleType] || olympicRoute.prices['olympic-sedan']
        
        basePrice = routePrice * vehicles.count
        
        // Apply night surcharge (20%)
        let nightSurcharge = 0
        if (isNight) {
          nightSurcharge = basePrice * 0.20 // 20% night surcharge
        }
        
        const subtotal = basePrice + nightSurcharge
        
        // Apply VAT (10%)
        const vatAmount = subtotal * 0.10
        totalPrice = subtotal + vatAmount
        
        // Add Meet & Greet if applicable
        totalPrice += meetGreetPrice
        
        // Create vehicle breakdown
        for (let i = 1; i <= vehicles.count; i++) {
          vehicleBreakdowns.push({
            vehicleIndex: i,
            type: config.type,
            passengers: config.passengers,
            luggage: config.luggage,
            routePrice: routePrice,
            nightSurcharge: isNight ? routePrice * 0.20 : 0,
            vatAmount: (routePrice + (isNight ? routePrice * 0.20 : 0)) * 0.10,
            total: routePrice + (isNight ? routePrice * 0.20 : 0) + ((routePrice + (isNight ? routePrice * 0.20 : 0)) * 0.10)
          })
        }
        
      } else {
        // Multiple different vehicles
        vehicles.multipleConfigs.forEach((config, index) => {
          const olympicVehicleType = mapToOlympicVehicleType(config.type)
          const routePrice = olympicRoute.prices[olympicVehicleType] || olympicRoute.prices['olympic-sedan']
          
          basePrice += routePrice
          
          // Apply night surcharge per vehicle
          let vehicleNightSurcharge = 0
          if (isNight) {
            vehicleNightSurcharge = routePrice * 0.20
          }
          
          const vehicleSubtotal = routePrice + vehicleNightSurcharge
          const vehicleVat = vehicleSubtotal * 0.10
          const vehicleTotal = vehicleSubtotal + vehicleVat
          
          totalPrice += vehicleTotal
          
          vehicleBreakdowns.push({
            vehicleIndex: index + 1,
            type: config.type,
            passengers: config.passengers,
            luggage: config.luggage,
            routePrice: routePrice,
            nightSurcharge: vehicleNightSurcharge,
            vatAmount: vehicleVat,
            total: vehicleTotal
          })
        })
        
        // Add Meet & Greet once for all vehicles
        totalPrice += meetGreetPrice
      }
      
      console.log("💰 OLYMPIC PRICING CALCULATED:", {
        basePrice,
        nightSurcharge: isNight ? basePrice * 0.20 : 0,
        meetGreetPrice,
        totalPrice
      })
      
      return {
        basePrice,
        totalPrice,
        meetGreetPrice,
        meetGreetBreakdown,
        eventRoute: {
          name: `${olympicRoute.from} → ${olympicRoute.to}`,
          from: olympicRoute.from,
          to: olympicRoute.to,
          notes: `Olympic Period Transfer (${olympicRoute.category})`
        },
        isEventPricing: true,
        isOlympicPricing: true,
        breakdown: {
          durationHours: 0, // Not applicable for transfers
          basePrice,
          vehicleMultiplier: vehicles.count === 1 || vehicles.sameType ? vehicles.count : 1,
          passengerMultiplier: 1,
          subtotal: basePrice + (isNight ? basePrice * 0.20 : 0),
          vatRate: 0.10,
          vatAmount: (basePrice + (isNight ? basePrice * 0.20 : 0)) * 0.10,
          nightSurcharge: isNight ? basePrice * 0.20 : 0,
          distanceKm: 0, // Not applicable for Olympic fixed routes
          vehicleBreakdowns
        }
      }
    },
    []
  )

  const calculatePrice = useCallback(
    async (state: BookingState): Promise<PricingResult | null> => {
      console.log("🔍 CALCULATE_PRICE - START (CORRECTED SYSTEM):", {
        isReady: isReadyForPricing(state),
        serviceType: state.serviceType,
        date: state.journey.date,
        pickup: state.journey.pickup,
        destination: state.journey.destination
      })

      if (!isReadyForPricing(state)) {
        console.log("❌ CALCULATE_PRICE - NOT READY FOR PRICING")
        return null
      }

      const { journey, vehicles, serviceType, options } = state

      try {
        // Meet & Greet temporarily disabled due to complex location matching
        let meetGreetPrice = 0
        let meetGreetBreakdown = null
        console.log("⚠️ Meet & Greet temporarily disabled - needs location matching system")

        // Olympic pricing temporarily disabled due to complex location matching
        // Need to implement proper location matching system first
        console.log("⚠️ Olympic pricing temporarily disabled - using standard pricing")

        // Fall back to standard pricing
        console.log("📊 FALLING BACK TO STANDARD PRICING")
        let standardPricing: PricingResult | null = null

        if (serviceType === "transfer" || serviceType === "inter-cluster") {
          // Transfer pricing (distance-based)
          if (vehicles.count === 1 || vehicles.sameType) {
            const config = vehicles.singleConfig
            standardPricing = calculateTotalPrice(
              journey.distance!.km,
              config.type,
              config.passengers,
              config.luggage,
              vehicles.count,
              journey.time,
              journey.minutes,
              journey.timeAmPm,
              journey.pickup.coordinates,
              journey.destination.coordinates
            )
          } else {
            standardPricing = calculateMultipleVehiclesPrice(
              journey.distance!.km, 
              vehicles.multipleConfigs,
              journey.time,
              journey.minutes,
              journey.timeAmPm,
              journey.pickup.coordinates,
              journey.destination.coordinates
            )
          }
        } else if (serviceType === "disposizione") {
          // Disposition pricing (time-based)
          if (vehicles.count === 1 || vehicles.sameType) {
            const config = vehicles.singleConfig
            standardPricing = calculateDispositionPrice(
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
            standardPricing = calculateMultipleVehiclesDispositionPrice(
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

        // Add Meet & Greet pricing to standard pricing if we calculated it earlier
        if (standardPricing && meetGreetPrice > 0) {
          standardPricing.meetGreetPrice = meetGreetPrice
          standardPricing.meetGreetBreakdown = meetGreetBreakdown
          standardPricing.totalPrice += meetGreetPrice
          
          console.log("💰 ADDED MEET & GREET TO STANDARD PRICING:", {
            originalTotal: standardPricing.totalPrice - meetGreetPrice,
            meetGreetPrice,
            newTotal: standardPricing.totalPrice
          })
        }

        console.log("🔚 CALCULATE_PRICE - RETURNING:", {
          result: standardPricing ? "standardPricing" : "null",
          totalPrice: standardPricing?.totalPrice,
          basePrice: standardPricing?.basePrice
        })
        return standardPricing
      } catch (error) {
        console.error("Price calculation error:", error)
        return null
      }
    },
    [isReadyForPricing]
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
  }, [
    // Use specific state properties instead of entire state object
    state.journey.date,
    state.journey.pickup.locationId,
    state.journey.pickup.address,
    state.journey.destination.locationId, 
    state.journey.destination.address,
    state.journey.time,
    state.journey.minutes,
    state.journey.timeAmPm,
    state.journey.endTime,
    state.journey.endMinutes,
    state.journey.endTimeAmPm,
    state.journey.distance?.km,
    state.vehicles.count,
    state.vehicles.sameType,
    JSON.stringify(state.vehicles.singleConfig),
    JSON.stringify(state.vehicles.multipleConfigs),
    state.serviceType,
    JSON.stringify(state.options.meetGreetConfig),
    debouncedCalculate
  ])

  return {
    isReadyForPricing: isReadyForPricing(state),
    pricing: state.ui.pricing,
    isCalculating: state.ui.isCalculatingPrice,
  }
}
