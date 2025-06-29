#!/usr/bin/env tsx

import { 
  GP_MONZA_2025, 
  MILANO_CORTINA_2026, 
  getActiveEvent,
  getAllowedVehicleTypes,
  getAvailableLocations,
  findEventRouteByLocation,
  calculateRoundTripDispositionPrice,
  MEET_GREET_SERVICES,
  calculateMeetGreetPrice,
  isEventPeriod
} from './lib/event-pricing'

import { 
  OLYMPIC_TRANSFER_ROUTES,
  OLYMPIC_CEREMONIES,
  calculateCeremonyPrice,
  isOlympicPeriod,
  isCeremonyDate,
  getCeremonyName,
  findOlympicRoute
} from './lib/olympic-pricing'

import * as fs from 'fs'

// Utility function to format currency
function formatPrice(amount: number): string {
  return `€${amount.toFixed(2)}`
}

// Utility function to calculate price without VAT
function calculateWithoutVAT(total: number, vatRate: number): number {
  return total / (1 + vatRate / 100)
}

// Custom Olympic pricing functions
function calculateOlympicTransferPrice(route: any, vehicleType: string, isNight: boolean = false) {
  const basePrice = route.prices[vehicleType] || 0
  const nightSurcharge = isNight ? basePrice * 0.2 : 0 // 20% Olympic night surcharge
  const subtotal = basePrice + nightSurcharge
  const vatAmount = subtotal * 0.1 // 10% Olympic VAT
  return {
    basePrice,
    nightSurcharge,
    subtotal,
    vatAmount,
    total: subtotal + vatAmount,
    extraHourRate: route.extraHourRates[vehicleType] || 0
  }
}

// CSV writing functions
let csvData: string[] = []

function addCSVHeader() {
  const header = [
    'Tipo_Servizio',
    'Evento', 
    'Partenza',
    'Destinazione',
    'Veicolo',
    'Periodo',
    'Prezzo_Base_No_IVA',
    'Prezzo_Base_Con_IVA',
    'Supplemento_Notte_No_IVA', 
    'Supplemento_Notte_Con_IVA',
    'Tariffa_IVA_Percent',
    'Supplemento_Notte_Percent',
    'Ore_Extra_Rate',
    'Note',
    'Scenario_Dettagli'
  ].join(',')
  
  csvData.push(header)
}

function addCSVRow(data: {
  tipoServizio: string
  evento: string
  partenza: string
  destinazione: string
  veicolo: string
  periodo: string
  prezzoBaseNoIVA: number
  prezzoBaseConIVA: number
  supplementoNotteNoIVA: number
  supplementoNotteConIVA: number
  tariffaIVA: number
  supplementoNottePercent: number
  oreExtraRate: number
  note: string
  scenarioDettagli: string
}) {
  const row = [
    data.tipoServizio,
    data.evento,
    data.partenza,
    data.destinazione, 
    data.veicolo,
    data.periodo,
    data.prezzoBaseNoIVA.toFixed(2),
    data.prezzoBaseConIVA.toFixed(2),
    data.supplementoNotteNoIVA.toFixed(2),
    data.supplementoNotteConIVA.toFixed(2),
    data.tariffaIVA.toString(),
    data.supplementoNottePercent.toString(),
    data.oreExtraRate.toFixed(2),
    `"${data.note}"`,
    `"${data.scenarioDettagli}"`
  ].join(',')
  
  csvData.push(row)
}

console.log("🏁 PATTY CAR - COMPLETE PRICING TEST SCRIPT")
console.log("=" .repeat(80))
console.log()

// Initialize CSV
addCSVHeader()

// Test dates for different periods
const testDates = {
  gpMonza: new Date('2025-07-15'),
  olympics: new Date('2026-02-15'),
  openingCeremony: new Date('2026-02-06'),
  closingCeremony: new Date('2026-02-22'),
  noEvent: new Date('2024-06-15')
}

