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

// Helper function to convert 12h format to 24h format
const convertTo24Hour = (hour: string, minutes: string, ampm: string): { hour24: number, totalMinutes: number } => {
  let hour24 = parseInt(hour)
  if (ampm === "PM" && hour24 !== 12) hour24 += 12
  if (ampm === "AM" && hour24 === 12) hour24 = 0
  return { hour24, totalMinutes: hour24 * 60 + parseInt(minutes) }
}

// Helper function to check if time is night (19:30 - 07:30)
const isNightTime = (hour: string, minutes: string, ampm: string): boolean => {
  const { hour24, totalMinutes } = convertTo24Hour(hour, minutes, ampm)
  // Night time: 19:30 (1170 minutes) to 07:30 (450 minutes)
  return totalMinutes >= 1170 || totalMinutes <= 450
}

// Vehicle type mapping for events
const mapVehicleTypeToEvent = (type: string): 'berlina' | 'monovolume' | 'minibus' => {
  switch (type.toLowerCase()) {
    case 'sedan':
    case 'berlina':
      return 'berlina'
    case 'van':
    case 'monovolume':
      return 'monovolume'
    case 'minibus':
      return 'minibus'
    default:
      return 'berlina'
  }
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
      // Transfer needs distance (unless using event pricing)
      if (!journey.distance?.km && !journey.date) {
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

  // NEW: Calculate Olympic ceremony pricing
  const calculateCeremonyPriceForBooking = useCallback(
    async (state: BookingState, ceremony: OlympicCeremony): Promise<PricingResult | null> => {
      const { vehicles, journey, options } = state
      
      // Calculate service hours (minimum 2 hours included)
      const startTimeConverted = convertTo24Hour(journey.time!, journey.minutes!, journey.timeAmPm!)
      const endTimeConverted = convertTo24Hour(journey.endTime!, journey.endMinutes!, journey.endTimeAmPm!)
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
          options.meetGreetConfig.specialServices || {}
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
          options.meetGreetConfig.specialServices || {}
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
          name: "Milano-Cortina 2026 Olympics",
          from: olympicRoute.from,
          to: olympicRoute.to,
          notes: "Olympic period pricing - Transfer inter-cluster"
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
          options.meetGreetConfig.specialServices || {}
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
      const { vehicles, journey, options } = state
      
      // Calculate duration in hours
      const startTimeConverted = convertTo24Hour(journey.time!, journey.minutes!, journey.timeAmPm!)
      const endTimeConverted = convertTo24Hour(journey.endTime!, journey.endMinutes!, journey.endTimeAmPm!)
      const durationMinutes = Math.max(0, endTimeConverted.totalMinutes - startTimeConverted.totalMinutes)
      const durationHours = Math.ceil(durationMinutes / 60)

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
          options.meetGreetConfig.specialServices || {}
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
          name: `${activeEvent.name} - Disposition`,
          from: "Disposition Service",
          to: `${durationHours} hours`,
          notes: `Special ${activeEvent.name} rates - ${durationHours}h duration`
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
          vatRate: activeEvent.extras.vatRate
        },
        vehicleBreakdowns: vehicleBreakdowns.length > 0 ? vehicleBreakdowns : undefined
      }
    },
    []
  )

  const calculatePrice = useCallback(
    async (state: BookingState): Promise<PricingResult | null> => {
      if (!isReadyForPricing(state)) {
        return null
      }

      const { journey, vehicles, serviceType, options } = state

      try {
        // Check for Olympic pricing first (highest priority)
        if (journey.date && isOlympicPeriod(journey.date)) {
          
          // Check for Olympic ceremony dates
          const ceremony = findOlympicCeremony(journey.date)
          if (ceremony && serviceType === "ceremony-disposition") {
            const result = await calculateCeremonyPriceForBooking(state, ceremony)
            return result
          }
          
          // For transfers, try Olympic routes first
          const resolvedPickup = resolveLocationForPricing(
            journey.pickup.locationId, 
            journey.pickup.coordinates
          )
          const resolvedDestination = resolveLocationForPricing(
            journey.destination.locationId, 
            journey.destination.coordinates
          )
          
          if (resolvedPickup.resolvedLocationId && resolvedDestination.resolvedLocationId) {
            const olympicRoute = findOlympicRoute(
              resolvedPickup.resolvedLocationId,
              resolvedDestination.resolvedLocationId
            )
            
            if (olympicRoute) {
              return await calculateOlympicPrice(state, olympicRoute)
            }
          }
        }

        // Check for regular event pricing
        const activeEvent = journey.date ? getActiveEvent(journey.date) : null
        if (activeEvent) {
          
          if (serviceType === "disposizione") {
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

        if (serviceType === "transfer") {
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
              journey.timeAmPm
            )
          } else {
            standardPricing = calculateMultipleVehiclesPrice(
              journey.distance!.km, 
              vehicles.multipleConfigs,
              journey.time,
              journey.minutes,
              journey.timeAmPm
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
              options.meetGreetConfig.specialServices || {}
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
