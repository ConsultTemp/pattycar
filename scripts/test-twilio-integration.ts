#!/usr/bin/env tsx

/**
 * Test script for Twilio SMS integration - TypeScript version
 * 
 * Usage:
 * npx tsx scripts/test-twilio-integration.ts customer +393331234567 "Mario Rossi"
 * npx tsx scripts/test-twilio-integration.ts driver +393331234567 "Giuseppe Verdi"
 */

import { config } from 'dotenv'
import { notifyCustomer, notifyDriver, isValidPhoneNumber } from '../lib/twilio-service'

// Load environment variables
config({ path: '.env.local' })

interface TestConfig {
  type: 'customer' | 'driver'
  phone: string
  name: string
}

async function validateEnvironment(): Promise<boolean> {
  const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER']
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '))
    console.error('Please check your .env.local file')
    return false
  }

  console.log('✅ Environment variables validated')
  return true
}

async function testCustomerNotification(phone: string, name: string) {
  console.log(`🧪 Testing customer notification for ${name} at ${phone}`)

  const testData = {
    customerName: name,
    customerPhone: phone.replace(/^\+39/, ''), // Remove prefix for internal format
    customerPhonePrefix: '+39',
    serviceDate: '2024-12-25',
    serviceTime: '10:00',
    pickupAddress: 'Via Roma 1, Milano',
    destinationAddress: 'Aeroporto Malpensa, Terminal 1',
    vehicleType: 'Mercedes Class E',
    driverName: 'Mario Rossi'
  }

  // Test 7-day notification
  console.log('📅 Testing 7-day notification...')
  const result7Days = await notifyCustomer(testData, '7_days')
  
  if (result7Days.success) {
    console.log('✅ 7-day notification sent successfully')
    console.log('📧 Message SID:', result7Days.messageId)
  } else {
    console.error('❌ 7-day notification failed:', result7Days.error)
  }

  // Small delay before second test
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Test 1-day notification
  console.log('📅 Testing 1-day notification...')
  const result1Day = await notifyCustomer(testData, '1_day')
  
  if (result1Day.success) {
    console.log('✅ 1-day notification sent successfully')
    console.log('📧 Message SID:', result1Day.messageId)
  } else {
    console.error('❌ 1-day notification failed:', result1Day.error)
  }

  return { result7Days, result1Day }
}

async function testDriverNotification(phone: string, name: string) {
  console.log(`🧪 Testing driver notification for ${name} at ${phone}`)

  const testData = {
    driverName: name,
    driverPhone: phone,
    serviceDate: '2024-12-25',
    serviceTime: '10:00',
    customerName: 'Giovanni Bianchi',
    pickupAddress: 'Via Roma 1, Milano',
    destinationAddress: 'Aeroporto Malpensa, Terminal 1',
    vehicleType: 'Mercedes Class E',
    passengers: 2,
    notes: 'Cliente VIP, massima puntualità richiesta'
  }

  const result = await notifyDriver(testData)
  
  if (result.success) {
    console.log('✅ Driver notification sent successfully')
    console.log('📧 Message SID:', result.messageId)
  } else {
    console.error('❌ Driver notification failed:', result.error)
  }

  return result
}

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 3) {
    console.log('📋 Usage: npx tsx scripts/test-twilio-integration.ts <type> <phone> <name>')
    console.log('📋 Types: customer, driver')
    console.log('📋 Example: npx tsx scripts/test-twilio-integration.ts customer +393331234567 "Mario Rossi"')
    process.exit(1)
  }

  const [type, phone, name] = args as [string, string, string]

  console.log('🚀 Starting Twilio SMS integration test...')
  console.log('🔧 Configuration:')
  console.log('  - Type:', type)
  console.log('  - Phone:', phone)
  console.log('  - Name:', name)
  console.log('  - From Number:', process.env.TWILIO_PHONE_NUMBER)
  console.log('')

  // Validate environment
  const envValid = await validateEnvironment()
  if (!envValid) {
    process.exit(1)
  }

  // Validate phone number
  const phoneValid = isValidPhoneNumber(phone.replace(/^\+\d+/, ''), phone.match(/^\+\d+/)?.[0])
  if (!phoneValid) {
    console.error('❌ Invalid phone number format')
    console.error('💡 Phone should include country code, e.g. +393331234567')
    process.exit(1)
  }

  console.log('✅ Phone number format validated')
  console.log('')

  try {
    if (type === 'customer') {
      await testCustomerNotification(phone, name)
    } else if (type === 'driver') {
      await testDriverNotification(phone, name)
    } else {
      console.error('❌ Invalid type. Use "customer" or "driver"')
      process.exit(1)
    }

    console.log('')
    console.log('🎉 Test completed successfully!')
    console.log('💡 Check your phone for the SMS message')
    
  } catch (error) {
    console.error('💥 Test failed with error:')
    console.error(error)
    process.exit(1)
  }
}

// Run the test
main().catch(console.error)