/**
 * Olympic Pricing Configuration for Milano-Cortina 2026
 * Extended from event-pricing.ts with Olympic-specific features
 */

import {
  OLYMPIC_LOCATIONS,
  OLYMPIC_ROUTES,
  OLYMPIC_PERIOD_2026,
  OlympicRoute,
  OlympicVehicleType,
  Location,
  getLocationById,
  findLocationByCoordinates,
  calculateDistance,
  findOlympicRoute as findOlympicRouteBase,
  isOlympicPeriod as isOlympicPeriodBase,
  isNightTime as isNightTimeBase,
  mapVehicleTypeToOlympic
} from './event-pricing'

// Olympic-specific vehicle types with detailed specifications
export interface OlympicVehicleSpec {
  id: string
  name: string
  displayName: string
  maxPassengers: number
  maxPassengersWithLuggage: number
  maxLuggage: number
  maxSmallLuggage?: number
  description: string
  category: 'standard' | 'luxury'
  olympicType: OlympicVehicleType
}

// Olympic vehicle specifications
export const OLYMPIC_VEHICLE_SPECS: OlympicVehicleSpec[] = [
  {
    id: 'olympic-sedan',
    name: 'Olympic Sedan',
    displayName: 'Sedan (2 pax)',
    maxPassengers: 2,
    maxPassengersWithLuggage: 2,
    maxLuggage: 2,
    maxSmallLuggage: 4,
    description: 'Premium sedan for Olympic period',
    category: 'standard',
    olympicType: 'sedan'
  },
  {
    id: 'olympic-suv',
    name: 'Olympic SUV',
    displayName: 'SUV (4 pax)',
    maxPassengers: 4,
    maxPassengersWithLuggage: 3,
    maxLuggage: 3,
    maxSmallLuggage: 6,
    description: 'Premium SUV for Olympic period',
    category: 'standard',
    olympicType: 'suv'
  },
  {
    id: 'olympic-minivan',
    name: 'Olympic Minivan',
    displayName: 'Minivan (6 pax)',
    maxPassengers: 6,
    maxPassengersWithLuggage: 4,
    maxLuggage: 4,
    maxSmallLuggage: 8,
    description: 'Spacious minivan for families',
    category: 'standard',
    olympicType: 'minivan'
  },
  {
    id: 'olympic-tesla',
    name: 'Olympic Tesla',
    displayName: 'Tesla Electric',
    maxPassengers: 4,
    maxPassengersWithLuggage: 3,
    maxLuggage: 3,
    maxSmallLuggage: 6,
    description: 'Premium electric vehicle',
    category: 'luxury',
    olympicType: 'tesla'
  },
  {
    id: 'olympic-van',
    name: 'Olympic Van',
    displayName: 'Van (8 pax)',
    maxPassengers: 8,
    maxPassengersWithLuggage: 6,
    maxLuggage: 6,
    maxSmallLuggage: 12,
    description: 'Large capacity van',
    category: 'standard',
    olympicType: 'van'
  },
  {
    id: 'olympic-luxury',
    name: 'Olympic Luxury',
    displayName: 'Luxury Sedan (Mercedes S / Maserati)',
    maxPassengers: 2,
    maxPassengersWithLuggage: 2,
    maxLuggage: 2,
    maxSmallLuggage: 4,
    description: 'Ultra-luxury sedan service',
    category: 'luxury',
    olympicType: 'luxury'
  }
]

// Olympic Ceremony Configuration
export interface OlympicCeremony {
  id: string
  name: string
  date: string // YYYY-MM-DD
  venue: string
  venueLocationId: string
  baseCity: string
  baseCityLocationId: string
  pricing: {
    dispositionBase: {
      'berlina': number       // Berlina per max 3 pax
      'monovolume': number    // Monovolume per max 6 pax (max 4 grandi)
      'minibus': number       // Minibus per max 8 pax
    }
    hourlyRate: {
      'berlina': number
      'monovolume': number
      'minibus': number
    }
  }
  description: string
  notes: string[]
}

