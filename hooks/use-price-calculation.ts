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
import {
  GP_MONZA_2025,
  MILANO_CORTINA_2026,
  isEventPeriod,
  getActiveEvent,
  findMatchingEventRoute,
  findEventRouteByLocation,
  findMeetGreetService,
  calculateMeetGreetPriceLegacy,
  findAvailableMeetGreetServices,
  findMeetGreetServiceByLocation,
  resolveLocationForPricing,
  type EventRoute,
  type EventPricing
} from "@/lib/event-pricing"
import {
  isOlympicPeriod,
  findOlympicRoute,
  findOlympicCeremony,
  getOlympicLocations,
  OLYMPIC_PRICING_CONFIG,
  calculateCeremonyPrice as calcOlympicCeremonyPrice,
  type OlympicRoute,
  type OlympicCeremony
} from "@/lib/olympic-pricing"

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
      if (!journey.distance?.km) {
        console.log("❌ isReadyForPricing: transfer missing distance")
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

  // NEW: Calculate Olympic ceremony pricing
  const calculateCeremonyPriceForBooking = useCallback(
    async (state: BookingState, ceremony: OlympicCeremony): Promise<PricingResult | null> => {
      const { vehicles, journey, options } = state
      
      // Calculate service hours (minimum 2 hours included)
      const startTimeConverted = timeUtils.to24h(journey.time!, journey.minutes!, journey.timeAmPm!)
      const endTimeConverted = timeUtils.to24h(journey.endTime!, journey.endMinutes!, journey.endTimeAmPm!)
      const durationMinutes = Math.max(0, endTimeConverted.totalMinutes - startTimeConverted.totalMinutes)
      const serviceHours = Math.ceil(durationMinutes / 60)
      
      // Check night time
      const isNight = journey.time && journey.minutes && journey.timeAmPm 
        ? isNightTime(journey.time, journey.minutes, journey.timeAmPm) 
        : false
      
      let totalPrice = 0
      let basePrice = 0
      let meetGreetPrice = 0
      let meetGreetBreakdown = null
      const vehicleBreakdowns: any[] = []
      
      // Ceremony pricing components (for detailed breakdown)
      let ceremonyBasePrice = 0
      let extraHours = 0
      let extraHoursCost = 0
      let transferCost = 0
      let nightSurcharge = 0
      let vatAmount = 0
      let transferRoute = ''
      
      if (vehicles.count === 1 || vehicles.sameType) {
        // Single vehicle type - calculate once and multiply
        const ceremonyResult = calcOlympicCeremonyPrice(
          ceremony,
          vehicles.singleConfig.type,
          serviceHours,
          journey.pickup.locationId,
          isNight,
          journey.pickup.coordinates,
          journey.destination.locationId,
          journey.destination.coordinates
        )
        
        totalPrice = ceremonyResult.total * vehicles.count
        basePrice = ceremonyResult.basePrice * vehicles.count
        
        // Extract components for breakdown
        ceremonyBasePrice = ceremonyResult.basePrice * vehicles.count
        extraHours = ceremonyResult.extraHours
        extraHoursCost = ceremonyResult.extraHoursCost * vehicles.count
        transferCost = ceremonyResult.transferCost * vehicles.count
        nightSurcharge = ceremonyResult.nightSurcharge * vehicles.count
        vatAmount = ceremonyResult.vatAmount * vehicles.count
        transferRoute = ceremonyResult.transferRoute || ''

        // Populate vehicle breakdown for single vehicle type
        if (vehicles.count === 1) {
          vehicleBreakdowns.push({
            vehicleIndex: 1,
            type: vehicles.singleConfig.type,
            passengers: vehicles.singleConfig.passengers,
            luggage: vehicles.singleConfig.luggage,
            ceremonyBasePrice: ceremonyResult.basePrice,
            extraHours: ceremonyResult.extraHours,
            extraHoursCost: ceremonyResult.extraHoursCost,
            transferCost: ceremonyResult.transferCost,
            nightSurcharge: ceremonyResult.nightSurcharge,
            vatAmount: ceremonyResult.vatAmount,
            total: ceremonyResult.total
          })
        } else {
          // For multiple same type vehicles, create breakdown for each
          for (let i = 1; i <= vehicles.count; i++) {
            vehicleBreakdowns.push({
              vehicleIndex: i,
              type: vehicles.singleConfig.type,
              passengers: vehicles.singleConfig.passengers,
              luggage: vehicles.singleConfig.luggage,
              ceremonyBasePrice: ceremonyResult.basePrice,
              extraHours: ceremonyResult.extraHours,
              extraHoursCost: ceremonyResult.extraHoursCost,
              transferCost: ceremonyResult.transferCost,
              nightSurcharge: ceremonyResult.nightSurcharge,
              vatAmount: ceremonyResult.vatAmount,
              total: ceremonyResult.total
            })
          }
        }
      } else {
        // Multiple different vehicles - calculate for each
        vehicles.multipleConfigs.forEach((config, index) => {
          const ceremonyResult = calcOlympicCeremonyPrice(
            ceremony,
            config.type,
            serviceHours,
            journey.pickup.locationId,
            isNight,
            journey.pickup.coordinates,
            journey.destination.locationId,
            journey.destination.coordinates
          )
          
          totalPrice += ceremonyResult.total
          basePrice += ceremonyResult.basePrice
          
          // Accumulate components
          ceremonyBasePrice += ceremonyResult.basePrice
          extraHoursCost += ceremonyResult.extraHoursCost
          transferCost += ceremonyResult.transferCost
          nightSurcharge += ceremonyResult.nightSurcharge
          vatAmount += ceremonyResult.vatAmount
          
          if (!transferRoute && ceremonyResult.transferRoute) {
            transferRoute = ceremonyResult.transferRoute
          }
          if (!extraHours && ceremonyResult.extraHours) {
            extraHours = ceremonyResult.extraHours
          }
          
          vehicleBreakdowns.push({
            vehicleIndex: index + 1,
            type: config.type,
            passengers: config.passengers,
            luggage: config.luggage,
            ceremonyBasePrice: ceremonyResult.basePrice,
            extraHours: ceremonyResult.extraHours,
            extraHoursCost: ceremonyResult.extraHoursCost,
            transferCost: ceremonyResult.transferCost,
            nightSurcharge: ceremonyResult.nightSurcharge,
            vatAmount: ceremonyResult.vatAmount,
            total: ceremonyResult.total
          })
        })
      }

      // Calculate Meet & Greet if enabled
      if (options.meetGreetConfig.enabled && options.meetGreetConfig.serviceId) {
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
        
        meetGreetPrice = meetGreetResult.price * vehicles.count
        meetGreetBreakdown = {
          ...meetGreetResult.breakdown,
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
          name: ceremony.name,
          from: ceremony.baseCity,
          to: ceremony.venue,
          notes: transferRoute ? `${transferRoute} | ${serviceHours}h ceremony disposition` : `${serviceHours}h ceremony disposition`
        },
        isEventPricing: true,
        isOlympicPricing: true,
        breakdown: {
          durationHours: serviceHours,
          basePrice,
          vehicleMultiplier: 1,
          passengerMultiplier: 1,
          luggageMultiplier: 1,
          vehicleCount: vehicles.count,
          pricePerVehicle: Math.round(basePrice / vehicles.count),
          subtotal: totalPrice - vatAmount - (meetGreetPrice || 0),
          vatAmount: vatAmount,
          vatRate: 10,
          nightSurcharge
        },
        vehicleBreakdowns: vehicleBreakdowns.length > 0 ? vehicleBreakdowns : undefined
      }
    },
    []
  )

  // Helper function to map standard vehicle types to Olympic vehicle types
  const mapToOlympicVehicleType = (standardType: string): keyof OlympicRoute['prices'] => {
    // If already in Olympic format, return as is
    if (standardType.startsWith('olympic-')) {
      return standardType as keyof OlympicRoute['prices']
    }
    
    // Otherwise map standard types to Olympic types
    const mapping: Record<string, keyof OlympicRoute['prices']> = {
      'sedan': 'olympic-sedan',
      'van': 'olympic-minivan', 
      'minibus': 'olympic-van',
      'luxury-sedan': 'olympic-luxury'
    }
    return mapping[standardType] || 'olympic-sedan'
  }

  // NEW: Calculate Olympic transfer pricing
  const calculateOlympicPrice = useCallback(
    async (state: BookingState, olympicRoute: OlympicRoute): Promise<PricingResult | null> => {
      const { vehicles, journey, options } = state
      
      let basePrice = 0
      let vehicleBreakdowns: any[] = []
      
      if (vehicles.count === 1 || vehicles.sameType) {
        // Single vehicle type - MAP TO OLYMPIC TYPE
        const olympicVehicleType = mapToOlympicVehicleType(vehicles.singleConfig.type)
        const pricePerVehicle = olympicRoute.prices[olympicVehicleType] || 0
        basePrice = pricePerVehicle * vehicles.count
      } else {
        // Multiple different vehicles - MAP TO OLYMPIC TYPES
        vehicles.multipleConfigs.forEach((config, index) => {
          const olympicVehicleType = mapToOlympicVehicleType(config.type)
          const vehiclePrice = olympicRoute.prices[olympicVehicleType] || 0
          basePrice += vehiclePrice
          
          vehicleBreakdowns.push({
            vehicleIndex: index + 1,
            type: config.type,
            passengers: config.passengers,
            luggage: config.luggage,
            price: vehiclePrice
          })
        })
      }

      // Apply night surcharge if applicable (20% for Olympic period)
      let nightSurcharge = 0
      if (journey.time && journey.minutes && journey.timeAmPm && 
          isNightTime(journey.time, journey.minutes, journey.timeAmPm)) {
        nightSurcharge = basePrice * 0.20 // 20% Olympic night surcharge
      }

      const subtotal = basePrice + nightSurcharge
      
      // Apply Olympic VAT (10%)
      const vatAmount = subtotal * (OLYMPIC_PRICING_CONFIG.vat.rate / 100)
      let totalPrice = subtotal + vatAmount

      // Calculate Meet & Greet if enabled (multiply by vehicle count)
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
        
        meetGreetPrice = meetGreetResult.price * vehicles.count
        meetGreetBreakdown = {
          ...meetGreetResult.breakdown,
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
          name: "Milano-Cortina",
          from: olympicRoute.from,
          to: olympicRoute.to,
          notes: ""
        },
        isEventPricing: true,
        isOlympicPricing: true,
        breakdown: {
          basePrice,
          vehicleMultiplier: 1,
          passengerMultiplier: 1,
          luggageMultiplier: 1,
          nightSurcharge,
          nightSurchargeRate: nightSurcharge > 0 ? 20 : 0,
          vehicleCount: vehicles.count,
          pricePerVehicle: basePrice / vehicles.count,
          subtotal,
          vatAmount,
          vatRate: OLYMPIC_PRICING_CONFIG.vat.rate
        },
        vehicleBreakdowns: vehicleBreakdowns.length > 0 ? vehicleBreakdowns : undefined
      }
    },
    []
  )

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

      // STEP 1: Calculate disposition hourly price (duration × hourly rate)
      let dispositionPrice = 0
      let subtotal = 0
      const vehicleBreakdowns: any[] = []

      if (vehicles.count === 1 || vehicles.sameType) {
        // Single vehicle type
        const config = vehicles.singleConfig
        const vehicleType = mapVehicleTypeToEvent(config.type)
        const eventDisposition = activeEvent.disposition![vehicleType]
        
        // Disposition price using active event special hourly rates
        const pricePerVehicle = durationHours * eventDisposition.hourly
        dispositionPrice = pricePerVehicle * vehicles.count
        subtotal = dispositionPrice
        
        console.log("⏰ DISPOSITION PRICE (SINGLE VEHICLE):", {
          vehicleType,
          hourlyRate: eventDisposition.hourly,
          durationHours,
          pricePerVehicle,
          vehicleCount: vehicles.count,
          totalDispositionPrice: dispositionPrice
        })
      } else {
        // Multiple different vehicles
        vehicles.multipleConfigs.forEach((config, index) => {
          const vehicleType = mapVehicleTypeToEvent(config.type)
          const eventDisposition = activeEvent.disposition![vehicleType]
          
          const vehiclePrice = durationHours * eventDisposition.hourly
          dispositionPrice += vehiclePrice
          
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
        subtotal = dispositionPrice
        
        console.log("⏰ DISPOSITION PRICE (MULTIPLE VEHICLES):", {
          totalDispositionPrice: dispositionPrice,
          vehicleBreakdowns
        })
      }

      // DISPOSITION TRANSFER: Calculate normal transfer cost from pickup to destination 
      let transferCost = 0
      let transferRoute = ''
      
      // Only calculate transfer if we have both pickup and destination
      if (journey.pickup.address && journey.destination.address && 
          journey.pickup.address !== journey.destination.address) {
        
        console.log("🚗 CALCULATING DISPOSITION TRANSFER:", {
          from: journey.pickup.address,
          to: journey.destination.address,
          hasDistance: !!journey.distance?.km
        })
        
        // Resolve locations for pricing
        const resolvedPickup = resolveLocationForPricing(
          journey.pickup.locationId, 
          journey.pickup.coordinates
        )
        const resolvedDestination = resolveLocationForPricing(
          journey.destination.locationId, 
          journey.destination.coordinates
        )
        
        let transferPricing = null
        
        // During Olympic period, try Olympic routes first
        if (journey.date && isOlympicPeriod(journey.date) && 
            resolvedPickup.resolvedLocationId && resolvedDestination.resolvedLocationId) {
          
          const olympicRoute = findOlympicRoute(
            resolvedPickup.resolvedLocationId,
            resolvedDestination.resolvedLocationId
          )
          
          if (olympicRoute) {
            // Use Olympic route pricing
            let olympicVehicleType: keyof typeof olympicRoute.prices = 'olympic-sedan'
            
            if (vehicles.count === 1 || vehicles.sameType) {
              olympicVehicleType = mapToOlympicVehicleType(vehicles.singleConfig.type)
            } else {
              olympicVehicleType = mapToOlympicVehicleType(vehicles.multipleConfigs[0].type)
            }
            
            transferCost = olympicRoute.prices[olympicVehicleType] * vehicles.count
            transferRoute = `${olympicRoute.from} → ${olympicRoute.to}`
            
            console.log("🏔️ DISPOSITION TRANSFER (OLYMPIC ROUTE):", {
              from: olympicRoute.from,
              to: olympicRoute.to,
              vehicleType: olympicVehicleType,
              cost: transferCost,
              route: transferRoute
            })
          }
        }
        
        // If no Olympic route found, try event routes or use standard pricing
        if (!transferPricing && transferCost === 0) {
          // Try to find event route (non-Olympic)
          if (!isOlympicPeriod(journey.date!) && activeEvent) {
            let eventRoute: EventRoute | null = null
            
            if (resolvedPickup.resolvedLocationId && resolvedDestination.resolvedLocationId) {
              eventRoute = findEventRouteByLocation(
                resolvedPickup.resolvedLocationId,
                resolvedDestination.resolvedLocationId,
                activeEvent
              )
            }
            
            if (!eventRoute && resolvedPickup.resolvedCoordinates && resolvedDestination.resolvedCoordinates) {
              eventRoute = await findMatchingEventRoute(
                resolvedPickup.resolvedCoordinates,
                resolvedDestination.resolvedCoordinates,
                activeEvent
              )
            }
            
            if (eventRoute) {
              // Use event route pricing
              const vehicleType = mapVehicleTypeToEvent(
                vehicles.count === 1 || vehicles.sameType 
                  ? vehicles.singleConfig.type 
                  : vehicles.multipleConfigs[0].type
              )
              
              transferCost = (eventRoute.prices[vehicleType] || 0) * vehicles.count
              transferRoute = `${eventRoute.from} → ${eventRoute.to}`
              
              console.log("🎯 DISPOSITION TRANSFER (EVENT ROUTE):", {
                from: eventRoute.from,
                to: eventRoute.to,
                vehicleType,
                cost: transferCost,
                route: transferRoute
              })
            }
          }
          
          // Final fallback: use standard distance-based pricing
          if (transferCost === 0 && journey.distance?.km) {
            let vehicleType = 'sedan'
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
            
            const { calculateTotalPrice } = require('@/lib/pricing-config')
            const standardPricing = calculateTotalPrice(
              journey.distance.km,
              vehicleType,
              passengers,
              luggage,
              vehicles.count,
              journey.time,
              journey.minutes,
              journey.timeAmPm,
              journey.pickup.coordinates,
              journey.destination.coordinates
            )
            
            transferCost = standardPricing.basePrice
            transferRoute = `${journey.pickup.address} → ${journey.destination.address}`
            
            console.log("📏 DISPOSITION TRANSFER (DISTANCE-BASED):", {
              from: journey.pickup.address,
              to: journey.destination.address,
              distance: journey.distance.km + 'km',
              vehicleType,
              cost: transferCost,
              route: transferRoute
            })
          }
        }
        
        // Add transfer cost to subtotal
        subtotal += transferCost
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
        dispositionPrice,
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
          dispositionPrice,
          totalPrice,
          meetGreetPrice,
          eventRoute: `${activeEvent.name} - Disposition`,
          isEventPricing: true,
          transferCost,
          transferRoute
        })

        return {
          basePrice: dispositionPrice,
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
            basePrice: dispositionPrice,
            vehicleMultiplier: 1,
            passengerMultiplier: 1,
            luggageMultiplier: 1,
            nightSurcharge,
            nightSurchargeRate: nightSurcharge > 0 ? activeEvent.extras.nightSurcharge : 0,
            vehicleCount: vehicles.count,
            pricePerVehicle: Math.round(dispositionPrice / vehicles.count),
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

  const calculatePrice = useCallback(
    async (state: BookingState): Promise<PricingResult | null> => {
      console.log("🔍 CALCULATE_PRICE - START:", {
        isReady: isReadyForPricing(state),
        serviceType: state.serviceType,
        date: state.journey.date,
        pickup: state.journey.pickup,
        hasEndTime: !!state.journey.endTime
      })

      if (!isReadyForPricing(state)) {
        console.log("❌ CALCULATE_PRICE - NOT READY FOR PRICING")
        return null
      }

      const { journey, vehicles, serviceType, options } = state

      try {
        // Check for Olympic pricing first (highest priority)
        if (journey.date && isOlympicPeriod(journey.date)) {
          console.log("🏔️ OLYMPIC PERIOD DETECTED:", {
            date: journey.date,
            serviceType: serviceType
          })
          
          // Check for Olympic ceremony dates
          const ceremony = findOlympicCeremony(journey.date)
          if (ceremony && serviceType === "ceremony-disposition") {
            const result = await calculateCeremonyPriceForBooking(state, ceremony)
            return result
          }
          
          // For transfers (NOT dispositions), try Olympic routes first
          if (serviceType !== "disposizione") {
            console.log("🔍 RESOLVING LOCATIONS FOR OLYMPIC PRICING:", {
              pickupLocationId: journey.pickup.locationId,
              pickupAddress: journey.pickup.address,
              destinationLocationId: journey.destination.locationId,
              destinationAddress: journey.destination.address
            })
            
            const resolvedPickup = resolveLocationForPricing(
              journey.pickup.locationId, 
              journey.pickup.coordinates
            )
            const resolvedDestination = resolveLocationForPricing(
              journey.destination.locationId, 
              journey.destination.coordinates
            )
            
            console.log("✅ RESOLVED LOCATIONS:", {
              pickup: resolvedPickup,
              destination: resolvedDestination
            })
            
            if (resolvedPickup.resolvedLocationId && resolvedDestination.resolvedLocationId) {
              console.log("🏔️ SEARCHING OLYMPIC ROUTE:", {
                from: resolvedPickup.resolvedLocationId,
                to: resolvedDestination.resolvedLocationId
              })
              
              let olympicRoute = findOlympicRoute(
                resolvedPickup.resolvedLocationId,
                resolvedDestination.resolvedLocationId
              )
              
              // FALLBACK: If Meet & Greet location doesn't find route, try generic location
              if (!olympicRoute && resolvedPickup.resolvedLocationId && resolvedDestination.resolvedLocationId) {
                // Meet & Greet → Generic location fallback mapping
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
                  console.log("🔄 OLYMPIC ROUTE FALLBACK:", {
                    original: `${resolvedPickup.resolvedLocationId} → ${resolvedDestination.resolvedLocationId}`,
                    fallback: `${fallbackPickupId} → ${fallbackDestinationId}`
                  })
                  
                  olympicRoute = findOlympicRoute(fallbackPickupId, fallbackDestinationId)
                }
              }
              
              console.log("🎯 OLYMPIC ROUTE RESULT:", olympicRoute)
              
              if (olympicRoute) {
                console.log("🏔️ OLYMPIC TRANSFER ROUTE FOUND - Using calculateOlympicPrice")
                return await calculateOlympicPrice(state, olympicRoute)
              } else {
                console.log("❌ NO OLYMPIC ROUTE FOUND - Will fallback to standard pricing")
              }
            } else {
              console.log("❌ MISSING RESOLVED LOCATION IDs - Cannot search Olympic routes")
            }
          } else {
            console.log("⏰ OLYMPIC DISPOSITION - Skipping Olympic route search, will use event pricing")
          }
        }

        // Check for regular event pricing
        const activeEvent = journey.date ? getActiveEvent(journey.date) : null
        console.log("📅 ACTIVE EVENT CHECK:", {
          activeEvent: activeEvent?.name,
          serviceType: serviceType,
          willCalculateDisposition: activeEvent && serviceType === "disposizione"
        })
        
        if (activeEvent) {
          
          if (serviceType === "disposizione") {
            console.log("⏰ CALLING calculateEventDispositionPrice")
            // Use special event disposition pricing
            return await calculateEventDispositionPrice(state, activeEvent)
          }
          
          // For transfers, try to find event routes (only for non-Olympic events)
          if (!isOlympicPeriod(journey.date!)) {
            let eventRoute: EventRoute | null = null
            
            const resolvedPickup = resolveLocationForPricing(
              journey.pickup.locationId, 
              journey.pickup.coordinates
            )
            const resolvedDestination = resolveLocationForPricing(
              journey.destination.locationId, 
              journey.destination.coordinates
            )
            
            
            // Try location-based matching first
            if (resolvedPickup.resolvedLocationId && resolvedDestination.resolvedLocationId) {
              eventRoute = findEventRouteByLocation(
                resolvedPickup.resolvedLocationId,
                resolvedDestination.resolvedLocationId,
                activeEvent
              )
            }
            
            // Fallback to coordinate-based matching
            if (!eventRoute && resolvedPickup.resolvedCoordinates && resolvedDestination.resolvedCoordinates) {
              eventRoute = await findMatchingEventRoute(
                resolvedPickup.resolvedCoordinates,
                resolvedDestination.resolvedCoordinates,
                activeEvent
              )
            }
            
            if (eventRoute) {
              return await calculateEventPrice(state, eventRoute, activeEvent)
            }
          }
        }

        // Fall back to standard pricing
        let standardPricing: PricingResult | null = null

        if (serviceType === "transfer" || serviceType === "inter-cluster") {
          // Transfer pricing (distance-based) OR Inter-cluster (fixed pricing during Olympic period)
          // Check if distance is available before calculating
          if (!journey.distance?.km) {
            console.log("❌ CALCULATE_PRICE - Missing distance for transfer service")
            return null
          }

          if (vehicles.count === 1 || vehicles.sameType) {
            const config = vehicles.singleConfig
            standardPricing = calculateTotalPrice(
              journey.distance.km,
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
              journey.distance.km, 
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

          // STANDARD DISPOSITION: Add transfer cost from Milano Centrale to disposition start point
          if (standardPricing) {
            const resolvedPickup = resolveLocationForPricing(
              journey.pickup.locationId, 
              journey.pickup.coordinates
            )
            
            // Calculate transfer from Milano Centrale to disposition start point
            let transferCost = 0
            let transferRoute = ''
            
            // Check if we need to calculate transfer (if not Milano Centrale and we have location data)
            const needsTransferCalculation = resolvedPickup.resolvedLocationId !== 'milano-centrale' && 
              (resolvedPickup.resolvedLocationId || resolvedPickup.resolvedCoordinates || journey.pickup.address)
            
            if (needsTransferCalculation) {
              try {
                // Get distance from Milano Centrale to disposition start point
                const milanoCoordinates = { lat: 45.4868, lng: 9.2037 } // Milano Centrale coordinates
                const milanoCentroCoordinates = { lat: 45.4642, lng: 9.1900 } // Milano centro coordinates for hinterland check
                let pickupCoordinates = resolvedPickup.resolvedCoordinates
                
                // If we don't have resolved coordinates but have a locationId or address, try to get them
                if (!pickupCoordinates && (resolvedPickup.resolvedLocationId || journey.pickup.address)) {
                  // This case handles cities like Napoli that aren't in our registry
                  // For now, we'll use the journey coordinates if available, or skip if not
                  pickupCoordinates = journey.pickup.coordinates
                }
                
                if (pickupCoordinates) {
                  // Check if pickup location is within Milano hinterland (10km from Milano center)
                  const distanceFromMilanoCenter = calculateDistanceKm(milanoCentroCoordinates, pickupCoordinates)
                  
                  console.log("🏙️ DISPOSITION MILANO HINTERLAND CHECK:", {
                    pickupLocation: journey.pickup.address,
                    pickupLocationId: resolvedPickup.resolvedLocationId,
                    distanceFromMilanoCenter: distanceFromMilanoCenter.toFixed(1) + 'km',
                    isInHinterland: distanceFromMilanoCenter <= 10
                  })
                  
                  if (distanceFromMilanoCenter <= 10) {
                    // Within Milano hinterland - NO transfer cost
                    console.log("✅ DISPOSITION: Location within Milano hinterland (10km) - NO transfer cost applied")
                    transferCost = 0
                    transferRoute = ''
                  } else {
                    // Outside Milano hinterland - calculate transfer cost
                    const distance = calculateDistanceKm(milanoCoordinates, pickupCoordinates)
                    
                    // Use standard pricing for the transfer
                    let vehicleType = 'sedan' // default
                    let passengers = 1
                    let luggage = 0
                    
                    if (vehicles.count === 1 || vehicles.sameType) {
                      vehicleType = vehicles.singleConfig.type
                      passengers = vehicles.singleConfig.passengers
                      luggage = vehicles.singleConfig.luggage
                    } else {
                      // For multiple vehicles, use the first one for transfer calculation
                      vehicleType = vehicles.multipleConfigs[0].type
                      passengers = vehicles.multipleConfigs[0].passengers
                      luggage = vehicles.multipleConfigs[0].luggage
                    }
                    
                    // Calculate transfer price using standard pricing
                    const transferPricing = calculateTotalPrice(
                      distance,
                      vehicleType,
                      passengers,
                      luggage,
                      vehicles.count,
                      journey.time,
                      journey.minutes,
                      journey.timeAmPm,
                      milanoCoordinates, // Milano Centrale coordinates
                      pickupCoordinates  // Pickup coordinates
                    )
                    
                    transferCost = transferPricing.basePrice
                    transferRoute = `Milano Centrale → ${journey.pickup.address}`
                    
                    console.log("🚗 STANDARD DISPOSITION TRANSFER (OUTSIDE HINTERLAND):", {
                      distance: distance.toFixed(1) + 'km',
                      vehicleType,
                      cost: transferCost,
                      route: transferRoute
                    })
                  }
                }
              } catch (error) {
                console.error("Error calculating transfer distance:", error)
                transferCost = 0
              }
            }
            
            // Add transfer cost to the total pricing
            if (transferCost > 0) {
              const originalSubtotal = standardPricing.breakdown.subtotal
              const transferSubtotal = originalSubtotal + transferCost
              const transferVatAmount = Math.round(transferSubtotal * standardPricing.breakdown.vatRate * 100) / 100
              const transferTotalPrice = Math.round((transferSubtotal + transferVatAmount) * 100) / 100
              
              // DON'T add transferCost to basePrice - keep them separate!
              // standardPricing.basePrice += transferCost  <- REMOVED THIS BAD LINE
              standardPricing.totalPrice = transferTotalPrice
               
               // Create new breakdown with transfer information
               const updatedBreakdown = {
                 ...standardPricing.breakdown,
                 subtotal: transferSubtotal,
                 vatAmount: transferVatAmount,
                 transferCost: transferCost,
                 transferRoute: transferRoute
               }
               standardPricing.breakdown = updatedBreakdown
               
               console.log("💰 UPDATED STANDARD DISPOSITION PRICING:", {
                 originalTotal: originalSubtotal + Math.round(originalSubtotal * standardPricing.breakdown.vatRate * 100) / 100,
                 transferCost,
                 newTotal: transferTotalPrice,
                 transferRoute
               })
            }
          }
        }

        // Add Meet & Greet pricing to standard pricing if enabled
        if (standardPricing && options.meetGreetConfig.enabled) {
          // Try to detect Meet & Greet service if not already configured
          let serviceId = options.meetGreetConfig.serviceId
          
          if (!serviceId) {
            // ENHANCED: Resolve pickup and destination for Meet & Greet (handles Milano area)
            const resolvedPickup = resolveLocationForPricing(
              journey.pickup.locationId, 
              journey.pickup.coordinates
            )
            const resolvedDestination = resolveLocationForPricing(
              journey.destination.locationId, 
              journey.destination.coordinates
            )
            
            // Auto-detect service using location-based matching first
            let detectedService = null
            
            if (resolvedPickup.resolvedLocationId || resolvedDestination.resolvedLocationId) {
              detectedService = findMeetGreetServiceByLocation(
                resolvedPickup.resolvedLocationId,
                resolvedDestination.resolvedLocationId
              )
            }
            
            // Fallback to coordinate-based detection
            if (!detectedService && resolvedPickup.resolvedCoordinates && resolvedDestination.resolvedCoordinates) {
              detectedService = findMeetGreetService(resolvedPickup.resolvedCoordinates, resolvedDestination.resolvedCoordinates)
            }
            
            if (detectedService) {
              serviceId = detectedService.serviceId
            }
          }
          
          if (serviceId) {
            const isNight = journey.time && journey.minutes && journey.timeAmPm 
              ? isNightTime(journey.time, journey.minutes, journey.timeAmPm) 
              : false
            
            const meetGreetResult = calculateMeetGreetPriceLegacy(
              serviceId,
              options.meetGreetConfig.passengers,
              options.meetGreetConfig.children,
              options.meetGreetConfig.infants,
              options.meetGreetConfig.extraLuggage,
              isNight,
              options.meetGreetConfig.specialServices || {},
              journey.date // Pass service date for holiday surcharge
            )
            
            // Multiply Meet & Greet price by number of vehicles
            const totalMeetGreetPrice = meetGreetResult.price * vehicles.count
            standardPricing.meetGreetPrice = totalMeetGreetPrice
            standardPricing.meetGreetBreakdown = {
              ...meetGreetResult.breakdown,
              // Update total to reflect multiplication by vehicle count
              total: meetGreetResult.breakdown.total * vehicles.count
            }
            standardPricing.totalPrice += totalMeetGreetPrice
          }
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
    [isReadyForPricing, calculateEventPrice]
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
