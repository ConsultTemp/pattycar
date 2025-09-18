#!/usr/bin/env node

/**
 * Test with the exact signature calculated by the server
 * From the logs: Expected signature: b1d6d264bee9d2b77c4d31623040427e83ffc993e5bd82438f3bd1275b9c0438
 */

const WEBHOOK_URL = "https://pattycar.com/api/stripe-webhook";

// This is the exact payload from the server logs
const exactPayload = `{"id":"evt_test_webhook_1758219635363","object":"event","api_version":"2025-05-28.basil","created":1758219635,"data":{"object":{"id":"cs_test_1758219635363","object":"checkout.session","amount_subtotal":15000,"amount_total":15000,"currency":"eur","customer":"cus_test_1758219635363","customer_details":{"address":{"city":null,"country":"IT","line1":null,"line2":null,"postal_code":null,"state":null},"email":"test@example.com","name":"Test Customer","phone":null,"tax_exempt":"none","tax_ids":[]},"invoice":"in_test_1758219635363","metadata":{"serviceType":"transfer","pickup":"Milano Centrale","destination":"Aeroporto Malpensa","passengers":"2","luggage":"1","vehicleType":"Mercedes E-Class","vehicleCount":"1","date":"2024-01-20","time":"14:30","phonePrefix":"+39","phoneNumber":"3383931206","customerName":"Test Customer","customerEmail":"test@example.com","notes":"Test booking from webhook simulator","billingInfo":"Test Company\\nVia Test 123\\n20100 Milano","flight":"AZ1234","departureCity":"Roma","meetAndGreet":"false","distance":"50 km","duration":"45 min","vatRate":"22","isOlympicPricing":"false","sameVehicleType":"true"},"payment_intent":"pi_test_1758219635363","payment_status":"paid","status":"complete","success_url":"https://pattycar.com/payment-success?session_id={CHECKOUT_SESSION_ID}","url":null}},"livemode":false,"pending_webhooks":1,"request":{"id":null,"idempotency_key":null},"type":"checkout.session.completed"}`;

// This is the exact signature the server calculated
const exactTimestamp = "1758219636";
const exactSignature = "b1d6d264bee9d2b77c4d31623040427e83ffc993e5bd82438f3bd1275b9c0438";

async function testWithExactSignature() {
  console.log('🎯 Testing with EXACT signature from server logs');
  console.log('===============================================');
  console.log('Timestamp:', exactTimestamp);
  console.log('Signature:', exactSignature);
  console.log('Payload length:', exactPayload.length);
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': `t=${exactTimestamp},v1=${exactSignature}`,
        'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
      },
      body: exactPayload
    });
    
    console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('📋 Response:', responseText);
    
    if (response.ok) {
      console.log('✅ SUCCESS! The webhook processed correctly with exact signature!');
    } else {
      console.log('❌ Still failed even with exact signature');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testWithExactSignature().catch(console.error);