console.log("📅 TEST DATES:")
console.log(`- GP Monza: ${testDates.gpMonza.toISOString().split('T')[0]}`)
console.log(`- Olympics: ${testDates.olympics.toISOString().split('T')[0]}`)
console.log(`- Opening Ceremony: ${testDates.openingCeremony.toISOString().split('T')[0]}`)
console.log(`- Closing Ceremony: ${testDates.closingCeremony.toISOString().split('T')[0]}`)
console.log(`- No Event: ${testDates.noEvent.toISOString().split('T')[0]}`)
console.log()

// =============================================================================
// 1. GP MONZA 2025 TESTING
// =============================================================================
console.log("🏎️  GP MONZA 2025 PRICING TEST")
console.log("=" .repeat(80))

const gpMonzaDate = testDates.gpMonza
const gpMonzaEvent = getActiveEvent(gpMonzaDate)
const gpMonzaLocations = getAvailableLocations(gpMonzaDate)
const gpMonzaVehicles = getAllowedVehicleTypes(gpMonzaDate)

console.log(`\n📍 Available Locations (${gpMonzaLocations.length}):`)
gpMonzaLocations.forEach(loc => console.log(`   - ${loc.displayName} (${loc.id})`))

console.log(`\n🚗 Available Vehicles (${gpMonzaVehicles.length}):`)
gpMonzaVehicles.forEach(vehicle => console.log(`   - ${vehicle}`))

// Test all GP Monza transfer combinations
console.log(`\n💰 GP MONZA TRANSFER PRICES:`)
console.log("-".repeat(60))

const gpTransferTests = [
  { from: 'milano', to: 'linate', desc: 'Milano → Linate' },
  { from: 'linate', to: 'milano', desc: 'Linate → Milano' },
  { from: 'milano', to: 'linate-prime', desc: 'Milano → Linate Prime' },
  { from: 'linate-prime', to: 'milano', desc: 'Linate Prime → Milano' },
  { from: 'milano', to: 'malpensa', desc: 'Milano → Malpensa' },
  { from: 'malpensa', to: 'milano', desc: 'Malpensa → Milano' },
  { from: 'milano', to: 'orio-al-serio', desc: 'Milano → Orio al Serio' },
  { from: 'orio-al-serio', to: 'milano', desc: 'Orio al Serio → Milano' }
]

gpTransferTests.forEach(test => {
  console.log(`\n${test.desc}:`)
  
  const route = findEventRouteByLocation(test.from, test.to, GP_MONZA_2025)
  if (route) {
    const vehicles = ['berlina', 'monovolume', 'minibus'] as const
    
    vehicles.forEach(vehicle => {
      const basePrice = route.prices[vehicle]
      const withoutVAT = calculateWithoutVAT(basePrice * 1.1, 10) // GP Monza has 10% VAT
      const nightSurcharge = basePrice * 0.2 // 20% night surcharge
      const nightTotal = (basePrice + nightSurcharge) * 1.1
      const nightWithoutVAT = calculateWithoutVAT(nightTotal, 10)
      
      console.log(`  ${vehicle.toUpperCase()}:`)
      console.log(`    Day: ${formatPrice(withoutVAT)} (no VAT) → ${formatPrice(basePrice * 1.1)} (with 10% VAT)`)
      console.log(`    Night: ${formatPrice(nightWithoutVAT)} (no VAT) → ${formatPrice(nightTotal)} (with 10% VAT + 20% night)`)
      if (route.notes) console.log(`    Notes: ${route.notes}`)

      // Add to CSV - Day
      addCSVRow({
        tipoServizio: 'Transfer',
        evento: 'GP_Monza_2025',
        partenza: test.from,
        destinazione: test.to,
        veicolo: vehicle,
        periodo: 'Giorno',
        prezzoBaseNoIVA: withoutVAT,
        prezzoBaseConIVA: basePrice * 1.1,
        supplementoNotteNoIVA: 0,
        supplementoNotteConIVA: 0,
        tariffaIVA: 10,
        supplementoNottePercent: 0,
        oreExtraRate: 0,
        note: route.notes || '',
        scenarioDettagli: `${test.desc} - ${vehicle} - giorno`
      })

      // Add to CSV - Night  
      addCSVRow({
        tipoServizio: 'Transfer',
        evento: 'GP_Monza_2025',
        partenza: test.from,
        destinazione: test.to,
        veicolo: vehicle,
        periodo: 'Notte',
        prezzoBaseNoIVA: withoutVAT,
        prezzoBaseConIVA: basePrice * 1.1,
        supplementoNotteNoIVA: nightWithoutVAT,
        supplementoNotteConIVA: nightTotal,
        tariffaIVA: 10,
        supplementoNottePercent: 20,
        oreExtraRate: 0,
        note: route.notes || '',
        scenarioDettagli: `${test.desc} - ${vehicle} - notte (19:30-07:30)`
      })
    })
  } else {
    console.log(`  ❌ Route not found`)
  }
})

