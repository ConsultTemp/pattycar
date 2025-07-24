// Meet & Greet Services - Corrected with updated Olympic period pricing
// All prices from Olympic Period rates (January - March 2026)

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
  maxPassengers: number
  maxLuggageForNightSurcharge: number
  nightSurchargeHours: { start: string; end: string }
  specialServices?: {
    tarmac?: { 
      price: number
      description: string
      maxPassengers: number
      onDemand: boolean
    }
    fastTrack?: { 
      price: number
      mandatoryWith?: string[]
    }
    vipLounge?: { 
      price: number
      mandatoryWith?: string[]
    }
    combo?: {
      name: string
      price: number
      includes: string[]
    }
    greeterOnly?: { price: number }
  }
  details: string[]
  constraints: string[]
}

export interface MeetGreetServiceWithId extends MeetGreetService {
  serviceId: string
}

// Complete Meet & Greet Services with Olympic period pricing
export const MEET_GREET_SERVICES: Record<string, MeetGreetService> = {
  // =========================================================================
  // AIRPORT ARRIVALS - Olympic Period rates
  // =========================================================================
  "malpensa-arrivals": {
    type: "airport-arrivals",
    location: "Aeroporto di Milano Malpensa",
    coordinates: { lat: 45.6306, lng: 8.7281 },
    basePrice: 370, // Olympic period base price
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
        price: 0, // On request
        description: "Service that picks passengers directly on the landing strip with van for max 6 pax (available only if aircraft is parked)",
        maxPassengers: 6,
        onDemand: true
      },
      fastTrack: { price: 30 },
      vipLounge: { price: 100 }
    },
    details: [
      "The greeter and porter await for the client/s directly at the entrance door of the arrivals area",
      "They approach passenger/s with PATTY CAR sign", 
      "They collect baggage from conveyor belt and accompany to PATTY CAR reserved vehicle",
      "Porter assistance with baggage transport to reserved vehicle"
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
    basePrice: 320, // Olympic period base price
    extraPassengerPrice: 85,
    extraLuggagePrice: 20,
    nightSurchargePrice: 85,
    extraHourPrice: 85,
    includedHours: 3,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 10,
    nightSurchargeHours: { start: "20:00", end: "08:00" },
    specialServices: {
      tarmac: { 
        price: 0, // On request
        description: "Service that picks passengers directly on the landing strip with van for max 6 pax (available only if aircraft is parked)",
        maxPassengers: 6,
        onDemand: true
      },
      fastTrack: { price: 25 },
      vipLounge: { price: 90 }
    },
    details: [
      "The greeter and porter await for the client/s directly at the entrance door of the arrivals area",
      "They approach passenger/s with PATTY CAR sign",
      "They collect baggage from conveyor belt and accompany to PATTY CAR reserved vehicle",
      "Porter assistance with baggage transport to reserved vehicle"
    ],
    constraints: [
      "Groups of more than 8 people will be quoted on request",
      "TARMAC service available only if aircraft is parked (on demand)",
      "Maximum 10 pieces of luggage per operator for night surcharge"
    ]
  },

  "orio-al-serio-arrivals": {
    type: "airport-arrivals", 
    location: "Aeroporto di Bergamo Orio al Serio",
    coordinates: { lat: 45.6739, lng: 9.7043 },
    basePrice: 300, // Olympic period base price
    extraPassengerPrice: 80,
    extraLuggagePrice: 20,
    nightSurchargePrice: 80,
    extraHourPrice: 80,
    includedHours: 3,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 10,
    nightSurchargeHours: { start: "20:00", end: "08:00" },
    specialServices: {
      tarmac: { 
        price: 0, // On request
        description: "Service that picks passengers directly on the landing strip with van for max 6 pax (available only if aircraft is parked)",
        maxPassengers: 6,
        onDemand: true
      }
    },
    details: [
      "The greeter and porter await for the client/s directly at the entrance door of the arrivals area",
      "They approach passenger/s with PATTY CAR sign",
      "They collect baggage from conveyor belt and accompany to PATTY CAR reserved vehicle",
      "Porter assistance with baggage transport to reserved vehicle"
    ],
    constraints: [
      "Groups of more than 8 people will be quoted on request",
      "TARMAC service available only if aircraft is parked (on demand)",
      "Maximum 10 pieces of luggage per operator for night surcharge"
    ]
  },

  "venezia-marco-polo-arrivals": {
    type: "airport-arrivals",
    location: "Aeroporto di Venezia Marco Polo",
    coordinates: { lat: 45.5053, lng: 12.3519 },
    basePrice: 400, // Olympic period base price
    extraPassengerPrice: 110,
    extraLuggagePrice: 25,
    nightSurchargePrice: 95,
    extraHourPrice: 95,
    includedHours: 3,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 10,
    nightSurchargeHours: { start: "20:00", end: "08:00" },
    specialServices: {
      tarmac: { 
        price: 0, // On request
        description: "Service that picks passengers directly on the landing strip with van for max 6 pax (available only if aircraft is parked)",
        maxPassengers: 6,
        onDemand: true
      },
      fastTrack: { price: 30, mandatoryWith: ["vipLounge"] },
      vipLounge: { price: 100, mandatoryWith: ["fastTrack"] },
      combo: {
        name: "Fast Track + VIP Lounge",
        price: 120,
        includes: ["Fast Track", "VIP Lounge Access"]
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
      "Maximum 10 pieces of luggage per operator for night surcharge",
      "Fast Track and VIP Lounge services are mandatory together in Venice"
    ]
  },

  "treviso-arrivals": {
    type: "airport-arrivals",
    location: "Aeroporto di Treviso Antonio Canova",
    coordinates: { lat: 45.6548, lng: 12.1944 },
    basePrice: 350, // Olympic period base price
    extraPassengerPrice: 95,
    extraLuggagePrice: 25,
    nightSurchargePrice: 90,
    extraHourPrice: 90,
    includedHours: 3,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 10,
    nightSurchargeHours: { start: "20:00", end: "08:00" },
    details: [
      "The greeter and porter await for the client/s directly at the entrance door of the arrivals area",
      "They approach passenger/s with PATTY CAR sign",
      "They collect baggage from conveyor belt and accompany to PATTY CAR reserved vehicle"
    ],
    constraints: [
      "Groups of more than 8 people will be quoted on request",
      "Maximum 10 pieces of luggage per operator for night surcharge"
    ]
  },

  // =========================================================================
  // AIRPORT DEPARTURES - Olympic Period rates
  // =========================================================================
  "malpensa-departures": {
    type: "airport-departures",
    location: "Aeroporto di Milano Malpensa",
    coordinates: { lat: 45.6306, lng: 8.7281 },
    basePrice: 370, // Olympic period base price
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
      "Maximum 10 pieces of luggage per operator for night surcharge"
    ]
  },

  "linate-departures": {
    type: "airport-departures",
    location: "Aeroporto di Milano Linate",
    coordinates: { lat: 45.4451, lng: 9.2767 },
    basePrice: 320, // Olympic period base price
    extraPassengerPrice: 85,
    extraLuggagePrice: 20,
    nightSurchargePrice: 85,
    extraHourPrice: 85,
    includedHours: 3,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 10,
    nightSurchargeHours: { start: "20:00", end: "08:00" },
    specialServices: {
      fastTrack: { price: 25 },
      vipLounge: { price: 90 }
    },
    details: [
      "The greeter and porter await for the client/s directly at the entrance door, upon arrival of the booked PATTY CAR vehicle",
      "They can help with tax refund procedures, custom stamps and check-in procedures",
      "They will assist during metal detector and passport controls [skip the line is not possible]",
      "Finally they will escort passenger/s to vip lounge (if included in the booked air ticket) and consecutively to the boarding gate"
    ],
    constraints: [
      "Groups of more than 8 people will be quoted on request",
      "Maximum 10 pieces of luggage per operator for night surcharge"
    ]
  },

  "orio-al-serio-departures": {
    type: "airport-departures",
    location: "Aeroporto di Bergamo Orio al Serio",
    coordinates: { lat: 45.6739, lng: 9.7043 },
    basePrice: 300, // Olympic period base price
    extraPassengerPrice: 80,
    extraLuggagePrice: 20,
    nightSurchargePrice: 80,
    extraHourPrice: 80,
    includedHours: 3,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 10,
    nightSurchargeHours: { start: "20:00", end: "08:00" },
    details: [
      "The greeter and porter await for the client/s directly at the entrance door, upon arrival of the booked PATTY CAR vehicle",
      "They can help with tax refund procedures, custom stamps and check-in procedures",
      "They will assist during metal detector and passport controls [skip the line is not possible]",
      "Finally they will escort passenger/s to the boarding gate"
    ],
    constraints: [
      "Groups of more than 8 people will be quoted on request",
      "Maximum 10 pieces of luggage per operator for night surcharge"
    ]
  },

  "venezia-marco-polo-departures": {
    type: "airport-departures",
    location: "Aeroporto di Venezia Marco Polo",
    coordinates: { lat: 45.5053, lng: 12.3519 },
    basePrice: 400, // Olympic period base price
    extraPassengerPrice: 110,
    extraLuggagePrice: 25,
    nightSurchargePrice: 95,
    extraHourPrice: 95,
    includedHours: 3,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 10,
    nightSurchargeHours: { start: "20:00", end: "08:00" },
    specialServices: {
      fastTrack: { price: 30, mandatoryWith: ["vipLounge"] },
      vipLounge: { price: 100, mandatoryWith: ["fastTrack"] },
      combo: {
        name: "Fast Track + VIP Lounge",
        price: 120,
        includes: ["Fast Track", "VIP Lounge Access"]
      }
    },
    details: [
      "The greeter and porter await for the client/s directly at the entrance door, upon arrival of the booked PATTY CAR vehicle",
      "They can help with tax refund procedures, custom stamps and check-in procedures",
      "They will assist during metal detector and passport controls [skip the line is not possible]",
      "Finally they will escort passenger/s to vip lounge (if included) and consecutively to the boarding gate"
    ],
    constraints: [
      "Groups of more than 8 people will be quoted on request",
      "Maximum 10 pieces of luggage per operator for night surcharge",
      "Fast Track and VIP Lounge services are mandatory together in Venice"
    ]
  },

  "treviso-departures": {
    type: "airport-departures",
    location: "Aeroporto di Treviso Antonio Canova",
    coordinates: { lat: 45.6548, lng: 12.1944 },
    basePrice: 350, // Olympic period base price
    extraPassengerPrice: 95,
    extraLuggagePrice: 25,
    nightSurchargePrice: 90,
    extraHourPrice: 90,
    includedHours: 3,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 10,
    nightSurchargeHours: { start: "20:00", end: "08:00" },
    details: [
      "The greeter and porter await for the client/s directly at the entrance door, upon arrival of the booked PATTY CAR vehicle",
      "They can help with tax refund procedures, custom stamps and check-in procedures",
      "They will assist during metal detector and passport controls [skip the line is not possible]",
      "Finally they will escort passenger/s to the boarding gate"
    ],
    constraints: [
      "Groups of more than 8 people will be quoted on request",
      "Maximum 10 pieces of luggage per operator for night surcharge"
    ]
  },

  // =========================================================================
  // RAILWAY ARRIVALS - Olympic Period rates
  // =========================================================================
  "milano-centrale-arrivals": {
    type: "railway-arrivals",
    location: "Milano Centrale",
    coordinates: { lat: 45.4868, lng: 9.2037 },
    basePrice: 270, // Olympic period base price
    extraPassengerPrice: 75,
    extraLuggagePrice: 25,
    nightSurchargePrice: 190,
    extraHourPrice: 90,
    includedHours: 2,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 5,
    nightSurchargeHours: { start: "18:30", end: "09:00" },
    details: [
      "Greeter and porter await for the client/s directly at the railway station entrance door, upon arrival of the PATTY CAR vehicle",
      "They approach passengers with PATTY CAR sign at the platform exit",
      "Porter assistance with luggage transport to reserved PATTY CAR vehicle",
      "Escort from platform to vehicle parking area"
    ],
    constraints: [
      "Groups of more than 8 people will be quoted on request",
      "Maximum 5 pieces of luggage per operator for night surcharge",
      "Night surcharge hours: 18:30 PM - 09:00 AM"
    ]
  },

  "verona-porta-nuova-arrivals": {
    type: "railway-arrivals",
    location: "Verona Porta Nuova",
    coordinates: { lat: 45.4280, lng: 10.9823 },
    basePrice: 250, // Olympic period base price
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
      "They approach passengers with PATTY CAR sign at the platform exit",
      "Porter assistance with luggage transport to reserved PATTY CAR vehicle"
    ],
    constraints: [
      "Groups of more than 8 people will be quoted on request",
      "Maximum 5 pieces of luggage per operator for night surcharge",
      "Night surcharge hours: 18:30 PM - 09:00 AM"
    ]
  },

  "venezia-santa-lucia-arrivals": {
    type: "railway-arrivals",
    location: "Venezia Santa Lucia",
    coordinates: { lat: 45.4408, lng: 12.3208 },
    basePrice: 250, // Olympic period base price - Greeter for 1 PASSENGER
    extraPassengerPrice: 70,
    extraLuggagePrice: 25,
    nightSurchargePrice: 0, // Porter ON DEMAND
    extraHourPrice: 90,
    includedHours: 2,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 0, // Porter ON DEMAND
    nightSurchargeHours: { start: "18:30", end: "09:00" },
    specialServices: {
      greeterOnly: { price: 0 } // Default greeter only service
    },
    details: [
      "In Venice only greeter | porter on demand",
      "Greeter will await at the railway station entrance door upon arrival of the PATTY CAR vehicle",
      "Greeter will escort from platform to vehicle parking area"
    ],
    constraints: [
      "Groups of more than 8 people will be quoted on request",
      "Porter service available on demand only",
      "Greeter only service by default"
    ]
  },

  // =========================================================================
  // RAILWAY DEPARTURES - Olympic Period rates
  // =========================================================================
  "milano-centrale-departures": {
    type: "railway-departures",
    location: "Milano Centrale",
    coordinates: { lat: 45.4868, lng: 9.2037 },
    basePrice: 270, // Olympic period base price
    extraPassengerPrice: 75,
    extraLuggagePrice: 25,
    nightSurchargePrice: 190,
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

  "verona-porta-nuova-departures": {
    type: "railway-departures",
    location: "Verona Porta Nuova",
    coordinates: { lat: 45.4280, lng: 10.9823 },
    basePrice: 250, // Olympic period base price
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

  "venezia-santa-lucia-departures": {
    type: "railway-departures",
    location: "Venezia Santa Lucia",
    coordinates: { lat: 45.4408, lng: 12.3208 },
    basePrice: 250, // Olympic period base price - Greeter for 1 PASSENGER
    extraPassengerPrice: 70,
    extraLuggagePrice: 25,
    nightSurchargePrice: 0, // Porter ON DEMAND
    extraHourPrice: 90,
    includedHours: 2,
    includedLuggage: 2,
    maxPassengers: 8,
    maxLuggageForNightSurcharge: 0, // Porter ON DEMAND
    nightSurchargeHours: { start: "18:30", end: "09:00" },
    specialServices: {
      greeterOnly: { price: 0 } // Default greeter only service
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

// Function to get Meet & Greet service by ID with proper typing
export function getMeetGreetServiceById(serviceId: string): MeetGreetServiceWithId | null {
  const service = MEET_GREET_SERVICES[serviceId]
  if (!service) return null
  
  return {
    ...service,
    serviceId
  }
}

// Function to get all Meet & Greet services with IDs
export function getAllMeetGreetServices(): MeetGreetServiceWithId[] {
  return Object.entries(MEET_GREET_SERVICES).map(([serviceId, service]) => ({
    ...service,
    serviceId
  }))
}

// Function to get Meet & Greet services by type
export function getMeetGreetServicesByType(type: MeetGreetService['type']): MeetGreetServiceWithId[] {
  return getAllMeetGreetServices().filter(service => service.type === type)
}

// Function to get Meet & Greet services by location coordinates
export function getMeetGreetServiceByCoordinates(
  coordinates: { lat: number; lng: number },
  radiusKm: number = 2
): MeetGreetServiceWithId | null {
  
  const services = getAllMeetGreetServices()
  
  for (const service of services) {
    const distance = calculateDistance(coordinates, service.coordinates)
    if (distance <= radiusKm) {
      return service
    }
  }
  
  return null
}

// Helper function to calculate distance
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

// Function to check if time is night according to service rules
export function isNightTime(timeStr: string, serviceId: string): boolean {
  const service = getMeetGreetServiceById(serviceId)
  if (!service) return false
  
  const [hours, minutes] = timeStr.split(':').map(Number)
  const timeInMinutes = hours * 60 + minutes
  
  const [startHour, startMin] = service.nightSurchargeHours.start.split(':').map(Number)
  const [endHour, endMin] = service.nightSurchargeHours.end.split(':').map(Number)
  
  const startTime = startHour * 60 + startMin
  const endTime = endHour * 60 + endMin
  
  // Handle overnight periods (e.g., 20:00 to 08:00)
  if (startTime > endTime) {
    return timeInMinutes >= startTime || timeInMinutes <= endTime
  } else {
    return timeInMinutes >= startTime && timeInMinutes <= endTime
  }
}

// Function to check if date is a holiday (Christmas, New Year, etc.)
export function isHolidayDate(date: Date): boolean {
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  // Christmas holidays
  if (month === 12 && (day >= 24 && day <= 26)) return true
  // New Year holidays
  if (month === 1 && (day === 1 || day === 6)) return true
  // New Year's Eve
  if (month === 12 && day === 31) return true
  
  return false
}

// Main calculation function for Meet & Greet pricing
export function calculateMeetGreetPriceCorrected(
  serviceId: string,
  passengers: number,
  children: number,
  infants: number,
  extraLuggage: number,
  isNight: boolean,
  specialServices: any = {},
  serviceDate?: Date
): { price: number; breakdown: any } {
  
  const service = getMeetGreetServiceById(serviceId)
  if (!service) {
    return { price: 0, breakdown: { error: 'Service not found' } }
  }

  let totalPrice = service.basePrice
  const breakdown: any = {
    basePrice: service.basePrice,
    extraPassengers: 0,
    extraLuggage: 0,
    nightSurcharge: 0,
    specialServices: 0,
    holidaySurcharge: 0,
    total: 0
  }

  // Calculate extra passengers (children count as passengers, infants don't)
  const totalPassengers = passengers + children
  if (totalPassengers > 1) {
    const extraPassengers = totalPassengers - 1
    breakdown.extraPassengers = extraPassengers * service.extraPassengerPrice
    totalPrice += breakdown.extraPassengers
  }

  // Calculate extra luggage
  if (extraLuggage > service.includedLuggage) {
    const extraLuggageCount = extraLuggage - service.includedLuggage
    breakdown.extraLuggage = extraLuggageCount * service.extraLuggagePrice
    totalPrice += breakdown.extraLuggage
  }

  // Apply night surcharge if applicable
  if (isNight && service.nightSurchargePrice > 0) {
    // Check luggage limit for night surcharge
    if (service.maxLuggageForNightSurcharge === 0 || extraLuggage <= service.maxLuggageForNightSurcharge) {
      breakdown.nightSurcharge = service.nightSurchargePrice
      totalPrice += breakdown.nightSurcharge
    }
  }

  // Calculate special services
  let specialServicesTotal = 0
  if (service.specialServices) {
    Object.entries(specialServices).forEach(([serviceType, enabled]) => {
      if (enabled && service.specialServices![serviceType as keyof typeof service.specialServices]) {
        const specialService = service.specialServices![serviceType as keyof typeof service.specialServices]
        if (specialService && 'price' in specialService) {
          specialServicesTotal += specialService.price
        }
      }
    })
  }
  breakdown.specialServices = specialServicesTotal
  totalPrice += specialServicesTotal

  // Apply holiday surcharge (15% on holidays)
  if (serviceDate && isHolidayDate(serviceDate)) {
    breakdown.holidaySurcharge = Math.round(totalPrice * 0.15)
    totalPrice += breakdown.holidaySurcharge
  }

  breakdown.total = totalPrice

  return { price: totalPrice, breakdown }
}