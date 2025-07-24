import { timeUtils } from './time-utils'
import { findLocationByLocality, shouldUseListinoPricing } from './locality-mapping'

// Unified Location Registry - All available locations with precise coordinates and services
export interface Location {
  id: string
  name: string
  displayName: string
  coordinates: { lat: number; lng: number }
  type: 'city' | 'airport' | 'station'
  // NEW: Area coverage for cities (radius in km from coordinates)
  coverageRadius?: number // For cities like Milano, this defines the metropolitan area
  services: {
    gpMonza?: {
      enabled: boolean
      routes: string[] // IDs of the routes this location participates in
    }
    milanoCortina?: {
      enabled: boolean
      routes: string[] // IDs of the routes this location participates in
    }
    olympicVenue?: {
      enabled: boolean
      routes: string[] // IDs of the routes this location participates in
    }
    meetGreetArrivals?: {
      enabled: boolean
      serviceId: string
    }
    meetGreetDepartures?: {
      enabled: boolean
      serviceId: string
    }
  }
}

// Unified Location Registry
export const LOCATION_REGISTRY: Record<string, Location> = {
  // Cities
  "milano": {
    id: "milano",
    name: "Milano",
    displayName: "Milano",
    coordinates: { lat: 45.4642, lng: 9.1900 }, // Centro Milano (Duomo)
    type: "city",
    coverageRadius: 25, // 25km radius covers all Milano metropolitan area
    services: {
      gpMonza: {
        enabled: true,
        routes: ["milano-linate", "milano-linate-prime", "milano-malpensa", "milano-orio"]
      },
      milanoCortina: {
        enabled: true,
        routes: ["milano-cortina"]
      },
      olympicVenue: {
        enabled: true,
        routes: ["olympics-transfers"]
      }
    }
  },

  "cortina": {
    id: "cortina",
    name: "Cortina d'Ampezzo",
    displayName: "Cortina Center (Olympic Venue)",
    coordinates: { lat: 46.5408, lng: 12.1357 },
    type: "city",
    services: {
      milanoCortina: {
        enabled: true,
        routes: ["milano-cortina", "malpensa-cortina", "linate-cortina"]
      },
      olympicVenue: {
        enabled: true,
        routes: ["olympics-inter-cluster"]
      }
    }
  },

  "livigno": {
    id: "livigno",
    name: "Livigno",
    displayName: "Livigno (Olympic Venue)",
    coordinates: { lat: 46.5344, lng: 10.1342 },
    type: "city",
    services: {
      olympicVenue: {
        enabled: true,
        routes: ["olympics-transfers", "olympics-inter-cluster"]
      }
    }
  },

  "bormio": {
    id: "bormio",
    name: "Bormio",
    displayName: "Bormio (Olympic Venue)",
    coordinates: { lat: 46.4669, lng: 10.3700 },
    type: "city",
    services: {
      olympicVenue: {
        enabled: true,
        routes: ["olympics-transfers", "olympics-inter-cluster"]
      }
    }
  },

  "verona": {
    id: "verona",
    name: "Verona",
    displayName: "Verona",
    coordinates: { lat: 45.4384, lng: 10.9916 },
    type: "city",
    services: {
      olympicVenue: {
        enabled: true,
        routes: ["olympics-transfers", "olympics-inter-cluster"]
      }
    }
  },



  // NEW: Inter-cluster Olympic destinations  
  "anterselva": {
    id: "anterselva",
    name: "Anterselva",
    displayName: "Anterselva (Olympic Venue)",
    coordinates: { lat: 46.7833, lng: 12.0833 },
    type: "city",
    services: {
      olympicVenue: {
        enabled: true,
        routes: ["olympics-inter-cluster"]
      }
    }
  },

  "val-di-fiemme": {
    id: "val-di-fiemme",
    name: "Val di Fiemme",
    displayName: "Val di Fiemme - Predazzo/Tesero (Olympic Venue)",
    coordinates: { lat: 46.3000, lng: 11.6000 },
    type: "city",
    services: {
      olympicVenue: {
        enabled: true,
        routes: ["olympics-inter-cluster"]
      }
    }
  },

  "tirano": {
    id: "tirano",
    name: "Tirano",
    displayName: "Tirano",
    coordinates: { lat: 46.2167, lng: 10.1667 },
    type: "city",
    services: {
      olympicVenue: {
        enabled: true,
        routes: ["olympics-inter-cluster"]
      }
    }
  },

  "venezia": {
    id: "venezia",
    name: "Venezia",
    displayName: "Venezia Hotel",
    coordinates: { lat: 45.4408, lng: 12.3155 },
    type: "city",
    services: {
      olympicVenue: {
        enabled: true,
        routes: ["olympics-inter-cluster"]
      }
    }
  },
  
  "treviso": {
    id: "treviso",
    name: "Treviso",
    displayName: "Treviso",
    coordinates: { lat: 45.6684, lng: 12.2431 },
    type: "city",
    services: {
      olympicVenue: {
        enabled: true,
        routes: ["olympics-inter-cluster"]
      }
    }
  },

  // Airports
  "linate": {
    id: "linate",
    name: "Aeroporto di Milano Linate",
    displayName: "Milano Linate (LIN)",
    coordinates: { lat: 45.4451, lng: 9.2767 },
    type: "airport",
    services: {
      gpMonza: {
        enabled: true,
        routes: ["milano-linate"]
      },
      meetGreetArrivals: {
        enabled: true,
        serviceId: "linate-arrivals"
      },
      meetGreetDepartures: {
        enabled: true,
        serviceId: "linate-departures"
      }
    }
  },

  "linate-prime": {
    id: "linate-prime",
    name: "Aeroporto di Milano Linate Prime",
    displayName: "Milano Linate Prime",
    coordinates: { lat: 45.4451, lng: 9.2767 },
    type: "airport",
    services: {
      gpMonza: {
        enabled: true,
        routes: ["milano-linate-prime"]
      }
    }
  },

  "malpensa": {
    id: "malpensa",
    name: "Aeroporto di Milano Malpensa",
    displayName: "Milano Malpensa (MXP)",
    coordinates: { lat: 45.6306, lng: 8.7281 },
    type: "airport",
    services: {
      gpMonza: {
        enabled: true,
        routes: ["milano-malpensa"]
      },
      meetGreetArrivals: {
        enabled: true,
        serviceId: "malpensa-arrivals"
      },
      meetGreetDepartures: {
        enabled: true,
        serviceId: "malpensa-departures"
      }
    }
  },

  "orio-al-serio": {
    id: "orio-al-serio",
    name: "Aeroporto di Bergamo Orio al Serio",
    displayName: "Bergamo Orio al Serio (BGY)",
    coordinates: { lat: 45.6739, lng: 9.7042 },
    type: "airport",
    services: {
      gpMonza: {
        enabled: true,
        routes: ["milano-orio"]
      }
    }
  },

  "venezia-marco-polo": {
    id: "venezia-marco-polo",
    name: "Aeroporto di Venezia Marco Polo",
    displayName: "Venezia Marco Polo (VCE)",
    coordinates: { lat: 45.5053, lng: 12.3519 },
    type: "airport",
    services: {
      meetGreetArrivals: {
        enabled: true,
        serviceId: "venezia-arrivals"
      },
      meetGreetDepartures: {
        enabled: true,
        serviceId: "venezia-departures"
      }
    }
  },

  // Railway Stations - CORRECTED: Solo departures secondo il listino
  "milano-centrale": {
    id: "milano-centrale",
    name: "Milano Centrale",
    displayName: "Milano Centrale",
    coordinates: { lat: 45.4868, lng: 9.2037 },
    type: "station",
    services: {
      // REMOVED: meetGreetArrivals - non nel listino per stazioni
      meetGreetDepartures: {
        enabled: true,
        serviceId: "milano-centrale-departures"
      }
    }
  },

  "verona-porta-nuova": {
    id: "verona-porta-nuova",
    name: "Verona Porta Nuova",
    displayName: "Verona Porta Nuova",
    coordinates: { lat: 45.4280, lng: 10.9823 },
    type: "station",
    services: {
      // REMOVED: meetGreetArrivals - non nel listino per stazioni
      meetGreetDepartures: {
        enabled: true,
        serviceId: "verona-departures"
      }
    }
  },

  "venezia-santa-lucia": {
    id: "venezia-santa-lucia",
    name: "Venezia Santa Lucia",
    displayName: "Venezia Santa Lucia",
    coordinates: { lat: 45.4408, lng: 12.3208 },
    type: "station",
    services: {
      // REMOVED: meetGreetArrivals - non nel listino per stazioni
      meetGreetDepartures: {
        enabled: true,
        serviceId: "venezia-rail-departures"
      }
    }
  },

  // Olympic Ceremony Venues
  "san-siro": {
    id: "san-siro",
    name: "Stadio San Siro",
    displayName: "Stadio San Siro (Cerimonia Apertura)",
    coordinates: { lat: 45.4781, lng: 9.1240 },
    type: "city",
    services: {
      olympicVenue: {
        enabled: true,
        routes: ["ceremony-opening"]
      }
    }
  },

  "arena-verona": {
    id: "arena-verona",
    name: "Arena di Verona",
    displayName: "Arena di Verona (Cerimonia Chiusura)",
    coordinates: { lat: 45.4386, lng: 10.9939 },
    type: "city",
    services: {
      olympicVenue: {
        enabled: true,
        routes: ["ceremony-closing"]
      }
    }
  }
}

