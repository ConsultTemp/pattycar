#!/usr/bin/env node

/**
 * Test script to simulate a Stripe webhook call with proper signature
 * This allows testing the webhook endpoint without making a real payment
 */

const crypto = require('crypto');

// Configuration
const WEBHOOK_URL = "https://pattycar.com/api/stripe-webhook";
const WEBHOOK_SECRET = "whsec_L6cvzJTvXF6y1d6lHbi8su7PT7D9T4Ae";

// Sample Stripe checkout.session.completed event payload
const stripeEventPayload = {
  "id": "evt_test_webhook_" + Date.now(),
  "object": "event",
  "api_version": "2025-05-28.basil",
  "created": Math.floor(Date.now() / 1000),
  "data": {
    "object": {
      "id": "cs_test_" + Date.now(),
      "object": "checkout.session",
      "amount_subtotal": 15000,
      "amount_total": 15000,
      "currency": "eur",
      "customer": "cus_test_" + Date.now(),
      "customer_details": {
        "address": {
          "city": null,
          "country": "IT",
          "line1": null,
          "line2": null,
          "postal_code": null,
          "state": null
        },
        "email": "test@example.com",
        "name": "Test Customer",
        "phone": null,
        "tax_exempt": "none",
        "tax_ids": []
      },
      "invoice": "in_test_" + Date.now(),
      "metadata": {
        "serviceType": "transfer",
        "pickup": "Milano Centrale",
        "destination": "Aeroporto Malpensa",
        "passengers": "2",
        "luggage": "1",
        "vehicleType": "Mercedes E-Class",
        "vehicleCount": "1",
        "date": "2024-01-20",
        "time": "14:30",
        "phonePrefix": "+39",
        "phoneNumber": "3383931206",
        "customerName": "Test Customer",
        "customerEmail": "test@example.com",
        "notes": "Test booking from webhook simulator",
        "billingInfo": "Test Company\nVia Test 123\n20100 Milano",
        "flight": "AZ1234",
        "departureCity": "Roma",
        "meetAndGreet": "false",
        "distance": "50 km",
        "duration": "45 min",
        "vatRate": "22",
        "isOlympicPricing": "false",
        "sameVehicleType": "true"
      },
      "payment_intent": "pi_test_" + Date.now(),
      "payment_status": "paid",
      "status": "complete",
      "success_url": "https://pattycar.com/payment-success?session_id={CHECKOUT_SESSION_ID}",
      "url": null
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": null,
    "idempotency_key": null
  },
  "type": "checkout.session.completed"
};

/**
 * Create Stripe webhook signature
 * This mimics exactly how Stripe creates the signature
 */
function createStripeSignature(payload, secret, timestamp) {
  const payloadString = JSON.stringify(payload);
  
  // Remove the 'whsec_' prefix from the secret
  const key = secret.replace('whsec_', '');
  
  // Create the signature string that Stripe signs
  const signedPayload = timestamp + '.' + payloadString;
  
  // Create HMAC signature
  const signature = crypto
    .createHmac('sha256', key)
    .update(signedPayload, 'utf8')
    .digest('hex');
  
  // Format as Stripe does: t=timestamp,v1=signature
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Test the webhook endpoint
 */
async function testStripeWebhook() {
  console.log('🧪 Testing Stripe Webhook Endpoint');
  console.log('==================================');
  console.log('URL:', WEBHOOK_URL);
  console.log('Event Type:', stripeEventPayload.type);
  console.log('Customer:', stripeEventPayload.data.object.customer_details.name);
  console.log('Amount:', `€${stripeEventPayload.data.object.amount_total / 100}`);
  
  try {
    // Create timestamp (current time in seconds)
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Convert payload to string exactly as it will be sent
    const payloadString = JSON.stringify(stripeEventPayload);
    
    // Create Stripe signature
    const stripeSignature = createStripeSignature(stripeEventPayload, WEBHOOK_SECRET, timestamp);
    
    console.log('\n🔐 Signature Details:');
    console.log('Timestamp:', timestamp);
    console.log('Signature:', stripeSignature);
    console.log('Payload length:', payloadString.length);
    console.log('First 100 chars:', payloadString.substring(0, 100));
    
    console.log('\n📤 Sending webhook request...');
    
    // Send the webhook request
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': stripeSignature,
        'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
      },
      body: payloadString
    });
    
    console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
    
    // Get response text
    const responseText = await response.text();
    console.log('📋 Response Body:', responseText);
    
    // Try to parse as JSON
    try {
      const responseJson = JSON.parse(responseText);
      console.log('📋 Response JSON:', JSON.stringify(responseJson, null, 2));
    } catch (parseError) {
      console.log('📋 Response is not valid JSON');
    }
    
    if (response.ok) {
      console.log('✅ Webhook test successful!');
      console.log('🎉 The webhook should have:');
      console.log('   - Processed the payment');
      console.log('   - Sent customer confirmation email');
      console.log('   - Sent admin notification email');
      console.log('   - Saved booking to database');
      console.log('   - Added booking to Google Sheets');
    } else {
      console.log('❌ Webhook test failed');
      console.log('Check the server logs for more details');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error('Full error:', error);
  }
}

/**
 * Test with different event types
 */
async function testDifferentEvents() {
  console.log('\n🔄 Testing different event types...');
  
  // Test with unsupported event type
  const unsupportedEvent = {
    ...stripeEventPayload,
    id: "evt_unsupported_" + Date.now(),
    type: "invoice.payment_succeeded"
  };
  
  console.log('\n📋 Testing unsupported event type:', unsupportedEvent.type);
  
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const payloadString = JSON.stringify(unsupportedEvent);
    const stripeSignature = createStripeSignature(unsupportedEvent, WEBHOOK_SECRET, timestamp);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': stripeSignature,
        'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
      },
      body: payloadString
    });
    
    console.log(`Status: ${response.status}`);
    const responseText = await response.text();
    console.log('Response:', responseText);
    
  } catch (error) {
    console.error('Error testing unsupported event:', error.message);
  }
}

/**
 * Test with invalid signature
 */
async function testInvalidSignature() {
  console.log('\n🚫 Testing invalid signature...');
  
  try {
    const payloadString = JSON.stringify(stripeEventPayload);
    const invalidSignature = 't=' + Math.floor(Date.now() / 1000) + ',v1=invalid_signature_12345';
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': invalidSignature,
        'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
      },
      body: payloadString
    });
    
    console.log(`Status: ${response.status} (should be 400)`);
    const responseText = await response.text();
    console.log('Response:', responseText);
    
  } catch (error) {
    console.error('Error testing invalid signature:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  await testStripeWebhook();
  await testDifferentEvents();
  await testInvalidSignature();
  
  console.log('\n✨ All webhook tests completed!');
  console.log('\n💡 Tips:');
  console.log('- Check Vercel logs for detailed webhook processing');
  console.log('- Check your email for confirmation messages');
  console.log('- Check Google Sheets for the new booking entry');
  console.log('- Check your database for the saved booking');
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { createStripeSignature, testStripeWebhook };
