// Olympic Winter Games Milano-Cortina 2026 Configuration
// Period: January - March 2026

export interface OlympicVehicleType {
  id: string
  name: string
  displayName: string
  maxPassengers: number
  maxPassengersWithLuggage: number
  maxLuggage: number
  maxSmallLuggage?: number
  description: string
  category: 'standard' | 'luxury'
}

// Olympic Vehicle Types - More comprehensive than standard
export const OLYMPIC_VEHICLE_TYPES: Record<string, OlympicVehicleType> = {
  'olympic-sedan': {
    id: 'olympic-sedan',
    name: 'sedan',
    displayName: 'Sedan',
    maxPassengers: 3,
    maxPassengersWithLuggage: 3,
    maxLuggage: 2,
    maxSmallLuggage: 1,
    description: '3 passengers max',
    category: 'standard'
  },

  'olympic-minivan': {
    id: 'olympic-minivan',
    name: 'minivan',
    displayName: 'Mini Van',
    maxPassengers: 6,
    maxPassengersWithLuggage: 4,
    maxLuggage: 4,
    description: '6 passengers (4 with luggage)',
    category: 'standard'
  },
  'olympic-van': {
    id: 'olympic-van',
    name: 'van',
    displayName: 'Van',
    maxPassengers: 8,
    maxPassengersWithLuggage: 6,
    maxLuggage: 6,
    description: '8 passengers (6 with luggage)',
    category: 'standard'
  },
  'olympic-luxury': {
    id: 'olympic-luxury',
    name: 'luxury',
    displayName: 'Luxury Sedan',
    maxPassengers: 2,
    maxPassengersWithLuggage: 2,
    maxLuggage: 2,
    description: '2 passengers max (Mercedes S / Maserati)',
    category: 'luxury'
  }
}

// Olympic Locations - Specific destinations for Olympic period
export interface OlympicLocation {
  id: string
  name: string
  displayName: string
  coordinates: { lat: number; lng: number }
  type: 'airport' | 'station' | 'city' | 'olympic-venue'
  isOlympicDestination: boolean
}

export const OLYMPIC_LOCATIONS: Record<string, OlympicLocation> = {
  // Airports
  'malpensa': {
    id: 'malpensa',
    name: 'Milano Malpensa MXP',
    displayName: 'Milano Malpensa (MXP)',
    coordinates: { lat: 45.6306, lng: 8.7281 },
    type: 'airport',
    isOlympicDestination: false
  },
  'linate': {
    id: 'linate',
    name: 'Milano Linate LIN',
    displayName: 'Milano Linate (LIN)',
    coordinates: { lat: 45.4451, lng: 9.2767 },
    type: 'airport',
    isOlympicDestination: false
  },
  'bergamo': {
    id: 'bergamo',
    name: 'Bergamo BGY',
    displayName: 'Bergamo Orio al Serio (BGY)',
    coordinates: { lat: 45.6739, lng: 9.7042 },
    type: 'airport',
    isOlympicDestination: false
  },
  
  // Train Stations
  'milano-centrale': {
    id: 'milano-centrale',
    name: 'Milano Stazione Centrale',
    displayName: 'Milano Centrale Station',
    coordinates: { lat: 45.4868, lng: 9.2037 },
    type: 'station',
    isOlympicDestination: false
  },
  
  // Olympic Destinations
  'milano': {
    id: 'milano',
    name: 'Milano',
    displayName: 'Milano',
    coordinates: { lat: 45.4642, lng: 9.1900 },
    type: 'city',
    isOlympicDestination: true
  },
  'livigno': {
    id: 'livigno',
    name: 'Livigno',
    displayName: 'Livigno (Olympic Venue)',
    coordinates: { lat: 46.5344, lng: 10.1342 },
    type: 'olympic-venue',
    isOlympicDestination: true
  },
  'bormio': {
    id: 'bormio',
    name: 'Bormio',
    displayName: 'Bormio (Olympic Venue)',
    coordinates: { lat: 46.4669, lng: 10.3700 },
    type: 'olympic-venue',
    isOlympicDestination: true
  },
  'verona': {
    id: 'verona',
    name: 'Verona',
    displayName: 'Verona',
    coordinates: { lat: 45.4384, lng: 10.9916 },
    type: 'city',
    isOlympicDestination: true
  },
  
  // Inter-cluster destinations (Olympic-specific)
  'cortina': {
    id: 'cortina',
    name: 'Cortina Center',
    displayName: 'Cortina Center (Olympic Venue)',
    coordinates: { lat: 46.5369, lng: 12.1357 },
    type: 'olympic-venue',
    isOlympicDestination: true
  },
  'anterselva': {
    id: 'anterselva', 
    name: 'Anterselva',
    displayName: 'Anterselva (Olympic Venue)',
    coordinates: { lat: 46.7833, lng: 12.0833 },
    type: 'olympic-venue',
    isOlympicDestination: true
  },
  'val-di-fiemme': {
    id: 'val-di-fiemme',
    name: 'Val di Fiemme',
    displayName: 'Val di Fiemme - Predazzo/Tesero (Olympic Venue)',
    coordinates: { lat: 46.3000, lng: 11.6000 },
    type: 'olympic-venue', 
    isOlympicDestination: true
  },
  'tirano': {
    id: 'tirano',
    name: 'Tirano',
    displayName: 'Tirano',
    coordinates: { lat: 46.2167, lng: 10.1667 },
    type: 'city',
    isOlympicDestination: true
  },
  'venezia': {
    id: 'venezia',
    name: 'Venezia',
    displayName: 'Venezia Hotel (incl. water taxi)',
    coordinates: { lat: 45.4408, lng: 12.3155 },
    type: 'city',
    isOlympicDestination: true
  }
}

