#!/usr/bin/env node

/**
 * Test script that simulates exactly what Google Apps Script sends
 * This matches the format from the provided Google Apps Script code
 */

const API_ENDPOINT = "https://pattycar.vercel.app/api/send-sms";

// Test cases that match exactly what Google Apps Script would send
const googleSheetsTestCases = [
  {
    name: "Exact Google Sheets Format - Driver Only",
    payload: {
      data: "2024-01-15",  // From sheet column A (Data)
      ora: "14:30",        // From sheet column B (Ora) 
      clientePhone: "3331234567",  // From sheet column X (might not have +39)
      driverPhone: "3339876543",   // From driver lookup (might not have +39)
      target: "driver"             // From the action chosen
    }
  },
  {
    name: "Google Sheets Format - Cliente Only",
    payload: {
      data: "2024-01-16",
      ora: "10:00", 
      clientePhone: "+393331234567",
      driverPhone: "+393339876543",
      target: "cliente"
    }
  },
  {
    name: "Google Sheets Format - Entrambi",
    payload: {
      data: "2024-01-17",
      ora: "16:45",
      clientePhone: "3331234567",
      driverPhone: "3339876543", 
      target: "entrambi"
    }
  },
  {
    name: "Google Sheets Format - Missing Driver Phone",
    payload: {
      data: "2024-01-18",
      ora: "09:15",
      clientePhone: "3331234567",
      driverPhone: null,  // This is what happens when getDriverPhone returns null
      target: "driver"
    }
  },
  {
    name: "Google Sheets Format - Empty Strings",
    payload: {
      data: "2024-01-19",
      ora: "11:30",
      clientePhone: "",
      driverPhone: "",
      target: "entrambi"
    }
  }
];

async function testGoogleSheetsFormat(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log("Payload:", JSON.stringify(testCase.payload, null, 2));
  
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Simulate Google Apps Script user agent
        "User-Agent": "Mozilla/5.0 (compatible; Google-Apps-Script)"
      },
      body: JSON.stringify(testCase.payload)
    });
    
    const result = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log("✅ Test passed");
    } else {
      console.log("❌ Test failed");
    }
    
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
}

async function runGoogleSheetsTests() {
  console.log("📊 Testing Google Sheets SMS Integration");
  console.log("=======================================");
  console.log("Simulating exact format from Google Apps Script\n");
  
  for (const testCase of googleSheetsTestCases) {
    await testGoogleSheetsFormat(testCase);
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("\n✨ Google Sheets format tests completed!");
}

// Run the tests
if (require.main === module) {
  runGoogleSheetsTests().catch(console.error);
}

module.exports = { googleSheetsTestCases, testGoogleSheetsFormat };
