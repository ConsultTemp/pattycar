#!/usr/bin/env node

/**
 * Test script for the /api/send-sms endpoint
 * This simulates the requests that would come from Google Apps Script
 */

const API_ENDPOINT = "http://localhost:3000/api/send-sms";

// Test data simulating what Google Apps Script would send
const testCases = [
  {
    name: "Test Driver SMS",
    payload: {
      data: "2024-01-15",
      ora: "14:30",
      clientePhone: "+393331234567",
      driverPhone: "+393339876543", 
      target: "driver",
      customerName: "Mario Rossi",
      pickup: "Via Roma 123, Milano",
      destination: "Aeroporto Malpensa"
    }
  },
  {
    name: "Test Client SMS",
    payload: {
      data: new Date("2024-01-16T10:00:00"),
      ora: "10:00",
      clientePhone: "+393331234567",
      driverPhone: "+393339876543",
      target: "cliente", 
      customerName: "Giulia Bianchi",
      pickup: "Stazione Centrale Milano"
    }
  },
  {
    name: "Test Both SMS",
    payload: {
      data: "2024-01-17",
      ora: "16:45",
      clientePhone: "+393331234567",
      driverPhone: "+393339876543",
      target: "entrambi",
      customerName: "Luca Verdi",
      pickup: "Hotel Excelsior, Milano",
      destination: "Aeroporto Linate"
    }
  },
  {
    name: "Test Missing Driver Phone",
    payload: {
      data: "2024-01-18",
      ora: "09:15",
      clientePhone: "+393331234567",
      target: "driver"
      // driverPhone missing intentionally
    },
    expectedStatus: 200 // This should return 200 but with failed SMS in results
  },
  {
    name: "Test Invalid Target",
    payload: {
      data: "2024-01-19", 
      ora: "11:30",
      clientePhone: "+393331234567",
      driverPhone: "+393339876543",
      target: "invalid_target"
    },
    expectedStatus: 400 // This test should return an error
  }
];

async function testEndpoint(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log("Payload:", JSON.stringify(testCase.payload, null, 2));
  
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(testCase.payload)
    });
    
    const result = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(result, null, 2));
    
    // Check if the status matches expected (default to 200 if not specified)
    const expectedStatus = testCase.expectedStatus || 200;
    if (response.status === expectedStatus) {
      console.log("✅ Test passed");
    } else {
      console.log(`❌ Test failed - Expected status ${expectedStatus}, got ${response.status}`);
    }
    
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
}

async function runAllTests() {
  console.log("🚀 Starting SMS Endpoint Tests");
  console.log("===============================");
  
  // Test GET endpoint first
  console.log("\n🔍 Testing GET endpoint (health check)");
  try {
    const response = await fetch(API_ENDPOINT);
    const result = await response.json();
    console.log("GET Response:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ GET test failed:", error.message);
  }
  
  // Run all POST tests
  for (const testCase of testCases) {
    await testEndpoint(testCase);
    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("\n✨ All tests completed!");
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testCases, testEndpoint };
