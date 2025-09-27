import twilio from 'twilio'

// Initialize Twilio client
function createTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured')
  }

  return twilio(accountSid, authToken)
}

// Interface for SMS data
export interface SMSData {
  to: string
  message: string
}

// Send SMS using Twilio
export async function sendSMS(data: SMSData): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const client = createTwilioClient()
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    if (!twilioPhoneNumber) {
      throw new Error('Twilio phone number not configured')
    }

    const message = await client.messages.create({
      body: data.message,
      from: twilioPhoneNumber,
      to: data.to
    })

    console.log('SMS sent successfully:', message.sid)
    return { success: true, messageId: message.sid }

  } catch (error) {
    console.error('Error sending SMS:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Send SMS to multiple recipients
export async function sendBulkSMS(recipients: SMSData[]): Promise<{ success: boolean; results: Array<{ to: string; success: boolean; error?: string; messageId?: string }> }> {
  const results: Array<{ to: string; success: boolean; error?: string; messageId?: string }> = []

  for (const recipient of recipients) {
    const result = await sendSMS(recipient)
    results.push({
      to: recipient.to,
      success: result.success,
      error: result.error,
      messageId: result.messageId
    })
  }

  const allSuccessful = results.every(result => result.success)
  return { success: allSuccessful, results }
}

// Predefined message templates
export const SMS_TEMPLATES = {
  DRIVER_BOOKING_NOTIFICATION: (customerName: string, serviceDate: string, serviceTime: string, pickup: string, destination: string) => 
    `🚗 Nuova prenotazione!\n\nCliente: ${customerName}\nData: ${serviceDate} alle ${serviceTime}\nDa: ${pickup}\nA: ${destination}\n\nPatty Car`,

  CUSTOMER_REMINDER_TOMORROW: (customerName: string, serviceDate: string, serviceTime: string, pickup: string) =>
    `🚗 Promemoria Patty Car\n\nCiao ${customerName}, il tuo servizio è domani ${serviceDate} alle ${serviceTime}.\n\nRitiro: ${pickup}\n\nGrazie per averci scelto!`,

  CUSTOMER_REMINDER_7_DAYS: (customerName: string, serviceDate: string, serviceTime: string) =>
    `🚗 Promemoria Patty Car\n\nCiao ${customerName}, il tuo servizio è programmato per ${serviceDate} alle ${serviceTime}.\n\nTi invieremo un altro promemoria domani.\n\nGrazie!`,

  GENERAL_MESSAGE: (message: string) => message
}

// Format phone number for international SMS (add +39 if needed)
export function formatPhoneNumber(phone: string, prefix?: string): string {
  if (!phone) return ''
  
  // Remove any spaces, dashes, or parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
  
  // If it already starts with +, return as is
  if (cleanPhone.startsWith('+')) {
    return cleanPhone
  }
  
  // If we have a prefix, use it
  if (prefix) {
    return `${prefix}${cleanPhone}`
  }
  
  // Default to Italian prefix if no prefix provided and doesn't start with +
  if (!cleanPhone.startsWith('39') && !cleanPhone.startsWith('+39')) {
    return `+39${cleanPhone}`
  }
  
  return `+${cleanPhone}`
}