// Olympic Routes with specific pricing
export interface OlympicRoute {
  from: string
  to: string
  fromLocationId: string
  toLocationId: string
  prices: {
    'olympic-sedan': number
    'olympic-minivan': number
    'olympic-van': number
    'olympic-luxury': number
  }
  extraHourRates: {
    'olympic-sedan': number
    'olympic-minivan': number
    'olympic-van': number
    'olympic-luxury': number
  }
}

// Olympic Transfer Routes - Based on the pricing tables provided
export const OLYMPIC_TRANSFER_ROUTES: OlympicRoute[] = [
  // Malpensa Routes
  {
    from: 'Milano Malpensa MXP',
    to: 'Milano',
    fromLocationId: 'malpensa',
    toLocationId: 'milano',
    prices: {
      'olympic-sedan': 220,
      'olympic-minivan': 255,
      'olympic-van': 490,
      'olympic-luxury': 470
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    }
  },
  {
    from: 'Milano Malpensa MXP',
    to: 'Livigno',
    fromLocationId: 'malpensa',
    toLocationId: 'livigno',
    prices: {
      'olympic-sedan': 1100,
      'olympic-minivan': 1270,
      'olympic-van': 1780,
      'olympic-luxury': 1630
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    }
  },
  {
    from: 'Milano Malpensa MXP',
    to: 'Bormio',
    fromLocationId: 'malpensa',
    toLocationId: 'bormio',
    prices: {
      'olympic-sedan': 990,
      'olympic-minivan': 1150,
      'olympic-van': 1540,
      'olympic-luxury': 1430
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    }
  },
  {
    from: 'Milano Malpensa MXP',
    to: 'Verona',
    fromLocationId: 'malpensa',
    toLocationId: 'verona',
    prices: {
      'olympic-sedan': 710,
      'olympic-minivan': 830,
      'olympic-van': 1250,
      'olympic-luxury': 1130
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    }
  },
  
  // Linate Routes
  {
    from: 'Milano Linate LIN',
    to: 'Milano',
    fromLocationId: 'linate',
    toLocationId: 'milano',
    prices: {
      'olympic-sedan': 135,
      'olympic-minivan': 150,
      'olympic-van': 330,
      'olympic-luxury': 285
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    }
  },
  {
    from: 'Milano Linate LIN',
    to: 'Livigno',
    fromLocationId: 'linate',
    toLocationId: 'livigno',
    prices: {
      'olympic-sedan': 1070,
      'olympic-minivan': 1230,
      'olympic-van': 1590,
      'olympic-luxury': 1470
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    }
  },
  {
    from: 'Milano Linate LIN',
    to: 'Bormio',
    fromLocationId: 'linate',
    toLocationId: 'bormio',
    prices: {
      'olympic-sedan': 920,
      'olympic-minivan': 1170,
      'olympic-van': 1390,
      'olympic-luxury': 1290
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    }
  },
  {
    from: 'Milano Linate LIN',
    to: 'Verona',
    fromLocationId: 'linate',
    toLocationId: 'verona',
    prices: {
      'olympic-sedan': 620,
      'olympic-minivan': 730,
      'olympic-van': 990,
      'olympic-luxury': 920
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    }
  },
  
  // Bergamo Routes
  {
    from: 'Bergamo BGY',
    to: 'Milano',
    fromLocationId: 'bergamo',
    toLocationId: 'milano',
    prices: {
      'olympic-sedan': 240,
      'olympic-minivan': 270,
      'olympic-van': 520,
      'olympic-luxury': 515
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    }
  },
  {
    from: 'Bergamo BGY',
    to: 'Livigno',
    fromLocationId: 'bergamo',
    toLocationId: 'livigno',
    prices: {
      'olympic-sedan': 950,
      'olympic-minivan': 1100,
      'olympic-van': 1590,
      'olympic-luxury': 1470
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    }
  },
  {
    from: 'Bergamo BGY',
    to: 'Bormio',
    fromLocationId: 'bergamo',
    toLocationId: 'bormio',
    prices: {
      'olympic-sedan': 830,
      'olympic-minivan': 960,
      'olympic-van': 1390,
      'olympic-luxury': 1290
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    }
  },
  {
    from: 'Bergamo BGY',
    to: 'Verona',
    fromLocationId: 'bergamo',
    toLocationId: 'verona',
    prices: {
      'olympic-sedan': 430,
      'olympic-minivan': 500,
      'olympic-van': 990,
      'olympic-luxury': 920
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    }
  },
  
  // Milano Centrale Routes
  {
    from: 'Milano Stazione Centrale',
    to: 'Milano',
    fromLocationId: 'milano-centrale',
    toLocationId: 'milano',
    prices: {
      'olympic-sedan': 125,
      'olympic-minivan': 150,
      'olympic-van': 320,
      'olympic-luxury': 270
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    }
  },
  {
    from: 'Milano Stazione Centrale',
    to: 'Livigno',
    fromLocationId: 'milano-centrale',
    toLocationId: 'livigno',
    prices: {
      'olympic-sedan': 1070,
      'olympic-minivan': 1230,
      'olympic-van': 1590,
      'olympic-luxury': 1470
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    }
  },
  {
    from: 'Milano Stazione Centrale',
    to: 'Bormio',
    fromLocationId: 'milano-centrale',
    toLocationId: 'bormio',
    prices: {
      'olympic-sedan': 920,
      'olympic-minivan': 1170,
      'olympic-van': 1390,
      'olympic-luxury': 1290
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    }
  },
  {
    from: 'Milano Stazione Centrale',
    to: 'Verona',
    fromLocationId: 'milano-centrale',
    toLocationId: 'verona',
    prices: {
      'olympic-sedan': 620,
      'olympic-minivan': 730,
      'olympic-van': 990,
      'olympic-luxury': 920
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    }
  }
]