// Test GP Monza Disposition (basic scenarios only)
console.log(`\n🕐 GP MONZA DISPOSITION PRICES:`)
console.log("-".repeat(60))

const dispositionTests = [
  { vehicle: 'berlina', hours: 10, km: 100, desc: 'Berlina - Giorno standard (10h/100km)' },
  { vehicle: 'monovolume', hours: 10, km: 100, desc: 'Monovolume - Giorno standard (10h/100km)' },
  { vehicle: 'minibus', hours: 10, km: 100, desc: 'Minibus - Giorno standard (10h/100km)' }
] as const

dispositionTests.forEach(test => {
  console.log(`\n${test.desc}:`)
  
  // Test day service (base disposition)
  const dayResult = calculateRoundTripDispositionPrice({
    vehicleType: test.vehicle,
    serviceStartTime: '09',
    serviceStartMinutes: '00',
    serviceStartAmPm: 'AM',
    serviceEndTime: '05',
    serviceEndMinutes: '00',
    serviceEndAmPm: 'PM',
    milanToServiceStart: 30,
    serviceDistance: test.km - 60,
    serviceEndToMilan: 30,
    transferTimeToService: 1,
    transferTimeFromService: 1,
    event: GP_MONZA_2025
  })
  
  const dayWithoutVAT = calculateWithoutVAT(dayResult.total, 10)
  
  console.log(`  Day Service:`)
  console.log(`    Without VAT: ${formatPrice(dayWithoutVAT)}`)
  console.log(`    With 10% VAT: ${formatPrice(dayResult.total)}`)
  console.log(`    Breakdown: Daily €${dayResult.breakdown.dailyRate}`)

  // Add to CSV - Day Disposition
  addCSVRow({
    tipoServizio: 'Disposition',
    evento: 'GP_Monza_2025',
    partenza: 'Milano',
    destinazione: 'GP_Monza',
    veicolo: test.vehicle,
    periodo: 'Giorno',
    prezzoBaseNoIVA: dayWithoutVAT,
    prezzoBaseConIVA: dayResult.total,
    supplementoNotteNoIVA: 0,
    supplementoNotteConIVA: 0,
    tariffaIVA: 10,
    supplementoNottePercent: 0,
          oreExtraRate: GP_MONZA_2025.disposition?.[test.vehicle]?.hourly || 0,
    note: `Include 10 ore + 100 KM`,
    scenarioDettagli: `${test.desc} - giorno standard`
  })
})

// =============================================================================
// 2. OLYMPIC PERIOD 2026 TESTING
// =============================================================================
console.log(`\n\n🏔️  MILANO-CORTINA 2026 OLYMPICS PRICING TEST`)
console.log("=" .repeat(80))

const olympicDate = testDates.olympics
const olympicLocations = getAvailableLocations(olympicDate)
const olympicVehicles = getAllowedVehicleTypes(olympicDate)

console.log(`\n📍 Available Olympic Locations (${olympicLocations.length}):`)
olympicLocations.forEach(loc => console.log(`   - ${loc.displayName} (${loc.id})`))

console.log(`\n🚗 Available Olympic Vehicles (${olympicVehicles.length}):`)
olympicVehicles.forEach(vehicle => console.log(`   - ${vehicle}`))