// Helper functions for working with the Location Registry
export function getAllLocations(): Location[] {
  return Object.values(LOCATION_REGISTRY)
}

export function getLocationById(id: string): Location | undefined {
  return LOCATION_REGISTRY[id]
}

export function getLocationsByType(type: Location['type']): Location[] {
  return getAllLocations().filter(location => location.type === type)
}

export function getLocationsByService(service: keyof Location['services']): Location[] {
  return getAllLocations().filter(location => location.services[service]?.enabled)
}

// Find location by coordinates (with tolerance for backward compatibility)
export function findLocationByCoordinates(
  coordinates: { lat: number; lng: number }, 
  tolerance: number = 1
): Location | undefined {
  return getAllLocations().find(location => {
    const distance = calculateDistance(coordinates, location.coordinates)
    // Use coverageRadius for cities (like Milano), otherwise use tolerance
    const allowedDistance = location.coverageRadius || tolerance
    return distance <= allowedDistance
  })
}

// Get available locations for GP Monza routes
export function getGPMonzaLocations(): Location[] {
  return getLocationsByService('gpMonza')
}

// Get available locations for Meet & Greet
export function getMeetGreetLocations(): Location[] {
  return getAllLocations().filter(location => 
    location.services.meetGreetArrivals?.enabled || 
    location.services.meetGreetDepartures?.enabled
  )
}

// NEW: Helper to resolve mixed scenarios (location + custom coordinates)
export function resolveLocationForPricing(locationId?: string, coordinates?: { lat: number; lng: number }): {
  resolvedLocationId?: string
  resolvedCoordinates?: { lat: number; lng: number }
} {
  // If we have a location ID, try locality mapping first to map specific → base locations
  if (locationId) {
    console.log(`🔍 RESOLVING LOCATION: Trying locality mapping for "${locationId}"...`)
    const localityResult = findLocationByLocality(locationId)
    if (localityResult.locationId && localityResult.confidence > 0.7) {
      const mappedLocation = getLocationById(localityResult.locationId)
      if (mappedLocation) {
        console.log(`✅ LOCALITY MAPPING SUCCESS: "${locationId}" → "${localityResult.locationId}" (${(localityResult.confidence * 100).toFixed(1)}% confidence)`)
        return {
          resolvedLocationId: localityResult.locationId,
          resolvedCoordinates: mappedLocation.coordinates
        }
      }
    }
    console.log(`❌ LOCALITY MAPPING FAILED for "${locationId}" (confidence: ${(localityResult.confidence * 100).toFixed(1)}%). Trying direct lookup...`)
    
    // Fallback: use direct lookup if locality mapping fails
    const location = getLocationById(locationId)
    if (location) {
      console.log(`✅ DIRECT LOOKUP SUCCESS: "${locationId}" found in registry`)
      return {
        resolvedLocationId: locationId,
        resolvedCoordinates: location.coordinates
      }
    }
    console.log(`❌ DIRECT LOOKUP FAILED for "${locationId}"`)
  }

  // If we have coordinates, try geographic lookup first
  if (coordinates) {
    // Try coordinate-based location matching first
    const matchingLocation = findLocationByCoordinates(coordinates, 1) // Use 1km default, coverageRadius will override for cities
    if (matchingLocation) {
      console.log(`✅ COORDINATE MAPPING SUCCESS: ${coordinates.lat},${coordinates.lng} → "${matchingLocation.id}"`)
      return {
        resolvedLocationId: matchingLocation.id,
        resolvedCoordinates: matchingLocation.coordinates
      }
    }
    
    // If coordinate lookup fails, try geography-based locality mapping
    const geographicResult = shouldUseListinoPricing(null, [], coordinates, 0.7)
    if (geographicResult.useListino && geographicResult.locationId) {
      const mappedLocation = getLocationById(geographicResult.locationId)
      if (mappedLocation) {
        console.log(`✅ GEOGRAPHIC MAPPING SUCCESS: ${coordinates.lat},${coordinates.lng} → "${geographicResult.locationId}" (${(geographicResult.confidence * 100).toFixed(1)}% confidence)`)
        return {
          resolvedLocationId: geographicResult.locationId,
          resolvedCoordinates: mappedLocation.coordinates
        }
      }
    }
    
    console.log(`❌ COORDINATE MAPPING FAILED for ${coordinates.lat},${coordinates.lng}`)
    // No matching location found, return coordinates as-is
    return {
      resolvedLocationId: undefined,
      resolvedCoordinates: coordinates
    }
  }

  // No location or coordinates
  console.log(`❌ NO LOCATION OR COORDINATES PROVIDED`)
  return {
    resolvedLocationId: undefined,
    resolvedCoordinates: undefined
  }
}

export interface EventRoute {
  from: string
  to: string
  fromCoords?: { lat: number; lng: number }
  toCoords?: { lat: number; lng: number }
  prices: {
    berlina: number
    monovolume: number
    minibus: number
  }
  isReturn?: boolean
  waitTimeIncluded?: number // minutes
  notes?: string
}

