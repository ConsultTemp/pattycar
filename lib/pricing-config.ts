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

// IVA
export const VAT_RATE = 0.1 // 10%

// Helper function to convert 12h format to 24h format
const convertTo24Hour = (hour: string, minutes: string, ampm: string): { hour24: number, totalMinutes: number } => {
  let hour24 = parseInt(hour)
  if (ampm === "PM" && hour24 !== 12) hour24 += 12
  if (ampm === "AM" && hour24 === 12) hour24 = 0
  return { hour24, totalMinutes: hour24 * 60 + parseInt(minutes) }
}

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
  const subtotal = Math.round(pricePerVehicle * vehicleCount)
  const vatAmount = Math.round(subtotal * VAT_RATE)
  const totalPrice = subtotal + vatAmount

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
      subtotal,
      vatAmount,
      vatRate: VAT_RATE,
    },
  }
}

// Funzione per calcolare il prezzo totale con veicoli multipli configurati individualmente (transfer)
export function calculateMultipleVehiclesPrice(
  distanceKm: number,
  vehicles: Array<{ type: string; passengers: number; luggage: number }>,
): { basePrice: number; totalPrice: number; breakdown: any; vehicleBreakdowns: any[] } {
  let subtotal = 0
  const vehicleBreakdowns: any[] = []

  // Calcola il prezzo base della tratta
  const basePrice = distanceKm * PRICE_PER_KM

  // Calcola il prezzo per ogni veicolo
  vehicles.forEach((vehicle, index) => {
    const vehicleMultiplier = VEHICLE_MULTIPLIERS[vehicle.type] || 1.0
    const passengerMultiplier = PASSENGER_MULTIPLIERS.getMultiplier(vehicle.passengers)
    const luggageMultiplier = LUGGAGE_MULTIPLIERS.getMultiplier(vehicle.luggage)

    const vehiclePrice = Math.round(basePrice * vehicleMultiplier * passengerMultiplier * luggageMultiplier)
    subtotal += vehiclePrice

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

  const vatAmount = Math.round(subtotal * VAT_RATE)
  const totalPrice = subtotal + vatAmount

  return {
    basePrice,
    totalPrice,
    breakdown: {
      distanceKm,
      pricePerKm: PRICE_PER_KM,
      basePrice,
      totalVehicles: vehicles.length,
      subtotal,
      vatAmount,
      vatRate: VAT_RATE,
    },
    vehicleBreakdowns,
  }
}

// Funzione per calcolare il prezzo basato sulla durata (disposizioni)
export function calculateDispositionPrice(
  startTime: string,
  startMinutes: string,
  startTimeAmPm: string,
  endTime: string,
  endMinutes: string,
  endTimeAmPm: string,
  vehicleType: string,
  passengers: number,
  luggage: number,
  vehicleCount = 1,
): { basePrice: number; totalPrice: number; breakdown: any } {
  // Calcola la durata in ore utilizzando la conversione dal formato 12h al 24h
  const startTimeConverted = convertTo24Hour(startTime, startMinutes, startTimeAmPm)
  const endTimeConverted = convertTo24Hour(endTime, endMinutes, endTimeAmPm)
  const durationMinutes = Math.max(0, endTimeConverted.totalMinutes - startTimeConverted.totalMinutes)
  const durationHours = Math.ceil(durationMinutes / 60)

  // Prezzo base basato sulla durata
  const basePrice = durationHours * PRICE_PER_HOUR

  // Applica i moltiplicatori
  const vehicleMultiplier = VEHICLE_MULTIPLIERS[vehicleType] || 1.0
  const passengerMultiplier = PASSENGER_MULTIPLIERS.getMultiplier(passengers)
  const luggageMultiplier = LUGGAGE_MULTIPLIERS.getMultiplier(luggage)

  // Calcola il prezzo finale
  const pricePerVehicle = basePrice * vehicleMultiplier * passengerMultiplier * luggageMultiplier
  const subtotal = Math.round(pricePerVehicle * vehicleCount)
  const vatAmount = Math.round(subtotal * VAT_RATE)
  const totalPrice = subtotal + vatAmount

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
      subtotal,
      vatAmount,
      vatRate: VAT_RATE,
    },
  }
}

// Funzione per calcolare il prezzo con veicoli multipli per disposizioni
export function calculateMultipleVehiclesDispositionPrice(
  startTime: string,
  startMinutes: string,
  startTimeAmPm: string,
  endTime: string,
  endMinutes: string,
  endTimeAmPm: string,
  vehicles: Array<{ type: string; passengers: number; luggage: number }>,
): { basePrice: number; totalPrice: number; breakdown: any; vehicleBreakdowns: any[] } {
  let subtotal = 0
  const vehicleBreakdowns: any[] = []

  // Calcola la durata in ore utilizzando la conversione dal formato 12h al 24h
  const startTimeConverted = convertTo24Hour(startTime, startMinutes, startTimeAmPm)
  const endTimeConverted = convertTo24Hour(endTime, endMinutes, endTimeAmPm)
  const durationMinutes = Math.max(0, endTimeConverted.totalMinutes - startTimeConverted.totalMinutes)
  const durationHours = Math.ceil(durationMinutes / 60)

  // Calcola il prezzo base della durata
  const basePrice = durationHours * PRICE_PER_HOUR

  // Calcola il prezzo per ogni veicolo
  vehicles.forEach((vehicle, index) => {
    const vehicleMultiplier = VEHICLE_MULTIPLIERS[vehicle.type] || 1.0
    const passengerMultiplier = PASSENGER_MULTIPLIERS.getMultiplier(vehicle.passengers)
    const luggageMultiplier = LUGGAGE_MULTIPLIERS.getMultiplier(vehicle.luggage)

    const vehiclePrice = Math.round(basePrice * vehicleMultiplier * passengerMultiplier * luggageMultiplier)
    subtotal += vehiclePrice

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

  const vatAmount = Math.round(subtotal * VAT_RATE)
  const totalPrice = subtotal + vatAmount

  return {
    basePrice,
    totalPrice,
    breakdown: {
      durationHours,
      pricePerHour: PRICE_PER_HOUR,
      basePrice,
      totalVehicles: vehicles.length,
      subtotal,
      vatAmount,
      vatRate: VAT_RATE,
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
