/**
 * Event Pricing Configuration for Olympic Period 2026
 * Based on official price lists: Janeiro - March 2026
 */

// Location interface for Olympic venues and transport hubs
export interface Location {
  id: string
  name: string
  displayName: string
  coordinates: { lat: number; lng: number }
  type: 'city' | 'airport' | 'station' | 'olympic-venue'
  // Area coverage for cities (radius in km from coordinates)
  coverageRadius?: number
  services: {
    meetGreetArrivals?: {
      enabled: boolean
      serviceId: string
    }
    meetGreetDepartures?: {
      enabled: boolean
      serviceId: string
    }
    olympicTransfers?: {
      enabled: boolean
      routes: string[]
    }
  }
}

// Olympic Period location registry - OFFICIAL VENUES AND HUBS ONLY
export const OLYMPIC_LOCATIONS: Location[] = [
  // Airports
  {
    id: 'malpensa-airport',
    name: 'Milano Malpensa Airport',
    displayName: 'Milano Malpensa (MXP)',
    coordinates: { lat: 45.6306, lng: 8.7281 },
    type: 'airport',
    services: {
      meetGreetArrivals: { enabled: true, serviceId: 'malpensa-arrivals' },
      meetGreetDepartures: { enabled: true, serviceId: 'malpensa-departures' },
      olympicTransfers: { enabled: true, routes: ['mxp-olympic'] }
    }
  },
  {
    id: 'linate-airport',
    name: 'Milano Linate Airport',
    displayName: 'Milano Linate (LIN)',
    coordinates: { lat: 45.4454, lng: 9.2767 },
    type: 'airport',
    services: {
      meetGreetArrivals: { enabled: true, serviceId: 'linate-arrivals' },
      meetGreetDepartures: { enabled: true, serviceId: 'linate-departures' },
      olympicTransfers: { enabled: true, routes: ['lin-olympic'] }
    }
  },
  {
    id: 'bergamo-airport',
    name: 'Bergamo Orio al Serio Airport',
    displayName: 'Bergamo (BGY)',
    coordinates: { lat: 45.6739, lng: 9.7047 },
    type: 'airport',
    services: {
      meetGreetArrivals: { enabled: true, serviceId: 'bergamo-arrivals' },
      meetGreetDepartures: { enabled: true, serviceId: 'bergamo-departures' },
      olympicTransfers: { enabled: true, routes: ['bgy-olympic'] }
    }
  },
  {
    id: 'venezia-airport',
    name: 'Venezia Marco Polo Airport',
    displayName: 'Venezia Marco Polo (VCE)',
    coordinates: { lat: 45.5053, lng: 12.3519 },
    type: 'airport',
    services: {
      meetGreetArrivals: { enabled: true, serviceId: 'venezia-arrivals' },
      meetGreetDepartures: { enabled: true, serviceId: 'venezia-departures' },
      olympicTransfers: { enabled: true, routes: ['vce-olympic'] }
    }
  },
  {
    id: 'treviso-airport',
    name: 'Treviso Antonio Canova Airport',
    displayName: 'Treviso (TSF)',
    coordinates: { lat: 45.6484, lng: 12.1944 },
    type: 'airport',
    services: {
      meetGreetArrivals: { enabled: true, serviceId: 'treviso-arrivals' },
      meetGreetDepartures: { enabled: true, serviceId: 'treviso-departures' },
      olympicTransfers: { enabled: true, routes: ['tsf-olympic'] }
    }
  },

  // Train Stations
  {
    id: 'milano-centrale',
    name: 'Milano Stazione Centrale',
    displayName: 'Milano Centrale',
    coordinates: { lat: 45.4868, lng: 9.2037 },
    type: 'station',
    services: {
      meetGreetArrivals: { enabled: true, serviceId: 'milano-centrale-arrivals' },
      meetGreetDepartures: { enabled: true, serviceId: 'milano-centrale-departures' },
      olympicTransfers: { enabled: true, routes: ['milano-centrale-olympic'] }
    }
  },
  {
    id: 'venezia-santa-lucia',
    name: 'Venezia Stazione Santa Lucia',
    displayName: 'Venezia S. Lucia',
    coordinates: { lat: 45.4418, lng: 12.3209 },
    type: 'station',
    services: {
      meetGreetArrivals: { enabled: true, serviceId: 'venezia-station-arrivals' },
      meetGreetDepartures: { enabled: true, serviceId: 'venezia-station-departures' },
      olympicTransfers: { enabled: true, routes: ['venezia-station-olympic'] }
    }
  },

  // Cities and Olympic Venues
  {
    id: 'milano-center',
    name: 'Milano City Center',
    displayName: 'Milano Centro',
    coordinates: { lat: 45.4642, lng: 9.1900 },
    type: 'city',
    coverageRadius: 10, // 10km radius for Milano hinterland
    services: {
      olympicTransfers: { enabled: true, routes: ['milano-olympic'] }
    }
  },
  {
    id: 'cortina',
    name: 'Cortina d\'Ampezzo',
    displayName: 'Cortina',
    coordinates: { lat: 46.5369, lng: 12.1357 },
    type: 'olympic-venue',
    services: {
      olympicTransfers: { enabled: true, routes: ['cortina-olympic'] }
    }
  },
  {
    id: 'anterselva',
    name: 'Anterselva',
    displayName: 'Anterselva',
    coordinates: { lat: 46.7342, lng: 12.0889 },
    type: 'olympic-venue',
    services: {
      olympicTransfers: { enabled: true, routes: ['anterselva-olympic'] }
    }
  },
  {
    id: 'predazzo',
    name: 'Val di Fiemme - Predazzo',
    displayName: 'Predazzo',
    coordinates: { lat: 46.3090, lng: 11.6032 },
    type: 'olympic-venue',
    services: {
      olympicTransfers: { enabled: true, routes: ['predazzo-olympic'] }
    }
  },
  {
    id: 'tesero',
    name: 'Val di Fiemme - Tesero',
    displayName: 'Tesero',
    coordinates: { lat: 46.2928, lng: 11.5541 },
    type: 'olympic-venue',
    services: {
      olympicTransfers: { enabled: true, routes: ['tesero-olympic'] }
    }
  },
  {
    id: 'verona',
    name: 'Verona',
    displayName: 'Verona',
    coordinates: { lat: 45.4384, lng: 10.9916 },
    type: 'city',
    services: {
      olympicTransfers: { enabled: true, routes: ['verona-olympic'] }
    }
  },
  {
    id: 'livigno',
    name: 'Livigno',
    displayName: 'Livigno',
    coordinates: { lat: 46.5344, lng: 10.1344 },
    type: 'olympic-venue',
    services: {
      olympicTransfers: { enabled: true, routes: ['livigno-olympic'] }
    }
  },
  {
    id: 'bormio',
    name: 'Bormio',
    displayName: 'Bormio',
    coordinates: { lat: 46.4672, lng: 10.3697 },
    type: 'olympic-venue',
    services: {
      olympicTransfers: { enabled: true, routes: ['bormio-olympic'] }
    }
  },
  {
    id: 'tirano',
    name: 'Tirano',
    displayName: 'Tirano',
    coordinates: { lat: 46.2156, lng: 10.1617 },
    type: 'city',
    services: {
      olympicTransfers: { enabled: true, routes: ['tirano-olympic'] }
    }
  },
  {
    id: 'venezia-hotels',
    name: 'Venezia Hotels',
    displayName: 'Venezia (incl. water taxi)',
    coordinates: { lat: 45.4408, lng: 12.3155 },
    type: 'city',
    services: {
      olympicTransfers: { enabled: true, routes: ['venezia-hotels-olympic'] }
    }
  }
]