export interface EventPricing {
  id: string
  name: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  routes: EventRoute[]
  allowedVehicleTypes: string[] // Vehicle types allowed for this event
  olympicConfig?: {
    useOlympicPricing: boolean
    transferRoutes: string
    ceremonies: string[]
  }
  disposition?: {
    berlina: { daily: number; hourly: number; kmRate: number }
    monovolume: { daily: number; hourly: number; kmRate: number }
    minibus: { daily: number; hourly: number; kmRate: number }
    dailyIncludes: { hours: number; km: number }
  }
  extras: {
    nightSurcharge: number // percentage
    vatRate: number // percentage
  }
  cancellationPolicy: {
    berlina_monovolume_hours: number
    minibus_days: number
    penalty: number // percentage
  }
}

// GP Monza 2025 Configuration - Updated with correct pricing from official listino
export const GP_MONZA_2025: EventPricing = {
  id: "gp-monza-2025",
  name: "GP Monza 2025",
  startDate: "2025-09-01", // TESTING: Extended period for development
  endDate: "2025-09-09", // Will include actual GP Monza dates (3-9 September)
  allowedVehicleTypes: ["sedan", "van", "minibus"], // NO luxury-sedan for GP Monza
  routes: [
    // Milano / Linate - Standard
    {
      from: "Milano",
      to: "Aeroporto di Milano Linate",
      fromCoords: { lat: 45.4642, lng: 9.1900 },
      toCoords: { lat: 45.4451, lng: 9.2767 },
      prices: { berlina: 110, monovolume: 120, minibus: 160 }
    },
    {
      from: "Aeroporto di Milano Linate",
      to: "Milano",
      fromCoords: { lat: 45.4451, lng: 9.2767 },
      toCoords: { lat: 45.4642, lng: 9.1900 },
      prices: { berlina: 120, monovolume: 130, minibus: 180 },
      isReturn: true,
      waitTimeIncluded: 45,
      notes: "Compresi 45 minuti di attesa per eventuale ritardo del volo e/o attesa bagagli"
    },
    // Milano / Linate Prime
    {
      from: "Milano",
      to: "Aeroporto di Milano Linate Prime",
      fromCoords: { lat: 45.4642, lng: 9.1900 },
      toCoords: { lat: 45.4451, lng: 9.2767 },
      prices: { berlina: 130, monovolume: 140, minibus: 180 },
      notes: "Servizio Prime"
    },
    {
      from: "Aeroporto di Milano Linate Prime",
      to: "Milano",
      fromCoords: { lat: 45.4451, lng: 9.2767 },
      toCoords: { lat: 45.4642, lng: 9.1900 },
      prices: { berlina: 140, monovolume: 150, minibus: 200 },
      isReturn: true,
      waitTimeIncluded: 45,
      notes: "Servizio Prime - Compresi 45 minuti di attesa"
    },
    // Milano / Malpensa
    {
      from: "Milano",
      to: "Aeroporto di Milano Malpensa",
      fromCoords: { lat: 45.4642, lng: 9.1900 },
      toCoords: { lat: 45.6306, lng: 8.7281 },
      prices: { berlina: 190, monovolume: 220, minibus: 250 }
    },
    {
      from: "Aeroporto di Milano Malpensa",
      to: "Milano",
      fromCoords: { lat: 45.6306, lng: 8.7281 },
      toCoords: { lat: 45.4642, lng: 9.1900 },
      prices: { berlina: 210, monovolume: 240, minibus: 270 },
      isReturn: true,
      waitTimeIncluded: 45,
      notes: "Compresi 45 minuti di attesa per eventuale ritardo del volo e/o attesa bagagli"
    },
    // Milano / Orio al Serio
    {
      from: "Milano",
      to: "Aeroporto di Bergamo Orio al Serio",
      fromCoords: { lat: 45.4642, lng: 9.1900 },
      toCoords: { lat: 45.6739, lng: 9.7042 },
      prices: { berlina: 210, monovolume: 240, minibus: 270 }
    },
    {
      from: "Aeroporto di Bergamo Orio al Serio",
      to: "Milano",
      fromCoords: { lat: 45.6739, lng: 9.7042 },
      toCoords: { lat: 45.4642, lng: 9.1900 },
      prices: { berlina: 230, monovolume: 260, minibus: 290 },
      isReturn: true,
      waitTimeIncluded: 45,
      notes: "Compresi 45 minuti di attesa per eventuale ritardo del volo e/o attesa bagagli"
    }
  ],
  disposition: {
    berlina: { daily: 990, hourly: 94, kmRate: 1.5 },
    monovolume: { daily: 1190, hourly: 108, kmRate: 1.7 },
    minibus: { daily: 1490, hourly: 135, kmRate: 2.0 },
    dailyIncludes: { hours: 10, km: 100 }
  },
  extras: {
    nightSurcharge: 20, // +20% dalle 19:30 alle 7:30
    vatRate: 10 // +10% IVA (not 22% for GP Monza)
  },
  cancellationPolicy: {
    berlina_monovolume_hours: 72,
    minibus_days: 7,
    penalty: 100
  }
}

// Milano-Cortina 2026 Configuration - Olympic Winter Games
export const MILANO_CORTINA_2026: EventPricing = {
  id: "milano-cortina-2026",
  name: "Milano-Cortina",
  startDate: "2026-01-01", // Olympic period
  endDate: "2026-03-31", // Extended Olympic period
        allowedVehicleTypes: ["olympic-sedan", "olympic-minivan", "olympic-van", "olympic-luxury"], // Olympic vehicle types
  routes: [
    // Note: Olympic routes are handled by olympic-pricing.ts
    // This event mainly serves as configuration for disposition services
    // and ceremony events during the Olympic period
  ],
  // Olympic-specific configuration
  olympicConfig: {
    useOlympicPricing: true,
    transferRoutes: "olympic-transfer-routes", // Reference to OLYMPIC_TRANSFER_ROUTES
    ceremonies: ["opening-ceremony", "closing-ceremony"]
  },
  disposition: {
    berlina: { daily: 1200, hourly: 94, kmRate: 1.8 },
    monovolume: { daily: 1400, hourly: 108, kmRate: 2.0 },
    minibus: { daily: 1600, hourly: 135, kmRate: 2.2 },
    dailyIncludes: { hours: 10, km: 100 }
  },
  extras: {
    nightSurcharge: 20, // +20% for Olympic period (same as transfers)
    vatRate: 10 // Olympic VAT for Milano-Cortina
  },
  cancellationPolicy: {
    berlina_monovolume_hours: 72,
    minibus_days: 7,
    penalty: 100
  }
}

// Meet & Greet Configuration - Olympic Period rates (January-March 2026) - Updated with official pricing
export interface MeetGreetService {
  type: "airport-arrivals" | "airport-departures" | "railway-arrivals" | "railway-departures"
  location: string
  coordinates: { lat: number; lng: number }
  basePrice: number
  extraPassengerPrice: number
  extraLuggagePrice: number
  nightSurchargePrice: number
  extraHourPrice: number
  includedHours: number
  includedLuggage: number
  // New constraint fields
  maxPassengers: number
  maxLuggageForNightSurcharge: number
  nightSurchargeHours: { start: string; end: string }
  specialServices?: {
    tarmac?: { 
      price: number
      description: string
      maxPassengers: number // TARMAC specific limit
      onDemand: boolean
    }
    fastTrack?: { 
      price: number
      mandatoryWith?: string[] // Venice: mandatory with VIP lounge
    }
    vipLounge?: { 
      price: number
      mandatoryWith?: string[] // Venice: mandatory with Fast Track
    }
    combo?: { // Venice special combo
      name: string
      price: number
      includes: string[]
    }
    greeterOnly?: { price: number }
  }
  details: string[]
  constraints: string[] // New field for specific constraints
}

