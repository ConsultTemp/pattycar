// Location Matching System - Corrected Version
// NO MORE MOCKUP LOCATIONS - Uses only Google Places API results with precise matching

import { CORRECTED_OLYMPIC_ROUTES, findOlympicRouteCorrected } from './olympic-pricing-corrected'

// Coordinate precise per location con servizi speciali (Meet & Greet, Olympic, ecc.)
interface ServiceLocation {
  id: string
  name: string
  coordinates: { lat: number; lng: number }
  radius: number // raggio in km per il matching
  services: {
    meetGreetArrivals?: boolean
    meetGreetDepartures?: boolean
    olympicTransfers?: boolean
    specialPricing?: boolean
  }
  aliases: string[] // nomi alternativi per il matching
}

// Database completo delle location con servizi speciali
export const SERVICE_LOCATIONS: ServiceLocation[] = [
  // =========================================================================
  // AEROPORTI CON MEET & GREET
  // =========================================================================
  {
    id: 'malpensa',
    name: 'Milano Malpensa Airport',
    coordinates: { lat: 45.6306, lng: 8.7281 },
    radius: 2.0, // 2km radius
    services: {
      meetGreetArrivals: true,
      meetGreetDepartures: true,
      olympicTransfers: true,
      specialPricing: true
    },
    aliases: [
      'Milano Malpensa',
      'Malpensa Airport',
      'MXP',
      'Aeroporto di Milano Malpensa',
      'Milan Malpensa Airport',
      'Ferno', // comune vicino
      'Somma Lombardo' // comune vicino
    ]
  },
  {
    id: 'linate', 
    name: 'Milano Linate Airport',
    coordinates: { lat: 45.4451, lng: 9.2767 },
    radius: 2.0,
    services: {
      meetGreetArrivals: true,
      meetGreetDepartures: true,
      olympicTransfers: true,
      specialPricing: true
    },
    aliases: [
      'Milano Linate',
      'Linate Airport',
      'LIN',
      'Aeroporto di Milano Linate',
      'Milan Linate Airport',
      'Segrate', // comune vicino
      'Peschiera Borromeo' // comune vicino
    ]
  },
  {
    id: 'orio-al-serio',
    name: 'Bergamo Orio al Serio Airport',
    coordinates: { lat: 45.6739, lng: 9.7043 },
    radius: 2.0,
    services: {
      meetGreetArrivals: true,
      meetGreetDepartures: true,
      olympicTransfers: true,
      specialPricing: true
    },
    aliases: [
      'Bergamo Airport',
      'Orio al Serio',
      'BGY',
      'Aeroporto di Bergamo',
      'Bergamo Orio al Serio',
      'Orio Airport'
    ]
  },
  {
    id: 'venezia-marco-polo',
    name: 'Venezia Marco Polo Airport',
    coordinates: { lat: 45.5053, lng: 12.3519 },
    radius: 2.0,
    services: {
      meetGreetArrivals: true,
      meetGreetDepartures: true,
      olympicTransfers: true,
      specialPricing: true
    },
    aliases: [
      'Venice Airport',
      'Marco Polo Airport',
      'VCE',
      'Aeroporto di Venezia Marco Polo',
      'Venice Marco Polo Airport',
      'Marco Polo'
    ]
  },
  {
    id: 'treviso',
    name: 'Treviso Airport',
    coordinates: { lat: 45.6548, lng: 12.1944 },
    radius: 2.0,
    services: {
      meetGreetArrivals: true,
      meetGreetDepartures: true,
      olympicTransfers: true,
      specialPricing: true
    },
    aliases: [
      'Treviso Airport',
      'Antonio Canova Airport',
      'TSF',
      'Aeroporto di Treviso',
      'Canova Airport'
    ]
  },

  // =========================================================================
  // STAZIONI FERROVIARIE CON MEET & GREET
  // =========================================================================
  {
    id: 'milano-centrale',
    name: 'Milano Centrale Station',
    coordinates: { lat: 45.4868, lng: 9.2037 },
    radius: 0.5, // raggio più piccolo per stazioni
    services: {
      meetGreetArrivals: true,
      meetGreetDepartures: true,
      olympicTransfers: true,
      specialPricing: true
    },
    aliases: [
      'Milano Centrale',
      'Stazione Centrale Milano',
      'Milano Central Station',
      'Centrale Milano',
      'Milano Centrale FS',
      'Stazione Milano Centrale',
      'Central Station Milan'
    ]
  },
  {
    id: 'venezia-santa-lucia',
    name: 'Venezia Santa Lucia Station',
    coordinates: { lat: 45.4408, lng: 12.3208 },
    radius: 0.5,
    services: {
      meetGreetArrivals: true,
      meetGreetDepartures: true,
      olympicTransfers: true,
      specialPricing: true
    },
    aliases: [
      'Venezia Santa Lucia',
      'Santa Lucia Station',
      'Venice Santa Lucia',
      'Santa Lucia',
      'Venezia SL',
      'Venice Station'
    ]
  },
  {
    id: 'verona-porta-nuova',
    name: 'Verona Porta Nuova Station',
    coordinates: { lat: 45.4280, lng: 10.9823 },
    radius: 0.5,
    services: {
      meetGreetArrivals: true,
      meetGreetDepartures: true,
      olympicTransfers: true,
      specialPricing: true
    },
    aliases: [
      'Verona Porta Nuova',
      'Stazione di Verona',
      'Verona Station',
      'Porta Nuova Verona',
      'Verona PN',
      'Stazione Verona',
      'Verona Stazione'
    ]
  },

  // =========================================================================
  // CITTÀ OLIMPICHE E CENTRI PRINCIPALI
  // =========================================================================
  {
    id: 'milano-center',
    name: 'Milano Center',
    coordinates: { lat: 45.4642, lng: 9.1900 }, // Duomo
    radius: 10.0, // grande raggio per centro città
    services: {
      olympicTransfers: true,
      specialPricing: true
    },
    aliases: [
      'Milano',
      'Milan',
      'Milano City',
      'Milano Centro',
      'Centro Milano',
      'Milan City',
      'Milan Center'
    ]
  },
  {
    id: 'cortina',
    name: "Cortina d'Ampezzo",
    coordinates: { lat: 46.5408, lng: 12.1357 },
    radius: 5.0,
    services: {
      olympicTransfers: true,
      specialPricing: true
    },
    aliases: [
      'Cortina',
      "Cortina d'Ampezzo",
      'Cortina d Ampezzo',
      'Cortina Center',
      'Cortina Centre'
    ]
  },
  {
    id: 'livigno',
    name: 'Livigno',
    coordinates: { lat: 46.5344, lng: 10.1342 },
    radius: 3.0,
    services: {
      olympicTransfers: true,
      specialPricing: true
    },
    aliases: [
      'Livigno',
      'Livigno Center',
      'Livigno Centre'
    ]
  },
  {
    id: 'bormio',
    name: 'Bormio',
    coordinates: { lat: 46.4669, lng: 10.3700 },
    radius: 3.0,
    services: {
      olympicTransfers: true,
      specialPricing: true
    },
    aliases: [
      'Bormio',
      'Bormio Center',
      'Bormio Centre'
    ]
  },
  {
    id: 'verona',
    name: 'Verona',
    coordinates: { lat: 45.4384, lng: 10.9916 },
    radius: 8.0,
    services: {
      olympicTransfers: true,
      specialPricing: true
    },
    aliases: [
      'Verona',
      'Verona Center',
      'Verona Centre',
      'Centro Verona'
    ]
  },
  {
    id: 'venezia',
    name: 'Venezia',
    coordinates: { lat: 45.4408, lng: 12.3378 },
    radius: 8.0,
    services: {
      olympicTransfers: true,
      specialPricing: true
    },
    aliases: [
      'Venezia',
      'Venice',
      'Venedig',
      'Venezia Centro',
      'Venice Center'
    ]
  },
  {
    id: 'anterselva',
    name: 'Anterselva',
    coordinates: { lat: 46.7833, lng: 12.0833 },
    radius: 3.0,
    services: {
      olympicTransfers: true,
      specialPricing: true
    },
    aliases: [
      'Anterselva',
      'Antholz',
      'Anterselva di Mezzo',
      'Anterselva di Sopra',
      'Anterselva di Sotto',
      'Rasun Anterselva',
      'Rasun Antholz',
      'Rasun'
    ]
  },
  {
    id: 'val-di-fiemme',
    name: 'Val di Fiemme',
    coordinates: { lat: 46.2892, lng: 11.4481 }, // Predazzo coordinates
    radius: 5.0,
    services: {
      olympicTransfers: true,
      specialPricing: true
    },
    aliases: [
      'Predazzo',
      'Tesero',
      'Val di Fiemme',
      'Fiemme',
      'Cavalese',
      'Ziano di Fiemme',
      'Panchià',
      'Daiano',
      'Varena'
    ]
  },
  {
    id: 'tirano',
    name: 'Tirano',
    coordinates: { lat: 46.2156, lng: 10.1661 },
    radius: 3.0,
    services: {
      olympicTransfers: true,
      specialPricing: true
    },
    aliases: [
      'Tirano'
    ]
  }
]

