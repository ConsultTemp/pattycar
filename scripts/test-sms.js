#!/usr/bin/env node

/**
 * Test script for Twilio SMS integration
 * 
 * Usage:
 * node scripts/test-sms.js customer +393331234567 "Mario Rossi"
 * node scripts/test-sms.js driver +393331234567 "Giuseppe Verdi"
 */

require('dotenv').config({ path: '.env.local' });

const { Twilio } = require('twilio');

async function testSMS() {
  // Check if we have required arguments
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log('Usage: node scripts/test-sms.js <type> <phone> <name>');
    console.log('Types: customer, driver');
    console.log('Example: node scripts/test-sms.js customer +393331234567 "Mario Rossi"');
    process.exit(1);
  }

  const [type, phone, name] = args;

  // Validate environment variables
  const requiredEnvVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    console.error('Please check your .env.local file');
    process.exit(1);
  }

  console.log('🔧 Initializing Twilio client...');
  const client = new Twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    let message;
    
    if (type === 'customer') {
      message = `🚗 PatyCar TEST: Gentile ${name}, questo è un messaggio di test per la notifica clienti.
Data: 2024-12-25 alle 10:00
Da: Via Roma 1, Milano
A: Aeroporto Malpensa
Autista: Mario Rossi
Per modifiche: +39 123 456 789`;
    } else if (type === 'driver') {
      message = `🚗 PatyCar TEST: Ciao ${name}, questo è un messaggio di test per la notifica autisti.
📅 Data: 2024-12-25 alle 10:00
👤 Cliente: Giovanni Bianchi
📍 Da: Via Roma 1, Milano
📍 A: Aeroporto Malpensa
👥 Passeggeri: 2
🚗 Veicolo: Mercedes Class E

Per conferma/info: +39 123 456 789`;
    } else {
      console.error('❌ Invalid type. Use "customer" or "driver"');
      process.exit(1);
    }

    console.log(`📱 Sending test SMS to ${phone}...`);
    console.log(`📝 Message preview:`);
    console.log(message);
    console.log('---');

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    console.log('✅ SMS sent successfully!');
    console.log('📧 Message SID:', result.sid);
    console.log('📱 To:', result.to);
    console.log('📞 From:', result.from);
    console.log('📊 Status:', result.status);
    
  } catch (error) {
    console.error('❌ Error sending SMS:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 21614) {
      console.error('💡 Tip: This number may not be verified. Add it to your Twilio Verified Caller IDs.');
    } else if (error.code === 21211) {
      console.error('💡 Tip: Invalid phone number format. Make sure to include country code (+39).');
    }
    
    process.exit(1);
  }
}

testSMS();