// Updated MEET_GREET_SERVICES with correct Olympic Period pricing
export const MEET_GREET_SERVICES: Record<string, MeetGreetService> = {
  // AIRPORT ARRIVALS - Olympic Period rates
  "malpensa-arrivals": {
    type: "airport-arrivals",
    location: "Aeroporto di Milano Malpensa",
    coordinates: { lat: 45.6306, lng: 8.7281 },
    basePrice: 350, // Greeter + Porter + 2 luggages incl. for 1 PASSENGER
    extraPassengerPrice: 90, // Each extra PASSENGER
    extraLuggagePrice: 20, // Each extra LUGGAGE
    nightSurchargePrice: 90, // Night surcharge porter (20:00 / 8:00) | max 10 pcs of luggages per operator
    extraHourPrice: 90, // Each extra HOUR for delay or disruption (AFTER 3 HOURS INCLUDED)
    includedHours: 3,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 10,
    nightSurchargeHours: { start: "20:00", end: "08:00" },
    specialServices: {
      tarmac: { 
        price: 350, // TARMAC service - If booked but not used, because not necessary --> 100% penalty
        description: "Service that picks passengers directly on the landing strip with van for max 6 pax (available only if aircraft is parked)",
        maxPassengers: 6,
        onDemand: true
      }
    },
    details: [
      "The greeter meets the client/s at the finger exit",
      "She/he helps with passports control [fast-track / skip the line is not possible]",
      "There will be also a porter that will assist with baggage claim through a dedicated transport service",
      "The greeter and porter will escort passenger/s to the reserved vehicle PATTY CAR"
    ],
    constraints: [
      "Groups of more than 8 people will be quoted on request",
      "TARMAC service available only if aircraft is parked (on demand)",
      "Maximum 10 pieces of luggage per operator for night surcharge"
    ]
  },
  
  "linate-arrivals": {
    type: "airport-arrivals",
    location: "Aeroporto di Milano Linate",
    coordinates: { lat: 45.4451, lng: 9.2767 },
    basePrice: 350,
    extraPassengerPrice: 90,
    extraLuggagePrice: 20,
    nightSurchargePrice: 90,
    extraHourPrice: 90,
    includedHours: 3,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 10,
    nightSurchargeHours: { start: "20:00", end: "08:00" },
    specialServices: {
      tarmac: { 
        price: 350,
        description: "Service that picks passengers directly on the landing strip with van for max 6 pax (available only if aircraft is parked)",
        maxPassengers: 6,
        onDemand: true
      }
    },
    details: [
      "The greeter meets the client/s at the finger exit",
      "She/he helps with passports control [fast-track / skip the line is not possible]",
      "There will be also a porter that will assist with baggage claim through a dedicated transport service",
      "The greeter and porter will escort passenger/s to the reserved vehicle PATTY CAR"
    ],
    constraints: [
      "Groups of more than 8 people will be quoted on request",
      "TARMAC service available only if aircraft is parked (on demand)",
      "Maximum 10 pieces of luggage per operator for night surcharge"
    ]
  },

  "venezia-arrivals": {
    type: "airport-arrivals",
    location: "Aeroporto di Venezia Marco Polo",
    coordinates: { lat: 45.5053, lng: 12.3519 },
    basePrice: 390, // For arrivals extra-schengen flights, our greeter can meet pax soon after passport control
    extraPassengerPrice: 105,
    extraLuggagePrice: 25,
    nightSurchargePrice: 90,
    extraHourPrice: 90,
    includedHours: 3,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 10,
    nightSurchargeHours: { start: "20:00", end: "08:00" },
    specialServices: {
      tarmac: { 
        price: 0, // On request - not specified in Venice pricing
        description: "Service that picks passengers directly on the landing strip with van for max 6 pax (available only if aircraft is parked)",
        maxPassengers: 6,
        onDemand: true
      }
    },
    details: [
      "For arrivals extra-schengen flights, our greeter can meet pax soon after passport control",
      "Porter assistance with baggage claim through dedicated transport service",
      "Escort to reserved PATTY CAR vehicle"
    ],
    constraints: [
      "Groups of more than 8 people will be quoted on request",
      "TARMAC service available on request",
      "Maximum 10 pieces of luggage per operator for night surcharge"
    ]
  },

  // AIRPORT DEPARTURES - Olympic Period rates
  "malpensa-departures": {
    type: "airport-departures",
    location: "Aeroporto di Milano Malpensa",
    coordinates: { lat: 45.6306, lng: 8.7281 },
    basePrice: 370,
    extraPassengerPrice: 90,
    extraLuggagePrice: 20,
    nightSurchargePrice: 90,
    extraHourPrice: 90,
    includedHours: 3,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 10,
    nightSurchargeHours: { start: "20:00", end: "08:00" },
    specialServices: {
      fastTrack: { price: 30 }, // Fast track
      vipLounge: { price: 100 } // Vip lounge
    },
    details: [
      "The greeter and porter await for the client/s directly at the entrance door, upon arrival of the booked PATTY CAR vehicle",
      "They can help with tax refund procedures, custom stamps and check-in procedures", 
      "They will assist during metal detector and passport controls [skip the line is not possible]",
      "Finally they will escort passenger/s to vip lounge (if included in the booked air ticket) and consecutively to the boarding gate"
    ],
    constraints: [
      "Groups of more than 8 people will be quoted on request",
      "Fast Track service and VIP Lounge available on demand with extra charge",
      "Maximum 10 pieces of luggage per operator for night surcharge"
    ]
  },

  "linate-departures": {
    type: "airport-departures", 
    location: "Aeroporto di Milano Linate",
    coordinates: { lat: 45.4451, lng: 9.2767 },
    basePrice: 370,
    extraPassengerPrice: 90,
    extraLuggagePrice: 20,
    nightSurchargePrice: 90,
    extraHourPrice: 90,
    includedHours: 3,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 10,
    nightSurchargeHours: { start: "20:00", end: "08:00" },
    specialServices: {
      fastTrack: { price: 30 },
      vipLounge: { price: 100 }
    },
    details: [
      "The greeter and porter await for the client/s directly at the entrance door, upon arrival of the booked PATTY CAR vehicle",
      "They can help with tax refund procedures, custom stamps and check-in procedures",
      "They will assist during metal detector and passport controls [skip the line is not possible]", 
      "Finally they will escort passenger/s to vip lounge (if included in the booked air ticket) and consecutively to the boarding gate"
    ],
    constraints: [
      "Groups of more than 8 people will be quoted on request",
      "Fast Track service and VIP Lounge available on demand with extra charge",
      "Maximum 10 pieces of luggage per operator for night surcharge"
    ]
  },

  "venezia-departures": {
    type: "airport-departures",
    location: "Aeroporto di Venezia Marco Polo", 
    coordinates: { lat: 45.5053, lng: 12.3519 },
    basePrice: 410,
    extraPassengerPrice: 105,
    extraLuggagePrice: 25,
    nightSurchargePrice: 90,
    extraHourPrice: 90,
    includedHours: 3,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 10,
    nightSurchargeHours: { start: "20:00", end: "08:00" },
    specialServices: {
      combo: { // At Venice Airport it is mandatory to buy fast track and lounge together
        name: "Fast Track + VIP Lounge",
        price: 130, // €130 (in total)
        includes: ["Fast Track", "VIP Lounge"]
      }
    },
    details: [
      "The greeter and porter await for the client/s directly at the entrance door, upon arrival of the booked PATTY CAR vehicle",
      "They can help with tax refund procedures, custom stamps and check-in procedures",
      "They will assist during metal detector and passport controls [skip the line is not possible]",
      "Finally they will escort passenger/s to vip lounge and consecutively to the boarding gate",
      "At Venice Airport it is mandatory to buy fast track and lounge together (€130 total)"
    ],
    constraints: [
      "Groups of more than 8 people will be quoted on request",
      "Fast Track and VIP Lounge must be purchased together (€130 total)",
      "Maximum 10 pieces of luggage per operator for night surcharge"
    ]
  },

  // RAILWAY ARRIVALS REMOVED - Non esistono nel listino ufficiale
  // Le stazioni ferroviarie hanno SOLO servizi departures secondo il listino Olympic Period

  // RAILWAY DEPARTURES - Olympic Period rates
  "milano-centrale-departures": {
    type: "railway-departures",
    location: "Milano Centrale",
    coordinates: { lat: 45.4868, lng: 9.2037 },
    basePrice: 250,
    extraPassengerPrice: 70,
    extraLuggagePrice: 25,
    nightSurchargePrice: 175,
    extraHourPrice: 90,
    includedHours: 2,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 5,
    nightSurchargeHours: { start: "18:30", end: "09:00" },
    details: [
      "Greeter and porter await for the client/s directly at the railway station entrance door, upon arrival of the PATTY CAR vehicle",
      "Greeter and porter will escort to railway platform in front of the right coach and load passengers and luggages"
    ],
    constraints: [
      "Groups of more than 8 people will be quoted on request",
      "Maximum 5 pieces of luggage per operator for night surcharge",
      "Night surcharge hours: 18:30 PM - 09:00 AM"
    ]
  },

  "verona-departures": {
    type: "railway-departures",
    location: "Verona Porta Nuova", 
    coordinates: { lat: 45.4280, lng: 10.9823 },
    basePrice: 250,
    extraPassengerPrice: 70,
    extraLuggagePrice: 25,
    nightSurchargePrice: 175,
    extraHourPrice: 90,
    includedHours: 2,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 5,
    nightSurchargeHours: { start: "18:30", end: "09:00" },
    details: [
      "Greeter and porter await for the client/s directly at the railway station entrance door, upon arrival of the PATTY CAR vehicle",
      "Greeter and porter will escort to railway platform in front of the right coach and load passengers and luggages"
    ],
    constraints: [
      "Groups of more than 8 people will be quoted on request",
      "Maximum 5 pieces of luggage per operator for night surcharge",
      "Night surcharge hours: 18:30 PM - 09:00 AM"
    ]
  },

  "venezia-rail-departures": {
    type: "railway-departures",
    location: "Venezia Santa Lucia",
    coordinates: { lat: 45.4408, lng: 12.3208 },
    basePrice: 250, // Greeter for 1 PASSENGER - porter ON DEMAND secondo listino
    extraPassengerPrice: 70,
    extraLuggagePrice: 25,
    nightSurchargePrice: 0, // Porter ON DEMAND nel listino
    extraHourPrice: 90,
    includedHours: 2,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 0, // Porter ON DEMAND
    nightSurchargeHours: { start: "18:30", end: "09:00" },
    specialServices: {
      greeterOnly: { price: 0 } // Greeter only service by default secondo listino
    },
    details: [
      "In Venice only greeter | porter on demand",
      "Greeter will await at the railway station entrance door upon arrival of the PATTY CAR vehicle",
      "Greeter will escort to railway platform in front of the right coach"
    ],
    constraints: [
      "Groups of more than 8 people will be quoted on request",
      "Porter service available on demand only",
      "Greeter only service by default"
    ]
  }
}