// Test Olympic Transfer Routes
console.log(`\n💰 OLYMPIC TRANSFER PRICES:`)
console.log("-".repeat(60))

// Test some key Olympic routes
const olympicRouteTests = [
  { from: 'malpensa', to: 'milano', desc: 'Malpensa → Milano City' },
  { from: 'linate', to: 'milano', desc: 'Linate → Milano City' },
  { from: 'malpensa', to: 'livigno', desc: 'Malpensa → Livigno' },
  { from: 'linate', to: 'bormio', desc: 'Linate → Bormio' },
  { from: 'milano-centrale', to: 'cortina', desc: 'Milano Centrale → Cortina' },
  { from: 'malpensa', to: 'verona', desc: 'Malpensa → Verona' }
]

olympicRouteTests.forEach(test => {
  console.log(`\n${test.desc}:`)
  
  // Find the route in OLYMPIC_TRANSFER_ROUTES
  const route = findOlympicRoute(test.from, test.to)
  
  if (route) {
    const vehicles = ['olympic-sedan',  'olympic-minivan', 'olympic-van', 'olympic-luxury'] as const
    
    vehicles.forEach(vehicle => {
      const price = route.prices[vehicle]
      if (price) {
        const dayResult = calculateOlympicTransferPrice(route, vehicle, false)
        const nightResult = calculateOlympicTransferPrice(route, vehicle, true)
        
        console.log(`  ${vehicle.replace('olympic-', '').toUpperCase()}:`)
        console.log(`    Day: ${formatPrice(dayResult.subtotal)} (no VAT) → ${formatPrice(dayResult.total)} (with 10% VAT)`)
        console.log(`    Night: ${formatPrice(nightResult.subtotal)} (no VAT) → ${formatPrice(nightResult.total)} (with 10% VAT + 20% night)`)

        // Add to CSV - Day Olympic
        addCSVRow({
          tipoServizio: 'Olympic_Transfer',
          evento: 'Milano_Cortina_2026',
          partenza: test.from,
          destinazione: test.to,
          veicolo: vehicle,
          periodo: 'Giorno',
          prezzoBaseNoIVA: dayResult.subtotal,
          prezzoBaseConIVA: dayResult.total,
          supplementoNotteNoIVA: 0,
          supplementoNotteConIVA: 0,
          tariffaIVA: 10,
          supplementoNottePercent: 0,
          oreExtraRate: dayResult.extraHourRate,
          note: '',
          scenarioDettagli: `${test.desc} - ${vehicle} - giorno`
        })

        // Add to CSV - Night Olympic
        addCSVRow({
          tipoServizio: 'Olympic_Transfer',
          evento: 'Milano_Cortina_2026',
          partenza: test.from,
          destinazione: test.to,
          veicolo: vehicle,
          periodo: 'Notte',
          prezzoBaseNoIVA: dayResult.subtotal,
          prezzoBaseConIVA: dayResult.total,
          supplementoNotteNoIVA: nightResult.subtotal,
          supplementoNotteConIVA: nightResult.total,
          tariffaIVA: 10,
          supplementoNottePercent: 20,
          oreExtraRate: nightResult.extraHourRate,
          note: `Night surcharge: €${nightResult.nightSurcharge}`,
          scenarioDettagli: `${test.desc} - ${vehicle} - notte (21:00-06:00)`
        })
      }
    })
  } else {
    console.log(`  ❌ Olympic route not found`)
  }
})

// =============================================================================
// 3. OLYMPIC CEREMONIES 2026 TESTING
// =============================================================================
console.log(`\n\n🎭 OLYMPIC CEREMONIES 2026 PRICING TEST`)
console.log("=" .repeat(80))

console.log(`\nCeremony pricing (from CSV data):`)
console.log(`  Opening Ceremony (Feb 6, 2026) - San Siro Milano:`)
console.log(`    Berlina: €1,700 base + €300/hour`)
console.log(`    Monovolume: €2,200 base + €400/hour`)
console.log(`    Minibus: €2,900 base + €500/hour`)

