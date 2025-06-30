import { findLocationByLocality, shouldUseListinoPricing } from './lib/locality-mapping'

console.log('🔍 TESTING LOCALITY MAPPING - COMPREHENSIVE TEST')

// Test cases che potrebbero causare problemi
const testCases = [
  // Venezia - casi che dovrebbero funzionare bene
  { name: 'Venezia Santa Lucia', coords: { lat: 45.4408, lng: 12.3155 } },
  { name: 'Venice Santa Lucia', coords: { lat: 45.4408, lng: 12.3155 } },
  { name: 'Santa Lucia Station', coords: { lat: 45.4408, lng: 12.3155 } },
  { name: 'Venezia Marco Polo', coords: { lat: 45.5050, lng: 12.3519 } },
  { name: 'Marco Polo Airport', coords: { lat: 45.5050, lng: 12.3519 } },
  { name: 'Mestre', coords: { lat: 45.4869, lng: 12.2335 } },
  
  // Verona - casi problematici
  { name: 'Verona Porta Nuova', coords: { lat: 45.4281, lng: 10.9824 } },
  { name: 'Stazione di Verona', coords: { lat: 45.4281, lng: 10.9824 } },
  { name: 'Verona', coords: { lat: 45.4384, lng: 10.9916 } },
  
  // Milano - dovrebbe funzionare bene
  { name: 'Via Montenapoleone, Milano', coords: { lat: 45.4696, lng: 9.1964 } },
  { name: 'Milano Centrale', coords: { lat: 45.4860, lng: 9.2044 } },
  { name: 'Milano', coords: { lat: 45.4642, lng: 9.1900 } },
  
  // Altri casi
  { name: 'Treviso Airport', coords: { lat: 45.6502, lng: 12.1944 } },
  { name: 'Antonio Canova Airport', coords: { lat: 45.6502, lng: 12.1944 } },
  
  // Casi edge che potrebbero non funzionare
  { name: 'Località Sconosciuta', coords: { lat: 46.0000, lng: 11.0000 } },
  { name: 'Random City', coords: { lat: 40.7128, lng: -74.0060 } }
]

console.log('\n🧪 Testing locality mapping with shouldUseListinoPricing:')
for (const test of testCases) {
  console.log(`\n=== TEST: ${test.name} ===`)
  
  // Test solo località
  const localityResult = findLocationByLocality(test.name)
  console.log(`Locality only: ${localityResult.locationId} (confidence: ${localityResult.confidence.toFixed(3)})`)
  
  // Test con sistema completo (località + geografia)
  const fullResult = shouldUseListinoPricing(test.name, [], test.coords, 0.7)
  console.log(`Full system: ${fullResult.useListino ? 'LISTINO' : 'DISTANCE'} - ${fullResult.locationId} (confidence: ${fullResult.confidence.toFixed(3)})`)
  console.log(`Reason: ${fullResult.reason}`)
  
  if (fullResult.useListino !== (localityResult.confidence >= 0.7)) {
    console.log('⚠️  DIFFERENCE DETECTED between locality-only and full system!')
  }
}

console.log('\n🎯 SUMMARY:')
for (const test of testCases) {
  const result = shouldUseListinoPricing(test.name, [], test.coords, 0.7)
  const status = result.useListino ? '✅ LISTINO' : '❌ DISTANCE'
  console.log(`"${test.name}" → ${status} (${result.locationId || 'none'} - ${result.confidence.toFixed(3)})`)
} 