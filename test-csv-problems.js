#!/usr/bin/env node

/**
 * Test script that simulates the problematic data from the CSV
 */

const API_ENDPOINT = "https://pattycar.vercel.app/api/send-sms";

// Test cases that match the problematic data from the CSV
const csvProblematicCases = [
  {
    name: "Date without year (1/1)",
    payload: {
      data: "1/1",  // Problematic date format
      ora: "0:01",
      clientePhone: null,
      driverPhone: null,
      target: "driver"
    }
  },
  {
    name: "Date with year (06/09/2025)",
    payload: {
      data: "06/09/2025",
      ora: "10:00",
      clientePhone: "3383931206", // From the notes
      driverPhone: "3339876543",
      target: "entrambi",
      customerName: "Test Customer",
      pickup: "Test Pickup Address",
      destination: "Test Destination"
    }
  },
  {
    name: "Empty data field",
    payload: {
      data: "",  // Empty data
      ora: "10:00",
      clientePhone: "3383931206",
      driverPhone: "3339876543",
      target: "cliente"
    }
  },
  {
    name: "Null data field",
    payload: {
      data: null,  // Null data
      ora: "10:00",
      clientePhone: "3383931206",
      driverPhone: "3339876543",
      target: "cliente"
    }
  },
  {
    name: "Date object simulation",
    payload: {
      data: "2025-01-15T00:00:00.000Z",  // ISO date string
      ora: "10:00",
      clientePhone: "3383931206",
      driverPhone: "3339876543",
      target: "entrambi"
    }
  }
];

async function testCsvProblems(testCase) {
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
    
    if (response.status === 400) {
      console.log("🔍 This is likely causing the 400 error!");
    } else if (response.ok) {
      console.log("✅ This format works");
    } else {
      console.log("❌ Other error");
    }
    
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
}

async function runCsvProblemTests() {
  console.log("🐛 Testing CSV Problematic Data");
  console.log("==============================");
  console.log("Simulating data that could cause 400 errors\n");
  
  for (const testCase of csvProblematicCases) {
    await testCsvProblems(testCase);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("\n✨ CSV problem tests completed!");
}

// Run the tests
if (require.main === module) {
  runCsvProblemTests().catch(console.error);
}