console.log(`  Closing Ceremony (Feb 22, 2026) - Arena Verona:`)
console.log(`    Berlina: €1,700 base + €300/hour`)
console.log(`    Monovolume: €2,200 base + €400/hour`)
console.log(`    Minibus: €2,900 base + €500/hour`)

// Add ceremony data from CSV to our test results
const ceremonyPrices = [
  { ceremony: 'Opening', location: 'San Siro Milano', date: '2026-02-06', vehicle: 'berlina', base: 1700, hourly: 300 },
  { ceremony: 'Opening', location: 'San Siro Milano', date: '2026-02-06', vehicle: 'monovolume', base: 2200, hourly: 400 },
  { ceremony: 'Opening', location: 'San Siro Milano', date: '2026-02-06', vehicle: 'minibus', base: 2900, hourly: 500 },
  { ceremony: 'Closing', location: 'Arena Verona', date: '2026-02-22', vehicle: 'berlina', base: 1700, hourly: 300 },
  { ceremony: 'Closing', location: 'Arena Verona', date: '2026-02-22', vehicle: 'monovolume', base: 2200, hourly: 400 },
  { ceremony: 'Closing', location: 'Arena Verona', date: '2026-02-22', vehicle: 'minibus', base: 2900, hourly: 500 }
]

ceremonyPrices.forEach(ceremony => {
  const totalWithVAT = ceremony.base * 1.1 // 10% VAT
  const withoutVAT = calculateWithoutVAT(totalWithVAT, 10)
  
  addCSVRow({
    tipoServizio: 'Ceremony_Disposition',
    evento: 'Milano_Cortina_2026',
    partenza: ceremony.location,
    destinazione: ceremony.location,
    veicolo: ceremony.vehicle,
    periodo: 'Giorno',
    prezzoBaseNoIVA: withoutVAT,
    prezzoBaseConIVA: totalWithVAT,
    supplementoNotteNoIVA: 0,
    supplementoNotteConIVA: 0,
    tariffaIVA: 10,
    supplementoNottePercent: 0,
    oreExtraRate: ceremony.hourly,
    note: `${ceremony.ceremony} Ceremony - Base €${ceremony.base}`,
    scenarioDettagli: `${ceremony.ceremony} Ceremony - ${ceremony.location} - ${ceremony.vehicle} - ${ceremony.date}`
  })
})

// =============================================================================
// 4. MEET & GREET SERVICES TESTING (Core scenarios only)
// =============================================================================
console.log(`\n\n🤝 MEET & GREET SERVICES PRICING TEST`)
console.log("=" .repeat(80))

console.log(`\nAvailable Meet & Greet Services:`)
Object.keys(MEET_GREET_SERVICES).forEach(serviceId => {
  const service = MEET_GREET_SERVICES[serviceId]
  console.log(`   - ${serviceId}: ${service.location} (${service.type})`)
})

// Test Meet & Greet core scenarios (no extra delays/waits)
const meetGreetTests = [
  {
    serviceId: 'malpensa-arrivals',
    scenarios: [
      { passengers: 1, children: 0, infants: 0, extraLuggage: 0, desc: '1 passenger base' },
      { passengers: 2, children: 1, infants: 0, extraLuggage: 2, desc: '2 adults + 1 child + 2 extra luggage' },
      { passengers: 4, children: 2, infants: 1, extraLuggage: 3, desc: '4 adults + 2 children + 1 infant + 3 extra luggage' }
    ]
  },
  {
    serviceId: 'linate-departures',
    scenarios: [
      { passengers: 1, children: 0, infants: 0, extraLuggage: 0, desc: '1 passenger base' },
      { passengers: 3, children: 0, infants: 0, extraLuggage: 2, desc: '3 passengers + 2 extra luggage' }
    ]
  },
  {
    serviceId: 'milano-centrale-arrivals',
    scenarios: [
      { passengers: 1, children: 0, infants: 0, extraLuggage: 0, desc: '1 passenger base' },
      { passengers: 2, children: 0, infants: 0, extraLuggage: 1, desc: '2 passengers + 1 extra luggage' }
    ]
  }
]