// Olympic Inter-Cluster Routes - Based on the inter-cluster pricing table
export const OLYMPIC_INTER_CLUSTER_ROUTES: OlympicRoute[] = [
  // Milano Center to Olympic Venues
  {
    from: 'Milano',
    to: 'Bormio',
    fromLocationId: 'milano',
    toLocationId: 'bormio',
    prices: {
      'olympic-sedan': 920,
      'olympic-minivan': 1170,
      'olympic-van': 1170,
      'olympic-luxury': 1170
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    }
  },
  {
    from: 'Milano',
    to: 'Livigno',
    fromLocationId: 'milano',
    toLocationId: 'livigno',
    prices: {
      'olympic-sedan': 1070,
      'olympic-minivan': 1230,
      'olympic-van': 1230,
      'olympic-luxury': 1230
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    }
  },
  {
    from: 'Milano',
    to: 'Cortina d\'Ampezzo',
    fromLocationId: 'milano',
    toLocationId: 'cortina',
    prices: {
      'olympic-sedan': 1380,
      'olympic-minivan': 1620,
      'olympic-van': 1620,
      'olympic-luxury': 1620
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    }
  },
  {
    from: 'Milano',
    to: 'Verona',
    fromLocationId: 'milano',
    toLocationId: 'verona',
    prices: {
      'olympic-sedan': 620,
      'olympic-minivan': 730,
      'olympic-van': 730,
      'olympic-luxury': 730
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    }
  },
  
  // Inter-venue routes
  {
    from: 'Cortina d\'Ampezzo',
    to: 'Bormio',
    fromLocationId: 'cortina',
    toLocationId: 'bormio',
    prices: {
      'olympic-sedan': 1600,
      'olympic-minivan': 1840,
      'olympic-van': 1840,
      'olympic-luxury': 1840
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    }
  },
  {
    from: 'Cortina d\'Ampezzo',
    to: 'Livigno',
    fromLocationId: 'cortina',
    toLocationId: 'livigno',
    prices: {
      'olympic-sedan': 1340,
      'olympic-minivan': 1550,
      'olympic-van': 1550,
      'olympic-luxury': 1550
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    }
  },
  {
    from: 'Cortina d\'Ampezzo',
    to: 'Verona',
    fromLocationId: 'cortina',
    toLocationId: 'verona',
    prices: {
      'olympic-sedan': 950,
      'olympic-minivan': 1070,
      'olympic-van': 1070,
      'olympic-luxury': 1070
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    }
  },
  {
    from: 'Livigno',
    to: 'Bormio',
    fromLocationId: 'livigno',
    toLocationId: 'bormio',
    prices: {
      'olympic-sedan': 460,
      'olympic-minivan': 530,
      'olympic-van': 530,
      'olympic-luxury': 530
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    }
  },
  
  // Additional Milano Center routes from official table
  {
    from: 'Milano',
    to: 'Tirano',
    fromLocationId: 'milano',
    toLocationId: 'tirano',
    prices: {
      'olympic-sedan': 870,
      'olympic-minivan': 1100,
      'olympic-van': 1100,
      'olympic-luxury': 1100
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    }
  },
  {
    from: 'Milano',
    to: 'Anterselva',
    fromLocationId: 'milano',
    toLocationId: 'anterselva',
    prices: {
      'olympic-sedan': 1380,
      'olympic-minivan': 1620,
      'olympic-van': 1620,
      'olympic-luxury': 1620
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    }
  },
  {
    from: 'Milano',
    to: 'Val di Fiemme',
    fromLocationId: 'milano',
    toLocationId: 'val-di-fiemme',
    prices: {
      'olympic-sedan': 1290,
      'olympic-minivan': 1520,
      'olympic-van': 1520,
      'olympic-luxury': 1520
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    }
  },
  {
    from: 'Milano',
    to: 'Venezia',
    fromLocationId: 'milano',
    toLocationId: 'venezia',
    prices: {
      'olympic-sedan': 1020,
      'olympic-minivan': 1200,
      'olympic-van': 1200,
      'olympic-luxury': 1200
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    }
  },
  
  // Additional Cortina routes from official table
  {
    from: 'Cortina Center',
    to: 'Anterselva',
    fromLocationId: 'cortina',
    toLocationId: 'anterselva',
    prices: {
      'olympic-sedan': 460,
      'olympic-minivan': 530,
      'olympic-van': 530,
      'olympic-luxury': 530
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    }
  },
  {
    from: 'Cortina Center',
    to: 'Val di Fiemme',
    fromLocationId: 'cortina',
    toLocationId: 'val-di-fiemme',
    prices: {
      'olympic-sedan': 590,
      'olympic-minivan': 640,
      'olympic-van': 640,
      'olympic-luxury': 640
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    }
  },
  {
    from: 'Cortina Center',
    to: 'Venezia',
    fromLocationId: 'cortina',
    toLocationId: 'venezia',
    prices: {
      'olympic-sedan': 800,
      'olympic-minivan': 860,
      'olympic-van': 860,
      'olympic-luxury': 860
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    }
  }
]