// Calcola la distanza tra due coordinate in km
function calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Normalizza il testo per il matching
function normalizeText(text: string): string {
  return text.toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Interfaccia per il risultato del matching
export interface LocationMatchResult {
  locationId?: string
  coordinates?: { lat: number; lng: number }
  hasSpecialServices: boolean
  services: {
    meetGreetArrivals?: boolean
    meetGreetDepartures?: boolean
    olympicTransfers?: boolean
    specialPricing?: boolean
  }
  matchType: 'exact' | 'coordinate' | 'name' | 'none'
  confidence: number
  distance?: number
}

// Funzione principale per il matching delle location
export function matchGooglePlaceToService(
  googlePlace: {
    place_id: string
    description: string
    main_text: string
    secondary_text?: string
    coordinates?: { lat: number; lng: number }
  }
): LocationMatchResult {
  
  console.log('🔍 MATCHING GOOGLE PLACE:', {
    description: googlePlace.description,
    main_text: googlePlace.main_text,
    coordinates: googlePlace.coordinates
  })

  const normalizedDescription = normalizeText(googlePlace.description)
  const normalizedMainText = normalizeText(googlePlace.main_text)
  
  let bestMatch: LocationMatchResult = {
    hasSpecialServices: false,
    services: {},
    matchType: 'none',
    confidence: 0
  }

  // FASE 1: Matching per nome/alias (priorità massima)
  for (const location of SERVICE_LOCATIONS) {
    const normalizedLocationName = normalizeText(location.name)
    
    // Controlla match esatto nel nome principale
    if (normalizedDescription.includes(normalizedLocationName) || 
        normalizedMainText.includes(normalizedLocationName)) {
      bestMatch = {
        locationId: location.id,
        coordinates: location.coordinates,
        hasSpecialServices: true,
        services: location.services,
        matchType: 'exact',
        confidence: 1.0
      }
      console.log('✅ EXACT NAME MATCH:', location.name, '→', location.id)
      break
    }
    
    // Controlla match negli alias
    for (const alias of location.aliases) {
      const normalizedAlias = normalizeText(alias)
      if (normalizedDescription.includes(normalizedAlias) || 
          normalizedMainText.includes(normalizedAlias)) {
        bestMatch = {
          locationId: location.id,
          coordinates: location.coordinates,
          hasSpecialServices: true,
          services: location.services,
          matchType: 'name',
          confidence: 0.9
        }
        console.log('✅ ALIAS MATCH:', alias, '→', location.id)
        break
      }
    }
    
    if (bestMatch.confidence >= 0.9) break
  }

  // FASE 2: Matching per coordinate (se disponibili e nessun match per nome)
  if (bestMatch.confidence < 0.9 && googlePlace.coordinates) {
    for (const location of SERVICE_LOCATIONS) {
      const distance = calculateDistance(googlePlace.coordinates, location.coordinates)
      
      if (distance <= location.radius) {
        const coordinateConfidence = Math.max(0.1, 1 - (distance / location.radius))
        
        if (coordinateConfidence > bestMatch.confidence) {
          bestMatch = {
            locationId: location.id,
            coordinates: location.coordinates,
            hasSpecialServices: true,
            services: location.services,
            matchType: 'coordinate',
            confidence: coordinateConfidence,
            distance
          }
          console.log('📍 COORDINATE MATCH:', location.name, '→', location.id, `(${distance.toFixed(1)}km)`)
        }
      }
    }
  }

  // Se non abbiamo trovato match speciali, restituisci le coordinate Google (custom location)
  if (bestMatch.confidence < 0.1) {
    bestMatch = {
      coordinates: googlePlace.coordinates,
      hasSpecialServices: false,
      services: {},
      matchType: 'none',
      confidence: 0
    }
    console.log('❌ NO SPECIAL SERVICE MATCH - Using Google coordinates as custom location')
  }

  console.log('🎯 FINAL MATCH RESULT:', bestMatch)
  return bestMatch
}

// Funzione per verificare se una location supporta Meet & Greet
export function hasMeetGreetService(locationId?: string, coordinates?: { lat: number; lng: number }): {
  hasService: boolean
  serviceType?: 'arrivals' | 'departures' | 'both'
  serviceId?: string
} {
  if (!locationId) {
    return { hasService: false }
  }

  const location = SERVICE_LOCATIONS.find(loc => loc.id === locationId)
  if (!location) {
    return { hasService: false }
  }

  const hasArrivals = location.services.meetGreetArrivals
  const hasDepartures = location.services.meetGreetDepartures

  if (hasArrivals && hasDepartures) {
    return {
      hasService: true,
      serviceType: 'both',
      serviceId: `${locationId}-both`
    }
  } else if (hasArrivals) {
    return {
      hasService: true,
      serviceType: 'arrivals',
      serviceId: `${locationId}-arrivals`
    }
  } else if (hasDepartures) {
    return {
      hasService: true,
      serviceType: 'departures',
      serviceId: `${locationId}-departures`
    }
  }

  return { hasService: false }
}

// Funzione per verificare se una tratta ha pricing olimpico
export function hasOlympicPricing(
  pickupLocationId?: string, 
  destinationLocationId?: string
): boolean {
  if (!pickupLocationId || !destinationLocationId) {
    return false
  }

  const route = findOlympicRouteCorrected(pickupLocationId, destinationLocationId)
  return !!route
}

// Funzione per ottenere tutte le location con servizi speciali
export function getAllServiceLocations(): ServiceLocation[] {
  return SERVICE_LOCATIONS
}

// Funzione per ottenere location per tipo di servizio
export function getLocationsByService(serviceType: keyof ServiceLocation['services']): ServiceLocation[] {
  return SERVICE_LOCATIONS.filter(location => location.services[serviceType])
}

// Test della funzione di matching
export function testLocationMatching() {
  const testCases = [
    {
      place_id: 'test1',
      description: 'Milano Malpensa Airport, Ferno, Metropolitan City of Milan, Italy',
      main_text: 'Milano Malpensa Airport',
      coordinates: { lat: 45.6306, lng: 8.7281 }
    },
    {
      place_id: 'test2', 
      description: 'Milano Centrale, Milan, Metropolitan City of Milan, Italy',
      main_text: 'Milano Centrale',
      coordinates: { lat: 45.4868, lng: 9.2037 }
    },
    {
      place_id: 'test3',
      description: 'Via Roma, Milano, Metropolitan City of Milan, Italy',
      main_text: 'Via Roma',
      coordinates: { lat: 45.4642, lng: 9.1900 }
    },
    {
      place_id: 'test4',
      description: 'Venezia Marco Polo Airport, Venice, Metropolitan City of Venice, Italy',
      main_text: 'Venezia Marco Polo Airport',
      coordinates: { lat: 45.5053, lng: 12.3519 }
    }
  ]

  console.log('🧪 TESTING LOCATION MATCHING:')
  testCases.forEach((testCase, index) => {
    console.log(`\n--- Test ${index + 1}: ${testCase.description} ---`)
    const result = matchGooglePlaceToService(testCase)
    console.log('Result:', result)
    
    if (result.locationId) {
      const meetGreet = hasMeetGreetService(result.locationId)
      console.log('Meet & Greet:', meetGreet)
      
      // Test olympic pricing with another location
      const olympicTest = hasOlympicPricing(result.locationId, 'cortina')
      console.log('Olympic pricing to Cortina:', olympicTest)
    }
  })
}