// Enhanced interface for Meet & Greet services with unique IDs
export interface MeetGreetServiceWithId extends MeetGreetService {
  serviceId: string // Unique identifier like "malpensa-arrivals"
}

// NEW: Location-based Meet & Greet detection using Location Registry
export function findMeetGreetServiceByLocation(
  pickupLocationId?: string,
  destinationLocationId?: string
): MeetGreetServiceWithId | null {
  // CORRECT LOGIC:
  // 1. PICKUP at airport/station = client is ARRIVING there = needs ARRIVALS service
  if (pickupLocationId) {
    const pickupLocation = getLocationById(pickupLocationId)
    if (pickupLocation?.services.meetGreetArrivals?.enabled) {
      const serviceId = pickupLocation.services.meetGreetArrivals.serviceId
      const service = MEET_GREET_SERVICES[serviceId]
      if (service) {
        return { ...service, serviceId }
      }
    }
  }

  // 2. DESTINATION at airport/station = client is DEPARTING from there = needs DEPARTURES service
  if (destinationLocationId) {
    const destinationLocation = getLocationById(destinationLocationId)
    if (destinationLocation?.services.meetGreetDepartures?.enabled) {
      const serviceId = destinationLocation.services.meetGreetDepartures.serviceId
      const service = MEET_GREET_SERVICES[serviceId]
      if (service) {
        return { ...service, serviceId }
      }
    }
  }

  // 3. No Meet & Greet available
  return null
}

// LEGACY: Coordinate-based detection (for backward compatibility)
export function findMeetGreetService(
  pickupCoords: { lat: number; lng: number },
  destinationCoords: { lat: number; lng: number }
): MeetGreetServiceWithId | null {
  const TOLERANCE_KM = 1 // 1km tolerance for airports/stations

  // Try to find locations by coordinates first
  const pickupLocation = findLocationByCoordinates(pickupCoords, TOLERANCE_KM)
  const destinationLocation = findLocationByCoordinates(destinationCoords, TOLERANCE_KM)

  if (pickupLocation || destinationLocation) {
    return findMeetGreetServiceByLocation(pickupLocation?.id, destinationLocation?.id)
  }

  // FALLBACK: Old logic for locations not in registry
  // 1. PICKUP at airport/station = client is ARRIVING there = needs ARRIVALS service
  for (const [serviceId, service] of Object.entries(MEET_GREET_SERVICES)) {
    if (service.type.includes('arrivals')) {
      const pickupDistance = calculateDistance(pickupCoords, service.coordinates)
      if (pickupDistance <= TOLERANCE_KM) {
        return { ...service, serviceId }
      }
    }
  }

  // 2. DESTINATION at airport/station = client is DEPARTING from there = needs DEPARTURES service  
  for (const [serviceId, service] of Object.entries(MEET_GREET_SERVICES)) {
    if (service.type.includes('departures')) {
      const destinationDistance = calculateDistance(destinationCoords, service.coordinates)
      if (destinationDistance <= TOLERANCE_KM) {
        return { ...service, serviceId }
      }
    }
  }

  // 3. No Meet & Greet available
  return null
}