// Olympic Ceremony Events - Special pricing
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

export const OLYMPIC_CEREMONIES: Record<string, OlympicCeremony> = {
  'opening-ceremony': {
    id: 'opening-ceremony',
    name: 'Disposizione per Cerimonia di Apertura',
    date: '2026-02-06',
    venue: 'Stadio San Siro',
    venueLocationId: 'san-siro',
    baseCity: 'Milano',
    baseCityLocationId: 'milano',
    pricing: {
      dispositionBase: {
        'berlina': 1700,        // Berlina per max 3 pax
        'monovolume': 2200,     // Monovolume per max 6 pax (max 4 grandi)
        'minibus': 2900         // Minibus per max 8 pax
      },
      hourlyRate: {
        'berlina': 300,
        'monovolume': 400,
        'minibus': 500
      }
    },
    description: 'Disposizione per Cerimonia di Apertura - Stadio San Siro, Milano',
    notes: [
      'La disposizione si intende su Milano (partenza e ritorno in Milano)',
      'Comprende la disponibilità del mezzo da 2 ore prima dell\'inizio della cerimonia',
      'Include l\'attesa in loco e il transfer finale in città',
      'Nel caso il mezzo dovesse partire da una località differente da Milano, occorrerà valutare l\'extra tratta'
    ]
  },
  'closing-ceremony': {
    id: 'closing-ceremony',
    name: 'Disposizione per Cerimonia di Chiusura',
    date: '2026-02-22',
    venue: 'Arena di Verona',
    venueLocationId: 'arena-verona',
    baseCity: 'Verona',
    baseCityLocationId: 'verona',
    pricing: {
      dispositionBase: {
        'berlina': 1700,        // Berlina per max 3 pax
        'monovolume': 2200,     // Monovolume per max 6 pax (max 4 grandi)
        'minibus': 2900         // Minibus per max 8 pax
      },
      hourlyRate: {
        'berlina': 300,
        'monovolume': 400,
        'minibus': 500
      }
    },
    description: 'Disposizione per Cerimonia di Chiusura - Arena di Verona',
    notes: [
      'La disposizione si intende su Verona (partenza e ritorno in Verona)',
      'Comprende la disponibilità del mezzo da 2 ore prima dell\'inizio della cerimonia',
      'Include l\'attesa in loco e il transfer finale in città',
      'Nel caso il mezzo dovesse partire da una località differente da Verona, occorrerà valutare l\'extra tratta'
    ]
  }
}

