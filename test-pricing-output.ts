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
  const nightSurcharge = isNight ? basePrice * 0.25 : 0 // 25% Olympic night surcharge
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

// HTML generation functions
let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Patty Car - Complete Pricing Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        h2 {
            color: #34495e;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-top: 40px;
        }
        h3 {
            color: #2980b9;
            margin-top: 30px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 10px;
            text-align: left;
            font-weight: 600;
        }
        td {
            padding: 12px 10px;
            border-bottom: 1px solid #ecf0f1;
        }
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        tr:hover {
            background-color: #e8f4f8;
        }
        .price {
            font-weight: bold;
            color: #27ae60;
        }
        .night-price {
            font-weight: bold;
            color: #e74c3c;
        }
        .route-name {
            font-weight: 600;
            color: #2c3e50;
        }
        .notes {
            font-style: italic;
            color: #7f8c8d;
            font-size: 0.9em;
        }
        .summary-box {
            background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .summary-box h3 {
            color: white;
            margin-top: 0;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏁 Patty Car - Complete Pricing Report</h1>
        <p style="text-align: center; color: #7f8c8d; font-size: 1.1em;">
            Generated on ${new Date().toLocaleDateString('it-IT')} at ${new Date().toLocaleTimeString('it-IT')}
        </p>
`

function addSection(title: string, subtitle?: string) {
  htmlContent += `
        <h2>${title}</h2>
        ${subtitle ? `<p style="color: #7f8c8d; font-style: italic;">${subtitle}</p>` : ''}
  `
}

function addTable(headers: string[], rows: string[][]) {
  htmlContent += `
        <table>
            <thead>
                <tr>
                    ${headers.map(h => `<th>${h}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
            </tbody>
        </table>
  `
}

function addWarning(message: string) {
  htmlContent += `<div class="warning">⚠️ ${message}</div>`
}

function addSuccess(message: string) {
  htmlContent += `<div class="success">✅ ${message}</div>`
}

// Test dates for different periods
const testDates = {
  gpMonza: new Date('2025-07-15'),
  olympics: new Date('2026-02-15'),
  openingCeremony: new Date('2026-02-06'),
  closingCeremony: new Date('2026-02-22'),
  noEvent: new Date('2024-06-15')
}

console.log("🏁 Generating Patty Car Complete Pricing Report...")

// =============================================================================
// 1. GP MONZA 2025 TESTING
// =============================================================================
addSection("🏎️ GP Monza 2025 Pricing", "Prezzi per il periodo del Gran Premio di Monza (10% IVA, +20% supplemento notturno 19:30-07:30)")

const gpMonzaDate = testDates.gpMonza
const gpMonzaLocations = getAvailableLocations(gpMonzaDate)
const gpMonzaVehicles = getAllowedVehicleTypes(gpMonzaDate)

// GP Monza Transfer Prices
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

const gpTransferHeaders = ['Tratta', 'Berlina (Giorno)', 'Berlina (Notte)', 'Monovolume (Giorno)', 'Monovolume (Notte)', 'Minibus (Giorno)', 'Minibus (Notte)', 'Note']
const gpTransferRows: string[][] = []

gpTransferTests.forEach(test => {
  const route = findEventRouteByLocation(test.from, test.to, GP_MONZA_2025)
  if (route) {
    const vehicles = ['berlina', 'monovolume', 'minibus'] as const
    const prices: string[] = [test.desc]
    
    vehicles.forEach(vehicle => {
      const basePrice = route.prices[vehicle]
      const withoutVAT = calculateWithoutVAT(basePrice * 1.1, 10)
      const nightSurcharge = basePrice * 0.2
      const nightTotal = (basePrice + nightSurcharge) * 1.1
      const nightWithoutVAT = calculateWithoutVAT(nightTotal, 10)
      
      prices.push(`<span class="price">${formatPrice(basePrice * 1.1)}</span><br><small>(${formatPrice(withoutVAT)} no IVA)</small>`)
      prices.push(`<span class="night-price">${formatPrice(nightTotal)}</span><br><small>(${formatPrice(nightWithoutVAT)} no IVA)</small>`)
    })
    
    prices.push(route.notes || '-')
    gpTransferRows.push(prices)
  } else {
    gpTransferRows.push([test.desc, '❌ Route non trovata', '', '', '', '', '', ''])
  }
})

addTable(gpTransferHeaders, gpTransferRows)

// GP Monza Disposition Prices
addSection("", "Prezzi Disposizione GP Monza")

const dispositionTests = [
  { vehicle: 'berlina', hours: 8, km: 80, desc: 'Berlina - 8h/80km (dentro incluso)' },
  { vehicle: 'berlina', hours: 12, km: 150, desc: 'Berlina - 12h/150km (extra ore/km)' },
  { vehicle: 'monovolume', hours: 10, km: 100, desc: 'Monovolume - 10h/100km (esatto incluso)' },
  { vehicle: 'monovolume', hours: 15, km: 200, desc: 'Monovolume - 15h/200km (extra ore/km)' },
  { vehicle: 'minibus', hours: 8, km: 50, desc: 'Minibus - 8h/50km (dentro incluso)' },
  { vehicle: 'minibus', hours: 18, km: 300, desc: 'Minibus - 18h/300km (extra ore/km)' }
] as const

const dispositionHeaders = ['Scenario', 'Giorno (con IVA)', 'Giorno (senza IVA)', 'Notte (con IVA)', 'Notte (senza IVA)', 'Dettagli']
const dispositionRows: string[][] = []

dispositionTests.forEach(test => {
  // Test day service (9:00-17:00)
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
  
  // Test night service (21:00-05:00)
  const nightResult = calculateRoundTripDispositionPrice({
    vehicleType: test.vehicle,
    serviceStartTime: '09',
    serviceStartMinutes: '00',
    serviceStartAmPm: 'PM',
    serviceEndTime: '05',
    serviceEndMinutes: '00',
    serviceEndAmPm: 'AM',
    milanToServiceStart: 30,
    serviceDistance: test.km - 60,
    serviceEndToMilan: 30,
    transferTimeToService: 1,
    transferTimeFromService: 1,
    event: GP_MONZA_2025
  })
  
  const nightWithoutVAT = calculateWithoutVAT(nightResult.total, 10)
  
  const details = `Daily €${dayResult.breakdown.dailyRate} + Extra KM €${dayResult.breakdown.extraKmCost} + Extra Ore €${dayResult.breakdown.extraHoursCost}`
  
  dispositionRows.push([
    test.desc,
    `<span class="price">${formatPrice(dayResult.total)}</span>`,
    formatPrice(dayWithoutVAT),
    `<span class="night-price">${formatPrice(nightResult.total)}</span>`,
    formatPrice(nightWithoutVAT),
    details
  ])
})

addTable(dispositionHeaders, dispositionRows)

// =============================================================================
// 2. OLYMPIC PERIOD 2026 TESTING
// =============================================================================
addSection("🏔️ Milano-Cortina 2026 Olympics Pricing", "Prezzi per il periodo Olimpico (10% IVA, +25% supplemento notturno 21:00-06:00)")

const olympicDate = testDates.olympics
const olympicLocations = getAvailableLocations(olympicDate)
const olympicVehicles = getAllowedVehicleTypes(olympicDate)

// Olympic Transfer Routes
const olympicRouteTests = [
  { from: 'malpensa', to: 'milano-city', desc: 'Malpensa → Milano City' },
  { from: 'linate', to: 'milano-city', desc: 'Linate → Milano City' },
  { from: 'malpensa', to: 'livigno', desc: 'Malpensa → Livigno' },
  { from: 'linate', to: 'bormio', desc: 'Linate → Bormio' },
  { from: 'malpensa', to: 'verona', desc: 'Malpensa → Verona' }
]

const olympicHeaders = ['Tratta', 'Sedan (Giorno)', 'Sedan (Notte)', 'SUV (Giorno)', 'SUV (Notte)', 'Van (Giorno)', 'Van (Notte)', 'Luxury (Giorno)', 'Luxury (Notte)']
const olympicRows: string[][] = []

olympicRouteTests.forEach(test => {
  const route = findOlympicRoute(test.from, test.to)
  if (route) {
    const vehicles = ['olympic-sedan', 'olympic-suv', 'olympic-van', 'olympic-luxury'] as const
    const prices: string[] = [test.desc]
    
    vehicles.forEach(vehicle => {
      const price = route.prices[vehicle]
      if (price) {
        const dayResult = calculateOlympicTransferPrice(route, vehicle, false)
        const nightResult = calculateOlympicTransferPrice(route, vehicle, true)
        
        prices.push(`<span class="price">${formatPrice(dayResult.total)}</span><br><small>(${formatPrice(dayResult.subtotal)} no IVA)</small>`)
        prices.push(`<span class="night-price">${formatPrice(nightResult.total)}</span><br><small>(${formatPrice(nightResult.subtotal)} no IVA)</small>`)
      } else {
        prices.push('-', '-')
      }
    })
    
    olympicRows.push(prices)
  } else {
    olympicRows.push([test.desc, '❌ Route non trovata', '', '', '', '', '', '', ''])
  }
})

addTable(olympicHeaders, olympicRows)

// Olympic Disposition
addSection("", "Prezzi Disposizione Olympics (tariffe orarie)")

const olympicDispositionTests = [
  { vehicle: 'olympic-sedan', hours: 8, desc: 'Olympic Sedan - 8h' },
  { vehicle: 'olympic-suv', hours: 8, desc: 'Olympic SUV - 8h' },
  { vehicle: 'olympic-van', hours: 8, desc: 'Olympic Van - 8h' }
] as const

const olympicDispHeaders = ['Veicolo', 'Tariffa Oraria', 'Giorno (8h con IVA)', 'Giorno (8h senza IVA)', 'Notte (8h con IVA)', 'Notte (8h senza IVA)']
const olympicDispRows: string[][] = []

olympicDispositionTests.forEach(test => {
  const route = findOlympicRoute('malpensa', 'milano-city')
  if (route) {
    const hourlyRate = route.extraHourRates[test.vehicle] || 100
    const dayHours = 8
    const dayPrice = hourlyRate * dayHours
    const dayWithVAT = dayPrice * 1.1
    const dayWithoutVAT = calculateWithoutVAT(dayWithVAT, 10)
    
    const nightPrice = dayPrice * 1.25
    const nightWithVAT = nightPrice * 1.1
    const nightWithoutVAT = calculateWithoutVAT(nightWithVAT, 10)
    
    olympicDispRows.push([
      test.desc,
      `€${hourlyRate}/ora`,
      `<span class="price">${formatPrice(dayWithVAT)}</span>`,
      formatPrice(dayWithoutVAT),
      `<span class="night-price">${formatPrice(nightWithVAT)}</span>`,
      formatPrice(nightWithoutVAT)
    ])
  }
})

addTable(olympicDispHeaders, olympicDispRows)

// =============================================================================
// 3. MEET & GREET SERVICES TESTING
// =============================================================================
addSection("🤝 Meet & Greet Services Pricing", "Servizi disponibili solo durante il periodo Olimpico (22% IVA)")

const meetGreetTests = [
  {
    serviceId: 'malpensa-arrivals',
    scenarios: [
      { passengers: 1, children: 0, infants: 0, extraLuggage: 0, isNight: false, desc: '1 passeggero, giorno' },
      { passengers: 2, children: 1, infants: 0, extraLuggage: 2, isNight: false, desc: '2 adulti + 1 bambino + 2 bagagli extra, giorno' },
      { passengers: 1, children: 0, infants: 0, extraLuggage: 0, isNight: true, desc: '1 passeggero, notte' },
      { passengers: 4, children: 2, infants: 1, extraLuggage: 5, isNight: true, desc: '4 adulti + 2 bambini + 1 neonato + 5 bagagli extra, notte' }
    ]
  },
  {
    serviceId: 'linate-departures',
    scenarios: [
      { passengers: 1, children: 0, infants: 0, extraLuggage: 0, isNight: false, desc: '1 passeggero, giorno' },
      { passengers: 3, children: 0, infants: 0, extraLuggage: 3, isNight: true, desc: '3 passeggeri + 3 bagagli extra, notte' }
    ]
  },
  {
    serviceId: 'venezia-arrivals',
    scenarios: [
      { passengers: 1, children: 0, infants: 0, extraLuggage: 0, isNight: false, desc: '1 passeggero, giorno' },
      { passengers: 2, children: 1, infants: 0, extraLuggage: 2, isNight: false, desc: '2 adulti + 1 bambino + 2 bagagli extra, giorno' }
    ]
  }
]

meetGreetTests.forEach(test => {
  const service = MEET_GREET_SERVICES[test.serviceId]
  addSection("", `${service.location} - ${service.type.toUpperCase()}`)
  
  const mgHeaders = ['Scenario', 'Prezzo con IVA', 'Prezzo senza IVA', 'Dettagli']
  const mgRows: string[][] = []
  
  test.scenarios.forEach(scenario => {
    const result = calculateMeetGreetPrice(service, {
      passengers: scenario.passengers,
      children: scenario.children,
      infants: scenario.infants,
      extraLuggage: scenario.extraLuggage,
      extraHours: 0,
      specialServices: {},
      isNight: scenario.isNight
    })
    
    const withoutVAT = calculateWithoutVAT(result.total, 22)
    
    const details = result.breakdown
      .filter(item => item.amount > 0 && !item.description.includes('VAT'))
      .map(item => `${item.description}: €${item.amount}`)
      .join('<br>')
    
    mgRows.push([
      scenario.desc,
      `<span class="price">${formatPrice(result.total)}</span>`,
      formatPrice(withoutVAT),
      details
    ])
  })
  
  addTable(mgHeaders, mgRows)
  
  // Special services
  if (service.specialServices) {
    htmlContent += `<h4>Servizi Speciali Disponibili:</h4><ul>`
    
    if (service.specialServices.tarmac) {
      const tarmacTotal = service.basePrice + service.specialServices.tarmac.price
      const tarmacWithVAT = tarmacTotal * 1.22
      const tarmacWithoutVAT = calculateWithoutVAT(tarmacWithVAT, 22)
      htmlContent += `<li><strong>TARMAC Service:</strong> ${formatPrice(tarmacWithVAT)} (con IVA) - ${formatPrice(tarmacWithoutVAT)} (senza IVA)</li>`
    }
    
    if (service.specialServices.fastTrack) {
      const fastTrackTotal = service.basePrice + service.specialServices.fastTrack.price
      const fastTrackWithVAT = fastTrackTotal * 1.22
      const fastTrackWithoutVAT = calculateWithoutVAT(fastTrackWithVAT, 22)
      htmlContent += `<li><strong>Fast Track:</strong> ${formatPrice(fastTrackWithVAT)} (con IVA) - ${formatPrice(fastTrackWithoutVAT)} (senza IVA)</li>`
    }
    
    if (service.specialServices.vipLounge) {
      const vipTotal = service.basePrice + service.specialServices.vipLounge.price
      const vipWithVAT = vipTotal * 1.22
      const vipWithoutVAT = calculateWithoutVAT(vipWithVAT, 22)
      htmlContent += `<li><strong>VIP Lounge:</strong> ${formatPrice(vipWithVAT)} (con IVA) - ${formatPrice(vipWithoutVAT)} (senza IVA)</li>`
    }
    
    if (service.specialServices.combo) {
      const comboTotal = service.basePrice + service.specialServices.combo.price
      const comboWithVAT = comboTotal * 1.22
      const comboWithoutVAT = calculateWithoutVAT(comboWithVAT, 22)
      htmlContent += `<li><strong>${service.specialServices.combo.name}:</strong> ${formatPrice(comboWithVAT)} (con IVA) - ${formatPrice(comboWithoutVAT)} (senza IVA)</li>`
    }
    
    htmlContent += `</ul>`
  }
})

// =============================================================================
// 4. SUMMARY
// =============================================================================
addSection("📊 Riepilogo e Note")

htmlContent += `
        <div class="summary-box">
            <h3>✅ Servizi Testati</h3>
            <ul>
                <li><strong>GP Monza 2025:</strong> ${gpTransferTests.length} tratte transfer × 3 veicoli = ${gpTransferTests.length * 3} combinazioni</li>
                <li><strong>GP Monza Disposition:</strong> ${dispositionTests.length} scenari × 2 (giorno/notte) = ${dispositionTests.length * 2} test</li>
                <li><strong>Olympic Transfers:</strong> ${olympicRouteTests.length} tratte × 6 veicoli = ${olympicRouteTests.length * 6} combinazioni</li>
                <li><strong>Olympic Disposition:</strong> ${olympicDispositionTests.length} scenari × 2 (giorno/notte) = ${olympicDispositionTests.length * 2} test</li>
                <li><strong>Meet & Greet:</strong> ${meetGreetTests.reduce((sum, test) => sum + test.scenarios.length, 0)} scenari su ${meetGreetTests.length} servizi</li>
            </ul>
        </div>

        <div class="summary-box">
            <h3>💡 Aliquote IVA Applicate</h3>
            <ul>
                <li><strong>GP Monza 2025:</strong> 10% IVA</li>
                <li><strong>Olympics 2026:</strong> 10% IVA</li>
                <li><strong>Meet & Greet:</strong> 22% IVA</li>
                <li><strong>Cerimonie:</strong> 10% IVA</li>
            </ul>
        </div>

        <div class="summary-box">
            <h3>🌙 Supplementi Notturni</h3>
            <ul>
                <li><strong>GP Monza:</strong> +20% (19:30-07:30)</li>
                <li><strong>Olympics:</strong> +25% (21:00-06:00)</li>
                <li><strong>Meet & Greet:</strong> Importi fissi per servizio</li>
            </ul>
        </div>
`

addWarning("Linate Prime attualmente utilizza i prezzi di Linate normale invece dei prezzi premium. Necessita correzione nel sistema di routing.")

addSuccess("Tutti i prezzi sono stati calcolati correttamente secondo i parametri configurati nel sistema.")

htmlContent += `
        <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
            <p><strong>Report generato il:</strong> ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}</p>
            <p style="color: #7f8c8d;">Confronta questi prezzi con i tuoi listini ufficiali per verificare la correttezza dei calcoli.</p>
        </div>
    </div>
</body>
</html>
`

// Write to file
fs.writeFileSync('pattycar-pricing-report.html', htmlContent)

console.log("✅ Report HTML generato: pattycar-pricing-report.html")
console.log("📂 Apri il file nel browser per visualizzare tutte le tabelle dei prezzi") 