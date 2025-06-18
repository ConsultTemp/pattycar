// Moltiplicatori per tipo di veicolo
export const VEHICLE_MULTIPLIERS: Record<string, number> = {
  sedan: 1.0,
  van: 1.3,
  minibus: 1.5,
  "luxury-sedan": 1.8,
}

// Moltiplicatori per numero di passeggeri
export const PASSENGER_MULTIPLIERS = {
  getMultiplier: (passengers: number): number => {
    if (passengers <= 2) return 1.0
    if (passengers <= 4) return 1.1
    if (passengers <= 6) return 1.2
    return 1.3
  },
}

// Moltiplicatori per bagagli
export const LUGGAGE_MULTIPLIERS = {
  getMultiplier: (luggage: number): number => {
    if (luggage <= 2) return 1.0
    if (luggage <= 4) return 1.05
    if (luggage <= 6) return 1.1
    return 1.15
  },
}

// Prezzo base per km
export const PRICE_PER_KM = 5.0

// Prezzo base per ora (disposizioni)
export const PRICE_PER_HOUR = 100

// Funzione per calcolare il prezzo totale basato sulla distanza (transfer)
export function calculateTotalPrice(
  distanceKm: number,
  vehicleType: string,
  passengers: number,
  luggage: number,
  vehicleCount = 1,
): { basePrice: number; totalPrice: number; breakdown: any } {
  // Prezzo base basato sulla distanza
  const basePrice = distanceKm * PRICE_PER_KM

  // Applica i moltiplicatori
  const vehicleMultiplier = VEHICLE_MULTIPLIERS[vehicleType] || 1.0
  const passengerMultiplier = PASSENGER_MULTIPLIERS.getMultiplier(passengers)
  const luggageMultiplier = LUGGAGE_MULTIPLIERS.getMultiplier(luggage)

  // Calcola il prezzo finale
  const pricePerVehicle = basePrice * vehicleMultiplier * passengerMultiplier * luggageMultiplier
  const totalPrice = Math.round(pricePerVehicle * vehicleCount)

  return {
    basePrice,
    totalPrice,
    breakdown: {
      distanceKm,
      pricePerKm: PRICE_PER_KM,
      basePrice,
      vehicleMultiplier,
      passengerMultiplier,
      luggageMultiplier,
      vehicleCount,
      pricePerVehicle: Math.round(pricePerVehicle),
    },
  }
}

// Funzione per calcolare il prezzo totale con veicoli multipli configurati individualmente (transfer)
export function calculateMultipleVehiclesPrice(
  distanceKm: number,
  vehicles: Array<{ type: string; passengers: number; luggage: number }>,
): { basePrice: number; totalPrice: number; breakdown: any; vehicleBreakdowns: any[] } {
  let totalPrice = 0
  const vehicleBreakdowns: any[] = []

  // Calcola il prezzo base della tratta
  const basePrice = distanceKm * PRICE_PER_KM

  // Calcola il prezzo per ogni veicolo
  vehicles.forEach((vehicle, index) => {
    const vehicleMultiplier = VEHICLE_MULTIPLIERS[vehicle.type] || 1.0
    const passengerMultiplier = PASSENGER_MULTIPLIERS.getMultiplier(vehicle.passengers)
    const luggageMultiplier = LUGGAGE_MULTIPLIERS.getMultiplier(vehicle.luggage)

    const vehiclePrice = Math.round(basePrice * vehicleMultiplier * passengerMultiplier * luggageMultiplier)
    totalPrice += vehiclePrice

    vehicleBreakdowns.push({
      vehicleIndex: index + 1,
      type: vehicle.type,
      passengers: vehicle.passengers,
      luggage: vehicle.luggage,
      basePrice,
      vehicleMultiplier,
      passengerMultiplier,
      luggageMultiplier,
      price: vehiclePrice,
    })
  })

  return {
    basePrice,
    totalPrice,
    breakdown: {
      distanceKm,
      pricePerKm: PRICE_PER_KM,
      basePrice,
      totalVehicles: vehicles.length,
    },
    vehicleBreakdowns,
  }
}

