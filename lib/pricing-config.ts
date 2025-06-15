// Configurazione città e luoghi
export const CITIES_AND_LOCATIONS = {
    milano: {
      name: "Milano",
      locations: {
        malpensa: "Aeroporto Malpensa",
        centro: "Milano Centro",
        centrale: "Stazione Centrale",
        garibaldi: "Stazione Garibaldi",
      },
    },
    roma: {
      name: "Roma",
      locations: {
        fiumicino: "Aeroporto Fiumicino",
        termini: "Stazione Termini",
        centro: "Roma Centro",
        ciampino: "Aeroporto Ciampino",
      },
    },
    venezia: {
      name: "Venezia",
      locations: {
        "marco-polo": "Aeroporto Marco Polo",
        "santa-lucia": "Stazione Santa Lucia",
        centro: "Venezia Centro",
        mestre: "Mestre",
      },
    },
    bergamo: {
      name: "Bergamo",
      locations: {
        "orio-al-serio": "Aeroporto Orio al Serio",
        centro: "Bergamo Centro",
        stazione: "Stazione Bergamo",
        "citta-alta": "Città Alta",
      },
    },
  }
  
  // Prezzi tra città diverse (bidirezionali)
  export const INTERCITY_PRICES: Record<string, Record<string, number>> = {
    milano: {
      roma: 350,
      venezia: 280,
      bergamo: 80,
    },
    roma: {
      milano: 350,
      venezia: 400,
      bergamo: 420,
    },
    venezia: {
      milano: 280,
      roma: 400,
      bergamo: 200,
    },
    bergamo: {
      milano: 80,
      roma: 420,
      venezia: 200,
    },
  }
  
  // Prezzi interni per ogni città (da luogo a luogo)
  export const INTRACITY_PRICES: Record<string, Record<string, Record<string, number>>> = {
    milano: {
      malpensa: {
        centro: 60,
        centrale: 65,
        garibaldi: 70,
      },
      centro: {
        malpensa: 60,
        centrale: 15,
        garibaldi: 20,
      },
      centrale: {
        malpensa: 65,
        centro: 15,
        garibaldi: 10,
      },
      garibaldi: {
        malpensa: 70,
        centro: 20,
        centrale: 10,
      },
    },
    roma: {
      fiumicino: {
        termini: 50,
        centro: 55,
        ciampino: 40,
      },
      termini: {
        fiumicino: 50,
        centro: 20,
        ciampino: 35,
      },
      centro: {
        fiumicino: 55,
        termini: 20,
        ciampino: 30,
      },
      ciampino: {
        fiumicino: 40,
        termini: 35,
        centro: 30,
      },
    },
    venezia: {
      "marco-polo": {
        "santa-lucia": 35,
        centro: 40,
        mestre: 25,
      },
      "santa-lucia": {
        "marco-polo": 35,
        centro: 15,
        mestre: 20,
      },
      centro: {
        "marco-polo": 40,
        "santa-lucia": 15,
        mestre: 25,
      },
      mestre: {
        "marco-polo": 25,
        "santa-lucia": 20,
        centro: 25,
      },
    },
    bergamo: {
      "orio-al-serio": {
        centro: 25,
        stazione: 30,
        "citta-alta": 35,
      },
      centro: {
        "orio-al-serio": 25,
        stazione: 15,
        "citta-alta": 20,
      },
      stazione: {
        "orio-al-serio": 30,
        centro: 15,
        "citta-alta": 25,
      },
      "citta-alta": {
        "orio-al-serio": 35,
        centro: 20,
        stazione: 25,
      },
    },
  }
  
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
  
  // Funzione per calcolare il prezzo totale
  export function calculateTotalPrice(
    departureCity: string,
    departureLocation: string,
    destinationCity: string,
    destinationLocation: string,
    vehicleType: string,
    passengers: number,
    luggage: number,
    vehicleCount = 1,
  ): { basePrice: number; totalPrice: number; breakdown: any } {
    let basePrice = 0
  
    // Se le città sono diverse, usa il prezzo intercity
    if (departureCity !== destinationCity) {
      basePrice = INTERCITY_PRICES[departureCity]?.[destinationCity] || 100
    }
    // Se è la stessa città, usa il prezzo intracity
    else {
      basePrice = INTRACITY_PRICES[departureCity]?.[departureLocation]?.[destinationLocation] || 50
    }
  
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
        basePrice,
        vehicleMultiplier,
        passengerMultiplier,
        luggageMultiplier,
        vehicleCount,
        pricePerVehicle: Math.round(pricePerVehicle),
        routeType: departureCity !== destinationCity ? "intercity" : "intracity",
      },
    }
  }
  
  // Funzione per calcolare il prezzo totale con veicoli multipli configurati individualmente
  export function calculateMultipleVehiclesPrice(
    departureCity: string,
    departureLocation: string,
    destinationCity: string,
    destinationLocation: string,
    vehicles: Array<{ type: string; passengers: number; luggage: number }>,
  ): { basePrice: number; totalPrice: number; breakdown: any; vehicleBreakdowns: any[] } {
    let totalPrice = 0
    const vehicleBreakdowns: any[] = []
  
    // Calcola il prezzo base della tratta
    let basePrice = 0
    if (departureCity !== destinationCity) {
      basePrice = INTERCITY_PRICES[departureCity]?.[destinationCity] || 100
    } else {
      basePrice = INTRACITY_PRICES[departureCity]?.[departureLocation]?.[destinationLocation] || 50
    }
  
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
        basePrice,
        totalVehicles: vehicles.length,
        routeType: departureCity !== destinationCity ? "intercity" : "intracity",
      },
      vehicleBreakdowns,
    }
  }
  