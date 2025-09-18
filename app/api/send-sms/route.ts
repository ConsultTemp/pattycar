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
  try {
    // Parse the request body
    const payload: GoogleSheetsSMSPayload = await request.json()
    
    // Validate required fields
    if (!payload.data || !payload.ora || !payload.target) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: data, ora, target' 
        },
        { status: 400 }
      )
    }
    
    // Validate target
    if (!['driver', 'cliente', 'entrambi'].includes(payload.target)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid target. Must be: driver, cliente, or entrambi' 
        },
        { status: 400 }
      )
    }
    
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
    console.error('Error in send-sms endpoint:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Optional: Add GET method for testing/health check
export async function GET() {
  return NextResponse.json({
    message: 'SMS endpoint is active',
    supportedTargets: ['driver', 'cliente', 'entrambi'],
    requiredFields: ['data', 'ora', 'target'],
    optionalFields: ['customerName', 'pickup', 'destination', 'clientePhone', 'driverPhone']
  })
}
