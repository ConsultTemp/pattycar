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
// Updated imports for corrected pricing modules
import {
  CORRECTED_OLYMPIC_ROUTES,
  findOlympicRouteCorrected,
  isOlympicPeriod,
  type OlympicRoute
} from "@/lib/olympic-pricing-corrected"
import {
  hasMeetGreetService,
  hasOlympicPricing,
  matchGooglePlaceToService
} from "@/lib/location-matching-corrected"
import {
  calculateMeetGreetPriceCorrected,
  MEET_GREET_SERVICES
} from "@/lib/meet-greet-corrected"

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



  const calculateEventPrice = useCallback(
    async (state: BookingState, eventRoute: EventRoute, activeEvent: EventPricing): Promise<PricingResult | null> => {
      const { vehicles, journey, options } = state
      
      // Get the appropriate vehicle type and calculate base price
      let basePrice = 0
      let vehicleType = 'berlina'
      
      if (vehicles.count === 1 || vehicles.sameType) {
        vehicleType = mapVehicleTypeToEvent(vehicles.singleConfig.type)
        basePrice = eventRoute.prices[vehicleType as keyof typeof eventRoute.prices] * vehicles.count
      } else {
        // For multiple different vehicles, sum all prices
        basePrice = vehicles.multipleConfigs.reduce((sum, config) => {
          const vType = mapVehicleTypeToEvent(config.type)
          return sum + eventRoute.prices[vType as keyof typeof eventRoute.prices]
        }, 0)
      }

      // Apply night surcharge if applicable
      let nightSurcharge = 0
      if (journey.time && journey.minutes && journey.timeAmPm && 
          isNightTime(journey.time, journey.minutes, journey.timeAmPm)) {
        nightSurcharge = basePrice * (activeEvent.extras.nightSurcharge / 100)
      }

      const subtotal = basePrice + nightSurcharge
      
      // Apply VAT
      const vatAmount = subtotal * (activeEvent.extras.vatRate / 100)
      let totalPrice = subtotal + vatAmount

      // Calculate Meet & Greet if enabled
      let meetGreetPrice = 0
      let meetGreetBreakdown = null
      if (options.meetGreetConfig.enabled && options.meetGreetConfig.serviceId) {
        const isNight = journey.time && journey.minutes && journey.timeAmPm 
          ? isNightTime(journey.time, journey.minutes, journey.timeAmPm) 
          : false
        
        const meetGreetResult = calculateMeetGreetPriceLegacy(
          options.meetGreetConfig.serviceId,
          options.meetGreetConfig.passengers,
          options.meetGreetConfig.children,
          options.meetGreetConfig.infants,
          options.meetGreetConfig.extraLuggage,
          isNight,
          options.meetGreetConfig.specialServices || {},
          journey.date // Pass service date for holiday surcharge
        )
        
        // Multiply Meet & Greet price by number of vehicles
        meetGreetPrice = meetGreetResult.price * vehicles.count
        meetGreetBreakdown = {
          ...meetGreetResult.breakdown,
          // Update total to reflect multiplication by vehicle count
          total: meetGreetResult.breakdown.total * vehicles.count
        }
        totalPrice += meetGreetPrice
      }

      return {
        basePrice,
        totalPrice,
        meetGreetPrice,
        meetGreetBreakdown,
        eventRoute: {
          name: activeEvent.name,
          from: eventRoute.from,
          to: eventRoute.to,
          notes: eventRoute.notes
        },
        isEventPricing: true,
        breakdown: {
          basePrice,
          vehicleMultiplier: 1,
          passengerMultiplier: 1,
          luggageMultiplier: 1,
          vehicleCount: vehicles.count,
          pricePerVehicle: basePrice / vehicles.count,
          subtotal,
          vatAmount,
          vatRate: activeEvent.extras.vatRate
        }
      }
    },
    []
  )

  // NEW: Calculate disposition pricing using active event special rates
  const calculateEventDispositionPrice = useCallback(
    async (state: BookingState, activeEvent: EventPricing): Promise<PricingResult | null> => {
      console.log("💰 calculateEventDispositionPrice - START:", {
        activeEvent: activeEvent.name,
        serviceType: state.serviceType,
        hasStartTime: !!state.journey.time,
        hasEndTime: !!state.journey.endTime,
        startTime: `${state.journey.time}:${state.journey.minutes} ${state.journey.timeAmPm}`,
        endTime: `${state.journey.endTime}:${state.journey.endMinutes} ${state.journey.endTimeAmPm}`,
        pickup: state.journey.pickup,
        vehicles: state.vehicles
      })

      const { vehicles, journey, options } = state
      
      // Calculate duration in hours
      const startTimeConverted = timeUtils.to24h(journey.time!, journey.minutes!, journey.timeAmPm!)
      const endTimeConverted = timeUtils.to24h(journey.endTime!, journey.endMinutes!, journey.endTimeAmPm!)
      const durationMinutes = Math.max(0, endTimeConverted.totalMinutes - startTimeConverted.totalMinutes)
      const durationHours = Math.ceil(durationMinutes / 60)
      
      console.log("⏱️ DURATION CALCULATION:", {
        startTimeConverted,
        endTimeConverted,
        durationMinutes,
        durationHours
      })

      let basePrice = 0
      let subtotal = 0
      const vehicleBreakdowns: any[] = []

      if (vehicles.count === 1 || vehicles.sameType) {
        // Single vehicle type
        const config = vehicles.singleConfig
        const vehicleType = mapVehicleTypeToEvent(config.type)
        const eventDisposition = activeEvent.disposition![vehicleType]
        
        // Base price using active event special hourly rates
        const pricePerVehicle = durationHours * eventDisposition.hourly
        basePrice = pricePerVehicle * vehicles.count
        subtotal = basePrice
        
        // Don't add custom breakdown - let the standard system handle it
      } else {
        // Multiple different vehicles
        vehicles.multipleConfigs.forEach((config, index) => {
          const vehicleType = mapVehicleTypeToEvent(config.type)
          const eventDisposition = activeEvent.disposition![vehicleType]
          
          const vehiclePrice = durationHours * eventDisposition.hourly
          subtotal += vehiclePrice
          
          vehicleBreakdowns.push({
            vehicleIndex: index + 1,
            type: config.type,
            passengers: config.passengers,
            luggage: config.luggage,
            durationHours,
            hourlyRate: eventDisposition.hourly,
            price: vehiclePrice
          })
        })
        basePrice = subtotal
      }

      // OLYMPIC DISPOSITION: Add transfer cost from Milano Centrale to disposition start point ONLY if outside Milano hinterland
      let transferCost = 0
      let transferRoute = ''
      if (journey.date && isOlympicPeriod(journey.date)) {
        // Resolve pickup location for transfer calculation
        const resolvedPickup = resolveLocationForPricing(
          journey.pickup.locationId, 
          journey.pickup.coordinates
        )
        
        // Check if we need to calculate transfer for Olympic disposition
        const needsOlympicTransfer = resolvedPickup.resolvedLocationId !== 'milano-centrale' && 
          (resolvedPickup.resolvedLocationId || resolvedPickup.resolvedCoordinates || journey.pickup.address)
          
        if (needsOlympicTransfer) {
          // Check if location is within Milano hinterland (10km)
          const milanoCentroCoordinates = { lat: 45.4642, lng: 9.1900 } // Milano centro coordinates
          let pickupCoordinates = resolvedPickup.resolvedCoordinates
          
          // If we don't have resolved coordinates but have a locationId or address, try to get them
          if (!pickupCoordinates && (resolvedPickup.resolvedLocationId || journey.pickup.address)) {
            // This case handles cities like Napoli that aren't in our registry
            pickupCoordinates = journey.pickup.coordinates
          }
          
          let isInMilanoHinterland = false
          if (pickupCoordinates) {
            const distanceFromMilanoCenter = calculateDistanceKm(milanoCentroCoordinates, pickupCoordinates)
            isInMilanoHinterland = distanceFromMilanoCenter <= 10
            
            console.log("🏙️ OLYMPIC DISPOSITION MILANO HINTERLAND CHECK:", {
              pickupLocation: journey.pickup.address,
              pickupLocationId: resolvedPickup.resolvedLocationId,
              distanceFromMilanoCenter: distanceFromMilanoCenter.toFixed(1) + 'km',
              isInHinterland: isInMilanoHinterland
            })
          }
          
          if (!isInMilanoHinterland) {
            // Outside Milano hinterland - calculate transfer cost
            let transferRouteFromMilano = null
            
            // Try to find Olympic route if we have a resolved location ID
            if (resolvedPickup.resolvedLocationId) {
              transferRouteFromMilano = findOlympicRoute('milano-centrale', resolvedPickup.resolvedLocationId)
            }
            
            if (transferRouteFromMilano) {
              // Map vehicle type to Olympic vehicle type for transfer pricing
              let olympicVehicleType: keyof typeof transferRouteFromMilano.prices = 'olympic-sedan'
              
              if (vehicles.count === 1 || vehicles.sameType) {
                olympicVehicleType = mapToOlympicVehicleType(vehicles.singleConfig.type)
              } else {
                // For multiple vehicles, use the first one for transfer calculation
                olympicVehicleType = mapToOlympicVehicleType(vehicles.multipleConfigs[0].type)
              }
              
              transferCost = transferRouteFromMilano.prices[olympicVehicleType] * vehicles.count
              transferRoute = `${transferRouteFromMilano.from} → ${transferRouteFromMilano.to}`
              subtotal += transferCost
              
              console.log("🚗 OLYMPIC DISPOSITION TRANSFER (PREDEFINED ROUTE):", {
                from: 'milano-centrale',
                to: resolvedPickup.resolvedLocationId,
                vehicleType: olympicVehicleType,
                cost: transferCost,
                route: transferRoute
              })
            } else if (pickupCoordinates) {
              // No predefined Olympic route found, calculate using standard distance pricing
              const milanoCoordinates = { lat: 45.4868, lng: 9.2037 } // Milano Centrale coordinates
              const distance = calculateDistanceKm(milanoCoordinates, pickupCoordinates)
              
              // Use standard pricing calculation for the transfer
              let vehicleType = 'sedan' // default
              let passengers = 1
              let luggage = 0
              
              if (vehicles.count === 1 || vehicles.sameType) {
                vehicleType = vehicles.singleConfig.type
                passengers = vehicles.singleConfig.passengers
                luggage = vehicles.singleConfig.luggage
              } else {
                vehicleType = vehicles.multipleConfigs[0].type
                passengers = vehicles.multipleConfigs[0].passengers
                luggage = vehicles.multipleConfigs[0].luggage
              }
              
              // Calculate transfer price using standard pricing (during Olympic period, we still use standard rates for non-Olympic routes)
              const { calculateTotalPrice } = require('@/lib/pricing-config')
              const transferPricing = calculateTotalPrice(
                distance,
                vehicleType,
                passengers,
                luggage,
                vehicles.count,
                journey.time,
                journey.minutes,
                journey.timeAmPm,
                milanoCoordinates,
                pickupCoordinates
              )
              
              transferCost = transferPricing.basePrice
              transferRoute = `Milano Centrale → ${journey.pickup.address}`
              subtotal += transferCost
              
              console.log("🚗 OLYMPIC DISPOSITION TRANSFER (DISTANCE-BASED):", {
                from: 'milano-centrale',
                to: journey.pickup.address,
                distance: distance.toFixed(1) + 'km',
                vehicleType,
                cost: transferCost,
                route: transferRoute
              })
            }
          } else {
            // Within Milano hinterland - NO transfer cost
            console.log("✅ OLYMPIC DISPOSITION: Location within Milano hinterland (10km) - NO transfer cost applied")
          }
        }
      }

      // Apply night surcharge if applicable
      let nightSurcharge = 0
      if (journey.time && journey.minutes && journey.timeAmPm && 
          isNightTime(journey.time, journey.minutes, journey.timeAmPm)) {
        nightSurcharge = subtotal * (activeEvent.extras.nightSurcharge / 100)
        subtotal += nightSurcharge
      }
      
      // Apply VAT
      const vatAmount = subtotal * (activeEvent.extras.vatRate / 100)
      let totalPrice = subtotal + vatAmount

      console.log("💵 FINAL CALCULATION - calculateEventDispositionPrice:", {
        basePrice,
        transferCost,
        nightSurcharge,
        subtotal,
        vatAmount,
        totalPrice,
        transferRoute,
        activeEvent: activeEvent.name
      })

      // Calculate Meet & Greet if enabled
      let meetGreetPrice = 0
      let meetGreetBreakdown = null
      if (options.meetGreetConfig.enabled && options.meetGreetConfig.serviceId) {
        const isNight = journey.time && journey.minutes && journey.timeAmPm 
          ? isNightTime(journey.time, journey.minutes, journey.timeAmPm) 
          : false
        
        const meetGreetResult = calculateMeetGreetPriceLegacy(
          options.meetGreetConfig.serviceId,
          options.meetGreetConfig.passengers,
          options.meetGreetConfig.children,
          options.meetGreetConfig.infants,
          options.meetGreetConfig.extraLuggage,
          isNight,
          options.meetGreetConfig.specialServices || {},
          journey.date // Pass service date for holiday surcharge
        )
        
        // Multiply Meet & Greet price by number of vehicles
        meetGreetPrice = meetGreetResult.price * vehicles.count
        meetGreetBreakdown = {
          ...meetGreetResult.breakdown,
          // Update total to reflect multiplication by vehicle count
          total: meetGreetResult.breakdown.total * vehicles.count
        }
        totalPrice += meetGreetPrice
      }

              console.log("🎯 RETURNING RESULT - calculateEventDispositionPrice:", {
          basePrice,
          totalPrice,
          meetGreetPrice,
          eventRoute: `${activeEvent.name} - Disposition`,
          isEventPricing: true,
          transferCost,
          transferRoute
        })

        return {
          basePrice,
          totalPrice,
          meetGreetPrice,
          meetGreetBreakdown,
          eventRoute: {
            name: `${activeEvent.name} - Disposition`,
            from: "Disposition Service",
            to: `${durationHours} hours`,
            notes: `Special ${activeEvent.name} rates - ${durationHours}h duration${transferRoute ? ` + Transfer: ${transferRoute}` : ''}`
          },
          isEventPricing: true,
          breakdown: {
            durationHours,
            basePrice,
            vehicleMultiplier: 1,
            passengerMultiplier: 1,
            luggageMultiplier: 1,
            nightSurcharge,
            nightSurchargeRate: nightSurcharge > 0 ? activeEvent.extras.nightSurcharge : 0,
            vehicleCount: vehicles.count,
            pricePerVehicle: Math.round(basePrice / vehicles.count),
            subtotal,
            vatAmount,
            vatRate: activeEvent.extras.vatRate,
            ...(transferCost > 0 && { transferCost, transferRoute })
          } as any,
          vehicleBreakdowns: vehicleBreakdowns.length > 0 ? vehicleBreakdowns : undefined
        }
    },
    []
  )

  // NEW: Calculate Olympic pricing using corrected system
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
        // Check for Meet & Greet first (if enabled and pickup/destination has the service)
        let meetGreetPrice = 0
        let meetGreetBreakdown = null
        
        if (options.meetGreetConfig.enabled) {
          console.log("🤝 CHECKING MEET & GREET SERVICE")
          
          // Check pickup location for Meet & Greet
          const pickupMatchResult = matchGooglePlaceToService({
            placeId: journey.pickup.placeId || null,
            description: journey.pickup.address,
            coordinates: journey.pickup.coordinates,
            addressComponents: [] // We don't store this, but the function can work without it
          })
          
          // Check destination location for Meet & Greet
          const destinationMatchResult = matchGooglePlaceToService({
            placeId: journey.destination.placeId || null,
            description: journey.destination.address,
            coordinates: journey.destination.coordinates,
            addressComponents: []
          })
          
          console.log("🎯 MEET & GREET LOCATION MATCHING:", {
            pickup: pickupMatchResult,
            destination: destinationMatchResult
          })
          
          // Determine which location to use for Meet & Greet (prioritize pickup for arrivals, destination for departures)
          let meetGreetServiceId = null
          let isArrival = true
          
          if (pickupMatchResult.type === 'service-location' && 
              (pickupMatchResult.serviceLocation?.services.meetGreetArrivals || 
               pickupMatchResult.serviceLocation?.services.meetGreetDepartures)) {
            meetGreetServiceId = pickupMatchResult.serviceLocation.id + (pickupMatchResult.serviceLocation.services.meetGreetArrivals ? '-arrivals' : '-departures')
            isArrival = !!pickupMatchResult.serviceLocation.services.meetGreetArrivals
          } else if (destinationMatchResult.type === 'service-location' && 
                     (destinationMatchResult.serviceLocation?.services.meetGreetArrivals || 
                      destinationMatchResult.serviceLocation?.services.meetGreetDepartures)) {
            meetGreetServiceId = destinationMatchResult.serviceLocation.id + (destinationMatchResult.serviceLocation.services.meetGreetArrivals ? '-arrivals' : '-departures')
            isArrival = !!destinationMatchResult.serviceLocation.services.meetGreetArrivals
          }
          
          if (meetGreetServiceId) {
            console.log("✅ MEET & GREET SERVICE FOUND:", meetGreetServiceId)
            
            // Check if it's night time for surcharge calculation
            const isNight = journey.time && journey.minutes && journey.timeAmPm 
              ? isNightTime(journey.time, journey.minutes, journey.timeAmPm) 
              : false
            
            const meetGreetResult = calculateMeetGreetPriceCorrected(
              meetGreetServiceId,
              options.meetGreetConfig.passengers || 1,
              options.meetGreetConfig.luggage || 0,
              options.meetGreetConfig.hours || 0,
              isNight,
              journey.date // for holiday surcharge
            )
            
            meetGreetPrice = meetGreetResult.totalPrice * vehicles.count
            meetGreetBreakdown = meetGreetResult.breakdown
            
            console.log("💰 MEET & GREET CALCULATED:", {
              service: meetGreetServiceId,
              price: meetGreetPrice,
              breakdown: meetGreetBreakdown
            })
          }
        }

        // Check for Olympic pricing (if in Olympic period)
        if (journey.date && isOlympicPeriod(journey.date)) {
          console.log("🏔️ OLYMPIC PERIOD DETECTED - Checking for Olympic routes")
          
          // Try to find Olympic route based on pickup and destination addresses
          const pickupMatchResult = matchGooglePlaceToService({
            placeId: journey.pickup.placeId || null,
            description: journey.pickup.address,
            coordinates: journey.pickup.coordinates,
            addressComponents: []
          })
          
          const destinationMatchResult = matchGooglePlaceToService({
            placeId: journey.destination.placeId || null,
            description: journey.destination.address,
            coordinates: journey.destination.coordinates,
            addressComponents: []
          })
          
          console.log("🎯 OLYMPIC LOCATION MATCHING:", {
            pickup: pickupMatchResult,
            destination: destinationMatchResult
          })
          
          // Check if we can find an Olympic route
          let fromLocationName = null
          let toLocationName = null
          
          if (pickupMatchResult.type === 'service-location' && 
              pickupMatchResult.serviceLocation?.services.olympicTransfers) {
            fromLocationName = pickupMatchResult.serviceLocation.name
          }
          
          if (destinationMatchResult.type === 'service-location' && 
              destinationMatchResult.serviceLocation?.services.olympicTransfers) {
            toLocationName = destinationMatchResult.serviceLocation.name
          }
          
          if (fromLocationName && toLocationName) {
            console.log("🔍 SEARCHING OLYMPIC ROUTE:", {
              from: fromLocationName,
              to: toLocationName
            })
            
            const olympicRoute = findOlympicRouteCorrected(fromLocationName, toLocationName)
            
            if (olympicRoute) {
              console.log("✅ OLYMPIC ROUTE FOUND:", olympicRoute)
              return await calculateOlympicPriceCorrected(state, olympicRoute, meetGreetPrice, meetGreetBreakdown)
            }
          }
          
          console.log("❌ NO OLYMPIC ROUTE FOUND - Falling back to standard pricing")
        }

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
    [isReadyForPricing, calculateOlympicPriceCorrected]
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
