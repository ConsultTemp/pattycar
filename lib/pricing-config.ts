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

// Supplemento notturno
export const NIGHT_SURCHARGE_RATE = 0.2 // 20%

// Helper function to convert 12h format to 24h format
const convertTo24Hour = (hour: string, minutes: string, ampm: string): { hour24: number, totalMinutes: number } => {
  let hour24 = parseInt(hour)
  if (ampm === "PM" && hour24 !== 12) hour24 += 12
  if (ampm === "AM" && hour24 === 12) hour24 = 0
  return { hour24, totalMinutes: hour24 * 60 + parseInt(minutes) }
}

// Helper function to check if time is night (19:30 - 07:30)
export const isNightTime = (hour: string, minutes: string, ampm: string): boolean => {
  const { totalMinutes } = convertTo24Hour(hour, minutes, ampm)
  // Night time: 19:30 (1170 minutes) to 07:30 (450 minutes)
  return totalMinutes >= 1170 || totalMinutes <= 450
}

// Funzione per calcolare il prezzo totale basato sulla distanza (transfer)
export function calculateTotalPrice(
  distanceKm: number,
  vehicleType: string,
  passengers: number,
  luggage: number,
  vehicleCount = 1,
  // Parametri opzionali per il supplemento notturno
  hour?: string,
  minutes?: string,
  ampm?: string
): { basePrice: number; totalPrice: number; breakdown: any } {
  // Prezzo base basato sulla distanza
  const basePrice = distanceKm * PRICE_PER_KM

  // Applica i moltiplicatori
  const vehicleMultiplier = VEHICLE_MULTIPLIERS[vehicleType] || 1.0
  const passengerMultiplier = PASSENGER_MULTIPLIERS.getMultiplier(passengers)
  const luggageMultiplier = LUGGAGE_MULTIPLIERS.getMultiplier(luggage)

  // Calcola il prezzo finale
  let pricePerVehicle = basePrice * vehicleMultiplier * passengerMultiplier * luggageMultiplier
  
  // Applica supplemento notturno se applicabile
  let nightSurcharge = 0
  if (hour && minutes && ampm && isNightTime(hour, minutes, ampm)) {
    nightSurcharge = pricePerVehicle * NIGHT_SURCHARGE_RATE
    pricePerVehicle += nightSurcharge
  }

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
      nightSurcharge: nightSurcharge * vehicleCount,
      nightSurchargeRate: hour && minutes && ampm && isNightTime(hour, minutes, ampm) ? NIGHT_SURCHARGE_RATE : 0,
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
  // Parametri opzionali per il supplemento notturno
  hour?: string,
  minutes?: string,
  ampm?: string
): { basePrice: number; totalPrice: number; breakdown: any; vehicleBreakdowns: any[] } {
  let subtotal = 0
  const vehicleBreakdowns: any[] = []

  // Calcola il prezzo base della tratta
  const basePrice = distanceKm * PRICE_PER_KM
  
  // Verifica se è orario notturno
  const isNight = hour && minutes && ampm && isNightTime(hour, minutes, ampm)

  // Calcola il prezzo per ogni veicolo
  vehicles.forEach((vehicle, index) => {
    const vehicleMultiplier = VEHICLE_MULTIPLIERS[vehicle.type] || 1.0
    const passengerMultiplier = PASSENGER_MULTIPLIERS.getMultiplier(vehicle.passengers)
    const luggageMultiplier = LUGGAGE_MULTIPLIERS.getMultiplier(vehicle.luggage)

    let vehiclePrice = basePrice * vehicleMultiplier * passengerMultiplier * luggageMultiplier
    
    // Applica supplemento notturno se applicabile
    let nightSurcharge = 0
    if (isNight) {
      nightSurcharge = vehiclePrice * NIGHT_SURCHARGE_RATE
      vehiclePrice += nightSurcharge
    }
    
    const finalVehiclePrice = Math.round(vehiclePrice)
    subtotal += finalVehiclePrice

    vehicleBreakdowns.push({
      vehicleIndex: index + 1,
      type: vehicle.type,
      passengers: vehicle.passengers,
      luggage: vehicle.luggage,
      basePrice,
      vehicleMultiplier,
      passengerMultiplier,
      luggageMultiplier,
      nightSurcharge,
      price: finalVehiclePrice,
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
      nightSurchargeRate: isNight ? NIGHT_SURCHARGE_RATE : 0,
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
  let pricePerVehicle = basePrice * vehicleMultiplier * passengerMultiplier * luggageMultiplier
  
  // Applica supplemento notturno se l'orario di inizio è notturno
  let nightSurcharge = 0
  if (isNightTime(startTime, startMinutes, startTimeAmPm)) {
    nightSurcharge = pricePerVehicle * NIGHT_SURCHARGE_RATE
    pricePerVehicle += nightSurcharge
  }

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
      nightSurcharge: nightSurcharge * vehicleCount,
      nightSurchargeRate: isNightTime(startTime, startMinutes, startTimeAmPm) ? NIGHT_SURCHARGE_RATE : 0,
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
  
  // Verifica se è orario notturno (basato sull'orario di inizio)
  const isNight = isNightTime(startTime, startMinutes, startTimeAmPm)

  // Calcola il prezzo per ogni veicolo
  vehicles.forEach((vehicle, index) => {
    const vehicleMultiplier = VEHICLE_MULTIPLIERS[vehicle.type] || 1.0
    const passengerMultiplier = PASSENGER_MULTIPLIERS.getMultiplier(vehicle.passengers)
    const luggageMultiplier = LUGGAGE_MULTIPLIERS.getMultiplier(vehicle.luggage)

    let vehiclePrice = basePrice * vehicleMultiplier * passengerMultiplier * luggageMultiplier
    
    // Applica supplemento notturno se applicabile
    let nightSurcharge = 0
    if (isNight) {
      nightSurcharge = vehiclePrice * NIGHT_SURCHARGE_RATE
      vehiclePrice += nightSurcharge
    }
    
    const finalVehiclePrice = Math.round(vehiclePrice)
    subtotal += finalVehiclePrice

    vehicleBreakdowns.push({
      vehicleIndex: index + 1,
      type: vehicle.type,
      passengers: vehicle.passengers,
      luggage: vehicle.luggage,
      basePrice,
      vehicleMultiplier,
      passengerMultiplier,
      luggageMultiplier,
      nightSurcharge,
      price: finalVehiclePrice,
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
      nightSurchargeRate: isNight ? NIGHT_SURCHARGE_RATE : 0,
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

// NCC Pricing Configuration - Basato su distanza e tempo
export const NCC_VEHICLE_CONFIG = {
  berlina: {
    basePrice: 50,      // €50 prezzo base
    pricePerKm: 1.6,    // €1.6 per km
    pricePerMin: 0.55,  // €0.55 per minuto
  },
  monovolume: {
    basePrice: 70,      // €70 prezzo base
    pricePerKm: 1.9,    // €1.9 per km
    pricePerMin: 0.75,  // €0.75 per minuto
  },
  minibus: {
    basePrice: 90,      // €90 prezzo base
    pricePerKm: 2.1,    // €2.1 per km
    pricePerMin: 0.90,  // €0.90 per minuto
  },
} as const

// Mapping dei tipi di veicolo dal sistema ai tipi NCC
const VEHICLE_TYPE_MAPPING: Record<string, keyof typeof NCC_VEHICLE_CONFIG> = {
  sedan: 'berlina',
  'luxury-sedan': 'berlina',
  van: 'monovolume',
  minibus: 'minibus',
}

/**
 * Calcola il prezzo di un transfer NCC basato su distanza e tempo
 * @param distanceKm Distanza del viaggio in km
 * @param durationMinutes Durata del viaggio in minuti
 * @param vehicleType Tipo di veicolo (sedan, van, minibus, luxury-sedan)
 * @param vehicleCount Numero di veicoli (default: 1)
 * @returns Oggetto con prezzo totale e breakdown dettagliato
 */
export function calculateNCCPrice(
  distanceKm: number,
  durationMinutes: number,
  vehicleType: string,
  vehicleCount: number = 1
): {
  totalPrice: number
  pricePerVehicle: number
  breakdown: {
    vehicleType: string
    nccVehicleType: keyof typeof NCC_VEHICLE_CONFIG
    basePrice: number
    distanceKm: number
    durationMinutes: number
    distanceCost: number
    timeCost: number
    subtotalPerVehicle: number
    vehicleCount: number
    subtotalAllVehicles: number
    vatAmount: number
    vatRate: number
    totalWithVat: number
  }
} {
  // Mappa il tipo di veicolo al tipo NCC
  const nccVehicleType = VEHICLE_TYPE_MAPPING[vehicleType] || 'berlina'
  const config = NCC_VEHICLE_CONFIG[nccVehicleType]

  // Calcoli per singolo veicolo
  const basePrice = config.basePrice
  const distanceCost = distanceKm * config.pricePerKm
  const timeCost = durationMinutes * config.pricePerMin
  const subtotalPerVehicle = basePrice + distanceCost + timeCost

  // Calcoli per tutti i veicoli
  const subtotalAllVehicles = subtotalPerVehicle * vehicleCount
  
  // Applica IVA
  const vatAmount = subtotalAllVehicles * VAT_RATE
  const totalWithVat = subtotalAllVehicles + vatAmount

  return {
    totalPrice: Math.round(totalWithVat * 100) / 100,
    pricePerVehicle: Math.round(subtotalPerVehicle * 100) / 100,
    breakdown: {
      vehicleType,
      nccVehicleType,
      basePrice,
      distanceKm,
      durationMinutes,
      distanceCost: Math.round(distanceCost * 100) / 100,
      timeCost: Math.round(timeCost * 100) / 100,
      subtotalPerVehicle: Math.round(subtotalPerVehicle * 100) / 100,
      vehicleCount,
      subtotalAllVehicles: Math.round(subtotalAllVehicles * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      vatRate: VAT_RATE,
      totalWithVat: Math.round(totalWithVat * 100) / 100,
    }
  }
}

/**
 * Calcola il prezzo NCC per veicoli multipli con configurazioni diverse
 * @param distanceKm Distanza del viaggio in km
 * @param durationMinutes Durata del viaggio in minuti
 * @param vehicles Array di configurazioni veicoli
 * @returns Oggetto con prezzo totale e breakdown per ogni veicolo
 */
export function calculateMultipleNCCPrice(
  distanceKm: number,
  durationMinutes: number,
  vehicles: Array<{ type: string; count: number }>
): {
  totalPrice: number
  breakdown: {
    distanceKm: number
    durationMinutes: number
    vehicles: Array<{
      type: string
      nccType: keyof typeof NCC_VEHICLE_CONFIG
      count: number
      pricePerVehicle: number
      totalPrice: number
      config: typeof NCC_VEHICLE_CONFIG[keyof typeof NCC_VEHICLE_CONFIG]
    }>
    subtotal: number
    vatAmount: number
    vatRate: number
    totalWithVat: number
  }
} {
  let subtotal = 0
  const vehicleBreakdowns: any[] = []

  vehicles.forEach(vehicle => {
    const result = calculateNCCPrice(distanceKm, durationMinutes, vehicle.type, vehicle.count)
    subtotal += result.breakdown.subtotalAllVehicles
    
    vehicleBreakdowns.push({
      type: vehicle.type,
      nccType: result.breakdown.nccVehicleType,
      count: vehicle.count,
      pricePerVehicle: result.pricePerVehicle,
      totalPrice: result.breakdown.subtotalAllVehicles,
      config: NCC_VEHICLE_CONFIG[result.breakdown.nccVehicleType]
    })
  })

  const vatAmount = subtotal * VAT_RATE
  const totalWithVat = subtotal + vatAmount

  return {
    totalPrice: Math.round(totalWithVat * 100) / 100,
    breakdown: {
      distanceKm,
      durationMinutes,
      vehicles: vehicleBreakdowns,
      subtotal: Math.round(subtotal * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      vatRate: VAT_RATE,
      totalWithVat: Math.round(totalWithVat * 100) / 100,
    }
  }
}