// Olympic Service Types
export type OlympicServiceType = 'transfer' | 'transfer-inter-cluster' | 'disposition' | 'ceremony-disposition'

// Olympic Pricing Configuration
export const OLYMPIC_PRICING_CONFIG = {
  period: {
    start: '2026-01-01',
    end: '2026-03-31'
  },
  surcharges: {
    night: {
      percentage: 20, // 20% night surcharge
      startTime: '21:00', // 9:00 PM
      endTime: '06:00'   // 6:00 AM
    }
  },
  vat: {
    rate: 10 // 10% VAT for Olympic period
  },
  cancellationPolicy: {
    // Until October 31, 2025: 100% refund
    fullRefundUntil: '2025-10-31',
    // November 1, 2025 to January 14, 2026: 50% refund
    partialRefundUntil: '2026-01-14',
    partialRefundPercentage: 50,
    // From January 15, 2026: 0% refund
    noRefundFrom: '2026-01-15'
  }
}

// Utility functions
function formatDateToLocal(date: Date): string {
  // Use local date instead of UTC to avoid timezone issues
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isOlympicPeriod(date: Date): boolean {
  const dateStr = formatDateToLocal(date)
  return dateStr >= OLYMPIC_PRICING_CONFIG.period.start && 
         dateStr <= OLYMPIC_PRICING_CONFIG.period.end
}

export function findOlympicRoute(fromLocationId: string, toLocationId: string): OlympicRoute | null {
  // First try standard transfer routes (airport/station to destination)
  const transferRoute = OLYMPIC_TRANSFER_ROUTES.find(route => 
    route.fromLocationId === fromLocationId && route.toLocationId === toLocationId
  )
  
  if (transferRoute) return transferRoute
  
  // Then try inter-cluster routes (destination to destination)
  const interClusterRoute = OLYMPIC_INTER_CLUSTER_ROUTES.find(route => 
    route.fromLocationId === fromLocationId && route.toLocationId === toLocationId
  )
  
  if (interClusterRoute) return interClusterRoute
  
  // Try reverse routes for both
  const reverseTransferRoute = OLYMPIC_TRANSFER_ROUTES.find(route => 
    route.fromLocationId === toLocationId && route.toLocationId === fromLocationId
  )
  
  if (reverseTransferRoute) return reverseTransferRoute
  
  const reverseInterClusterRoute = OLYMPIC_INTER_CLUSTER_ROUTES.find(route => 
    route.fromLocationId === toLocationId && route.toLocationId === fromLocationId
  )
  
  return reverseInterClusterRoute || null
}

export function findOlympicCeremony(date: Date): OlympicCeremony | null {
  const dateStr = formatDateToLocal(date)
  return Object.values(OLYMPIC_CEREMONIES).find(ceremony => 
    ceremony.date === dateStr
  ) || null
}

export function isCeremonyDate(date: Date): boolean {
  return findOlympicCeremony(date) !== null
}

export function getCeremonyName(date: Date): string | null {
  const ceremony = findOlympicCeremony(date)
  return ceremony ? ceremony.name : null
}

export function getOlympicVehicleTypes(): OlympicVehicleType[] {
  return Object.values(OLYMPIC_VEHICLE_TYPES)
}

// Get ceremony-specific vehicle types (only the 3 from the price list)
export function getCeremonyVehicleTypes(): { value: string; label: string; maxPassengers: number; maxLuggage: number; description: string; ceremonyPrice: number }[] {
  return [
    {
      value: 'berlina',
      label: 'Berlina',
      maxPassengers: 3,
      maxLuggage: 3,
      description: 'Max 3 passeggeri',
      ceremonyPrice: 1700
    },
    {
      value: 'monovolume', 
      label: 'Monovolume',
      maxPassengers: 6,
      maxLuggage: 4, // Max 4 grandi con bagagli
      description: 'Max 6 passeggeri (max 4 grandi)',
      ceremonyPrice: 2200
    },
    {
      value: 'minibus',
      label: 'Minibus', 
      maxPassengers: 8,
      maxLuggage: 8,
      description: 'Max 8 passeggeri',
      ceremonyPrice: 2900
    }
  ]
}

export function getOlympicLocations(): OlympicLocation[] {
  return Object.values(OLYMPIC_LOCATIONS)
}

export function isNightTime(timeStr: string): boolean {
  try {
    const [hour, minute] = timeStr.split(':').map(Number)
    const totalMinutes = hour * 60 + minute
    
    // Night time: 21:00 (1260 minutes) to 06:00 (360 minutes)
    return totalMinutes >= 1260 || totalMinutes <= 360
  } catch (error) {
    return false
  }
}

// Map standard vehicle types to ceremony vehicle types
export function mapVehicleToCeremonyType(vehicleType: string): 'berlina' | 'monovolume' | 'minibus' {
  switch (vehicleType) {
    case 'sedan':
    case 'luxury-sedan':
      return 'berlina'
    case 'van':
      return 'monovolume'
    case 'minibus':
      return 'minibus'
    default:
      return 'berlina' // fallback
  }
}

// Calculate ceremony disposition price with transfer logic
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
  const ceremonyVehicleType = mapVehicleToCeremonyType(vehicleType)
  
  // CEREMONY DISPOSITION = FIXED PRICE (no extra hours for standard ceremony service)
  // Base disposition price includes the complete ceremony service:
  // - Transfer from/to base city
  // - 2h availability before ceremony
  // - Waiting during ceremony
  // - Return transfer
  const basePrice = ceremony.pricing.dispositionBase[ceremonyVehicleType]
  
  // NO EXTRA HOURS for standard ceremony disposition service
  // The hourly rate is only for additional services beyond the standard ceremony package
  const extraHours = 0
  const extraHoursCost = 0
  
  // Check if pickup/destination require transfer (outside ceremony base city)
  let transferCost = 0
  let transferRoute = ''
  const transferRoutes: string[] = []
  
  // Helper function to check if location needs transfer
  const needsTransfer = (locationId?: string, coordinates?: { lat: number; lng: number }): boolean => {
    if (locationId) {
      // For location IDs, check if different from ceremony base city
      return locationId !== ceremony.baseCityLocationId
    }
    if (coordinates) {
      // For custom coordinates, check distance from ceremony base city
      // Get ceremony base city coordinates
      const baseCityCoords = getCeremonyBaseCityCoordinates(ceremony.baseCityLocationId)
      if (baseCityCoords) {
        const distance = calculateDistanceKm(coordinates, baseCityCoords)
        return distance > 50 // More than 50km from base city = needs transfer
      }
    }
    return false
  }
  
  // Helper function to find transfer price
  const findTransferPrice = (fromLocationId?: string, toLocationId?: string): OlympicRoute | null => {
    if (!fromLocationId || !toLocationId) return null
    
    // Try direct route first
    let transferPrice = findOlympicRoute(fromLocationId, toLocationId)
    
    // If not found, try reverse route
    if (!transferPrice) {
      transferPrice = findOlympicRoute(toLocationId, fromLocationId)
    }
    
    return transferPrice
  }
  
  // Check pickup transfer (from pickup to ceremony base city)
  if (needsTransfer(pickupLocationId, pickupCoordinates)) {
    const pickupTransfer = findTransferPrice(pickupLocationId || 'custom-location', ceremony.baseCityLocationId)
    
    if (pickupTransfer) {
      const ceremonyOlympicVehicle = mapVehicleToCeremonyOlympicType(ceremonyVehicleType)
      const pickupTransferCost = pickupTransfer.prices[ceremonyOlympicVehicle] || 0
      transferCost += pickupTransferCost
      transferRoutes.push(`${pickupLocationId || 'custom-location'} → ${ceremony.baseCity}`)
      
      console.log("🎪 PICKUP TRANSFER FOUND:", {
        from: pickupLocationId || 'custom-location',
        to: ceremony.baseCityLocationId,
        cost: pickupTransferCost,
        vehicleType: ceremonyOlympicVehicle
      })
    }
  }
  
  // Check destination transfer (from ceremony base city to destination)  
  if (needsTransfer(destinationLocationId, destinationCoordinates)) {
    const destinationTransfer = findTransferPrice(ceremony.baseCityLocationId, destinationLocationId || 'custom-location')
    
    if (destinationTransfer) {
      const ceremonyOlympicVehicle = mapVehicleToCeremonyOlympicType(ceremonyVehicleType)
      const destinationTransferCost = destinationTransfer.prices[ceremonyOlympicVehicle] || 0
      transferCost += destinationTransferCost
      transferRoutes.push(`${ceremony.baseCity} → ${destinationTransfer.to}`)
      
      console.log("🎪 DESTINATION TRANSFER FOUND:", {
        from: ceremony.baseCityLocationId,
        to: destinationLocationId || 'custom-location',
        cost: destinationTransferCost,
        vehicleType: ceremonyOlympicVehicle
      })
    }
  }
  
  // Combine transfer routes for display
  transferRoute = transferRoutes.join(' + ')
  
  console.log("🎪 CEREMONY TOTAL TRANSFERS:", {
    pickupNeedsTransfer: needsTransfer(pickupLocationId, pickupCoordinates),
    destinationNeedsTransfer: needsTransfer(destinationLocationId, destinationCoordinates),
    totalTransferCost: transferCost,
    transferRoutes: transferRoutes
  })
  
  // Subtotal before surcharges (base price + optional transfer)
  let subtotal = basePrice + transferCost
  
  // Night surcharge 20% (19:30-07:30)
  let nightSurcharge = 0
  if (isNight) {
    nightSurcharge = subtotal * 0.20
    subtotal += nightSurcharge
  }
  
  // VAT 10%
  const vatAmount = subtotal * 0.10
  const total = subtotal + vatAmount
  
  return {
    basePrice,
    extraHours,
    extraHoursCost: 0, // Always 0 for standard ceremony service
    transferCost,
    nightSurcharge: Math.round(nightSurcharge * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    transferRoute: transferRoute || undefined
  }
}

// Helper to map ceremony vehicle to olympic vehicle for transfer pricing
function mapVehicleToCeremonyOlympicType(ceremonyType: 'berlina' | 'monovolume' | 'minibus'): keyof OlympicRoute['prices'] {
  switch (ceremonyType) {
    case 'berlina':
      return 'olympic-sedan'
    case 'monovolume':
      return 'olympic-minivan'
    case 'minibus':
      return 'olympic-van'
  }
}

// Helper to get coordinates for ceremony base cities
function getCeremonyBaseCityCoordinates(baseCityLocationId: string): { lat: number; lng: number } | null {
  const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    'milano': { lat: 45.4642, lng: 9.1900 }, // Milano center
    'verona': { lat: 45.4384, lng: 10.9916 } // Verona center
  }
  
  return cityCoordinates[baseCityLocationId] || null
}

// Helper to calculate distance between two coordinates in kilometers
function calculateDistanceKm(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
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