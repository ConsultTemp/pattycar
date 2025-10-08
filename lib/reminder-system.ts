import { createAdminClient } from './supabase'
import { sendBulkSMS, SMS_TEMPLATES, formatPhoneNumber, SMSData } from './twilio-sms'
import { Database } from '@/types/database.types'

type BookingRow = Database['public']['Tables']['bookings']['Row']

// Get bookings that need reminders
export async function getBookingsForReminder(daysAhead: number): Promise<{ success: boolean; data?: BookingRow[]; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    // Calculate the target date (tomorrow or 7 days from now)
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + daysAhead)
    const targetDateString = targetDate.toISOString().split('T')[0] // YYYY-MM-DD format

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('service_date', targetDateString)
      .eq('payment_status', 'paid')
      .order('service_time', { ascending: true })

    if (error) {
      console.error('Error fetching bookings for reminder:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error fetching bookings for reminder:', error)
    return { success: false, error: 'Failed to fetch bookings' }
  }
}

// Send reminder SMS to customers
export async function sendCustomerReminders(daysAhead: number): Promise<{ success: boolean; sentCount: number; failedCount: number; error?: string }> {
  try {
    const bookingsResult = await getBookingsForReminder(daysAhead)
    
    if (!bookingsResult.success || !bookingsResult.data) {
      return { success: false, sentCount: 0, failedCount: 0, error: bookingsResult.error }
    }

    const bookings = bookingsResult.data
    const smsData: SMSData[] = []

    // Prepare SMS for each booking
    for (const booking of bookings) {
      if (booking.customer_phone) {
        const customerPhone = formatPhoneNumber(
          booking.customer_phone,
          booking.customer_phone_prefix
        )

        if (customerPhone) {
          let message: string
          
          if (daysAhead === 1) {
            // Tomorrow reminder
            message = SMS_TEMPLATES.CUSTOMER_REMINDER_TOMORROW(
              booking.customer_name,
              booking.service_date,
              booking.service_time,
              booking.pickup_address
            )
          } else {
            // 7 days reminder
            message = SMS_TEMPLATES.CUSTOMER_REMINDER_7_DAYS(
              booking.customer_name,
              booking.service_date,
              booking.service_time
            )
          }

          smsData.push({
            to: customerPhone,
            message
          })
        }
      }
    }

    if (smsData.length === 0) {
      return { success: true, sentCount: 0, failedCount: 0 }
    }

    // Send SMS messages
    const result = await sendBulkSMS(smsData)
    const successCount = result.results.filter(r => r.success).length
    const failureCount = result.results.filter(r => !r.success).length

    console.log(`Sent ${successCount} reminder SMS (${daysAhead} days ahead), ${failureCount} failed`)

    return {
      success: true,
      sentCount: successCount,
      failedCount: failureCount
    }

  } catch (error) {
    console.error('Error sending customer reminders:', error)
    return {
      success: false,
      sentCount: 0,
      failedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Main function to run daily reminders
export async function runDailyReminders(): Promise<{ success: boolean; results: any; error?: string }> {
  try {
    console.log('Running daily reminders at', new Date().toISOString())

    // Send reminders for tomorrow (1 day ahead)
    const tomorrowResult = await sendCustomerReminders(1)
    
    // Send reminders for 7 days ahead
    const sevenDaysResult = await sendCustomerReminders(7)

    const results = {
      tomorrow: tomorrowResult,
      sevenDays: sevenDaysResult,
      totalSent: tomorrowResult.sentCount + sevenDaysResult.sentCount,
      totalFailed: tomorrowResult.failedCount + sevenDaysResult.failedCount
    }

    console.log('Daily reminders completed:', results)

    return {
      success: true,
      results
    }

  } catch (error) {
    console.error('Error running daily reminders:', error)
    return {
      success: false,
      results: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}














