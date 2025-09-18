import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth-server'
import { sendBulkSMS, SMS_TEMPLATES, formatPhoneNumber, SMSData } from '@/lib/twilio-sms'
import { createAdminClient } from '@/lib/supabase'
import { Database } from '@/types/database.types'

type BookingRow = Database['public']['Tables']['bookings']['Row']

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const isAuthenticated = await verifyAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, bookings } = body

    if (!type || !bookings || !Array.isArray(bookings)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const smsData: SMSData[] = []

    // Process each booking to collect SMS recipients
    for (const booking of bookings as BookingRow[]) {
      // Get driver info if assigned and type includes drivers
      if ((type === 'drivers' || type === 'all') && booking.driver_id) {
        const { data: driver } = await supabase
          .from('drivers')
          .select('name, phone')
          .eq('id', booking.driver_id)
          .single()

        if (driver && driver.phone) {
          const message = SMS_TEMPLATES.DRIVER_BOOKING_NOTIFICATION(
            booking.customer_name,
            booking.service_date,
            booking.service_time,
            booking.pickup_address,
            booking.destination_address
          )

          smsData.push({
            to: formatPhoneNumber(driver.phone),
            message
          })
        }
      }

      // Get customer info if type includes customers
      if ((type === 'customers' || type === 'all') && booking.customer_phone) {
        const customerPhone = formatPhoneNumber(
          booking.customer_phone,
          booking.customer_phone_prefix
        )

        if (customerPhone) {
          // For customers, send a general notification message
          const message = `🚗 Patty Car - Aggiornamento prenotazione\n\nCiao ${booking.customer_name}, abbiamo un aggiornamento sulla tua prenotazione del ${booking.service_date} alle ${booking.service_time}.\n\nPer maggiori informazioni, contattaci.\n\nGrazie!`

          smsData.push({
            to: customerPhone,
            message
          })
        }
      }

      // Get assigned customer info if available and type includes customers
      if ((type === 'customers' || type === 'all') && booking.customer_id) {
        const { data: customer } = await supabase
          .from('customers')
          .select('name, phone')
          .eq('id', booking.customer_id)
          .single()

        if (customer && customer.phone) {
          const message = `🚗 Patty Car - Notifica prenotazione\n\nCiao ${customer.name}, hai una prenotazione del ${booking.service_date} alle ${booking.service_time}.\n\nCliente: ${booking.customer_name}\nDa: ${booking.pickup_address}\nA: ${booking.destination_address}\n\nGrazie!`

          smsData.push({
            to: formatPhoneNumber(customer.phone),
            message
          })
        }
      }
    }

    if (smsData.length === 0) {
      return NextResponse.json(
        { error: 'No valid phone numbers found for selected bookings' },
        { status: 400 }
      )
    }

    // Send SMS messages
    const result = await sendBulkSMS(smsData)

    const successCount = result.results.filter(r => r.success).length
    const failureCount = result.results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      sentCount: successCount,
      failedCount: failureCount,
      details: result.results
    })

  } catch (error) {
    console.error('Error in send-sms API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



