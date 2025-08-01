// Test temporaneo per verificare i prezzi di Milano interno
const { calculateTotalPrice } = require('./lib/pricing-config.ts');

// Coordinate dentro Milano (entrambe nel raggio di 10km dal Duomo)
const milanoCoords1 = { lat: 45.4642, lng: 9.1900 }; // Duomo
const milanoCoords2 = { lat: 45.4720, lng: 9.1896 }; // Stazione Centrale

console.log('🧪 Test prezzi trasferimenti interni Milano:');
console.log('='.repeat(50));

// Test per ogni tipo di veicolo
const vehicleTypes = [
  { type: 'sedan', expectedPrice: 125 },
  { type: 'minivan', expectedPrice: 150 },
  { type: 'van', expectedPrice: 320 },
  { type: 'luxury-sedan', expectedPrice: 270 },
];

vehicleTypes.forEach(vehicle => {
  try {
    const result = calculateTotalPrice(
      5, // distanceKm (ignorata per Milano interno)
      vehicle.type,
      2, // passengers
      2, // luggage
      1, // vehicleCount
      '10', // hour
      '00', // minutes
      'AM', // ampm
      milanoCoords1, // pickup
      milanoCoords2  // destination
    );
    
    console.log(`${vehicle.type.padEnd(15)}: €${result.totalPrice.toFixed(2)} (atteso: €${vehicle.expectedPrice})`);
    console.log(`  Base price: €${result.breakdown.basePrice}`);
    console.log(`  Milano internal: ${result.breakdown.isMilanoInternal}`);
    console.log(`  Vehicle multiplier: ${result.breakdown.vehicleMultiplier}`);
    console.log('');
    
  } catch (error) {
    console.error(`❌ Errore con ${vehicle.type}:`, error.message);
  }
});

console.log('✅ Test completato!'); 