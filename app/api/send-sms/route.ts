import { NextRequest, NextResponse } from 'next/server'
import { sendSMS, formatPhoneNumber, SMS_TEMPLATES } from '@/lib/twilio-sms'

// Interface for the payload from Google Apps Script
interface GoogleSheetsSMSPayload {
  data: string | Date
  ora: string | Date
  clientePhone: string
  driverPhone: string
  target: 'driver' | 'cliente' | 'entrambi'
  // Optional additional fields that might come from the sheet
  customerName?: string
  pickup?: string
  destination?: string
}

// Format date and time for display
function formatDateTime(date: string | Date, time?: string | Date): { dateStr: string; timeStr: string } {
  let dateObj: Date
  
  if (typeof date === 'string') {
    dateObj = new Date(date)
  } else {
    dateObj = date
  }
  
  // Format date as DD/MM/YYYY
  const dateStr = dateObj.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  
  // Format time
  let timeStr = ''
  if (time) {
    if (typeof time === 'string') {
      timeStr = time
    } else {
      timeStr = time.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
  
  return { dateStr, timeStr }
}

// Create message templates for Google Sheets context
function createDriverMessage(payload: GoogleSheetsSMSPayload): string {
  const { dateStr, timeStr } = formatDateTime(payload.data, payload.ora)
  const customerName = payload.customerName || 'Cliente'
  const pickup = payload.pickup || 'Da definire'
  const destination = payload.destination || 'Da definire'
  
  return `🚗 Nuova prenotazione!

Cliente: ${customerName}
Data: ${dateStr} alle ${timeStr}
Da: ${pickup}
A: ${destination}

Patty Car`
}

function createClientMessage(payload: GoogleSheetsSMSPayload): string {
  const { dateStr, timeStr } = formatDateTime(payload.data, payload.ora)
  const customerName = payload.customerName || 'Cliente'
  const pickup = payload.pickup || 'luogo di ritiro'
  
  return `🚗 Promemoria Patty Car

Ciao ${customerName}, il tuo servizio è programmato per ${dateStr} alle ${timeStr}.

Ritiro: ${pickup}

Grazie per averci scelto!`
}

export async function POST(request: NextRequest) {
  console.log('🚀 SMS Endpoint called at:', new Date().toISOString())
  
  try {
    // Parse the request body
    const rawBody = await request.text()
    console.log('📥 Raw request body:', rawBody)
    
    let payload: GoogleSheetsSMSPayload
    try {
      payload = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
        },
        { status: 400 }
      )
    }
    
    console.log('📋 Parsed payload:', JSON.stringify(payload, null, 2))
    
    // Validate required fields with more detailed logging
    const missingFields = []
    
    console.log('🔍 Field validation:')
    console.log('  - data:', typeof payload.data, payload.data)
    console.log('  - ora:', typeof payload.ora, payload.ora)
    console.log('  - target:', typeof payload.target, payload.target)
    console.log('  - clientePhone:', typeof payload.clientePhone, payload.clientePhone)
    console.log('  - driverPhone:', typeof payload.driverPhone, payload.driverPhone)
    
    if (!payload.data) missingFields.push('data')
    if (!payload.ora) missingFields.push('ora') 
    if (!payload.target) missingFields.push('target')
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields)
      console.error('❌ FULL PAYLOAD RECEIVED:', JSON.stringify(payload, null, 2))
      console.error('❌ This will return 400 - Missing fields:', missingFields.join(', '))
      
      // Force log flush before returning error
      setTimeout(() => {
        console.error('❌ ERROR 400 RETURNED - Missing fields:')
      }, 100)
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          received: payload,
          debug: {
            missingFields,
            receivedFields: Object.keys(payload),
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      )
    }
    
    // Validate target
    if (!['driver', 'cliente', 'entrambi'].includes(payload.target)) {
      console.error('❌ Invalid target:', payload.target)
      console.error('❌ FULL PAYLOAD FOR INVALID TARGET:', JSON.stringify(payload, null, 2))
      console.error('❌ This will return 400 - Invalid target:', payload.target)
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid target. Must be: driver, cliente, or entrambi',
          received: payload.target,
          validOptions: ['driver', 'cliente', 'entrambi'],
          debug: {
            fullPayload: payload,
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      )
    }
    
    console.log('✅ Validation passed, processing SMS requests...')
    
    const results: Array<{
      target: string
      phone: string
      success: boolean
      error?: string
      messageId?: string
    }> = []
    
    // Send SMS to driver if required
    if (payload.target === 'driver' || payload.target === 'entrambi') {
      if (!payload.driverPhone) {
        results.push({
          target: 'driver',
          phone: '',
          success: false,
          error: 'Driver phone number not provided'
        })
      } else {
        const formattedDriverPhone = formatPhoneNumber(payload.driverPhone)
        const driverMessage = createDriverMessage(payload)
        
        // const driverResult = await sendSMS({
        //   to: formattedDriverPhone,
        //   message: driverMessage
        // })
        
        // Temporary mock result for testing without Twilio
        console.log('📱 DRIVER SMS (would be sent):', {
          to: formattedDriverPhone,
          message: driverMessage,
          timestamp: new Date().toISOString(),
          payload: payload
        })
        const driverResult = { success: true, messageId: 'MOCK_DRIVER_' + Date.now(), error: undefined }
        
        results.push({
          target: 'driver',
          phone: formattedDriverPhone,
          success: driverResult.success,
          error: driverResult.error,
          messageId: driverResult.messageId
        })
      }
    }
    
    // Send SMS to client if required
    if (payload.target === 'cliente' || payload.target === 'entrambi') {
      if (!payload.clientePhone) {
        results.push({
          target: 'cliente',
          phone: '',
          success: false,
          error: 'Client phone number not provided'
        })
      } else {
        const formattedClientPhone = formatPhoneNumber(payload.clientePhone)
        const clientMessage = createClientMessage(payload)
        
        // const clientResult = await sendSMS({
        //   to: formattedClientPhone,
        //   message: clientMessage
        // })
        
        // Temporary mock result for testing without Twilio
        console.log('📱 CLIENT SMS (would be sent):', {
          to: formattedClientPhone,
          message: clientMessage,
          timestamp: new Date().toISOString(),
          payload: payload
        })
        const clientResult = { success: true, messageId: 'MOCK_CLIENT_' + Date.now(), error: undefined }
        
        results.push({
          target: 'cliente',
          phone: formattedClientPhone,
          success: clientResult.success,
          error: clientResult.error,
          messageId: clientResult.messageId
        })
      }
    }
    
    // Check if all messages were sent successfully
    const allSuccessful = results.every(result => result.success)
    const successCount = results.filter(result => result.success).length
    const failureCount = results.filter(result => !result.success).length
    
    console.log('SMS sending results:', {
      target: payload.target,
      successCount,
      failureCount,
      results
    })
    
    return NextResponse.json({
      success: allSuccessful,
      message: `SMS sent: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    })
    
  } catch (error) {
    console.error('❌ Unexpected error in send-sms endpoint:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Optional: Add GET method for testing/health check
export async function GET() {
  const response = NextResponse.json({
    message: 'SMS endpoint is active',
    supportedTargets: ['driver', 'cliente', 'entrambi'],
    requiredFields: ['data', 'ora', 'target'],
    optionalFields: ['customerName', 'pickup', 'destination', 'clientePhone', 'driverPhone']
  })
  
  // Add CORS headers for Google Apps Script
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  
  return response
}

// Add OPTIONS method for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  
  return response
}