// Funzione per calcolare il prezzo basato sulla durata (disposizioni)
export function calculateDispositionPrice(
  startTime: string,
  startMinutes: string,
  endTime: string,
  endMinutes: string,
  vehicleType: string,
  passengers: number,
  luggage: number,
  vehicleCount = 1,
): { basePrice: number; totalPrice: number; breakdown: any } {
  // Calcola la durata in ore
  const startHour = Number.parseInt(startTime) + Number.parseInt(startMinutes) / 60
  const endHour = Number.parseInt(endTime) + Number.parseInt(endMinutes) / 60
  const durationHours = Math.ceil(Math.max(0, endHour - startHour))

  // Prezzo base basato sulla durata
  const basePrice = durationHours * PRICE_PER_HOUR

  // Applica i moltiplicatori
  const vehicleMultiplier = VEHICLE_MULTIPLIERS[vehicleType] || 1.0
  const passengerMultiplier = PASSENGER_MULTIPLIERS.getMultiplier(passengers)
  const luggageMultiplier = LUGGAGE_MULTIPLIERS.getMultiplier(luggage)

  // Calcola il prezzo finale
  const pricePerVehicle = basePrice * vehicleMultiplier * passengerMultiplier * luggageMultiplier
  const totalPrice = Math.round(pricePerVehicle * vehicleCount)

  return {
    basePrice,
    totalPrice,
    breakdown: {
      durationHours,
      pricePerHour: PRICE_PER_HOUR,
      basePrice,
      vehicleMultiplier,
      passengerMultiplier,
      luggageMultiplier,
      vehicleCount,
      pricePerVehicle: Math.round(pricePerVehicle),
    },
  }
}

// Funzione per calcolare il prezzo con veicoli multipli per disposizioni
export function calculateMultipleVehiclesDispositionPrice(
  startTime: string,
  startMinutes: string,
  endTime: string,
  endMinutes: string,
  vehicles: Array<{ type: string; passengers: number; luggage: number }>,
): { basePrice: number; totalPrice: number; breakdown: any; vehicleBreakdowns: any[] } {
  let totalPrice = 0
  const vehicleBreakdowns: any[] = []

  // Calcola la durata in ore
  const startHour = Number.parseInt(startTime) + Number.parseInt(startMinutes) / 60
  const endHour = Number.parseInt(endTime) + Number.parseInt(endMinutes) / 60
  const durationHours = Math.ceil(Math.max(0, endHour - startHour))

  // Calcola il prezzo base della durata
  const basePrice = durationHours * PRICE_PER_HOUR

  // Calcola il prezzo per ogni veicolo
  vehicles.forEach((vehicle, index) => {
    const vehicleMultiplier = VEHICLE_MULTIPLIERS[vehicle.type] || 1.0
    const passengerMultiplier = PASSENGER_MULTIPLIERS.getMultiplier(vehicle.passengers)
    const luggageMultiplier = LUGGAGE_MULTIPLIERS.getMultiplier(vehicle.luggage)

    const vehiclePrice = Math.round(basePrice * vehicleMultiplier * passengerMultiplier * luggageMultiplier)
    totalPrice += vehiclePrice

    vehicleBreakdowns.push({
      vehicleIndex: index + 1,
      type: vehicle.type,
      passengers: vehicle.passengers,
      luggage: vehicle.luggage,
      basePrice,
      vehicleMultiplier,
      passengerMultiplier,
      luggageMultiplier,
      price: vehiclePrice,
    })
  })

  return {
    basePrice,
    totalPrice,
    breakdown: {
      durationHours,
      pricePerHour: PRICE_PER_HOUR,
      basePrice,
      totalVehicles: vehicles.length,
    },
    vehicleBreakdowns,
  }
}

// Funzione helper per ottenere la distanza tra due luoghi
export async function getDistanceBetweenPlaces(origin: string, destination: string) {
  try {
    const response = await fetch("/api/distance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ origin, destination }),
    })

    if (!response.ok) {
      throw new Error("Failed to get distance")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error getting distance:", error)
    throw error
  }
}
