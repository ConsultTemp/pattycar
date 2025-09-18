#!/usr/bin/env node

/**
 * Test script for the production SMS endpoint
 * This tests the actual deployed endpoint on Vercel
 */

const API_ENDPOINT = "https://pattycar.vercel.app/api/send-sms";

// Simple test payload
const testPayload = {
  data: "2024-01-20",
  ora: "15:30",
  clientePhone: "+393331234567",
  driverPhone: "+393339876543",
  target: "entrambi",
  customerName: "Test Produzione",
  pickup: "Via Test Milano",
  destination: "Aeroporto Test"
};

async function testProductionEndpoint() {
  console.log("🌐 Testing Production SMS Endpoint");
  console.log("==================================");
  console.log("URL:", API_ENDPOINT);
  console.log("Payload:", JSON.stringify(testPayload, null, 2));
  
  try {
    console.log("\n📤 Sending request...");
    
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Test-Script/1.0"
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
    console.log("Response Headers:", Object.fromEntries(response.headers.entries()));
    
    const result = await response.text();
    console.log("📋 Response Body (raw):", result);
    
    try {
      const jsonResult = JSON.parse(result);
      console.log("📋 Response Body (parsed):", JSON.stringify(jsonResult, null, 2));
    } catch (parseError) {
      console.log("❌ Could not parse response as JSON");
    }
    
    if (response.ok) {
      console.log("✅ Request successful");
    } else {
      console.log("❌ Request failed");
    }
    
  } catch (error) {
    console.error("❌ Network/Request error:", error.message);
    console.error("Full error:", error);
  }
}

// Test GET endpoint too
async function testGetEndpoint() {
  console.log("\n🔍 Testing GET endpoint (health check)");
  
  try {
    const response = await fetch(API_ENDPOINT);
    const result = await response.json();
    console.log("GET Response:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ GET test failed:", error.message);
  }
}

async function runTests() {
  await testGetEndpoint();
  await testProductionEndpoint();
}

// Run the test
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testProductionEndpoint };
