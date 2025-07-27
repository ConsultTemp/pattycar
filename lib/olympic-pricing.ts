// Olympic Winter Games Milano-Cortina 2026 Configuration
// Period: January - March 2026

import { findLocationByGeography, shouldUseListinoPricing } from './locality-mapping'

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
    description: '3 passengers + 2 large + 1 small luggage',
    category: 'standard'
  },

  'olympic-minivan': {
    id: 'olympic-minivan',
    name: 'minivan',
    displayName: 'Mini Van',
    maxPassengers: 6,
    maxPassengersWithLuggage: 6,
    maxLuggage: 6,
    description: '6 passengers + 6 luggage',
    category: 'standard'
  },
  'olympic-van': {
    id: 'olympic-van',
    name: 'van',
    displayName: 'Van',
    maxPassengers: 8,
    maxPassengersWithLuggage: 8,
    maxLuggage: 8,
    description: '8 passengers + 8 luggage',
    category: 'standard'
  },
  'olympic-luxury': {
    id: 'olympic-luxury',
    name: 'luxury',
    displayName: 'Luxury Sedan',
    maxPassengers: 2,
    maxPassengersWithLuggage: 2,
    maxLuggage: 2,
    description: '2 passengers + 2 luggage',
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
    displayName: 'Venezia Hotel',
    coordinates: { lat: 45.4408, lng: 12.3155 },
    type: 'city',
    isOlympicDestination: true
  },
  
  // NEW: Venezia VCE (Marco Polo Airport) - separate from city/station
  'venezia-marco-polo': {
    id: 'venezia-marco-polo',
    name: 'Venezia VCE',
    displayName: 'Venezia Marco Polo (VCE)',
    coordinates: { lat: 45.5053, lng: 12.3519 }, // Marco Polo Airport coordinates (matching event-pricing.ts)
    type: 'airport',
    isOlympicDestination: false
  },
  
  'treviso': {
    id: 'treviso',
    name: 'Treviso',
    displayName: 'Treviso',
    coordinates: { lat: 45.6684, lng: 12.2431 },
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
    'olympic-van'?: number // Optional for inter-cluster routes
    'olympic-luxury'?: number // Optional for inter-cluster routes
  }
  extraHourRates: {
    'olympic-sedan': number
    'olympic-minivan': number
    'olympic-van'?: number // Optional for inter-cluster routes
    'olympic-luxury'?: number // Optional for inter-cluster routes
  }
  isEastCluster?: boolean
  isInterCluster?: boolean // NEW: flag to identify inter-cluster routes
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
  },
  
  // Venezia VCE Routes
  {
    from: 'Venezia VCE',
    to: 'Cortina',
    fromLocationId: 'venezia-marco-polo',
    toLocationId: 'cortina',
    prices: {
      'olympic-sedan': 590,
      'olympic-minivan': 640,
      'olympic-van': 896,
      'olympic-luxury': 768
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    isEastCluster: true
  },
  {
    from: 'Venezia VCE',
    to: 'Anterselva',
    fromLocationId: 'venezia-marco-polo',
    toLocationId: 'anterselva',
    prices: {
      'olympic-sedan': 760,
      'olympic-minivan': 825,
      'olympic-van': 1155,
      'olympic-luxury': 990
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    isEastCluster: true
  },
  {
    from: 'Venezia VCE',
    to: 'Anterselva (via A22)',
    fromLocationId: 'venezia-marco-polo',
    toLocationId: 'anterselva',
    prices: {
      'olympic-sedan': 1370,
      'olympic-minivan': 1470,
      'olympic-van': 2058,
      'olympic-luxury': 1764
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    isEastCluster: true
  },
  {
    from: 'Venezia VCE',
    to: 'Val di Fiemme',
    fromLocationId: 'venezia-marco-polo',
    toLocationId: 'val-di-fiemme',
    prices: {
      'olympic-sedan': 730,
      'olympic-minivan': 780,
      'olympic-van': 1092,
      'olympic-luxury': 936
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    isEastCluster: true
  },
  {
    from: 'Venezia VCE',
    to: 'Verona',
    fromLocationId: 'venezia-marco-polo',
    toLocationId: 'verona',
    prices: {
      'olympic-sedan': 510,
      'olympic-minivan': 550,
      'olympic-van': 770,
      'olympic-luxury': 660
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    isEastCluster: true
  },
  
  // Treviso TSF Routes
  {
    from: 'Treviso TSF',
    to: 'Cortina',
    fromLocationId: 'treviso',
    toLocationId: 'cortina',
    prices: {
      'olympic-sedan': 570,
      'olympic-minivan': 620,
      'olympic-van': 868,
      'olympic-luxury': 744
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    isEastCluster: true
  },
  {
    from: 'Treviso TSF',
    to: 'Anterselva',
    fromLocationId: 'treviso',
    toLocationId: 'anterselva',
    prices: {
      'olympic-sedan': 760,
      'olympic-minivan': 830,
      'olympic-van': 1162,
      'olympic-luxury': 996
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    isEastCluster: true
  },
  {
    from: 'Treviso TSF',
    to: 'Anterselva (via A22)',
    fromLocationId: 'treviso',
    toLocationId: 'anterselva',
    prices: {
      'olympic-sedan': 1360,
      'olympic-minivan': 1470,
      'olympic-van': 2058,
      'olympic-luxury': 1764
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    isEastCluster: true
  },
  {
    from: 'Treviso TSF',
    to: 'Val di Fiemme',
    fromLocationId: 'treviso',
    toLocationId: 'val-di-fiemme',
    prices: {
      'olympic-sedan': 670,
      'olympic-minivan': 710,
      'olympic-van': 994,
      'olympic-luxury': 852
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    isEastCluster: true
  },
  {
    from: 'Treviso TSF',
    to: 'Verona',
    fromLocationId: 'treviso',
    toLocationId: 'verona',
    prices: {
      'olympic-sedan': 510,
      'olympic-minivan': 550,
      'olympic-van': 770,
      'olympic-luxury': 660
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    isEastCluster: true
  },
  
  // Venezia Santa Lucia Routes
  {
    from: 'Venezia Stazione Santa Lucia',
    to: 'Cortina',
    fromLocationId: 'venezia',
    toLocationId: 'cortina',
    prices: {
      'olympic-sedan': 590,
      'olympic-minivan': 650,
      'olympic-van': 910,
      'olympic-luxury': 780
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    isEastCluster: true
  },
  {
    from: 'Venezia Stazione Santa Lucia',
    to: 'Anterselva',
    fromLocationId: 'venezia',
    toLocationId: 'anterselva',
    prices: {
      'olympic-sedan': 790,
      'olympic-minivan': 860,
      'olympic-van': 1204,
      'olympic-luxury': 1032
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    isEastCluster: true
  },
  {
    from: 'Venezia Stazione Santa Lucia',
    to: 'Anterselva (via A22)',
    fromLocationId: 'venezia',
    toLocationId: 'anterselva',
    prices: {
      'olympic-sedan': 1460,
      'olympic-minivan': 1470,
      'olympic-van': 2058,
      'olympic-luxury': 1764
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    isEastCluster: true
  },
  {
    from: 'Venezia Stazione Santa Lucia',
    to: 'Val di Fiemme',
    fromLocationId: 'venezia',
    toLocationId: 'val-di-fiemme',
    prices: {
      'olympic-sedan': 750,
      'olympic-minivan': 740,
      'olympic-van': 1036,
      'olympic-luxury': 888
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    isEastCluster: true
  },
  {
    from: 'Venezia Stazione Santa Lucia',
    to: 'Verona',
    fromLocationId: 'venezia',
    toLocationId: 'verona',
    prices: {
      'olympic-sedan': 540,
      'olympic-minivan': 590,
      'olympic-van': 826,
      'olympic-luxury': 708
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    isEastCluster: true
  }
]

// Olympic Transfer between cities Routes - Based on the inter-cluster pricing table
export const OLYMPIC_INTER_CLUSTER_ROUTES: OlympicRoute[] = [
  // Milano Center to Olympic Venues
  {
    from: 'Milano',
    to: 'Bormio',
    fromLocationId: 'milano',
    toLocationId: 'bormio',
    prices: {
      'olympic-sedan': 920,
      'olympic-minivan': 1170
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108
    },
    isInterCluster: true
  },
  {
    from: 'Milano',
    to: 'Livigno',
    fromLocationId: 'milano',
    toLocationId: 'livigno',
    prices: {
      'olympic-sedan': 1070,
      'olympic-minivan': 1230
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108
    },
    isInterCluster: true
  },
  {
    from: 'Milano',
    to: 'Cortina d\'Ampezzo',
    fromLocationId: 'milano',
    toLocationId: 'cortina',
    prices: {
      'olympic-sedan': 1380,
      'olympic-minivan': 1620
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108
    },
    isInterCluster: true
  },
  {
    from: 'Milano',
    to: 'Verona',
    fromLocationId: 'milano',
    toLocationId: 'verona',
    prices: {
      'olympic-sedan': 620,
      'olympic-minivan': 730
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108
    },
    isInterCluster: true
  },
  
  // Inter-venue routes
  {
    from: 'Cortina d\'Ampezzo',
    to: 'Bormio',
    fromLocationId: 'cortina',
    toLocationId: 'bormio',
    prices: {
      'olympic-sedan': 1600,
      'olympic-minivan': 1840
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108
    },
    isInterCluster: true
  },
  {
    from: 'Cortina d\'Ampezzo',
    to: 'Livigno',
    fromLocationId: 'cortina',
    toLocationId: 'livigno',
    prices: {
      'olympic-sedan': 1340,
      'olympic-minivan': 1550
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108
    },
    isInterCluster: true
  },
  {
    from: 'Cortina d\'Ampezzo',
    to: 'Verona',
    fromLocationId: 'cortina',
    toLocationId: 'verona',
    prices: {
      'olympic-sedan': 950,
      'olympic-minivan': 1070
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108
    },
    isInterCluster: true
  },
  {
    from: 'Livigno',
    to: 'Bormio',
    fromLocationId: 'livigno',
    toLocationId: 'bormio',
    prices: {
      'olympic-sedan': 460,
      'olympic-minivan': 530
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108
    },
    isInterCluster: true
  },
  
  // Additional Milano Center routes from official table
  {
    from: 'Milano',
    to: 'Tirano',
    fromLocationId: 'milano',
    toLocationId: 'tirano',
    prices: {
      'olympic-sedan': 870,
      'olympic-minivan': 1100
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108
    },
    isInterCluster: true
  },
  {
    from: 'Milano',
    to: 'Anterselva',
    fromLocationId: 'milano',
    toLocationId: 'anterselva',
    prices: {
      'olympic-sedan': 1380,
      'olympic-minivan': 1620
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108
    },
    isInterCluster: true
  },
  {
    from: 'Milano',
    to: 'Val di Fiemme',
    fromLocationId: 'milano',
    toLocationId: 'val-di-fiemme',
    prices: {
      'olympic-sedan': 1290,
      'olympic-minivan': 1520
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108
    },
    isInterCluster: true
  },
  {
    from: 'Milano',
    to: 'Venezia',
    fromLocationId: 'milano',
    toLocationId: 'venezia',
    prices: {
      'olympic-sedan': 1020,
      'olympic-minivan': 1200
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108
    },
    isInterCluster: true
  },
  
  // Additional Cortina routes from official table
  {
    from: 'Cortina Center',
    to: 'Anterselva',
    fromLocationId: 'cortina',
    toLocationId: 'anterselva',
    prices: {
      'olympic-sedan': 460,
      'olympic-minivan': 530
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108
    },
    isInterCluster: true
  },
  {
    from: 'Cortina Center',
    to: 'Val di Fiemme',
    fromLocationId: 'cortina',
    toLocationId: 'val-di-fiemme',
    prices: {
      'olympic-sedan': 590,
      'olympic-minivan': 640
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108
    },
    isInterCluster: true
  },
  {
    from: 'Cortina Center',
    to: 'Venezia',
    fromLocationId: 'cortina',
    toLocationId: 'venezia',
    prices: {
      'olympic-sedan': 800,
      'olympic-minivan': 860
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108
    },
    isInterCluster: true
  },
  
  // Additional route from pricing table
  {
    from: 'Cortina',
    to: 'Venezia Hotel (incl. water taxi)',
    fromLocationId: 'cortina',
    toLocationId: 'venezia',
    prices: {
      'olympic-sedan': 800,
      'olympic-minivan': 860
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108
    },
    isInterCluster: true,
    isEastCluster: true
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
      'La disposizione si intende con partenza da Milano',
      'Comprende la disponibilità del mezzo da 2 ore prima dell\'inizio della cerimonia',
      'Include l\'attesa in loco durante la cerimonia',
      'Nel caso il mezzo dovesse partire da una località differente da Milano, occorrerà valutare l\'extra tratta',
      'Il servizio NON include il transfer di ritorno'
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
      'La disposizione si intende con partenza da Verona',
      'Comprende la disponibilità del mezzo da 2 ore prima dell\'inizio della cerimonia',
      'Include l\'attesa in loco durante la cerimonia',
      'Nel caso il mezzo dovesse partire da una località differente da Verona, occorrerà valutare l\'extra tratta',
      'Il servizio NON include il transfer di ritorno'
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
  
  if (transferRoute) {
    return transferRoute
  }
  
  // Try airport/station routes
  const airportStationRoute = OLYMPIC_AIRPORT_STATION_ROUTES.find(route => 
    route.fromLocationId === fromLocationId && route.toLocationId === toLocationId
  )
  
  if (airportStationRoute) {
    return airportStationRoute
  }
  
  // Then try inter-cluster routes (destination to destination)
  
  const interClusterRoute = OLYMPIC_INTER_CLUSTER_ROUTES.find(route => 
    route.fromLocationId === fromLocationId && route.toLocationId === toLocationId
  )
  
  if (interClusterRoute) {
    return interClusterRoute
  }
  
  
  const reverseTransferRoute = OLYMPIC_TRANSFER_ROUTES.find(route => 
    route.fromLocationId === toLocationId && route.toLocationId === fromLocationId
  )
  
  if (reverseTransferRoute) {
    return reverseTransferRoute
  }
  
  const reverseAirportStationRoute = OLYMPIC_AIRPORT_STATION_ROUTES.find(route => 
    route.fromLocationId === toLocationId && route.toLocationId === fromLocationId
  )
  
  if (reverseAirportStationRoute) {
    return reverseAirportStationRoute
  }
  
  const reverseInterClusterRoute = OLYMPIC_INTER_CLUSTER_ROUTES.find(route => 
    route.fromLocationId === toLocationId && route.toLocationId === fromLocationId
  )
  
  if (reverseInterClusterRoute) {
    return reverseInterClusterRoute
  }
  
  return null
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
      value: 'minivan', 
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
    case 'berlina':
      return 'berlina'
    case 'van':
    case 'minivan':
    case 'monovolume':
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
  // - 2h availability before ceremony
  // - Waiting during ceremony
  // - Service at ceremony venue
  // Note: Return transfer is NOT included - only outbound transfer if needed
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
    // Get ceremony base city coordinates for distance calculation
    const baseCityCoords = getCeremonyBaseCityCoordinates(ceremony.baseCityLocationId)
    if (!baseCityCoords) return false
    
    if (locationId) {
      // For location IDs, first try to get coordinates from OLYMPIC_LOCATIONS or LOCATION_REGISTRY
      let locationCoords: { lat: number; lng: number } | null = null
      
      // Check OLYMPIC_LOCATIONS first
      const olympicLocation = OLYMPIC_LOCATIONS[locationId]
      if (olympicLocation) {
        locationCoords = olympicLocation.coordinates
      } else {
        // Check LOCATION_REGISTRY from event-pricing
        try {
          const { getLocationById } = require('@/lib/event-pricing')
          const location = getLocationById(locationId)
          if (location) {
            locationCoords = location.coordinates
          }
        } catch (error) {
        }
      }
      
      if (locationCoords) {
        // Use geographical distance check (10km radius around ceremony base city)
        const distance = calculateDistanceKm(locationCoords, baseCityCoords)
        return distance > 10 // More than 10km from base city = needs transfer
      } else {
        // Fallback: if can't find coordinates, use ID comparison
        return locationId !== ceremony.baseCityLocationId
      }
    }
    
    if (coordinates) {
      // For custom coordinates, check distance from ceremony base city (10km radius)
      const distance = calculateDistanceKm(coordinates, baseCityCoords)
      return distance > 10 // More than 10km from base city = needs transfer
    }
    
    return false
  }
  
  // Helper function to find transfer price
  const findTransferPrice = (fromLocationId?: string, toLocationId?: string, fromCoords?: { lat: number; lng: number }, toCoords?: { lat: number; lng: number }): OlympicRoute | null => {
    if (!fromLocationId || !toLocationId) return null
    
    // Try direct route first
    let transferPrice = findOlympicRoute(fromLocationId, toLocationId)
    
    // If not found, try reverse route
    if (!transferPrice) {
      transferPrice = findOlympicRoute(toLocationId, fromLocationId)
    }
    
    return transferPrice
  }
  
  // Helper function to calculate custom transfer price using complete transfer algorithm
  const calculateCustomTransferPrice = (fromCoords: { lat: number; lng: number }, toCoords: { lat: number; lng: number }, vehicleType: keyof OlympicRoute['prices']): number => {
    const distanceKm = calculateDistanceKm(fromCoords, toCoords)
    
    // Map Olympic vehicle type to standard vehicle type for pricing calculation
    const vehicleTypeMapping: Record<keyof OlympicRoute['prices'], string> = {
      'olympic-sedan': 'berlina',
      'olympic-minivan': 'monovolume', 
      'olympic-van': 'minibus',
      'olympic-luxury': 'luxury-sedan'
    }
    
    const standardVehicleType = vehicleTypeMapping[vehicleType]
    
    // Use the complete transfer pricing algorithm (same as regular transfers)
    const { calculateTotalPrice } = require('@/lib/pricing-config')
    
    // Calculate transfer using complete algorithm with default passenger/luggage config
    const transferPricing = calculateTotalPrice(
      distanceKm,
      standardVehicleType,
      1, // passengers - default to 1 for transfer calculation
      0, // luggage - default to 0 for transfer calculation  
      1, // vehicleCount - single vehicle for this calculation
      undefined, // hour - no specific time for custom transfer
      undefined, // minutes
      undefined, // ampm
      fromCoords,
      toCoords
    )
    
    
    
    // Return basePrice (without VAT) since ceremony calculation applies its own VAT
    return transferPricing.basePrice
  }
  
  // Helper function to get location display name
  const getLocationDisplayName = (locationId?: string): string => {
    if (!locationId) return 'custom-location'
    
    // Find in Olympic locations
    const olympicLocation = OLYMPIC_LOCATIONS[locationId]
    if (olympicLocation) return olympicLocation.displayName
    
    // Fallback to locationId
    return locationId
  }

  // Check pickup transfer (from pickup to ceremony base city)
  if (needsTransfer(pickupLocationId, pickupCoordinates)) {
    const ceremonyOlympicVehicle = mapVehicleToCeremonyOlympicType(ceremonyVehicleType)
    let pickupTransferCost = 0
    
    // First try to find predefined route
    const pickupTransfer = findTransferPrice(pickupLocationId || 'custom-location', ceremony.baseCityLocationId)
    
    if (pickupTransfer) {
      // Use predefined route price
      pickupTransferCost = pickupTransfer.prices[ceremonyOlympicVehicle] || 0
      
    } else if (pickupCoordinates) {
      // No predefined route found, check if coordinates match a listino location within 10km
      
      const locationMapping = findLocationByGeography(pickupCoordinates)
      if (locationMapping.locationId && locationMapping.confidence > 0.7) {
        // Found a location in listino within 10km radius, use predefined route
        
        const mappedTransfer = findTransferPrice(locationMapping.locationId, ceremony.baseCityLocationId)
        if (mappedTransfer) {
          pickupTransferCost = mappedTransfer.prices[ceremonyOlympicVehicle] || 0
        } else {
          // Fallback to distance calculation
          const baseCityCoords = getCeremonyBaseCityCoordinates(ceremony.baseCityLocationId)
          if (baseCityCoords) {
            pickupTransferCost = calculateCustomTransferPrice(pickupCoordinates, baseCityCoords, ceremonyOlympicVehicle)
          }
        }
      } else {
        // No listino location found, calculate based on distance
        const baseCityCoords = getCeremonyBaseCityCoordinates(ceremony.baseCityLocationId)
        if (baseCityCoords) {
          pickupTransferCost = calculateCustomTransferPrice(pickupCoordinates, baseCityCoords, ceremonyOlympicVehicle)
          
        }
      }
    } else {
    }
    
    if (pickupTransferCost > 0) {
      transferCost += pickupTransferCost
      const pickupDisplayName = getLocationDisplayName(pickupLocationId) || 'Posizione Custom'
      transferRoutes.push(`${pickupDisplayName} → ${ceremony.baseCity}`)
    }
  }
  
  // Note: Destination transfer (return) is NOT calculated for ceremony dispositions
  // The ceremony disposition price includes only:
  // 1. Base ceremony service at venue
  // 2. Optional pickup transfer (if outside base city)
  // No return transfer is included in the price
  
  // Combine transfer routes for display
  transferRoute = transferRoutes.join(' + ')
  
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

// Olympic Airport/Station Transfer Routes - Airport and Train station Arrival and Departure Rates
// Olympic Period rates from January - March 2026
export const OLYMPIC_AIRPORT_STATION_ROUTES: OlympicRoute[] = [
  // Milano Malpensa routes
  {
    from: 'Milano Malpensa MXP',
    to: 'Milano City Center',
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

  // Milano Linate routes
  {
    from: 'Milano Linate LIN',
    to: 'Milano City Center',
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

  // Bergamo BGY routes
  {
    from: 'Bergamo BGY',
    to: 'Milano City Center',
    fromLocationId: 'orio-al-serio',
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
    fromLocationId: 'orio-al-serio',
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
    fromLocationId: 'orio-al-serio',
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
    fromLocationId: 'orio-al-serio',
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

  // Milano Stazione Centrale routes
  {
    from: 'Milano Stazione Centrale',
    to: 'Milano City Center',
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

// Helper functions for inter-cluster route detection

/**
 * Check if a route is an inter-cluster route (only sedan and minivan available)
 */
export function isInterClusterRoute(fromLocationId: string, toLocationId: string): boolean {
  const route = findOlympicRoute(fromLocationId, toLocationId)
  return route?.isInterCluster === true
}

/**
 * Get available Olympic vehicle types for a route
 * @param fromLocationId - Starting location ID
 * @param toLocationId - Destination location ID
 * @returns Array of available Olympic vehicle type keys
 */
export function getAvailableOlympicVehicleTypes(fromLocationId?: string, toLocationId?: string): (keyof OlympicRoute['prices'])[] {
  // Default to all vehicle types if no locations provided
  if (!fromLocationId || !toLocationId) {
    return ['olympic-sedan', 'olympic-minivan', 'olympic-van', 'olympic-luxury']
  }

  // Check if this is an inter-cluster route
  if (isInterClusterRoute(fromLocationId, toLocationId)) {
    return ['olympic-sedan', 'olympic-minivan'] // Only sedan and minivan for inter-cluster
  }

  // Default to all vehicle types for airport/station transfers
  return ['olympic-sedan', 'olympic-minivan', 'olympic-van', 'olympic-luxury']
}

/**
 * Check if an Olympic vehicle type is available for a specific route
 */
export function isOlympicVehicleTypeAvailable(
  vehicleType: keyof OlympicRoute['prices'], 
  fromLocationId?: string, 
  toLocationId?: string
): boolean {
  const availableTypes = getAvailableOlympicVehicleTypes(fromLocationId, toLocationId)
  return availableTypes.includes(vehicleType)
}



