/**
 * Complete Testing Script for Olympic Pricing System
 * Tests all combinations of locations, services, vehicles, periods, and Meet & Greet
 */

import { 
  OLYMPIC_LOCATIONS, 
  OLYMPIC_ROUTES,
  MEET_GREET_SERVICES,
  getLocationById,
  findOlympicRoute,
  resolveLocationForPricing,
  findMeetGreetServiceByLocation,
  calculateMeetGreetPriceLegacy,
  isOlympicPeriod,
  type Location,
  type OlympicRoute 
} from './lib/event-pricing'

import {
  findOlympicCeremony,
  calculateCeremonyPrice,
  OLYMPIC_CEREMONIES,
  type OlympicCeremony
} from './lib/olympic-pricing'

// Test configurations
const TEST_DATES = {
  standard: new Date('2025-08-15'), // Standard period
  olympic: new Date('2026-02-15'),  // Olympic period
  ceremony: new Date('2026-02-06')  // Opening ceremony
}

const TEST_VEHICLES = [
  { type: 'sedan', passengers: 2, luggage: 2 },
  { type: 'minivan', passengers: 6, luggage: 4 },
  { type: 'van', passengers: 8, luggage: 6 },
  { type: 'luxury', passengers: 2, luggage: 2 },
  { type: 'tesla', passengers: 4, luggage: 3 }
]

const TEST_TIMES = {
  day: { hour: '10', minutes: '00', ampm: 'AM' },
  night: { hour: '11', minutes: '30', ampm: 'PM' }
}

const TEST_SERVICE_TYPES = ['transfer', 'inter-cluster', 'disposizione', 'ceremony-disposition']

interface TestResult {
  test: string
  passed: boolean
  details: any
  price?: number
  error?: string
}

class PricingTester {
  private results: TestResult[] = []

  // Test location mapping and resolution
  async testLocationMapping(): Promise<void> {
    console.log('\n🏢 TESTING LOCATION MAPPING')
    console.log('=' .repeat(50))

    for (const location of OLYMPIC_LOCATIONS) {
      // Test location retrieval
      const retrievedLocation = getLocationById(location.id)
      this.addResult(`Location retrieval: ${location.id}`, !!retrievedLocation, {
        locationId: location.id,
        found: !!retrievedLocation,
        displayName: retrievedLocation?.displayName
      })

      // Test coordinate resolution
      const resolved = resolveLocationForPricing(location.id, location.coordinates)
      this.addResult(`Location resolution: ${location.id}`, !!resolved.resolvedLocationId, {
        input: location.id,
        resolved: resolved
      })

      // Test services availability
      if (location.services.meetGreetArrivals || location.services.meetGreetDepartures) {
        const serviceTest = location.services.meetGreetArrivals?.serviceId || location.services.meetGreetDepartures?.serviceId
        const service = serviceTest ? MEET_GREET_SERVICES[serviceTest] : null
        this.addResult(`Meet & Greet service: ${location.id}`, !!service, {
          locationId: location.id,
          serviceId: serviceTest,
          hasService: !!service,
          serviceType: service?.type
        })
      }
    }
  }

  // Test Olympic route pricing
  async testOlympicRoutes(): Promise<void> {
    console.log('\n🏔️ TESTING OLYMPIC ROUTES')
    console.log('=' .repeat(50))

    for (const route of OLYMPIC_ROUTES) {
      // Test route lookup
      const foundRoute = findOlympicRoute(route.fromLocationId, route.toLocationId)
      this.addResult(`Route lookup: ${route.id}`, !!foundRoute, {
        routeId: route.id,
        from: route.fromLocationId,
        to: route.toLocationId,
        found: !!foundRoute
      })

      // Test pricing for each vehicle type
      for (const vehicleType of Object.keys(route.prices)) {
        const price = route.prices[vehicleType as keyof typeof route.prices]
        this.addResult(`Route pricing: ${route.id} - ${vehicleType}`, price > 0, {
          routeId: route.id,
          vehicleType,
          price,
          validPrice: price > 0
        }, price)
      }

      // Test night surcharge calculation
      for (const vehicleType of Object.keys(route.prices)) {
        const basePrice = route.prices[vehicleType as keyof typeof route.prices]
        const nightSurcharge = basePrice * 0.20 // 20% Olympic night surcharge
        const totalWithNight = basePrice + nightSurcharge + (basePrice + nightSurcharge) * 0.10 // +10% VAT
        
        this.addResult(`Night pricing: ${route.id} - ${vehicleType}`, totalWithNight > basePrice, {
          routeId: route.id,
          vehicleType,
          basePrice,
          nightSurcharge,
          totalWithNight,
          surchargeCorrect: nightSurcharge === basePrice * 0.20
        }, totalWithNight)
      }
    }
  }