// Function to find available Meet & Greet services based on pickup/destination location (LEGACY)
export function findAvailableMeetGreetServices(
  pickupCoords: { lat: number; lng: number } | undefined,
  destinationCoords: { lat: number; lng: number } | undefined
): string[] {
  const availableServices: string[] = []
  
  if (!pickupCoords && !destinationCoords) return availableServices

  if (pickupCoords && destinationCoords) {
    const service = findMeetGreetService(pickupCoords, destinationCoords)
    if (service) {
      availableServices.push(service.serviceId)
    }
  }

  return availableServices
}

// Function to check if a time is during night hours - UNIFIED SYSTEM
export function isNightTime(timeStr: string): boolean {
  try {
    // Parse time from various formats (HH:MM AM/PM or HH:MM)
    let hour: string
    let minutes: string
    let ampm: string | undefined

    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      // 12-hour format
      const [time, ampmPart] = timeStr.split(' ')
      const [hourStr, minuteStr] = time.split(':')
      hour = hourStr
      minutes = minuteStr || '00'
      ampm = ampmPart
    } else {
      // 24-hour format
      const [hourStr, minuteStr] = timeStr.split(':')
      hour = hourStr
      minutes = minuteStr || '00'
      ampm = undefined
    }

    // Use unified time utils for consistent logic (19:30-07:30)
    return timeUtils.isNightTime(hour, minutes, ampm)
  } catch (error) {
    console.error('Error parsing time:', timeStr, error)
    return false
  }
}

// Check if the date is a holiday (Sunday or January 6, 2026) - for Meet & Greet 30% surcharge
export function isHolidayDate(date: Date): boolean {
  // Check if it's Sunday (getDay() returns 0 for Sunday)
  if (date.getDay() === 0) {
    return true
  }
  
  // Check if it's January 6, 2026 (Epiphany)
  if (date.getFullYear() === 2026 && date.getMonth() === 0 && date.getDate() === 6) {
    return true
  }
  
  return false
}

// Updated calculateMeetGreetPrice function with new signature
export function calculateMeetGreetPrice(
  service: MeetGreetService,
  config: {
    passengers: number
    children: number
    infants: number
    extraLuggage: number
    extraHours: number
    specialServices: any
    isNight: boolean
    serviceDate?: Date // NEW: Add optional service date for holiday surcharge
  },
  dictionary?: any
): { total: number; breakdown: Array<{ description: string; amount: number }> } {
  const breakdown: Array<{ description: string; amount: number }> = []

  // Base price for 1 passenger (includes greeter + porter + included luggage)
  let totalPrice = service.basePrice
  breakdown.push({
    description: dictionary?.meetGreet?.baseServicePrice?.replace('{passengers}', '1').replace('{luggage}', service.includedLuggage.toString()) || `Base service (1 passenger, ${service.includedLuggage} luggage included)`,
    amount: service.basePrice
  })

  // Extra adult passengers (beyond the first one)
  const extraAdults = Math.max(0, config.passengers - 1)
  if (extraAdults > 0) {
    const extraAdultsPrice = extraAdults * service.extraPassengerPrice
    totalPrice += extraAdultsPrice
    breakdown.push({
      description: `Extra adults (${extraAdults})`,
      amount: extraAdultsPrice
    })
  }

  // Children (50% of adult rate)
  if (config.children > 0) {
    const childrenPrice = config.children * (service.extraPassengerPrice * 0.5)
    totalPrice += childrenPrice
    breakdown.push({
      description: `Children up to 12 years (${config.children}) - 50% rate`,
      amount: childrenPrice
    })
  }

  // Infants are free - just show in breakdown
  if (config.infants > 0) {
    breakdown.push({
      description: `Infants 0-2 years (${config.infants}) - FREE`,
      amount: 0
    })
  }

  // Extra luggage (beyond included)
  if (config.extraLuggage > 0) {
    const extraLuggagePrice = config.extraLuggage * service.extraLuggagePrice
    totalPrice += extraLuggagePrice
    breakdown.push({
      description: `Extra luggage (${config.extraLuggage} pieces)`,
      amount: extraLuggagePrice
    })
  }

  // Extra hours for delays
  if (config.extraHours > 0) {
    const extraHoursPrice = config.extraHours * service.extraHourPrice
    totalPrice += extraHoursPrice
    breakdown.push({
      description: `Extra hours for delays (${config.extraHours}) - after ${service.includedHours}h included`,
      amount: extraHoursPrice
    })
  }

  // Special services
  if (config.specialServices) {
    // Calculate number of passengers counting for special services (adults + children, excluding infants)
    const passengersForSpecialServices = config.passengers + config.children
    
    // TARMAC service
    if (config.specialServices.tarmac && service.specialServices?.tarmac) {
      totalPrice += service.specialServices.tarmac.price
      breakdown.push({
        description: 'TARMAC Service',
        amount: service.specialServices.tarmac.price
      })
    }

    // Standard Fast Track - multiply by number of passengers (excluding infants)
    if (config.specialServices.fastTrack && service.specialServices?.fastTrack) {
      const fastTrackTotal = service.specialServices.fastTrack.price * passengersForSpecialServices
      totalPrice += fastTrackTotal
      breakdown.push({
        description: `Fast Track (×${passengersForSpecialServices} passengers)`,
        amount: fastTrackTotal
      })
    }

    // Standard VIP Lounge - multiply by number of passengers (excluding infants)
    if (config.specialServices.vipLounge && service.specialServices?.vipLounge) {
      const vipLoungeTotal = service.specialServices.vipLounge.price * passengersForSpecialServices
      totalPrice += vipLoungeTotal
      breakdown.push({
        description: `VIP Lounge (×${passengersForSpecialServices} passengers)`,
        amount: vipLoungeTotal
      })
    }

    // Venice Combo (Fast Track + VIP Lounge) - multiply by number of passengers (excluding infants)
    if (config.specialServices.veniceCombo && service.specialServices?.combo) {
      const veniceComboTotal = service.specialServices.combo.price * passengersForSpecialServices
      totalPrice += veniceComboTotal
      breakdown.push({
        description: `${service.specialServices.combo.name} (×${passengersForSpecialServices} passengers)`,
        amount: veniceComboTotal
      })
    }

    // Greeter Only
    if (config.specialServices.greeterOnly && service.specialServices?.greeterOnly) {
      // Greeter only might replace base price or be additional
      breakdown.push({
        description: 'Greeter Only Service',
        amount: 0 // Already included in base price for Venice railway
      })
    }
  }

  // Night surcharge if applicable - 30% of total services (applied AFTER all other services)
  if (config.isNight) {
    const nightSurchargePercentage = 0.30 // 30%
    const nightSurchargeAmount = totalPrice * nightSurchargePercentage
    totalPrice += nightSurchargeAmount
    breakdown.push({
      description: dictionary?.meetGreet?.nightSurchargeWithPercentage?.replace('{percentage}', '30').replace('{start}', service.nightSurchargeHours.start).replace('{end}', service.nightSurchargeHours.end) || `Night surcharge 30% (${service.nightSurchargeHours.start} - ${service.nightSurchargeHours.end})`,
      amount: nightSurchargeAmount
    })
  }

  // Holiday surcharge if applicable - 30% of total services (applied AFTER all other services including night surcharge)
  const isHoliday = config.serviceDate ? isHolidayDate(config.serviceDate) : false
  if (isHoliday) {
    const holidaySurchargePercentage = 0.30 // 30%
    const holidaySurchargeAmount = totalPrice * holidaySurchargePercentage
    totalPrice += holidaySurchargeAmount
    
    let holidayDescription = dictionary?.meetGreet?.holidaySurcharge?.replace('{percentage}', '30') || 'Holiday surcharge 30%'
          if (config.serviceDate) {
        if (config.serviceDate.getDay() === 0) {
          holidayDescription += ' (' + (dictionary?.meetGreet?.sundayService || 'Sunday service') + ')'
        } else if (config.serviceDate.getFullYear() === 2026 && config.serviceDate.getMonth() === 0 && config.serviceDate.getDate() === 6) {
          holidayDescription += ' (' + (dictionary?.meetGreet?.epiphanyService || 'January 6, 2026 - Epiphany') + ')'
        }
      }
    
    breakdown.push({
      description: holidayDescription,
      amount: holidaySurchargeAmount
    })
  }

  // VAT 22%
  const vatAmount = totalPrice * 0.22
  breakdown.push({
    description: dictionary?.meetGreet?.vatLabel?.replace('{rate}', '22') || 'VAT (22%)',
    amount: vatAmount
  })

  const finalPrice = totalPrice + vatAmount

  return {
    total: Math.round(finalPrice * 100) / 100,
    breakdown
  }
}

