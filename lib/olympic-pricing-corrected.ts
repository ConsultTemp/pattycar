// Olympic Pricing Corrected - Based on Official Price Lists (January - March 2026)
// All prices are NET (VAT not included) - 10% VAT to be added
// Night surcharge: 20% for transfers between 21:00 (09:00 PM) and 6:00 AM

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
  category: 'airport-station' | 'inter-cluster' | 'milano-airports'
  notes?: string
}

// Complete Olympic Routes based on price lists
export const CORRECTED_OLYMPIC_ROUTES: OlympicRoute[] = [
  // =========================================================================
  // AIRPORT AND TRAIN STATION ARRIVAL/DEPARTURE RATES
  // Venezia VCE (Marco Polo Airport) routes
  // =========================================================================
  {
    from: "Venezia Marco Polo Airport (VCE)",
    to: "Cortina d'Ampezzo",
    fromLocationId: "venezia-marco-polo",
    toLocationId: "cortina",
    prices: {
      'olympic-sedan': 590,      // €590 Sedan 2 pax
      'olympic-minivan': 640,    // €640 Mini Van 6 pax (4 pax with Luggage)
      'olympic-van': 640,        // Same as minivan for this route
      'olympic-luxury': 640      // Same as minivan for this route
    },
    extraHourRates: {
      'olympic-sedan': 94,       // €94 sedan
      'olympic-minivan': 108,    // €108 minivan
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'airport-station'
  },
  {
    from: "Venezia Marco Polo Airport (VCE)", 
    to: "Anterselva",
    fromLocationId: "venezia-marco-polo",
    toLocationId: "anterselva", 
    prices: {
      'olympic-sedan': 760,      // €760 Sedan
      'olympic-minivan': 825,    // €825 Mini Van
      'olympic-van': 825,
      'olympic-luxury': 825
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'airport-station'
  },
  {
    from: "Venezia Marco Polo Airport (VCE)",
    to: "Anterselva (via A22)",
    fromLocationId: "venezia-marco-polo", 
    toLocationId: "anterselva-a22",
    prices: {
      'olympic-sedan': 1370,     // €1,370 Sedan via A22
      'olympic-minivan': 1470,   // €1,470 Mini Van via A22
      'olympic-van': 1470,
      'olympic-luxury': 1470
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'airport-station'
  },
  {
    from: "Venezia Marco Polo Airport (VCE)",
    to: "Val di Fiemme (Predazzo/Tesero)",
    fromLocationId: "venezia-marco-polo",
    toLocationId: "val-di-fiemme",
    prices: {
      'olympic-sedan': 730,      // €730 Sedan
      'olympic-minivan': 780,    // €780 Mini Van
      'olympic-van': 780,
      'olympic-luxury': 780
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'airport-station'
  },
  {
    from: "Venezia Marco Polo Airport (VCE)",
    to: "Verona",
    fromLocationId: "venezia-marco-polo",
    toLocationId: "verona",
    prices: {
      'olympic-sedan': 510,      // €510 Sedan
      'olympic-minivan': 550,    // €550 Mini Van
      'olympic-van': 550,
      'olympic-luxury': 550
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'airport-station'
  },

  // =========================================================================
  // TREVISO TSF (Antonio Canova Airport) routes
  // =========================================================================
  {
    from: "Treviso Airport (TSF)",
    to: "Cortina d'Ampezzo", 
    fromLocationId: "treviso",
    toLocationId: "cortina",
    prices: {
      'olympic-sedan': 570,      // €570 Sedan 
      'olympic-minivan': 620,    // €620 Mini Van
      'olympic-van': 620,
      'olympic-luxury': 620
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'airport-station'
  },
  {
    from: "Treviso Airport (TSF)",
    to: "Anterselva",
    fromLocationId: "treviso",
    toLocationId: "anterselva",
    prices: {
      'olympic-sedan': 760,      // €760 Sedan
      'olympic-minivan': 830,    // €830 Mini Van
      'olympic-van': 830,
      'olympic-luxury': 830
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'airport-station'
  },
  {
    from: "Treviso Airport (TSF)",
    to: "Anterselva (via A22)",
    fromLocationId: "treviso",
    toLocationId: "anterselva-a22",
    prices: {
      'olympic-sedan': 1360,     // €1,360 Sedan via A22
      'olympic-minivan': 1470,   // €1,470 Mini Van via A22
      'olympic-van': 1470,
      'olympic-luxury': 1470
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'airport-station'
  },
  {
    from: "Treviso Airport (TSF)",
    to: "Val di Fiemme (Predazzo/Tesero)",
    fromLocationId: "treviso",
    toLocationId: "val-di-fiemme",
    prices: {
      'olympic-sedan': 670,      // €670 Sedan
      'olympic-minivan': 710,    // €710 Mini Van
      'olympic-van': 710,
      'olympic-luxury': 710
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'airport-station'
  },
  {
    from: "Treviso Airport (TSF)",
    to: "Verona",
    fromLocationId: "treviso",
    toLocationId: "verona",
    prices: {
      'olympic-sedan': 510,      // €510 Sedan
      'olympic-minivan': 550,    // €550 Mini Van
      'olympic-van': 550,
      'olympic-luxury': 550
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'airport-station'
  },

  // =========================================================================
  // VENEZIA SANTA LUCIA STATION routes
  // =========================================================================
  {
    from: "Venezia Santa Lucia Station",
    to: "Cortina d'Ampezzo",
    fromLocationId: "venezia-santa-lucia",
    toLocationId: "cortina",
    prices: {
      'olympic-sedan': 590,      // €590 Sedan
      'olympic-minivan': 650,    // €650 Mini Van
      'olympic-van': 650,
      'olympic-luxury': 650
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'airport-station'
  },
  {
    from: "Venezia Santa Lucia Station",
    to: "Anterselva",
    fromLocationId: "venezia-santa-lucia",
    toLocationId: "anterselva",
    prices: {
      'olympic-sedan': 790,      // €790 Sedan
      'olympic-minivan': 860,    // €860 Mini Van
      'olympic-van': 860,
      'olympic-luxury': 860
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'airport-station'
  },
  {
    from: "Venezia Santa Lucia Station",
    to: "Anterselva (via A22)",
    fromLocationId: "venezia-santa-lucia",
    toLocationId: "anterselva-a22",
    prices: {
      'olympic-sedan': 1460,     // €1,460 Sedan via A22
      'olympic-minivan': 1470,   // €1,470 Mini Van via A22
      'olympic-van': 1470,
      'olympic-luxury': 1470
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'airport-station'
  },
  {
    from: "Venezia Santa Lucia Station",
    to: "Val di Fiemme (Predazzo/Tesero)",
    fromLocationId: "venezia-santa-lucia",
    toLocationId: "val-di-fiemme",
    prices: {
      'olympic-sedan': 750,      // €750 Sedan
      'olympic-minivan': 740,    // €740 Mini Van (NOTE: this is lower per price list)
      'olympic-van': 740,
      'olympic-luxury': 740
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'airport-station'
  },
  {
    from: "Venezia Santa Lucia Station",
    to: "Verona",
    fromLocationId: "venezia-santa-lucia",
    toLocationId: "verona",
    prices: {
      'olympic-sedan': 540,      // €540 Sedan
      'olympic-minivan': 590,    // €590 Mini Van
      'olympic-van': 590,
      'olympic-luxury': 590
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'airport-station'
  },

  // Special Venice route with water taxi
  {
    from: "Cortina d'Ampezzo",
    to: "Venezia Hotel (incl water taxi)",
    fromLocationId: "cortina",
    toLocationId: "venezia-hotel",
    prices: {
      'olympic-sedan': 800,      // €800 Sedan
      'olympic-minivan': 860,    // €860 Mini Van
      'olympic-van': 860,
      'olympic-luxury': 860
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'airport-station',
    notes: 'Includes water taxi service'
  },

  // =========================================================================
  // INTER-CLUSTER TRANSPORT RATES
  // Milano Center connections
  // =========================================================================
  {
    from: "Milano Center",
    to: "Bormio Center", 
    fromLocationId: "milano-center",
    toLocationId: "bormio",
    prices: {
      'olympic-sedan': 920,      // €920 Sedan
      'olympic-minivan': 1170,   // €1,170 Minivan
      'olympic-van': 1170,
      'olympic-luxury': 1170
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'inter-cluster'
  },
  {
    from: "Milano Center",
    to: "Livigno Center",
    fromLocationId: "milano-center",
    toLocationId: "livigno",
    prices: {
      'olympic-sedan': 1070,     // €1,070 Sedan
      'olympic-minivan': 1230,   // €1,230 Minivan
      'olympic-van': 1230,
      'olympic-luxury': 1230
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'inter-cluster'
  },
  {
    from: "Milano Center",
    to: "Tirano",
    fromLocationId: "milano-center",
    toLocationId: "tirano",
    prices: {
      'olympic-sedan': 870,      // €870 Sedan
      'olympic-minivan': 1100,   // €1,100 Minivan
      'olympic-van': 1100,
      'olympic-luxury': 1100
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'inter-cluster'
  },
  {
    from: "Milano Center",
    to: "Cortina Center",
    fromLocationId: "milano-center",
    toLocationId: "cortina",
    prices: {
      'olympic-sedan': 1380,     // €1,380 Sedan
      'olympic-minivan': 1620,   // €1,620 Minivan
      'olympic-van': 1620,
      'olympic-luxury': 1620
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'inter-cluster'
  },
  {
    from: "Milano Center",
    to: "Anterselva",
    fromLocationId: "milano-center",
    toLocationId: "anterselva",
    prices: {
      'olympic-sedan': 1380,     // €1,380 Sedan
      'olympic-minivan': 1620,   // €1,620 Minivan
      'olympic-van': 1620,
      'olympic-luxury': 1620
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'inter-cluster'
  },
  {
    from: "Milano Center",
    to: "Val di Fiemme",
    fromLocationId: "milano-center",
    toLocationId: "val-di-fiemme",  
    prices: {
      'olympic-sedan': 1290,     // €1,290 Sedan
      'olympic-minivan': 1520,   // €1,520 Minivan
      'olympic-van': 1520,
      'olympic-luxury': 1520
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'inter-cluster'
  },
  {
    from: "Milano Center",
    to: "Verona Center",
    fromLocationId: "milano-center",
    toLocationId: "verona",
    prices: {
      'olympic-sedan': 620,      // €620 Sedan
      'olympic-minivan': 730,    // €730 Minivan
      'olympic-van': 730,
      'olympic-luxury': 730
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'inter-cluster'
  },
  {
    from: "Milano Center",
    to: "Venezia",
    fromLocationId: "milano-center",
    toLocationId: "venezia",
    prices: {
      'olympic-sedan': 1020,     // €1,020 Sedan  
      'olympic-minivan': 1200,   // €1,200 Minivan
      'olympic-van': 1200,
      'olympic-luxury': 1200
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'inter-cluster'
  },

  // Other inter-cluster routes
  {
    from: "Cortina Center",
    to: "Anterselva",
    fromLocationId: "cortina",
    toLocationId: "anterselva",
    prices: {
      'olympic-sedan': 460,      // €460 Sedan
      'olympic-minivan': 530,    // €530 Minivan
      'olympic-van': 530,
      'olympic-luxury': 530
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'inter-cluster'
  },
  {
    from: "Livigno",
    to: "Bormio",
    fromLocationId: "livigno",
    toLocationId: "bormio",
    prices: {
      'olympic-sedan': 460,      // €460 Sedan
      'olympic-minivan': 530,    // €530 Minivan
      'olympic-van': 530,
      'olympic-luxury': 530
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'inter-cluster'
  },
  {
    from: "Cortina",
    to: "Verona",
    fromLocationId: "cortina",
    toLocationId: "verona",
    prices: {
      'olympic-sedan': 950,      // €950 Sedan
      'olympic-minivan': 1070,   // €1,070 Minivan
      'olympic-van': 1070,
      'olympic-luxury': 1070
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'inter-cluster'
  },
  {
    from: "Cortina Center",
    to: "Val di Fiemme (Predazzo/Tesero)",
    fromLocationId: "cortina",
    toLocationId: "val-di-fiemme",
    prices: {
      'olympic-sedan': 590,      // €590 Sedan
      'olympic-minivan': 640,    // €640 Minivan
      'olympic-van': 640,
      'olympic-luxury': 640
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'inter-cluster'
  },
  {
    from: "Cortina Center",
    to: "Venezia Hotel (incl water taxi)",
    fromLocationId: "cortina",
    toLocationId: "venezia-hotel",
    prices: {
      'olympic-sedan': 800,      // €800 Sedan
      'olympic-minivan': 860,    // €860 Minivan
      'olympic-van': 860,
      'olympic-luxury': 860
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'inter-cluster'
  },
  {
    from: "Cortina Center",
    to: "Bormio Center",
    fromLocationId: "cortina",
    toLocationId: "bormio",
    prices: {
      'olympic-sedan': 1600,     // €1,600 Sedan
      'olympic-minivan': 1840,   // €1,840 Minivan
      'olympic-van': 1840,
      'olympic-luxury': 1840
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'inter-cluster'
  },
  {
    from: "Cortina Center",
    to: "Livigno Center",
    fromLocationId: "cortina",
    toLocationId: "livigno",
    prices: {
      'olympic-sedan': 1340,     // €1,340 Sedan
      'olympic-minivan': 1550,   // €1,550 Minivan
      'olympic-van': 1550,
      'olympic-luxury': 1550
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 108,
      'olympic-luxury': 108
    },
    category: 'inter-cluster'
  },

  // =========================================================================
  // MILANO AIRPORT RATES - Updated with 6 vehicle types from price list
  // Milano Malpensa MXP routes
  // =========================================================================
  {
    from: "Milano Malpensa MXP",
    to: "Milano City Center",
    fromLocationId: "malpensa",
    toLocationId: "milano-center",
    prices: {
      'olympic-sedan': 220,      // €220 Sedan 2 pax / SUV 4 pax (3 pax with Luggage)
      'olympic-minivan': 255,    // €255 Mini Van 6 pax (4 pax with Luggage) / Tesla
      'olympic-van': 490,        // €490 Van 8 pax (6 pax with luggage)
      'olympic-luxury': 470      // €470 Luxury Sedan (2 pax max | Mercedes S / Maserati)
    },
    extraHourRates: {
      'olympic-sedan': 94,       // €94 (sedan & suv)
      'olympic-minivan': 108,    // €108 (mini van & tesla)
      'olympic-van': 135,        // €135 (van & first class)
      'olympic-luxury': 135      // €135 (van & first class)
    },
    category: 'milano-airports'
  },
  {
    from: "Milano Malpensa MXP",
    to: "Livigno",
    fromLocationId: "malpensa",
    toLocationId: "livigno",
    prices: {
      'olympic-sedan': 1100,     // €1,100 Sedan / SUV
      'olympic-minivan': 1270,   // €1,270 Mini Van / Tesla
      'olympic-van': 1780,       // €1,780 Van
      'olympic-luxury': 1630     // €1,630 Luxury Sedan
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    category: 'milano-airports'
  },
  {
    from: "Milano Malpensa MXP",
    to: "Bormio",
    fromLocationId: "malpensa",
    toLocationId: "bormio",
    prices: {
      'olympic-sedan': 990,      // €990 Sedan / SUV
      'olympic-minivan': 1150,   // €1,150 Mini Van / Tesla
      'olympic-van': 1540,       // €1,540 Van
      'olympic-luxury': 1430     // €1,430 Luxury Sedan
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    category: 'milano-airports'
  },
  {
    from: "Milano Malpensa MXP",
    to: "Verona",
    fromLocationId: "malpensa",
    toLocationId: "verona",
    prices: {
      'olympic-sedan': 710,      // €710 Sedan / SUV
      'olympic-minivan': 830,    // €830 Mini Van / Tesla
      'olympic-van': 1250,       // €1,250 Van
      'olympic-luxury': 1130     // €1,130 Luxury Sedan
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    category: 'milano-airports'
  },

  // Milano Linate LIN routes
  {
    from: "Milano Linate LIN",
    to: "Milano City Center",
    fromLocationId: "linate",
    toLocationId: "milano-center",
    prices: {
      'olympic-sedan': 135,      // €135 Sedan / SUV
      'olympic-minivan': 150,    // €150 Mini Van / Tesla
      'olympic-van': 330,        // €330 Van
      'olympic-luxury': 285      // €285 Luxury Sedan
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    category: 'milano-airports'
  },
  {
    from: "Milano Linate LIN",
    to: "Livigno",
    fromLocationId: "linate",
    toLocationId: "livigno",
    prices: {
      'olympic-sedan': 1070,     // €1,070 Sedan / SUV
      'olympic-minivan': 1230,   // €1,230 Mini Van / Tesla
      'olympic-van': 1590,       // €1,590 Van
      'olympic-luxury': 1470     // €1,470 Luxury Sedan
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    category: 'milano-airports'
  },
  {
    from: "Milano Linate LIN",
    to: "Bormio",
    fromLocationId: "linate",
    toLocationId: "bormio",
    prices: {
      'olympic-sedan': 920,      // €920 Sedan / SUV
      'olympic-minivan': 1170,   // €1,170 Mini Van / Tesla
      'olympic-van': 1390,       // €1,390 Van
      'olympic-luxury': 1290     // €1,290 Luxury Sedan
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    category: 'milano-airports'
  },
  {
    from: "Milano Linate LIN",
    to: "Verona",
    fromLocationId: "linate",
    toLocationId: "verona",
    prices: {
      'olympic-sedan': 620,      // €620 Sedan / SUV
      'olympic-minivan': 730,    // €730 Mini Van / Tesla
      'olympic-van': 990,        // €990 Van
      'olympic-luxury': 920      // €920 Luxury Sedan
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    category: 'milano-airports'
  },

  // Bergamo/Orio al Serio BGY routes
  {
    from: "Bergamo BGY",
    to: "Milano City Center",
    fromLocationId: "orio-al-serio",
    toLocationId: "milano-center",
    prices: {
      'olympic-sedan': 240,      // €240 Sedan / SUV
      'olympic-minivan': 270,    // €270 Mini Van / Tesla
      'olympic-van': 520,        // €520 Van
      'olympic-luxury': 515      // €515 Luxury Sedan
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    category: 'milano-airports'
  },
  {
    from: "Bergamo BGY",
    to: "Livigno",
    fromLocationId: "orio-al-serio",
    toLocationId: "livigno",
    prices: {
      'olympic-sedan': 950,      // €950 Sedan / SUV
      'olympic-minivan': 1100,   // €1,100 Mini Van / Tesla
      'olympic-van': 1590,       // €1,590 Van
      'olympic-luxury': 1470     // €1,470 Luxury Sedan
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    category: 'milano-airports'
  },
  {
    from: "Bergamo BGY",
    to: "Bormio",
    fromLocationId: "orio-al-serio",
    toLocationId: "bormio",
    prices: {
      'olympic-sedan': 830,      // €830 Sedan / SUV
      'olympic-minivan': 960,    // €960 Mini Van / Tesla
      'olympic-van': 1390,       // €1,390 Van
      'olympic-luxury': 1290     // €1,290 Luxury Sedan
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    category: 'milano-airports'
  },
  {
    from: "Bergamo BGY",
    to: "Verona",
    fromLocationId: "orio-al-serio",
    toLocationId: "verona",
    prices: {
      'olympic-sedan': 430,      // €430 Sedan / SUV
      'olympic-minivan': 500,    // €500 Mini Van / Tesla
      'olympic-van': 990,        // €990 Van
      'olympic-luxury': 920      // €920 Luxury Sedan
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    category: 'milano-airports'
  },

  // Milano Stazione Centrale routes
  {
    from: "Milano Stazione Centrale",
    to: "Milano City Center",
    fromLocationId: "milano-centrale",
    toLocationId: "milano-center",
    prices: {
      'olympic-sedan': 125,      // €125 Sedan / SUV
      'olympic-minivan': 150,    // €150 Mini Van / Tesla
      'olympic-van': 320,        // €320 Van
      'olympic-luxury': 270      // €270 Luxury Sedan
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    category: 'milano-airports'
  },
  {
    from: "Milano Stazione Centrale",
    to: "Livigno",
    fromLocationId: "milano-centrale",
    toLocationId: "livigno",
    prices: {
      'olympic-sedan': 1070,     // €1,070 Sedan / SUV
      'olympic-minivan': 1230,   // €1,230 Mini Van / Tesla
      'olympic-van': 1590,       // €1,590 Van
      'olympic-luxury': 1470     // €1,470 Luxury Sedan
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    category: 'milano-airports'
  },
  {
    from: "Milano Stazione Centrale",
    to: "Bormio",
    fromLocationId: "milano-centrale",
    toLocationId: "bormio",
    prices: {
      'olympic-sedan': 920,      // €920 Sedan / SUV
      'olympic-minivan': 1170,   // €1,170 Mini Van / Tesla
      'olympic-van': 1390,       // €1,390 Van
      'olympic-luxury': 1290     // €1,290 Luxury Sedan
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    category: 'milano-airports'
  },
  {
    from: "Milano Stazione Centrale",
    to: "Verona",
    fromLocationId: "milano-centrale",
    toLocationId: "verona",
    prices: {
      'olympic-sedan': 620,      // €620 Sedan / SUV
      'olympic-minivan': 730,    // €730 Mini Van / Tesla
      'olympic-van': 990,        // €990 Van
      'olympic-luxury': 920      // €920 Luxury Sedan
    },
    extraHourRates: {
      'olympic-sedan': 94,
      'olympic-minivan': 108,
      'olympic-van': 135,
      'olympic-luxury': 135
    },
    category: 'milano-airports'
  }
]

// ALL REVERSE ROUTES - Add reverse routes for all the above
export const BIDIRECTIONAL_OLYMPIC_ROUTES: OlympicRoute[] = [
  ...CORRECTED_OLYMPIC_ROUTES,
  // Create reverse routes automatically
  ...CORRECTED_OLYMPIC_ROUTES.map(route => ({
    ...route,
    from: route.to,
    to: route.from,
    fromLocationId: route.toLocationId,
    toLocationId: route.fromLocationId
  }))
]

// Olympic pricing configuration
export const OLYMPIC_PRICING_CONFIG = {
  vat: {
    rate: 10,
    description: '10% VAT to be added'
  },
  nightSurcharge: {
    rate: 20,
    description: 'Surcharge of 20% for all night transfers between 21:00 (09:00 PM) and 6:00 AM',
    hours: {
      start: '21:00',
      end: '06:00'
    }
  },
  extraHours: {
    description: 'Rate for extra hours',
    rates: {
      sedan: 94,      // €94 (sedan & suv)
      minivan: 108,   // €108 (mini van & tesla)
      van: 135,       // €135 (van & first class)
      luxury: 135     // €135 (van & first class)
    }
  }
}

// Function to find Olympic route by location IDs
export function findOlympicRouteCorrected(fromLocationId: string, toLocationId: string): OlympicRoute | null {
  return BIDIRECTIONAL_OLYMPIC_ROUTES.find(route => 
    route.fromLocationId === fromLocationId && route.toLocationId === toLocationId
  ) || null
}

// Function to get all Olympic locations
export function getOlympicLocationsCorrected(): string[] {
  const locations = new Set<string>()
  BIDIRECTIONAL_OLYMPIC_ROUTES.forEach(route => {
    locations.add(route.fromLocationId)
    locations.add(route.toLocationId)
  })
  return Array.from(locations)
}

// Function to check if a location is an Olympic venue
export function isOlympicLocationCorrected(locationId: string): boolean {
  return getOlympicLocationsCorrected().includes(locationId)
}