import { Twilio } from 'twilio'

// Initialize Twilio client
const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

interface NotificationResult {
  success: boolean
  messageId?: string
  error?: string
}

interface CustomerNotificationData {
  customerName: string
  customerPhone: string
  customerPhonePrefix: string
  serviceDate: string
  serviceTime: string
  pickupAddress: string
  destinationAddress: string
  vehicleType?: string
  driverName?: string
}

interface DriverNotificationData {
  driverName: string
  driverPhone: string
  serviceDate: string
  serviceTime: string
  customerName: string
  pickupAddress: string
  destinationAddress: string
  vehicleType?: string
  passengers?: number
  notes?: string
}

/**
 * Send SMS notification to customer
 */
export async function notifyCustomer(
  data: CustomerNotificationData,
  notificationType: '7_days' | '1_day'
): Promise<NotificationResult> {
  try {
    // Validate phone number
    if (!data.customerPhone || !data.customerPhonePrefix) {
      return {
        success: false,
        error: 'Missing customer phone number or prefix'
      }
    }

    // Format phone number with prefix
    const phoneNumber = `${data.customerPhonePrefix}${data.customerPhone}`

    // Create SMS message based on notification type
    let message: string
    if (notificationType === '7_days') {
      message = `🚗 PatyCar: Gentile ${data.customerName}, le ricordiamo il suo servizio del ${data.serviceDate} alle ${data.serviceTime}. 
Da: ${data.pickupAddress}
A: ${data.destinationAddress}
${data.driverName ? `Autista: ${data.driverName}` : ''}
Per modifiche: +39 123 456 789`
    } else {
      message = `🚗 PatyCar: Gentile ${data.customerName}, le ricordiamo che domani (${data.serviceDate}) alle ${data.serviceTime} è previsto il suo servizio.
Da: ${data.pickupAddress} 
A: ${data.destinationAddress}
${data.driverName ? `Autista: ${data.driverName}` : 'Autista da confermare'}
Per emergenze: +39 123 456 789`
    }

    // Send SMS
    const smsResult = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: phoneNumber
    })

    console.log(`Customer SMS sent successfully: ${smsResult.sid}`)
    
    return {
      success: true,
      messageId: smsResult.sid
    }

  } catch (error) {
    console.error('Error sending customer SMS:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send SMS notification to driver
 */
export async function notifyDriver(data: DriverNotificationData): Promise<NotificationResult> {
  try {
    // Validate phone number
    if (!data.driverPhone) {
      return {
        success: false,
        error: 'Missing driver phone number'
      }
    }

    // Create SMS message for driver
    const message = `🚗 PatyCar: Nuovo servizio assegnato!
📅 Data: ${data.serviceDate} alle ${data.serviceTime}
👤 Cliente: ${data.customerName}
📍 Da: ${data.pickupAddress}
📍 A: ${data.destinationAddress}
${data.passengers ? `👥 Passeggeri: ${data.passengers}` : ''}
${data.vehicleType ? `🚗 Veicolo: ${data.vehicleType}` : ''}
${data.notes ? `📝 Note: ${data.notes}` : ''}

Per conferma/info: +39 123 456 789`

    // Send SMS
    const smsResult = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: data.driverPhone
    })

    console.log(`Driver SMS sent successfully: ${smsResult.sid}`)
    
    return {
      success: true,
      messageId: smsResult.sid
    }

  } catch (error) {
    console.error('Error sending driver SMS:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send batch notifications to multiple drivers
 */
export async function notifyDriversBatch(notifications: DriverNotificationData[]): Promise<{
  success: boolean
  results: NotificationResult[]
  successCount: number
  errorCount: number
}> {
  const results: NotificationResult[] = []
  let successCount = 0
  let errorCount = 0

  // Send notifications in parallel but with rate limiting
  const batchSize = 5 // Process 5 at a time to respect Twilio rate limits
  for (let i = 0; i < notifications.length; i += batchSize) {
    const batch = notifications.slice(i, i + batchSize)
    
    const batchPromises = batch.map(async (notification) => {
      const result = await notifyDriver(notification)
      if (result.success) {
        successCount++
      } else {
        errorCount++
      }
      return result
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < notifications.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return {
    success: errorCount === 0,
    results,
    successCount,
    errorCount
  }
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string, prefix?: string): boolean {
  if (!phone) return false
  
  // Remove spaces and special characters
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
  
  // Basic validation: should be digits only and reasonable length
  const phoneRegex = /^\d{6,15}$/
  
  if (prefix) {
    const cleanPrefix = prefix.replace(/[\s\-\+]/g, '')
    const fullNumber = cleanPrefix + cleanPhone
    return phoneRegex.test(fullNumber)
  }
  
  return phoneRegex.test(cleanPhone)
}