// Olympic ceremonies calendar (placeholder - would be populated with real ceremony dates)
export const OLYMPIC_CEREMONIES: OlympicCeremony[] = [
  {
    id: 'opening-ceremony',
    name: 'Opening Ceremony',
    date: '2026-02-06',
    venue: 'San Siro Stadium',
    venueLocationId: 'milano-center',
    baseCity: 'Milano',
    baseCityLocationId: 'milano-center',
    pricing: {
      dispositionBase: {
        'berlina': 350,
        'monovolume': 450,
        'minibus': 550
      },
      hourlyRate: {
        'berlina': 120,
        'monovolume': 150,
        'minibus': 180
      }
    },
    description: 'Milano-Cortina 2026 Olympic Opening Ceremony',
    notes: [
      'Minimum 4 hours service',
      'Special event surcharge applies',
      'Advance booking mandatory'
    ]
  },
  {
    id: 'closing-ceremony',
    name: 'Closing Ceremony', 
    date: '2026-02-22',
    venue: 'San Siro Stadium',
    venueLocationId: 'milano-center',
    baseCity: 'Milano',
    baseCityLocationId: 'milano-center',
    pricing: {
      dispositionBase: {
        'berlina': 350,
        'monovolume': 450,
        'minibus': 550
      },
      hourlyRate: {
        'berlina': 120,
        'monovolume': 150,
        'minibus': 180
      }
    },
    description: 'Milano-Cortina 2026 Olympic Closing Ceremony',
    notes: [
      'Minimum 4 hours service',
      'Special event surcharge applies',
      'Advance booking mandatory'
    ]
  }
]

// Olympic service types
export type OlympicServiceType = 'transfer' | 'transfer-inter-cluster' | 'disposition' | 'ceremony-disposition'

// Olympic pricing configuration
export const OLYMPIC_PRICING_CONFIG = {
  nightSurcharge: OLYMPIC_PERIOD_2026.nightSurcharge, // 20%
  nightHours: OLYMPIC_PERIOD_2026.nightHours,
  vat: {
    rate: OLYMPIC_PERIOD_2026.vatRate, // 10%
    included: false
  },
  minimumHours: {
    disposition: 2,
    ceremonyDisposition: 4
  },
  extraHourRates: {
    sedan: 94,
    suv: 94,
    minivan: 108,
    tesla: 108,
    van: 135,
    luxury: 135
  }
}

// Helper functions

/**
 * Format date to local string for comparison
 */