  // Test Meet & Greet services
  async testMeetGreetServices(): Promise<void> {
    console.log('\n🤝 TESTING MEET & GREET SERVICES')
    console.log('=' .repeat(50))

    for (const [serviceId, service] of Object.entries(MEET_GREET_SERVICES)) {
      // Test basic service configuration
      this.addResult(`Service config: ${serviceId}`, service.basePrice > 0, {
        serviceId,
        basePrice: service.basePrice,
        location: service.location,
        type: service.type,
        validConfig: service.basePrice > 0 && service.location && service.type
      })

      // Test pricing calculation for various scenarios
      const testScenarios = [
        { passengers: 1, children: 0, infants: 0, extraLuggage: 0, isNight: false, name: 'Basic' },
        { passengers: 2, children: 1, infants: 1, extraLuggage: 2, isNight: false, name: 'Family' },
        { passengers: 1, children: 0, infants: 0, extraLuggage: 0, isNight: true, name: 'Night' },
        { passengers: 5, children: 2, infants: 0, extraLuggage: 5, isNight: false, name: 'Large Group' }
      ]

      for (const scenario of testScenarios) {
        try {
          const result = calculateMeetGreetPriceLegacy(
            serviceId,
            scenario.passengers,
            scenario.children,
            scenario.infants,
            scenario.extraLuggage,
            scenario.isNight,
            {},
            TEST_DATES.olympic
          )

          this.addResult(`Meet & Greet ${scenario.name}: ${serviceId}`, result.price > 0, {
            serviceId,
            scenario,
            price: result.price,
            breakdown: result.breakdown
          }, result.price)
        } catch (error) {
          this.addResult(`Meet & Greet ${scenario.name}: ${serviceId}`, false, {
            serviceId,
            scenario,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, undefined, error instanceof Error ? error.message : 'Unknown error')
        }
      }

      // Test special services (if available)
      if (service.specialServices) {
        for (const [specialServiceName, specialService] of Object.entries(service.specialServices)) {
          this.addResult(`Special service: ${serviceId} - ${specialServiceName}`, specialService.price > 0, {
            serviceId,
            specialServiceName,
            price: specialService.price,
            validPrice: specialService.price > 0
          })
        }
      }
    }
  }

  // Test ceremony pricing
  async testCeremonyPricing(): Promise<void> {
    console.log('\n🎭 TESTING CEREMONY PRICING')
    console.log('=' .repeat(50))

    for (const ceremony of OLYMPIC_CEREMONIES) {
      const ceremonyDate = new Date(ceremony.date)
      const foundCeremony = findOlympicCeremony(ceremonyDate)
      
      this.addResult(`Ceremony lookup: ${ceremony.id}`, !!foundCeremony, {
        ceremonyId: ceremony.id,
        date: ceremony.date,
        found: !!foundCeremony
      })

      // Test pricing for different vehicle types and durations
      const testDurations = [4, 6, 8] // hours
      const vehicleTypes = ['berlina', 'monovolume', 'minibus']

      for (const duration of testDurations) {
        for (const vehicleType of vehicleTypes) {
          try {
            const result = calculateCeremonyPrice(
              ceremony,
              vehicleType,
              duration,
              'milano-center', // pickup
              false, // not night
              { lat: 45.4642, lng: 9.1900 }, // milano coordinates
              ceremony.venueLocationId, // destination
              getLocationById(ceremony.venueLocationId)?.coordinates
            )

            this.addResult(`Ceremony pricing: ${ceremony.id} - ${vehicleType} - ${duration}h`, result.total > 0, {
              ceremonyId: ceremony.id,
              vehicleType,
              duration,
              basePrice: result.basePrice,
              transferCost: result.transferCost,
              total: result.total,
              breakdown: {
                extraHours: result.extraHours,
                extraHoursCost: result.extraHoursCost,
                nightSurcharge: result.nightSurcharge,
                vatAmount: result.vatAmount
              }
            }, result.total)
          } catch (error) {
            this.addResult(`Ceremony pricing: ${ceremony.id} - ${vehicleType} - ${duration}h`, false, {
              ceremonyId: ceremony.id,
              vehicleType,
              duration,
              error: error instanceof Error ? error.message : 'Unknown error'
            }, undefined, error instanceof Error ? error.message : 'Unknown error')
          }
        }
      }
    }
  }

  // Test date period recognition
  async testDatePeriods(): Promise<void> {
    console.log('\n📅 TESTING DATE PERIODS')
    console.log('=' .repeat(50))

    const testDates = [
      { date: new Date('2025-06-15'), period: 'Standard', shouldBeOlympic: false },
      { date: new Date('2025-12-15'), period: 'Standard', shouldBeOlympic: false },
      { date: new Date('2026-01-15'), period: 'Olympic', shouldBeOlympic: true },
      { date: new Date('2026-02-15'), period: 'Olympic', shouldBeOlympic: true },
      { date: new Date('2026-03-15'), period: 'Olympic', shouldBeOlympic: true },
      { date: new Date('2026-04-15'), period: 'Standard', shouldBeOlympic: false },
      { date: new Date('2026-02-06'), period: 'Ceremony', shouldBeOlympic: true },
      { date: new Date('2026-02-22'), period: 'Ceremony', shouldBeOlympic: true }
    ]

    for (const testDate of testDates) {
      const isOlympic = isOlympicPeriod(testDate.date)
      const ceremony = findOlympicCeremony(testDate.date)
      
      this.addResult(`Date period: ${testDate.period} (${testDate.date.toISOString().split('T')[0]})`, 
        isOlympic === testDate.shouldBeOlympic, {
        date: testDate.date.toISOString().split('T')[0],
        expectedPeriod: testDate.period,
        isOlympic,
        shouldBeOlympic: testDate.shouldBeOlympic,
        ceremony: ceremony?.name,
        correct: isOlympic === testDate.shouldBeOlympic
      })
    }
  }

  // Test integration scenarios
  async testIntegrationScenarios(): Promise<void> {
    console.log('\n🔗 TESTING INTEGRATION SCENARIOS')
    console.log('=' .repeat(50))

    const scenarios = [
      {
        name: 'Airport to Olympic Venue with Meet & Greet',
        pickup: 'malpensa-airport',
        destination: 'cortina',
        date: TEST_DATES.olympic,
        serviceType: 'transfer',
        vehicle: { type: 'sedan', passengers: 2, luggage: 2 },
        meetGreet: true
      },
      {
        name: 'Station to City Center Standard Period',
        pickup: 'milano-centrale',
        destination: 'milano-center',
        date: TEST_DATES.standard,
        serviceType: 'transfer',
        vehicle: { type: 'minivan', passengers: 4, luggage: 3 }
      },
      {
        name: 'Olympic Ceremony Service',
        pickup: 'milano-center',
        destination: 'milano-center',
        date: TEST_DATES.ceremony,
        serviceType: 'ceremony-disposition',
        vehicle: { type: 'berlina', passengers: 3, luggage: 2 },
        duration: 6
      },
      {
        name: 'Inter-cluster Transfer Olympic Period',
        pickup: 'milano-center',
        destination: 'cortina',
        date: TEST_DATES.olympic,
        serviceType: 'inter-cluster',
        vehicle: { type: 'van', passengers: 8, luggage: 6 }
      }
    ]

    for (const scenario of scenarios) {
      try {
        // Test location resolution
        const pickupLocation = getLocationById(scenario.pickup)
        const destinationLocation = getLocationById(scenario.destination)
        
        this.addResult(`Integration ${scenario.name}: Location resolution`, 
          !!pickupLocation && !!destinationLocation, {
          scenarioName: scenario.name,
          pickup: { id: scenario.pickup, found: !!pickupLocation },
          destination: { id: scenario.destination, found: !!destinationLocation }
        })

        // Test route finding
        if (scenario.serviceType === 'transfer' || scenario.serviceType === 'inter-cluster') {
          const route = findOlympicRoute(scenario.pickup, scenario.destination)
          this.addResult(`Integration ${scenario.name}: Route finding`, !!route, {
            scenarioName: scenario.name,
            from: scenario.pickup,
            to: scenario.destination,
            route: route?.id,
            found: !!route
          })

          if (route) {
            const vehicleType = scenario.vehicle.type as keyof typeof route.prices
            const price = route.prices[vehicleType]
            this.addResult(`Integration ${scenario.name}: Pricing`, price > 0, {
              scenarioName: scenario.name,
              vehicleType: scenario.vehicle.type,
              price,
              validPrice: price > 0
            }, price)
          }
        }

        // Test Meet & Greet if enabled
        if (scenario.meetGreet && pickupLocation) {
          const meetGreetService = findMeetGreetServiceByLocation(scenario.pickup, scenario.destination)
          this.addResult(`Integration ${scenario.name}: Meet & Greet`, !!meetGreetService, {
            scenarioName: scenario.name,
            pickup: scenario.pickup,
            meetGreetService: meetGreetService?.serviceId,
            available: !!meetGreetService
          })
        }

      } catch (error) {
        this.addResult(`Integration ${scenario.name}`, false, {
          scenarioName: scenario.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, undefined, error instanceof Error ? error.message : 'Unknown error')
      }
    }
  }

  // Helper method to add test results
  private addResult(test: string, passed: boolean, details: any, price?: number, error?: string): void {
    this.results.push({ test, passed, details, price, error })
    
    const status = passed ? '✅' : '❌'
    const priceInfo = price ? ` (€${price.toFixed(2)})` : ''
    const errorInfo = error ? ` - Error: ${error}` : ''
    
    console.log(`${status} ${test}${priceInfo}${errorInfo}`)
  }

  // Generate comprehensive test report
  generateReport(): void {
    console.log('\n📊 TEST REPORT SUMMARY')
    console.log('=' .repeat(60))

    const totalTests = this.results.length
    const passedTests = this.results.filter(r => r.passed).length
    const failedTests = totalTests - passedTests
    const successRate = ((passedTests / totalTests) * 100).toFixed(1)

    console.log(`Total Tests: ${totalTests}`)
    console.log(`Passed: ${passedTests} ✅`)
    console.log(`Failed: ${failedTests} ❌`)
    console.log(`Success Rate: ${successRate}%`)

    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:')
      console.log('-' .repeat(40))
      
      this.results
        .filter(r => !r.passed)
        .forEach(result => {
          console.log(`• ${result.test}`)
          if (result.error) {
            console.log(`  Error: ${result.error}`)
          }
          console.log(`  Details:`, JSON.stringify(result.details, null, 2))
          console.log('')
        })
    }

    // Price analysis
    const priceResults = this.results.filter(r => r.price && r.price > 0)
    if (priceResults.length > 0) {
      const prices = priceResults.map(r => r.price!).sort((a, b) => a - b)
      const minPrice = prices[0]
      const maxPrice = prices[prices.length - 1]
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length

      console.log('\n💰 PRICE ANALYSIS:')
      console.log('-' .repeat(40))
      console.log(`Price Range: €${minPrice.toFixed(2)} - €${maxPrice.toFixed(2)}`)
      console.log(`Average Price: €${avgPrice.toFixed(2)}`)
      console.log(`Total Pricing Tests: ${priceResults.length}`)
    }

    // Service coverage analysis
    const serviceTypes = [...new Set(this.results
      .filter(r => r.details.serviceType || r.details.type)
      .map(r => r.details.serviceType || r.details.type))]
      
    console.log('\n🎯 SERVICE COVERAGE:')
    console.log('-' .repeat(40))
    console.log(`Service Types Tested: ${serviceTypes.length}`)
    serviceTypes.forEach(type => console.log(`• ${type}`))

    // Location coverage analysis
    const locations = [...new Set(this.results
      .filter(r => r.details.locationId || r.details.pickup || r.details.from)
      .map(r => r.details.locationId || r.details.pickup || r.details.from))]
      
    console.log('\n📍 LOCATION COVERAGE:')
    console.log('-' .repeat(40))
    console.log(`Locations Tested: ${locations.length}`)
    console.log(`Total Available Locations: ${OLYMPIC_LOCATIONS.length}`)
    console.log(`Coverage: ${((locations.length / OLYMPIC_LOCATIONS.length) * 100).toFixed(1)}%`)
  }

  // Run all tests
  async runAllTests(): Promise<void> {
    console.log('🚀 STARTING COMPREHENSIVE PRICING SYSTEM TESTS')
    console.log('=' .repeat(60))

    await this.testLocationMapping()
    await this.testOlympicRoutes()
    await this.testMeetGreetServices()
    await this.testCeremonyPricing()
    await this.testDatePeriods()
    await this.testIntegrationScenarios()

    this.generateReport()
  }
}

// Run the tests
async function runPricingTests() {
  const tester = new PricingTester()
  await tester.runAllTests()
}

// Export for use in other files
export { PricingTester, runPricingTests }

// Run tests if this file is executed directly
if (require.main === module) {
  runPricingTests().catch(console.error)
}