// Olympic vehicle type mapping for pricing
export type OlympicVehicleType = 'sedan' | 'suv' | 'minivan' | 'tesla' | 'van' | 'luxury'

// Olympic route interface matching the price lists
export interface OlympicRoute {
  id: string
  from: string
  fromLocationId: string
  to: string
  toLocationId: string
  prices: {
    sedan: number
    suv: number
    minivan: number
    tesla: number
    van: number
    luxury: number
  }
  extraHourRates: {
    sedan: number
    suv: number
    minivan: number
    tesla: number
    van: number
    luxury: number
  }
  isEastCluster?: boolean
  notes?: string
}

// Olympic transfer routes based on the official price lists
export const OLYMPIC_ROUTES: OlympicRoute[] = [
  // Milano Malpensa routes
  {
    id: 'malpensa-milano-center',
    from: 'Milano Malpensa MXP',
    fromLocationId: 'malpensa-airport',
    to: 'Milano City Center',
    toLocationId: 'milano-center',
    prices: { sedan: 220, suv: 220, minivan: 255, tesla: 255, van: 490, luxury: 470 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },
  {
    id: 'malpensa-livigno',
    from: 'Milano Malpensa MXP',
    fromLocationId: 'malpensa-airport',
    to: 'Livigno',
    toLocationId: 'livigno',
    prices: { sedan: 1100, suv: 1100, minivan: 1270, tesla: 1270, van: 1780, luxury: 1630 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },
  {
    id: 'malpensa-bormio',
    from: 'Milano Malpensa MXP',
    fromLocationId: 'malpensa-airport',
    to: 'Bormio',
    toLocationId: 'bormio',
    prices: { sedan: 990, suv: 990, minivan: 1150, tesla: 1150, van: 1540, luxury: 1430 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },
  {
    id: 'malpensa-verona',
    from: 'Milano Malpensa MXP',
    fromLocationId: 'malpensa-airport',
    to: 'Verona',
    toLocationId: 'verona',
    prices: { sedan: 710, suv: 710, minivan: 830, tesla: 830, van: 1250, luxury: 1130 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },
  {
    id: 'malpensa-cortina',
    from: 'Milano Malpensa MXP',
    fromLocationId: 'malpensa-airport',
    to: 'Cortina',
    toLocationId: 'cortina',
    prices: { sedan: 1350, suv: 1350, minivan: 1580, tesla: 1580, van: 2100, luxury: 1950 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },

  // Milano Linate routes
  {
    id: 'linate-milano-center',
    from: 'Milano Linate LIN',
    fromLocationId: 'linate-airport',
    to: 'Milano City Center',
    toLocationId: 'milano-center',
    prices: { sedan: 135, suv: 135, minivan: 150, tesla: 150, van: 330, luxury: 285 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },
  {
    id: 'linate-livigno',
    from: 'Milano Linate LIN',
    fromLocationId: 'linate-airport',
    to: 'Livigno',
    toLocationId: 'livigno',
    prices: { sedan: 1070, suv: 1070, minivan: 1230, tesla: 1230, van: 1590, luxury: 1470 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },
  {
    id: 'linate-bormio',
    from: 'Milano Linate LIN',
    fromLocationId: 'linate-airport',
    to: 'Bormio',
    toLocationId: 'bormio',
    prices: { sedan: 920, suv: 920, minivan: 1170, tesla: 1170, van: 1390, luxury: 1290 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },
  {
    id: 'linate-verona',
    from: 'Milano Linate LIN',
    fromLocationId: 'linate-airport',
    to: 'Verona',
    toLocationId: 'verona',
    prices: { sedan: 620, suv: 620, minivan: 730, tesla: 730, van: 990, luxury: 920 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },
  {
    id: 'linate-cortina',
    from: 'Milano Linate LIN',
    fromLocationId: 'linate-airport',
    to: 'Cortina',
    toLocationId: 'cortina',
    prices: { sedan: 1300, suv: 1300, minivan: 1520, tesla: 1520, van: 1980, luxury: 1830 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },

  // Bergamo routes
  {
    id: 'bergamo-milano-center',
    from: 'Bergamo BGY',
    fromLocationId: 'bergamo-airport',
    to: 'Milano City Center',
    toLocationId: 'milano-center',
    prices: { sedan: 240, suv: 240, minivan: 270, tesla: 270, van: 520, luxury: 515 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },
  {
    id: 'bergamo-livigno',
    from: 'Bergamo BGY',
    fromLocationId: 'bergamo-airport',
    to: 'Livigno',
    toLocationId: 'livigno',
    prices: { sedan: 950, suv: 950, minivan: 1100, tesla: 1100, van: 1590, luxury: 1470 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },
  {
    id: 'bergamo-bormio',
    from: 'Bergamo BGY',
    fromLocationId: 'bergamo-airport',
    to: 'Bormio',
    toLocationId: 'bormio',
    prices: { sedan: 830, suv: 830, minivan: 960, tesla: 960, van: 1390, luxury: 1290 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },
  {
    id: 'bergamo-verona',
    from: 'Bergamo BGY',
    fromLocationId: 'bergamo-airport',
    to: 'Verona',
    toLocationId: 'verona',
    prices: { sedan: 430, suv: 430, minivan: 500, tesla: 500, van: 990, luxury: 920 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },
  {
    id: 'bergamo-cortina',
    from: 'Bergamo BGY',
    fromLocationId: 'bergamo-airport',
    to: 'Cortina',
    toLocationId: 'cortina',
    prices: { sedan: 1250, suv: 1250, minivan: 1460, tesla: 1460, van: 1880, luxury: 1730 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },

  // Milano Stazione Centrale routes
  {
    id: 'milano-centrale-milano-center',
    from: 'Milano Stazione Centrale',
    fromLocationId: 'milano-centrale',
    to: 'Milano City Center',
    toLocationId: 'milano-center',
    prices: { sedan: 125, suv: 125, minivan: 150, tesla: 150, van: 320, luxury: 270 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },
  {
    id: 'milano-centrale-livigno',
    from: 'Milano Stazione Centrale',
    fromLocationId: 'milano-centrale',
    to: 'Livigno',
    toLocationId: 'livigno',
    prices: { sedan: 1070, suv: 1070, minivan: 1230, tesla: 1230, van: 1590, luxury: 1470 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },
  {
    id: 'milano-centrale-bormio',
    from: 'Milano Stazione Centrale',
    fromLocationId: 'milano-centrale',
    to: 'Bormio',
    toLocationId: 'bormio',
    prices: { sedan: 920, suv: 920, minivan: 1170, tesla: 1170, van: 1390, luxury: 1290 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },
  {
    id: 'milano-centrale-verona',
    from: 'Milano Stazione Centrale',
    fromLocationId: 'milano-centrale',
    to: 'Verona',
    toLocationId: 'verona',
    prices: { sedan: 620, suv: 620, minivan: 730, tesla: 730, van: 990, luxury: 920 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },
  {
    id: 'milano-centrale-cortina',
    from: 'Milano Stazione Centrale',
    fromLocationId: 'milano-centrale',
    to: 'Cortina',
    toLocationId: 'cortina',
    prices: { sedan: 1280, suv: 1280, minivan: 1500, tesla: 1500, van: 1950, luxury: 1800 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 135, luxury: 135 }
  },

  // Venezia VCE routes - using reduced prices (sedan = 2 pax, minivan = 6 pax)
  {
    id: 'venezia-vce-cortina',
    from: 'Venezia VCE',
    fromLocationId: 'venezia-airport',
    to: 'Cortina',
    toLocationId: 'cortina',
    prices: { sedan: 590, suv: 590, minivan: 640, tesla: 640, van: 640, luxury: 640 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 },
    isEastCluster: true
  },
  {
    id: 'venezia-vce-anterselva',
    from: 'Venezia VCE',
    fromLocationId: 'venezia-airport',
    to: 'Anterselva',
    toLocationId: 'anterselva',
    prices: { sedan: 760, suv: 760, minivan: 825, tesla: 825, van: 825, luxury: 825 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 },
    isEastCluster: true
  },
  {
    id: 'venezia-vce-anterselva-a22',
    from: 'Venezia VCE',
    fromLocationId: 'venezia-airport',
    to: 'Anterselva (via A22)',
    toLocationId: 'anterselva',
    prices: { sedan: 1370, suv: 1370, minivan: 1470, tesla: 1470, van: 1470, luxury: 1470 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 },
    isEastCluster: true,
    notes: 'Via A22 route'
  },
  {
    id: 'venezia-vce-predazzo',
    from: 'Venezia VCE',
    fromLocationId: 'venezia-airport',
    to: 'Val di Fiemme Predazzo / Tesero',
    toLocationId: 'predazzo',
    prices: { sedan: 730, suv: 730, minivan: 780, tesla: 780, van: 780, luxury: 780 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 },
    isEastCluster: true
  },
  {
    id: 'venezia-vce-verona',
    from: 'Venezia VCE',
    fromLocationId: 'venezia-airport',
    to: 'Verona',
    toLocationId: 'verona',
    prices: { sedan: 510, suv: 510, minivan: 550, tesla: 550, van: 550, luxury: 550 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 },
    isEastCluster: true
  },

  // Treviso TSF routes
  {
    id: 'treviso-tsf-cortina',
    from: 'Treviso TSF',
    fromLocationId: 'treviso-airport',
    to: 'Cortina',
    toLocationId: 'cortina',
    prices: { sedan: 570, suv: 570, minivan: 620, tesla: 620, van: 620, luxury: 620 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 },
    isEastCluster: true
  },
  {
    id: 'treviso-tsf-anterselva',
    from: 'Treviso TSF',
    fromLocationId: 'treviso-airport',
    to: 'Anterselva',
    toLocationId: 'anterselva',
    prices: { sedan: 760, suv: 760, minivan: 830, tesla: 830, van: 830, luxury: 830 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 },
    isEastCluster: true
  },
  {
    id: 'treviso-tsf-anterselva-a22',
    from: 'Treviso TSF',
    fromLocationId: 'treviso-airport',
    to: 'Anterselva (via A22)',
    toLocationId: 'anterselva',
    prices: { sedan: 1360, suv: 1360, minivan: 1470, tesla: 1470, van: 1470, luxury: 1470 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 },
    isEastCluster: true,
    notes: 'Via A22 route'
  },
  {
    id: 'treviso-tsf-predazzo',
    from: 'Treviso TSF',
    fromLocationId: 'treviso-airport',
    to: 'Val di Fiemme Predazzo / Tesero',
    toLocationId: 'predazzo',
    prices: { sedan: 670, suv: 670, minivan: 710, tesla: 710, van: 710, luxury: 710 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 },
    isEastCluster: true
  },
  {
    id: 'treviso-tsf-verona',
    from: 'Treviso TSF',
    fromLocationId: 'treviso-airport',
    to: 'Verona',
    toLocationId: 'verona',
    prices: { sedan: 510, suv: 510, minivan: 550, tesla: 550, van: 550, luxury: 550 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 },
    isEastCluster: true
  },

  // Venezia Santa Lucia Station routes
  {
    id: 'venezia-station-cortina',
    from: 'Venezia Stazione Santa Lucia',
    fromLocationId: 'venezia-santa-lucia',
    to: 'Cortina',
    toLocationId: 'cortina',
    prices: { sedan: 590, suv: 590, minivan: 650, tesla: 650, van: 650, luxury: 650 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 },
    isEastCluster: true
  },
  {
    id: 'venezia-station-anterselva',
    from: 'Venezia Stazione Santa Lucia',
    fromLocationId: 'venezia-santa-lucia',
    to: 'Anterselva',
    toLocationId: 'anterselva',
    prices: { sedan: 790, suv: 790, minivan: 860, tesla: 860, van: 860, luxury: 860 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 },
    isEastCluster: true
  },
  {
    id: 'venezia-station-anterselva-a22',
    from: 'Venezia Stazione Santa Lucia',
    fromLocationId: 'venezia-santa-lucia',
    to: 'Anterselva (via A22)',
    toLocationId: 'anterselva',
    prices: { sedan: 1460, suv: 1460, minivan: 1470, tesla: 1470, van: 1470, luxury: 1470 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 },
    isEastCluster: true,
    notes: 'Via A22 route'
  },
  {
    id: 'venezia-station-predazzo',
    from: 'Venezia Stazione Santa Lucia',
    fromLocationId: 'venezia-santa-lucia',
    to: 'Val di Fiemme Predazzo / Tesero',
    toLocationId: 'predazzo',
    prices: { sedan: 750, suv: 750, minivan: 740, tesla: 740, van: 740, luxury: 740 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 },
    isEastCluster: true
  },
  {
    id: 'venezia-station-verona',
    from: 'Venezia Stazione Santa Lucia',
    fromLocationId: 'venezia-santa-lucia',
    to: 'Verona',
    toLocationId: 'verona',
    prices: { sedan: 540, suv: 540, minivan: 590, tesla: 590, van: 590, luxury: 590 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 },
    isEastCluster: true
  },

  // Inter-cluster routes (Milano Center based)
  {
    id: 'milano-center-bormio',
    from: 'Milano Center',
    fromLocationId: 'milano-center',
    to: 'Bormio Center',
    toLocationId: 'bormio',
    prices: { sedan: 920, suv: 920, minivan: 1170, tesla: 1170, van: 1170, luxury: 1170 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 }
  },
  {
    id: 'milano-center-livigno',
    from: 'Milano Center',
    fromLocationId: 'milano-center',
    to: 'Livigno Center',
    toLocationId: 'livigno',
    prices: { sedan: 1070, suv: 1070, minivan: 1230, tesla: 1230, van: 1230, luxury: 1230 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 }
  },
  {
    id: 'milano-center-tirano',
    from: 'Milano Center',
    fromLocationId: 'milano-center',
    to: 'Tirano',
    toLocationId: 'tirano',
    prices: { sedan: 870, suv: 870, minivan: 1100, tesla: 1100, van: 1100, luxury: 1100 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 }
  },
  {
    id: 'milano-center-cortina',
    from: 'Milano Center',
    fromLocationId: 'milano-center',
    to: 'Cortina Center',
    toLocationId: 'cortina',
    prices: { sedan: 1380, suv: 1380, minivan: 1620, tesla: 1620, van: 1620, luxury: 1620 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 }
  },
  {
    id: 'milano-center-anterselva',
    from: 'Milano Center',
    fromLocationId: 'milano-center',
    to: 'Anterselva',
    toLocationId: 'anterselva',
    prices: { sedan: 1380, suv: 1380, minivan: 1620, tesla: 1620, van: 1620, luxury: 1620 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 }
  },
  {
    id: 'milano-center-predazzo',
    from: 'Milano Center',
    fromLocationId: 'milano-center',
    to: 'Val di Fiemme',
    toLocationId: 'predazzo',
    prices: { sedan: 1290, suv: 1290, minivan: 1520, tesla: 1520, van: 1520, luxury: 1520 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 }
  },
  {
    id: 'milano-center-verona',
    from: 'Milano Center',
    fromLocationId: 'milano-center',
    to: 'Verona Center',
    toLocationId: 'verona',
    prices: { sedan: 620, suv: 620, minivan: 730, tesla: 730, van: 730, luxury: 730 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 }
  },
  {
    id: 'milano-center-venezia',
    from: 'Milano Center',
    fromLocationId: 'milano-center',
    to: 'Venezia',
    toLocationId: 'venezia-hotels',
    prices: { sedan: 1020, suv: 1020, minivan: 1200, tesla: 1200, van: 1200, luxury: 1200 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 }
  },

  // Other inter-cluster routes
  {
    id: 'cortina-anterselva',
    from: 'Cortina Center',
    fromLocationId: 'cortina',
    to: 'Anterselva',
    toLocationId: 'anterselva',
    prices: { sedan: 460, suv: 460, minivan: 530, tesla: 530, van: 530, luxury: 530 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 },
    isEastCluster: true
  },
  {
    id: 'livigno-bormio',
    from: 'Livigno',
    fromLocationId: 'livigno',
    to: 'Bormio',
    toLocationId: 'bormio',
    prices: { sedan: 460, suv: 460, minivan: 530, tesla: 530, van: 530, luxury: 530 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 }
  },
  {
    id: 'cortina-verona',
    from: 'Cortina',
    fromLocationId: 'cortina',
    to: 'Verona',
    toLocationId: 'verona',
    prices: { sedan: 950, suv: 950, minivan: 1070, tesla: 1070, van: 1070, luxury: 1070 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 },
    isEastCluster: true
  },
  {
    id: 'cortina-predazzo',
    from: 'Cortina Center',
    fromLocationId: 'cortina',
    to: 'Val di Fiemme Predazzo / Tesero',
    toLocationId: 'predazzo',
    prices: { sedan: 590, suv: 590, minivan: 640, tesla: 640, van: 640, luxury: 640 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 },
    isEastCluster: true
  },
  {
    id: 'cortina-venezia-hotels',
    from: 'Cortina Center',
    fromLocationId: 'cortina',
    to: 'Venezia hotel (incl water taxi)',
    toLocationId: 'venezia-hotels',
    prices: { sedan: 800, suv: 800, minivan: 860, tesla: 860, van: 860, luxury: 860 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 },
    isEastCluster: true
  },
  {
    id: 'cortina-bormio',
    from: 'Cortina Center',
    fromLocationId: 'cortina',
    to: 'Bormio Center',
    toLocationId: 'bormio',
    prices: { sedan: 1600, suv: 1600, minivan: 1840, tesla: 1840, van: 1840, luxury: 1840 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 }
  },
  {
    id: 'cortina-livigno',
    from: 'Cortina Center',
    fromLocationId: 'cortina',
    to: 'Livigno Center',
    toLocationId: 'livigno',
    prices: { sedan: 1340, suv: 1340, minivan: 1550, tesla: 1550, van: 1550, luxury: 1550 },
    extraHourRates: { sedan: 94, suv: 94, minivan: 108, tesla: 108, van: 108, luxury: 108 }
  }
]

// Olympic Period Configuration
export const OLYMPIC_PERIOD_2026 = {
  startDate: '2026-01-01',
  endDate: '2026-03-31',
  nightSurcharge: 20, // 20%
  nightHours: { start: '21:00', end: '06:00' },
  vatRate: 10 // 10%
}

// Main function to get location by ID
export function getLocationById(id: string): Location | undefined {
  return OLYMPIC_LOCATIONS.find(loc => loc.id === id)
}

// Get all Olympic locations
export function getAllLocations(): Location[] {
  return OLYMPIC_LOCATIONS
}

// Find location by coordinates with tolerance
export function findLocationByCoordinates(
  coordinates: { lat: number; lng: number }, 
  tolerance: number = 1
): Location | undefined {
  return OLYMPIC_LOCATIONS.find(location => {
    const distance = Math.sqrt(
      Math.pow(location.coordinates.lat - coordinates.lat, 2) + 
      Math.pow(location.coordinates.lng - coordinates.lng, 2)
    )
    return distance <= tolerance
  })
}

// Resolve location for pricing - handles Milano hinterland and direct location matching
export function resolveLocationForPricing(
  locationId?: string, 
  coordinates?: { lat: number; lng: number }
): {
  resolvedLocationId?: string
  resolvedCoordinates?: { lat: number; lng: number }
} {
  // If we have a direct location ID match, use it
  if (locationId) {
    const directMatch = getLocationById(locationId)
    if (directMatch) {
      return {
        resolvedLocationId: locationId,
        resolvedCoordinates: directMatch.coordinates
      }
    }
  }

  // If we have coordinates, try to find matching location or check Milano coverage
  if (coordinates) {
    // First try exact coordinate matching
    const coordinateMatch = findLocationByCoordinates(coordinates, 0.1)
    if (coordinateMatch) {
      return {
        resolvedLocationId: coordinateMatch.id,
        resolvedCoordinates: coordinateMatch.coordinates
      }
    }

    // Check if coordinates fall within Milano hinterland (10km from Milano center)
    const milanoCenter = getLocationById('milano-center')
    if (milanoCenter && milanoCenter.coverageRadius) {
      const distance = calculateDistance(coordinates, milanoCenter.coordinates)
      if (distance <= milanoCenter.coverageRadius) {
        return {
          resolvedLocationId: 'milano-center',
          resolvedCoordinates: milanoCenter.coordinates
        }
      }
    }

    // Return original coordinates if no match found
    return {
      resolvedCoordinates: coordinates
    }
  }

  return {}
}

// Calculate distance between two coordinates in kilometers
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (point2.lat - point1.lat) * Math.PI / 180
  const dLng = (point2.lng - point1.lng) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c
  return distance
}

// Find Olympic route between two locations
export function findOlympicRoute(fromLocationId: string, toLocationId: string): OlympicRoute | null {
  // Try direct route
  let route = OLYMPIC_ROUTES.find(r => 
    r.fromLocationId === fromLocationId && r.toLocationId === toLocationId
  )
  
  // Try reverse route
  if (!route) {
    route = OLYMPIC_ROUTES.find(r => 
      r.fromLocationId === toLocationId && r.toLocationId === fromLocationId
    )
  }
  
  return route || null
}

// Check if date is in Olympic period
export function isOlympicPeriod(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format
  return dateStr >= OLYMPIC_PERIOD_2026.startDate && dateStr <= OLYMPIC_PERIOD_2026.endDate
}

// Check if time is night time (21:00 - 06:00)
export function isNightTime(timeStr: string): boolean {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes
  // Night time: 21:00 (1260 minutes) to 06:00 (360 minutes)
  return totalMinutes >= 1260 || totalMinutes <= 360
}

// Map standard vehicle types to Olympic pricing structure
export function mapVehicleTypeToOlympic(standardType: string): OlympicVehicleType {
  const mapping: Record<string, OlympicVehicleType> = {
    'sedan': 'sedan',
    'van': 'minivan',
    'minivan': 'minivan', 
    'minibus': 'van',
    'luxury-sedan': 'luxury',
    'luxury': 'luxury',
    'tesla': 'tesla',
    'suv': 'suv'
  }
  return mapping[standardType.toLowerCase()] || 'sedan'
}

// Export event configuration
export const MILANO_CORTINA_2026 = {
  id: 'milano-cortina-2026',
  name: 'Milano Cortina 2026 Olympics',
  startDate: OLYMPIC_PERIOD_2026.startDate,
  endDate: OLYMPIC_PERIOD_2026.endDate,
  routes: OLYMPIC_ROUTES,
  allowedVehicleTypes: ['sedan', 'suv', 'minivan', 'tesla', 'van', 'luxury'],
  extras: {
    nightSurcharge: OLYMPIC_PERIOD_2026.nightSurcharge,
    vatRate: OLYMPIC_PERIOD_2026.vatRate
  }
}

// Meet & Greet Services Configuration - Based on official rates
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

// Meet & Greet Services Registry - Olympic Period Rates
export const MEET_GREET_SERVICES: Record<string, MeetGreetService> = {
  // Milano Malpensa Airport
  'malpensa-arrivals': {
    type: 'airport-arrivals',
    location: 'Milano Malpensa Airport (MXP)',
    coordinates: { lat: 45.6306, lng: 8.7281 },
    basePrice: 95,
    extraPassengerPrice: 15,
    extraLuggagePrice: 8,
    nightSurchargePrice: 25,
    extraHourPrice: 35,
    includedHours: 1,
    includedLuggage: 2,
    maxPassengers: 15,
    maxLuggageForNightSurcharge: 4,
    nightSurchargeHours: { start: '21:00', end: '06:00' },
    specialServices: {
      tarmac: {
        price: 150,
        description: 'VIP Tarmac Service - Direct aircraft assistance',
        maxPassengers: 8,
        onDemand: true
      },
      fastTrack: { price: 25 },
      vipLounge: { price: 45 }
    },
    details: [
      'Professional greeter with name sign',
      'Assistance with luggage and directions',
      'Up to 1 hour waiting time included', 
      'Meet at arrivals gate or baggage claim'
    ],
    constraints: [
      'Advance booking required (minimum 24h)',
      'Flight details must be provided',
      'Additional charges apply for delays over 1 hour'
    ]
  },

  'malpensa-departures': {
    type: 'airport-departures',
    location: 'Milano Malpensa Airport (MXP)',
    coordinates: { lat: 45.6306, lng: 8.7281 },
    basePrice: 85,
    extraPassengerPrice: 15,
    extraLuggagePrice: 8,
    nightSurchargePrice: 25,
    extraHourPrice: 35,
    includedHours: 1,
    includedLuggage: 2,
    maxPassengers: 15,
    maxLuggageForNightSurcharge: 4,
    nightSurchargeHours: { start: '21:00', end: '06:00' },
    specialServices: {
      fastTrack: { price: 25 },
      vipLounge: { price: 45 }
    },
    details: [
      'Check-in assistance and guidance',
      'Priority lane access when available',
      'Departure lounge directions'
    ],
    constraints: [
      'Meet at designated departure area',
      'Security restrictions apply',
      'Advance booking required'
    ]
  },

  // Milano Linate Airport
  'linate-arrivals': {
    type: 'airport-arrivals',
    location: 'Milano Linate Airport (LIN)',
    coordinates: { lat: 45.4454, lng: 9.2767 },
    basePrice: 90,
    extraPassengerPrice: 15,
    extraLuggagePrice: 8,
    nightSurchargePrice: 25,
    extraHourPrice: 35,
    includedHours: 1,
    includedLuggage: 2,
    maxPassengers: 15,
    maxLuggageForNightSurcharge: 4,
    nightSurchargeHours: { start: '21:00', end: '06:00' },
    specialServices: {
      fastTrack: { price: 20 },
      vipLounge: { price: 40 }
    },
    details: [
      'Professional greeter with name sign',
      'Baggage assistance and directions',
      'Compact airport - quick service'
    ],
    constraints: [
      'Limited to domestic and EU flights',
      'Advance booking required'
    ]
  },

  'linate-departures': {
    type: 'airport-departures',
    location: 'Milano Linate Airport (LIN)',
    coordinates: { lat: 45.4454, lng: 9.2767 },
    basePrice: 80,
    extraPassengerPrice: 15,
    extraLuggagePrice: 8,
    nightSurchargePrice: 25,
    extraHourPrice: 35,
    includedHours: 1,
    includedLuggage: 2,
    maxPassengers: 15,
    maxLuggageForNightSurcharge: 4,
    nightSurchargeHours: { start: '21:00', end: '06:00' },
    specialServices: {
      fastTrack: { price: 20 },
      vipLounge: { price: 40 }
    },
    details: [
      'Check-in assistance',
      'Security and departure guidance',
      'VIP services available'
    ],
    constraints: [
      'Domestic and EU flights only',
      'Meet at check-in area'
    ]
  },

  // Bergamo Airport
  'bergamo-arrivals': {
    type: 'airport-arrivals',
    location: 'Bergamo Orio al Serio Airport (BGY)',
    coordinates: { lat: 45.6739, lng: 9.7047 },
    basePrice: 85,
    extraPassengerPrice: 15,
    extraLuggagePrice: 8,
    nightSurchargePrice: 25,
    extraHourPrice: 35,
    includedHours: 1,
    includedLuggage: 2,
    maxPassengers: 15,
    maxLuggageForNightSurcharge: 4,
    nightSurchargeHours: { start: '21:00', end: '06:00' },
    details: [
      'Low-cost airline specialist',
      'Professional greeting service',
      'Ground transportation assistance'
    ],
    constraints: [
      'Mainly budget airlines',
      'Limited night services'
    ]
  },

  'bergamo-departures': {
    type: 'airport-departures',
    location: 'Bergamo Orio al Serio Airport (BGY)',
    coordinates: { lat: 45.6739, lng: 9.7047 },
    basePrice: 75,
    extraPassengerPrice: 15,
    extraLuggagePrice: 8,
    nightSurchargePrice: 25,
    extraHourPrice: 35,
    includedHours: 1,
    includedLuggage: 2,
    maxPassengers: 15,
    maxLuggageForNightSurcharge: 4,
    nightSurchargeHours: { start: '21:00', end: '06:00' },
    details: [
      'Check-in assistance for budget airlines',
      'Security queue guidance',
      'Departure information'
    ],
    constraints: [
      'Budget airline terminal',
      'Early morning flights common'
    ]
  },

  // Venezia Marco Polo Airport
  'venezia-arrivals': {
    type: 'airport-arrivals',
    location: 'Venezia Marco Polo Airport (VCE)',
    coordinates: { lat: 45.5053, lng: 12.3519 },
    basePrice: 100,
    extraPassengerPrice: 18,
    extraLuggagePrice: 10,
    nightSurchargePrice: 30,
    extraHourPrice: 40,
    includedHours: 1,
    includedLuggage: 2,
    maxPassengers: 12,
    maxLuggageForNightSurcharge: 4,
    nightSurchargeHours: { start: '21:00', end: '06:00' },
    specialServices: {
      fastTrack: { 
        price: 35,
        mandatoryWith: ['vipLounge']
      },
      vipLounge: { 
        price: 65,
        mandatoryWith: ['fastTrack']
      },
      combo: {
        name: 'Venice VIP Package',
        price: 85,
        includes: ['Fast Track', 'VIP Lounge Access']
      }
    },
    details: [
      'Venice specialist service',
      'Water taxi coordination available',
      'Multilingual staff',
      'Luxury options available'
    ],
    constraints: [
      'Island location - special logistics',
      'Water taxi connections available',
      'VIP services require package booking'
    ]
  },

  'venezia-departures': {
    type: 'airport-departures',
    location: 'Venezia Marco Polo Airport (VCE)',
    coordinates: { lat: 45.5053, lng: 12.3519 },
    basePrice: 90,
    extraPassengerPrice: 18,
    extraLuggagePrice: 10,
    nightSurchargePrice: 30,
    extraHourPrice: 40,
    includedHours: 1,
    includedLuggage: 2,
    maxPassengers: 12,
    maxLuggageForNightSurcharge: 4,
    nightSurchargeHours: { start: '21:00', end: '06:00' },
    specialServices: {
      fastTrack: { 
        price: 35,
        mandatoryWith: ['vipLounge']
      },
      vipLounge: { 
        price: 65,
        mandatoryWith: ['fastTrack']
      },
      combo: {
        name: 'Venice VIP Package',
        price: 85,
        includes: ['Fast Track', 'VIP Lounge Access']
      }
    },
    details: [
      'Premium Venice departure service',
      'Check-in assistance',
      'VIP lounge access available'
    ],
    constraints: [
      'Package services mandatory for VIP options',
      'Water taxi drop-off coordination'
    ]
  },

  // Treviso Airport
  'treviso-arrivals': {
    type: 'airport-arrivals',
    location: 'Treviso Antonio Canova Airport (TSF)',
    coordinates: { lat: 45.6484, lng: 12.1944 },
    basePrice: 80,
    extraPassengerPrice: 15,
    extraLuggagePrice: 8,
    nightSurchargePrice: 25,
    extraHourPrice: 35,
    includedHours: 1,
    includedLuggage: 2,
    maxPassengers: 15,
    maxLuggageForNightSurcharge: 4,
    nightSurchargeHours: { start: '21:00', end: '06:00' },
    details: [
      'Budget airline hub',
      'Quick service - small airport',
      'Easy access to Venice area'
    ],
    constraints: [
      'Limited to budget carriers',
      'Seasonal flight variations'
    ]
  },

  'treviso-departures': {
    type: 'airport-departures',
    location: 'Treviso Antonio Canova Airport (TSF)',
    coordinates: { lat: 45.6484, lng: 12.1944 },
    basePrice: 70,
    extraPassengerPrice: 15,
    extraLuggagePrice: 8,
    nightSurchargePrice: 25,
    extraHourPrice: 35,
    includedHours: 1,
    includedLuggage: 2,
    maxPassengers: 15,
    maxLuggageForNightSurcharge: 4,
    nightSurchargeHours: { start: '21:00', end: '06:00' },
    details: [
      'Budget airline departures',
      'Simple check-in assistance',
      'Regional airport convenience'
    ],
    constraints: [
      'Mainly European destinations',
      'Limited amenities'
    ]
  },

  // Milano Stazione Centrale
  'milano-centrale-arrivals': {
    type: 'railway-arrivals',
    location: 'Milano Stazione Centrale',
    coordinates: { lat: 45.4868, lng: 9.2037 },
    basePrice: 65,
    extraPassengerPrice: 12,
    extraLuggagePrice: 6,
    nightSurchargePrice: 20,
    extraHourPrice: 30,
    includedHours: 0.5, // 30 minutes for train stations
    includedLuggage: 2,
    maxPassengers: 20,
    maxLuggageForNightSurcharge: 6,
    nightSurchargeHours: { start: '21:00', end: '06:00' },
    specialServices: {
      greeterOnly: { price: 45 }
    },
    details: [
      'Main railway hub of Northern Italy',
      'High-speed train connections',
      'Platform meeting service',
      'Multilingual assistance'
    ],
    constraints: [
      'Platform access requires valid ticket',
      'Meet at designated areas only',
      'Peak hours may have delays'
    ]
  },

  'milano-centrale-departures': {
    type: 'railway-departures',
    location: 'Milano Stazione Centrale',
    coordinates: { lat: 45.4868, lng: 9.2037 },
    basePrice: 55,
    extraPassengerPrice: 12,
    extraLuggagePrice: 6,
    nightSurchargePrice: 20,
    extraHourPrice: 30,
    includedHours: 0.5,
    includedLuggage: 2,
    maxPassengers: 20,
    maxLuggageForNightSurcharge: 6,
    nightSurchargeHours: { start: '21:00', end: '06:00' },
    specialServices: {
      greeterOnly: { price: 35 }
    },
    details: [
      'Departure assistance',
      'Platform guidance',
      'Ticket validation help',
      'Last-minute support'
    ],
    constraints: [
      'Platform access rules apply',
      'Security screening for international trains'
    ]
  },

  // Venezia Santa Lucia Station
  'venezia-station-arrivals': {
    type: 'railway-arrivals',
    location: 'Venezia Stazione Santa Lucia',
    coordinates: { lat: 45.4418, lng: 12.3209 },
    basePrice: 75,
    extraPassengerPrice: 15,
    extraLuggagePrice: 8,
    nightSurchargePrice: 25,
    extraHourPrice: 35,
    includedHours: 0.5,
    includedLuggage: 2,
    maxPassengers: 12,
    maxLuggageForNightSurcharge: 4,
    nightSurchargeHours: { start: '21:00', end: '06:00' },
    details: [
      'Venice main train station',
      'Water taxi coordination',
      'Grand Canal access',
      'Tourist information'
    ],
    constraints: [
      'Island location logistics',
      'Water transport connections',
      'Limited wheeled luggage areas'
    ]
  },

  'venezia-station-departures': {
    type: 'railway-departures',
    location: 'Venezia Stazione Santa Lucia',
    coordinates: { lat: 45.4418, lng: 12.3209 },
    basePrice: 65,
    extraPassengerPrice: 15,
    extraLuggagePrice: 8,
    nightSurchargePrice: 25,
    extraHourPrice: 35,
    includedHours: 0.5,
    includedLuggage: 2,
    maxPassengers: 12,
    maxLuggageForNightSurcharge: 4,
    nightSurchargeHours: { start: '21:00', end: '06:00' },
    details: [
      'Venice departure service',
      'Platform assistance',
      'Water taxi drop-off coordination'
    ],
    constraints: [
      'Venice logistics apply',
      'Advance coordination required'
    ]
  }
}

// Helper functions for Meet & Greet services

export function findMeetGreetServiceByLocation(
  pickupLocationId?: string,
  destinationLocationId?: string
): MeetGreetServiceWithId | null {
  // Check if pickup location has meet & greet arrivals
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

  // Check if destination location has meet & greet departures  
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

  return null
}

export function findMeetGreetService(
  pickupCoords: { lat: number; lng: number },
  destinationCoords: { lat: number; lng: number }
): MeetGreetServiceWithId | null {
  // Find locations by coordinates and then check for services
  const pickupLocation = findLocationByCoordinates(pickupCoords, 0.1)
  const destinationLocation = findLocationByCoordinates(destinationCoords, 0.1)

  return findMeetGreetServiceByLocation(pickupLocation?.id, destinationLocation?.id)
}

export function findAvailableMeetGreetServices(
  pickupCoords: { lat: number; lng: number } | undefined,
  destinationCoords: { lat: number; lng: number } | undefined
): string[] {
  const services: string[] = []

  // Check all registered services and see if they match the coordinates
  Object.entries(MEET_GREET_SERVICES).forEach(([serviceId, service]) => {
    const serviceDistance = 0.1 // 0.1 degree tolerance
    
    if (pickupCoords) {
      const pickupDistance = calculateDistance(pickupCoords, service.coordinates)
      if (pickupDistance <= 1) { // Within 1km
        services.push(serviceId)
      }
    }
    
    if (destinationCoords) {
      const destDistance = calculateDistance(destinationCoords, service.coordinates)
      if (destDistance <= 1) { // Within 1km
        services.push(serviceId)
      }
    }
  })

  return [...new Set(services)] // Remove duplicates
}

// Meet & Greet pricing calculation
export function calculateMeetGreetPriceLegacy(
  serviceId: string,
  passengers: number,
  children: number,
  infants: number,
  extraLuggage: number,
  isNight: boolean,
  specialServices: any = {},
  serviceDate?: Date
): { price: number; breakdown: any } {
  const service = MEET_GREET_SERVICES[serviceId]
  if (!service) {
    return { price: 0, breakdown: { error: 'Service not found' } }
  }

  let totalPrice = service.basePrice
  const breakdown: any = {
    basePrice: service.basePrice,
    details: []
  }

  // Extra passengers (children count as passengers, infants are free)
  const totalPassengers = passengers + children
  if (totalPassengers > 1) {
    const extraPassengers = totalPassengers - 1
    const extraPassengerCost = extraPassengers * service.extraPassengerPrice
    totalPrice += extraPassengerCost
    breakdown.details.push({
      description: `Extra passengers (${extraPassengers})`,
      amount: extraPassengerCost
    })
  }

  // Extra luggage
  if (extraLuggage > 0) {
    const extraLuggageCost = extraLuggage * service.extraLuggagePrice
    totalPrice += extraLuggageCost
    breakdown.details.push({
      description: `Extra luggage (${extraLuggage} pieces)`,
      amount: extraLuggageCost
    })
  }

  // Night surcharge
  if (isNight) {
    totalPrice += service.nightSurchargePrice
    breakdown.details.push({
      description: 'Night surcharge',
      amount: service.nightSurchargePrice
    })
  }

  // Special services
  if (specialServices.tarmac && service.specialServices?.tarmac) {
    totalPrice += service.specialServices.tarmac.price
    breakdown.details.push({
      description: 'VIP Tarmac Service',
      amount: service.specialServices.tarmac.price
    })
  }

  if (specialServices.fastTrack && service.specialServices?.fastTrack) {
    // Check if VIP Lounge is mandatory
    if (service.specialServices.fastTrack.mandatoryWith?.includes('vipLounge')) {
      if (!specialServices.vipLounge) {
        // Auto-add VIP Lounge
        specialServices.vipLounge = true
      }
    }
    
    totalPrice += service.specialServices.fastTrack.price
    breakdown.details.push({
      description: 'Fast Track Service',
      amount: service.specialServices.fastTrack.price
    })
  }

  if (specialServices.vipLounge && service.specialServices?.vipLounge) {
    totalPrice += service.specialServices.vipLounge.price
    breakdown.details.push({
      description: 'VIP Lounge Access',
      amount: service.specialServices.vipLounge.price
    })
  }

  // Venice combo package (overrides individual services)
  if (specialServices.combo && service.specialServices?.combo) {
    // Remove individual service costs and apply combo price
    if (specialServices.fastTrack && specialServices.vipLounge) {
      // Remove individual costs
      const fastTrackCost = service.specialServices.fastTrack?.price || 0
      const vipLoungeCost = service.specialServices.vipLounge?.price || 0
      totalPrice -= (fastTrackCost + vipLoungeCost)
      
      // Remove individual items from breakdown
      breakdown.details = breakdown.details.filter((item: any) => 
        !item.description.includes('Fast Track') && !item.description.includes('VIP Lounge')
      )
      
      // Add combo
      totalPrice += service.specialServices.combo.price
      breakdown.details.push({
        description: service.specialServices.combo.name,
        amount: service.specialServices.combo.price
      })
    }
  }

  if (specialServices.greeterOnly && service.specialServices?.greeterOnly) {
    // Greeter only service - replace base price
    totalPrice = service.specialServices.greeterOnly.price
    breakdown.basePrice = service.specialServices.greeterOnly.price
    breakdown.details.unshift({
      description: 'Greeter Only Service',
      amount: service.specialServices.greeterOnly.price
    })
  }

  // Holiday surcharge (if serviceDate is provided and it's a holiday)
  if (serviceDate && isHolidayDate(serviceDate)) {
    const holidaySurcharge = totalPrice * 0.15 // 15% holiday surcharge
    totalPrice += holidaySurcharge
    breakdown.details.push({
      description: 'Holiday surcharge (15%)',
      amount: holidaySurcharge
    })
  }

  breakdown.total = totalPrice
  return { price: totalPrice, breakdown }
}

// Helper function to check if date is a holiday
export function isHolidayDate(date: Date): boolean {
  const holidays = [
    '12-25', // Christmas
    '12-26', // Boxing Day
    '01-01', // New Year
    '01-06', // Epiphany
    '04-25', // Liberation Day
    '05-01', // Labor Day
    '06-02', // Republic Day
    '08-15', // Assumption
    '11-01', // All Saints
    '12-08'  // Immaculate Conception
  ]
  
  const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  return holidays.includes(dateStr)
}

// Get active event for a date (Olympic period)
export function getActiveEvent(date: Date): typeof MILANO_CORTINA_2026 | null {
  if (isOlympicPeriod(date)) {
    return MILANO_CORTINA_2026
  }
  return null
}