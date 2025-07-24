// Test Meet & Greet Location Recognition System
const { 
  findNearbyMeetGreetLocation, 
  resolveLocationForPricing, 
  getMeetGreetLocations,
  calculateDistance 
} = require('./lib/event-pricing.js')

console.log('🧪 TESTING MEET & GREET LOCATION RECOGNITION SYSTEM')
console.log('=' * 60)

// Test data: Real coordinates near Meet & Greet locations
const testCases = [
  {
    name: "Milano Centrale Station (exact coordinates)",
    coordinates: { lat: 45.4868, lng: 9.2037 },
    expectedLocationId: "milano-centrale",
    expectedService: "departures only"
  },
  {
    name: "Milano Centrale Station (200m nearby)",
    coordinates: { lat: 45.4850, lng: 9.2020 }, // ~200m away
    expectedLocationId: "milano-centrale",
    expectedService: "departures only"
  },
  {
    name: "Milano Linate Airport (exact coordinates)",
    coordinates: { lat: 45.4451, lng: 9.2767 },
    expectedLocationId: "linate",
    expectedService: "arrivals + departures"
  },
  {
    name: "Milano Linate Airport (300m nearby)",
    coordinates: { lat: 45.4430, lng: 9.2750 }, // ~300m away
    expectedLocationId: "linate",
    expectedService: "arrivals + departures"
  },
  {
    name: "Milano Malpensa Airport (exact coordinates)",
    coordinates: { lat: 45.6306, lng: 8.7281 },
    expectedLocationId: "malpensa",
    expectedService: "arrivals + departures"
  },
  {
    name: "Milano Malpensa Airport (400m nearby)",
    coordinates: { lat: 45.6270, lng: 8.7250 }, // ~400m away
    expectedLocationId: "malpensa",
    expectedService: "arrivals + departures"
  },
  {
    name: "Venezia Marco Polo Airport (exact coordinates)",
    coordinates: { lat: 45.5053, lng: 12.3519 },
    expectedLocationId: "venezia-marco-polo",
    expectedService: "arrivals + departures"
  },
  {
    name: "Venezia Santa Lucia Station (exact coordinates)",
    coordinates: { lat: 45.4408, lng: 12.3208 },
    expectedLocationId: "venezia-santa-lucia",
    expectedService: "departures only"
  },
  {
    name: "Verona Porta Nuova Station (exact coordinates)",
    coordinates: { lat: 45.4280, lng: 10.9823 },
    expectedLocationId: "verona-porta-nuova",
    expectedService: "departures only"
  },
  {
    name: "Random Milano coordinate (should NOT be Meet & Greet)",
    coordinates: { lat: 45.4642, lng: 9.1900 }, // Milano Duomo
    expectedLocationId: null,
    expectedService: "none"
  },
  {
    name: "Too far from Meet & Greet location",
    coordinates: { lat: 45.4868, lng: 9.3000 }, // 5km+ from Milano Centrale
    expectedLocationId: null,
    expectedService: "none"
  }
]

async function runTests() {
  console.log('\n📋 Available Meet & Greet Locations:')
  const meetGreetLocations = getMeetGreetLocations()
  meetGreetLocations.forEach(location => {
    const arrivals = location.services.meetGreetArrivals?.enabled ? '✈️ Arrivals' : ''
    const departures = location.services.meetGreetDepartures?.enabled ? '🛫 Departures' : ''
    console.log(`  - ${location.displayName} (${location.id}): ${arrivals} ${departures}`)
  })

  console.log('\n🧪 Running Test Cases:')
  console.log('-'.repeat(80))

  let passedTests = 0
  let totalTests = testCases.length

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`)
    console.log(`   Coordinates: ${testCase.coordinates.lat}, ${testCase.coordinates.lng}`)

    // Test 1: Direct findNearbyMeetGreetLocation function
    const nearbyLocation = findNearbyMeetGreetLocation(testCase.coordinates)
    const foundLocationId = nearbyLocation?.id || null

    console.log(`   Found Location ID: ${foundLocationId}`)
    console.log(`   Expected Location ID: ${testCase.expectedLocationId}`)

    if (foundLocationId === testCase.expectedLocationId) {
      console.log('   ✅ PASS: Correct location detected')
      
      if (nearbyLocation) {
        // Calculate actual distance
        const distance = calculateDistance(testCase.coordinates, nearbyLocation.coordinates)
        console.log(`   📏 Distance: ${(distance * 1000).toFixed(0)}m`)
        console.log(`   📍 Services: ${nearbyLocation.services.meetGreetArrivals?.enabled ? 'Arrivals ' : ''}${nearbyLocation.services.meetGreetDepartures?.enabled ? 'Departures' : ''}`)
      }
      
      passedTests++
    } else {
      console.log('   ❌ FAIL: Incorrect location detected')
    }

    // Test 2: resolveLocationForPricing function (should prioritize Meet & Greet)
    console.log('\n   🔄 Testing resolveLocationForPricing integration:')
    const resolved = resolveLocationForPricing(undefined, testCase.coordinates)
    console.log(`   Resolved Location ID: ${resolved.resolvedLocationId}`)
    
    if (resolved.resolvedLocationId === testCase.expectedLocationId) {
      console.log('   ✅ resolveLocationForPricing working correctly')
    } else {
      console.log('   ❌ resolveLocationForPricing integration issue')
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`🎯 TEST RESULTS: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('✅ ALL TESTS PASSED! Meet & Greet recognition system is working correctly.')
  } else {
    console.log('❌ Some tests failed. Please check the implementation.')
  }
}

// Run the tests
runTests().catch(console.error) 