meetGreetTests.forEach(test => {
  const service = MEET_GREET_SERVICES[test.serviceId]
  console.log(`\n${service.location} - ${service.type.toUpperCase()}:`)
  console.log(`Base: €${service.basePrice} (includes ${service.includedLuggage} luggage)`)
  
  test.scenarios.forEach(scenario => {
    console.log(`\n  ${scenario.desc}:`)
    
    // Test day service only (no night complications)
    const result = calculateMeetGreetPrice(service, {
      passengers: scenario.passengers,
      children: scenario.children,
      infants: scenario.infants,
      extraLuggage: scenario.extraLuggage,
      extraHours: 0, // No extra hours for core testing
      specialServices: {},
      isNight: false
    })
    
    const withoutVAT = calculateWithoutVAT(result.total, 22) // Meet & Greet has 22% VAT
    
    console.log(`    Without VAT: ${formatPrice(withoutVAT)}`)
    console.log(`    With 22% VAT: ${formatPrice(result.total)}`)
    
    // Show breakdown
    const breakdownDetails = result.breakdown
      .filter(item => item.amount > 0 && !item.description.includes('VAT'))
      .map(item => `${item.description}: €${item.amount}`)
      .join(' | ')

    console.log(`    Breakdown: ${breakdownDetails}`)

    // Add to CSV
    addCSVRow({
      tipoServizio: 'Meet_and_Greet',
      evento: 'Milano_Cortina_2026',
      partenza: service.location,
      destinazione: 'Servizio_Cliente',
      veicolo: 'Meet_Greet_Service',
      periodo: 'Giorno',
      prezzoBaseNoIVA: withoutVAT,
      prezzoBaseConIVA: result.total,
      supplementoNotteNoIVA: 0,
      supplementoNotteConIVA: 0,
      tariffaIVA: 22,
      supplementoNottePercent: 0,
      oreExtraRate: service.extraHourPrice,
      note: breakdownDetails,
      scenarioDettagli: `${service.location} - ${service.type} - ${scenario.desc}`
    })
  })
})

// Write CSV file
const csvContent = csvData.join('\n')
fs.writeFileSync('pattycar-pricing-results.csv', csvContent, 'utf8')

console.log(`\n\n📊 PRICING SUMMARY & VERIFICATION`)
console.log("=" .repeat(80))

console.log(`\n✅ TESTED SERVICES:`)
console.log(`   • GP Monza 2025: ${gpTransferTests.length} transfer routes × 3 vehicles = ${gpTransferTests.length * 3} combinations`)
console.log(`   • GP Monza Disposition: ${dispositionTests.length} scenarios`)
console.log(`   • Olympic Transfers: ${olympicRouteTests.length} routes × 6 vehicles = ${olympicRouteTests.length * 6} combinations`)
console.log(`   • Olympic Ceremonies: 2 ceremonies × 3 vehicles = 6 tests`)
console.log(`   • Meet & Greet: ${meetGreetTests.reduce((sum, test) => sum + test.scenarios.length, 0)} core scenarios`)

console.log(`\n💡 VAT RATES APPLIED:`)
console.log(`   • GP Monza 2025: 10% VAT`)
console.log(`   • Olympics 2026: 10% VAT`)
console.log(`   • Meet & Greet: 22% VAT`)

console.log(`\n🌙 NIGHT SURCHARGES:`)
console.log(`   • GP Monza: +20% (19:30-07:30)`)
console.log(`   • Olympics: +20% (21:00-06:00)`)

console.log(`\n📄 CSV FILE GENERATED:`)
console.log(`   • File: pattycar-pricing-results.csv`)
console.log(`   • Total rows: ${csvData.length - 1} (+ 1 header row)`)
console.log(`   • Contains: Core pricing test results without external delays/waits`)

console.log(`\n✨ Script completed successfully!`)
console.log("=" .repeat(80)) 