// Legacy function to maintain compatibility (update this to use the new function)
export function calculateMeetGreetPriceLegacy(
  serviceId: string,
  passengers: number,
  children: number,
  infants: number,
  extraLuggage: number,
  isNight: boolean,
  specialServices: any = {},
  serviceDate?: Date // NEW: Add optional service date for holiday surcharge
): { price: number; breakdown: any } {
  const service = MEET_GREET_SERVICES[serviceId]
  
  if (!service) {
    return { price: 0, breakdown: {} }
  }

  const result = calculateMeetGreetPrice(service, {
    passengers,
    children,
    infants,
    extraLuggage,
    extraHours: 0,
    specialServices,
    isNight,
    serviceDate
  }, undefined)

  // Convert to legacy format
  const legacyBreakdown = {
    basePrice: service.basePrice,
    extraAdults: 0,
    children: 0,
    extraLuggage: 0,
    nightSurcharge: 0,
    specialServices: 0,
    subtotal: 0,
    vat: 0,
    total: result.total
  }

  // Extract values from new breakdown
  result.breakdown.forEach(item => {
    if (item.description.includes('Extra adults')) legacyBreakdown.extraAdults = item.amount
    if (item.description.includes('Children')) legacyBreakdown.children = item.amount
    if (item.description.includes('Extra luggage')) legacyBreakdown.extraLuggage = item.amount
    if (item.description.includes('Night surcharge')) legacyBreakdown.nightSurcharge = item.amount
    if (item.description.includes('VAT')) legacyBreakdown.vat = item.amount
  })

  // Calculate subtotal
  legacyBreakdown.subtotal = result.total - legacyBreakdown.vat

  return { price: result.total, breakdown: legacyBreakdown }
}

// Utility functions
export function isEventPeriod(date: Date, event: EventPricing): boolean {
  const dateStr = date.toISOString().split('T')[0]
  return dateStr >= event.startDate && dateStr <= event.endDate
}

export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371 // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180
  const dLng = (point2.lng - point1.lng) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// NEW: Location-based event route matching using Location Registry
export function findEventRouteByLocation(
  pickupLocationId?: string,
  destinationLocationId?: string,
  event: EventPricing = GP_MONZA_2025
): EventRoute | null {
  console.log("🔍 findEventRouteByLocation called with:", pickupLocationId, "→", destinationLocationId)
  
  if (!pickupLocationId || !destinationLocationId) {
    console.log("❌ Missing location IDs")
    return null
  }

  const pickupLocation = getLocationById(pickupLocationId)
  const destinationLocation = getLocationById(destinationLocationId)
  
  console.log("📍 Pickup location:", pickupLocation)
  console.log("📍 Destination location:", destinationLocation)

  if (!pickupLocation || !destinationLocation) {
    console.log("❌ One or both locations not found in registry")
    return null
  }

  // Check if both locations have GP Monza service
  if (!pickupLocation.services.gpMonza?.enabled || !destinationLocation.services.gpMonza?.enabled) {
    console.log("❌ One or both locations don't have GP Monza service")
    return null
  }

  console.log("✅ Both locations have GP Monza service")

  // Simple mapping for known combinations
  const routeKey = `${pickupLocationId}-${destinationLocationId}`
  console.log("🔑 Looking for route key:", routeKey)

  // Direct route mapping for GP Monza
  const routeMappings: Record<string, string> = {
    // Milano → Airports
    "milano-linate": "Milano → Linate",
    "milano-linate-prime": "Milano → Linate Prime",
    "milano-malpensa": "Milano → Malpensa", 
    "milano-orio-al-serio": "Milano → Orio",
    // Airports → Milano
    "linate-milano": "Linate → Milano",
    "linate-prime-milano": "Linate Prime → Milano",
    "malpensa-milano": "Malpensa → Milano",
    "orio-al-serio-milano": "Orio → Milano"
  }

  const routeDescription = routeMappings[routeKey]
  console.log("📋 Route description:", routeDescription)

  if (!routeDescription) {
    console.log("❌ No route mapping found for this combination")
    return null
  }

  // Find the actual route in GP_MONZA_2025
  for (const route of event.routes) {
    console.log(`🔍 Checking route: "${route.from}" → "${route.to}"`)
    console.log(`📍 Against: "${pickupLocation.name}" → "${destinationLocation.name}"`)
    
    // Match EXACTLY by location names (no coordinate fallback to avoid conflicts)
    const fromMatch = route.from === pickupLocation.name
    const toMatch = route.to === destinationLocation.name

    console.log(`✅ From match: ${fromMatch}, To match: ${toMatch}`)

    if (fromMatch && toMatch) {
      console.log("🎉 Found matching route:", route)
      return route
    }
  }

  console.log("❌ No matching route found in GP_MONZA_2025.routes")
  return null
}

// LEGACY: Coordinate-based event route matching (for backward compatibility)
export async function findMatchingEventRoute(
  pickupCoords: { lat: number; lng: number } | undefined,
  destinationCoords: { lat: number; lng: number } | undefined,
  event: EventPricing
): Promise<EventRoute | null> {
  try {
    // If we don't have coordinates, we can't match
    if (!pickupCoords || !destinationCoords) {
      return null
    }

    // Try location-based matching first
    const pickupLocation = findLocationByCoordinates(pickupCoords, 1)
    const destinationLocation = findLocationByCoordinates(destinationCoords, 1)

    if (pickupLocation && destinationLocation) {
      const route = findEventRouteByLocation(pickupLocation.id, destinationLocation.id, event)
      if (route) {
        return route
      }
    }

    // FALLBACK: Old coordinate-based matching with tolerance
    const TOLERANCE_KM = 15 // 15km tolerance for matching

    for (const route of event.routes) {
      if (!route.fromCoords || !route.toCoords) continue

      const pickupDistance = calculateDistance(pickupCoords, route.fromCoords)
      const destDistance = calculateDistance(destinationCoords, route.toCoords)

      if (pickupDistance <= TOLERANCE_KM && destDistance <= TOLERANCE_KM) {
        return route
      }
    }

    return null
  } catch (error) {
    console.error('Error finding matching event route:', error)
    return null
  }
}