function formatDateToLocal(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Check if date falls within Olympic period
 */
export function isOlympicPeriod(date: Date): boolean {
  return isOlympicPeriodBase(date)
}

/**
 * Find Olympic route between two locations
 */
export function findOlympicRoute(fromLocationId: string, toLocationId: string): OlympicRoute | null {
  return findOlympicRouteBase(fromLocationId, toLocationId)
}

/**
 * Find Olympic ceremony by date
 */
export function findOlympicCeremony(date: Date): OlympicCeremony | null {
  const dateStr = formatDateToLocal(date)
  return OLYMPIC_CEREMONIES.find(ceremony => ceremony.date === dateStr) || null
}

/**
 * Check if date is a ceremony date
 */
export function isCeremonyDate(date: Date): boolean {
  return findOlympicCeremony(date) !== null
}

/**
 * Get ceremony name for a date
 */
export function getCeremonyName(date: Date): string | null {
  const ceremony = findOlympicCeremony(date)
  return ceremony ? ceremony.name : null
}

/**
 * Get Olympic vehicle types
 */
export function getOlympicVehicleTypes(): OlympicVehicleSpec[] {
  return OLYMPIC_VEHICLE_SPECS
}

/**
 * Get ceremony vehicle types (simplified for UI)
 */
export function getCeremonyVehicleTypes(): { value: string; label: string; maxPassengers: number; maxLuggage: number; description: string; ceremonyPrice: number }[] {
  // Map ceremony pricing to vehicle types
  const ceremonyPricing = OLYMPIC_CEREMONIES[0]?.pricing?.dispositionBase || {
    berlina: 350,
    monovolume: 450,
    minibus: 550
  }

  return [
    {
      value: 'berlina',
      label: 'Berlina (max 3 pax)',
      maxPassengers: 3,
      maxLuggage: 2,
      description: 'Premium sedan for ceremony service',
      ceremonyPrice: ceremonyPricing.berlina
    },
    {
      value: 'monovolume',
      label: 'Monovolume (max 6 pax, 4 with luggage)',
      maxPassengers: 6,
      maxLuggage: 4,
      description: 'Family-sized vehicle for ceremony service',
      ceremonyPrice: ceremonyPricing.monovolume
    },
    {
      value: 'minibus',
      label: 'Minibus (max 8 pax)',
      maxPassengers: 8,
      maxLuggage: 6,
      description: 'Large capacity for ceremony service',
      ceremonyPrice: ceremonyPricing.minibus
    }
  ]
}

/**
 * Get Olympic locations
 */
export function getOlympicLocations(): Location[] {
  return OLYMPIC_LOCATIONS
}

/**
 * Check if time is night time
 */
export function isNightTime(timeStr: string): boolean {
  return isNightTimeBase(timeStr)
}

/**
 * Map vehicle type to ceremony type
 */
export function mapVehicleToCeremonyType(vehicleType: string): 'berlina' | 'monovolume' | 'minibus' {
  switch (vehicleType.toLowerCase()) {
    case 'sedan':
    case 'olympic-sedan':
    case 'luxury-sedan':
    case 'olympic-luxury':
      return 'berlina'
    case 'van':
    case 'minivan':
    case 'olympic-minivan':
    case 'suv':
    case 'olympic-suv':
      return 'monovolume'
    case 'minibus':
    case 'olympic-van':
    case 'tesla':
    case 'olympic-tesla':
      return 'minibus'
    default:
      return 'berlina'
  }
}

/**
 * Calculate Olympic ceremony pricing
 */
export function calculateCeremonyPrice(
  ceremony: OlympicCeremony,
  vehicleType: string,
  serviceHours: number,
  pickupLocationId?: string,
  isNight: boolean = false,
  pickupCoordinates?: { lat: number; lng: number },
  destinationLocationId?: string,
  destinationCoordinates?: { lat: number; lng: number }
): {
  basePrice: number
  extraHours: number
  extraHoursCost: number
  transferCost: number
  nightSurcharge: number
  subtotal: number
  vatAmount: number
  total: number
  transferRoute?: string
} {
  const ceremonyType = mapVehicleToCeremonyType(vehicleType)
  const minimumHours = OLYMPIC_PRICING_CONFIG.minimumHours.ceremonyDisposition
  
  // Base price (includes minimum hours)
  const basePrice = ceremony.pricing.dispositionBase[ceremonyType]
  
  // Extra hours calculation
  const extraHours = Math.max(0, serviceHours - minimumHours)
  const extraHoursCost = extraHours * ceremony.pricing.hourlyRate[ceremonyType]
  
  let subtotal = basePrice + extraHoursCost
  let transferCost = 0
  let transferRoute = ''
  
  // Check if transfer is needed from a different location
  const needsTransfer = (locationId?: string, coordinates?: { lat: number; lng: number }): boolean => {
    if (!locationId && !coordinates) return false
    
    // If we have locationId, check if it's different from ceremony base city
    if (locationId && locationId !== ceremony.baseCityLocationId) {
      return true
    }
    
    // If we have coordinates, check distance from ceremony base city
    if (coordinates && !locationId) {
      const baseCityLocation = getLocationById(ceremony.baseCityLocationId)
      if (baseCityLocation) {
        const distance = calculateDistance(coordinates, baseCityLocation.coordinates)
        return distance > 5 // More than 5km from base city
      }
    }
    
    return false
  }
  
  // Calculate transfer price using Olympic routes
  const findTransferPrice = (fromLocationId?: string, toLocationId?: string, fromCoords?: { lat: number; lng: number }, toCoords?: { lat: number; lng: number }): OlympicRoute | null => {
    if (fromLocationId && toLocationId) {
      return findOlympicRoute(fromLocationId, toLocationId)
    }
    
    // If no direct route found and we have coordinates, try coordinate-based lookup
    if (fromCoords && toCoords) {
      const fromLocation = findLocationByCoordinates(fromCoords, 0.1)
      const toLocation = findLocationByCoordinates(toCoords, 0.1)
      if (fromLocation && toLocation) {
        return findOlympicRoute(fromLocation.id, toLocation.id)
      }
    }
    
    return null
  }
  
  // Calculate custom transfer price based on distance
  const calculateCustomTransferPrice = (fromCoords: { lat: number; lng: number }, toCoords: { lat: number; lng: number }, vehicleType: keyof OlympicRoute['prices']): number => {
    const distance = calculateDistance(fromCoords, toCoords)
    
    // Base rates per km for Olympic period (simplified)
    const kmRates: Record<keyof OlympicRoute['prices'], number> = {
      sedan: 2.5,
      suv: 2.5,
      minivan: 3.0,
      tesla: 3.0,
      van: 4.0,
      luxury: 4.5
    }
    
    const baseRate = kmRates[vehicleType] || kmRates.sedan
    return Math.round(distance * baseRate)
  }
  
  // Helper to get location display name
  const getLocationDisplayName = (locationId?: string): string => {
    const location = locationId ? getLocationById(locationId) : null
    return location ? location.displayName : 'Custom Location'
  }
  
  // Check pickup location
  if (needsTransfer(pickupLocationId, pickupCoordinates)) {
    const transferRoute_pickup = findTransferPrice(
      ceremony.baseCityLocationId,
      pickupLocationId,
      ceremony.baseCityLocationId ? getLocationById(ceremony.baseCityLocationId)?.coordinates : undefined,
      pickupCoordinates
    )
    
    if (transferRoute_pickup) {
      const olympicVehicleType = mapVehicleToCeremonyOlympicType(ceremonyType)
      transferCost += transferRoute_pickup.prices[olympicVehicleType] || 0
      transferRoute = `${ceremony.baseCity} → ${getLocationDisplayName(pickupLocationId)}`
    } else if (pickupCoordinates) {
      // Fallback to distance-based calculation
      const baseCityCoords = getCeremonyBaseCityCoordinates(ceremony.baseCityLocationId)
      if (baseCityCoords) {
        const olympicVehicleType = mapVehicleToCeremonyOlympicType(ceremonyType)
        transferCost += calculateCustomTransferPrice(baseCityCoords, pickupCoordinates, olympicVehicleType)
        transferRoute = `${ceremony.baseCity} → Pickup Location`
      }
    }
  }
  
  // Check destination location (if different from pickup and ceremony venue)
  if (destinationLocationId && destinationLocationId !== pickupLocationId && destinationLocationId !== ceremony.venueLocationId) {
    if (needsTransfer(destinationLocationId, destinationCoordinates)) {
      // Additional transfer needed
      const transferRoute_dest = findTransferPrice(
        pickupLocationId || ceremony.venueLocationId,
        destinationLocationId,
        pickupCoordinates,
        destinationCoordinates
      )
      
      if (transferRoute_dest) {
        const olympicVehicleType = mapVehicleToCeremonyOlympicType(ceremonyType)
        transferCost += transferRoute_dest.prices[olympicVehicleType] || 0
        transferRoute += ` → ${getLocationDisplayName(destinationLocationId)}`
      } else if (destinationCoordinates && pickupCoordinates) {
        // Fallback to distance-based calculation
        const olympicVehicleType = mapVehicleToCeremonyOlympicType(ceremonyType)
        transferCost += calculateCustomTransferPrice(pickupCoordinates, destinationCoordinates, olympicVehicleType)
        transferRoute += ` → Destination`
      }
    }
  }
  
  subtotal += transferCost
  
  // Night surcharge
  let nightSurcharge = 0
  if (isNight) {
    nightSurcharge = subtotal * (OLYMPIC_PRICING_CONFIG.nightSurcharge / 100)
    subtotal += nightSurcharge
  }
  
  // VAT calculation
  const vatAmount = subtotal * (OLYMPIC_PRICING_CONFIG.vat.rate / 100)
  const total = subtotal + vatAmount
  
  return {
    basePrice,
    extraHours,
    extraHoursCost,
    transferCost,
    nightSurcharge,
    subtotal: subtotal - vatAmount, // Subtotal before VAT
    vatAmount,
    total,
    transferRoute: transferRoute || undefined
  }
}

/**
 * Helper to map ceremony vehicle type to Olympic pricing vehicle type
 */
function mapVehicleToCeremonyOlympicType(ceremonyType: 'berlina' | 'monovolume' | 'minibus'): keyof OlympicRoute['prices'] {
  switch (ceremonyType) {
    case 'berlina':
      return 'sedan'
    case 'monovolume':
      return 'minivan'
    case 'minibus':
      return 'van'
    default:
      return 'sedan'
  }
}

/**
 * Helper to get ceremony base city coordinates
 */
function getCeremonyBaseCityCoordinates(baseCityLocationId: string): { lat: number; lng: number } | null {
  const location = getLocationById(baseCityLocationId)
  return location ? location.coordinates : null
}

/**
 * Helper to calculate distance between coordinates
 */
function calculateDistanceKm(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
  return calculateDistance(coord1, coord2)
}

// Re-export from event-pricing for consistency
export {
  OLYMPIC_LOCATIONS,
  OLYMPIC_ROUTES,
  OLYMPIC_PERIOD_2026,
  getAllLocations,
  resolveLocationForPricing,
  mapVehicleTypeToOlympic,
  type Location,
  type OlympicRoute,
  type OlympicVehicleType
} from './event-pricing'