// NEW: Calculate round-trip disposition pricing with transfers from/to Milan base
export function calculateRoundTripDispositionPrice(config: {
  // Service details
  vehicleType: 'berlina' | 'monovolume' | 'minibus'
  serviceStartTime: string // HH:MM
  serviceStartMinutes: string
  serviceStartAmPm: string
  serviceEndTime: string // HH:MM  
  serviceEndMinutes: string
  serviceEndAmPm: string
  
  // Distances (in km)
  milanToServiceStart: number // Milano → Punto inizio servizio
  serviceDistance: number // Distanza del servizio effettivo
  serviceEndToMilan: number // Punto fine servizio → Milano
  
  // Additional times (in hours) - for transfers to/from Milan
  transferTimeToService: number // Tempo Milano → inizio servizio
  transferTimeFromService: number // Tempo fine servizio → Milano
  
  // Event pricing (defaults to GP Monza)
  event?: EventPricing
}): { 
  total: number
  breakdown: {
    dailyRate: number
    totalKm: number
    extraKm: number
    extraKmCost: number
    totalHours: number
    extraHours: number
    extraHoursCost: number
    nightSurcharge: number
    subtotal: number
    vatAmount: number
    vatRate: number
    details: {
      milanToService: { km: number, hours: number }
      serviceItself: { km: number, hours: number }
      serviceToMilan: { km: number, hours: number }
    }
  }
} {
  const event = config.event || GP_MONZA_2025
  const vehicleDisposition = event.disposition![config.vehicleType]
  
  // Calculate service duration
  const startTime = timeUtils.to24h(config.serviceStartTime, config.serviceStartMinutes, config.serviceStartAmPm)
  const endTime = timeUtils.to24h(config.serviceEndTime, config.serviceEndMinutes, config.serviceEndAmPm)
  const serviceDurationMinutes = Math.max(0, endTime.totalMinutes - startTime.totalMinutes)
  const serviceDurationHours = Math.ceil(serviceDurationMinutes / 60)
  
  // Total distances and times
  const totalKm = config.milanToServiceStart + config.serviceDistance + config.serviceEndToMilan
  const totalHours = config.transferTimeToService + serviceDurationHours + config.transferTimeFromService
  
  // Base daily rate (includes 10 hours and 100 km)
  const dailyRate = vehicleDisposition.daily
  const includedHours = event.disposition!.dailyIncludes.hours // 10 hours
  const includedKm = event.disposition!.dailyIncludes.km // 100 km
  
  // Calculate extra costs
  const extraKm = Math.max(0, totalKm - includedKm)
  const extraKmCost = extraKm * vehicleDisposition.kmRate
  
  const extraHours = Math.max(0, totalHours - includedHours)
  const extraHoursCost = extraHours * vehicleDisposition.hourly
  
  // Subtotal before night surcharge
  let subtotal = dailyRate + extraKmCost + extraHoursCost
  
  // Night surcharge if service starts or ends during night hours (19:30-07:30)
  let nightSurcharge = 0
  const isServiceStartNight = isTimeInNightRange(config.serviceStartTime, config.serviceStartMinutes, config.serviceStartAmPm)
  const isServiceEndNight = isTimeInNightRange(config.serviceEndTime, config.serviceEndMinutes, config.serviceEndAmPm)
  const isServiceNight = isServiceStartNight || isServiceEndNight
  
  if (isServiceNight) {
    nightSurcharge = subtotal * (event.extras.nightSurcharge / 100)
    subtotal += nightSurcharge
  }
  
  // Apply VAT
  const vatAmount = subtotal * (event.extras.vatRate / 100)
  const total = subtotal + vatAmount
  
  return {
    total: Math.round(total * 100) / 100,
    breakdown: {
      dailyRate,
      totalKm,
      extraKm,
      extraKmCost: Math.round(extraKmCost * 100) / 100,
      totalHours,
      extraHours,
      extraHoursCost: Math.round(extraHoursCost * 100) / 100,
      nightSurcharge: Math.round(nightSurcharge * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      vatRate: event.extras.vatRate,
      details: {
        milanToService: { 
          km: config.milanToServiceStart, 
          hours: config.transferTimeToService 
        },
        serviceItself: { 
          km: config.serviceDistance, 
          hours: serviceDurationHours 
        },
        serviceToMilan: { 
          km: config.serviceEndToMilan, 
          hours: config.transferTimeFromService 
        }
      }
    }
  }
}

// Helper function to check if time is in night range (19:30-07:30) - LEGACY PRICING LOGIC
function isTimeInNightRange(hour: string, minutes: string, ampm: string): boolean {
  const time = timeUtils.to24h(hour, minutes, ampm)
  const totalMinutes = time.totalMinutes
  
  // Night time: 19:30 (1170 minutes) to 07:30 (450 minutes)
  return totalMinutes >= 1170 || totalMinutes <= 450
}

// Get all available events
export const ALL_EVENTS = [GP_MONZA_2025, MILANO_CORTINA_2026]

// Get active event for a specific date
export function getActiveEvent(date: Date): EventPricing | null {
  for (const event of ALL_EVENTS) {
    if (isEventPeriod(date, event)) {
      return event
    }
  }
  return null
}

// Get allowed vehicle types for a specific date
export function getAllowedVehicleTypes(date?: Date): string[] {
  if (!date) {
    // If no date, return all vehicle types
    return ["sedan", "van", "minibus", "luxury-sedan"]
  }
  
  const activeEvent = getActiveEvent(date)
  return activeEvent ? activeEvent.allowedVehicleTypes : ["sedan", "van", "minibus", "luxury-sedan"]
}

// Get available locations based on date (shows only locations for active events)
export function getAvailableLocations(date?: Date): Location[] {
  const allLocations = getAllLocations()
  
  if (!date) {
    // No date selected: show only standard locations (no event-specific locations)
    return allLocations.filter(location => 
      !location.services.gpMonza?.enabled && 
      !location.services.olympicVenue?.enabled &&
      !location.services.milanoCortina?.enabled
    )
  }
  
  // Check which event is active for this date
  const activeEvent = getActiveEvent(date)
  
  if (!activeEvent) {
    // No active event: show only standard locations (no event-specific locations)
    return allLocations.filter(location => 
      !location.services.gpMonza?.enabled && 
      !location.services.olympicVenue?.enabled &&
      !location.services.milanoCortina?.enabled
    )
  }
  
  // Filter locations based on active event
  if (activeEvent.id === 'gp-monza-2025') {
    // GP Monza: show ONLY the 5 specific locations from GP Monza pricing list
    const gpMonzaLocationIds = ['milano', 'linate', 'linate-prime', 'malpensa', 'orio-al-serio']
    return allLocations.filter(location => 
      gpMonzaLocationIds.includes(location.id)
    )
  }
  
  if (activeEvent.id === 'milano-cortina-2026') {
    // Olympics: show only Olympic locations + standard airports/stations for transfers
    return allLocations.filter(location => 
      location.services.olympicVenue?.enabled ||
      location.services.milanoCortina?.enabled ||
      location.services.meetGreetArrivals?.enabled ||
      location.services.meetGreetDepartures?.enabled ||
      (location.type === 'airport' || location.type === 'station') // Include all airports/stations for Olympic transfers
    )
  }
  
  // Fallback: standard locations only
  return allLocations.filter(location => 
    !location.services.gpMonza?.enabled && 
    !location.services.olympicVenue?.enabled &&
    !location.services.milanoCortina?.enabled
  )
} 