import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { notifyCustomer } from '@/lib/twilio-service'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Verify this is actually coming from Vercel Cron (optional security check)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const now = new Date()
    
    // Calculate dates for notifications
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
    
    // Format dates for database query (YYYY-MM-DD)
    const sevenDaysDate = sevenDaysFromNow.toISOString().split('T')[0]
    const oneDayDate = oneDayFromNow.toISOString().split('T')[0]
    
    // Only run at 18:00 (6 PM)
    const currentHour = now.getHours()
    if (currentHour !== 18) {
      return NextResponse.json({
        success: true,
        message: `Cron job ran at ${currentHour}:00, but notifications only sent at 18:00`,
        sentNotifications: 0
      })
    }

    // Fetch bookings for 7 days from now and 1 day from now
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        customer_name,
        customer_phone,
        customer_phone_prefix,
        service_date,
        service_time,
        pickup_address,
        destination_address,
        vehicle_type,
        driver_id,
        drivers(
          name
        )
      `)
      .in('service_date', [sevenDaysDate, oneDayDate])
      .not('customer_phone', 'is', null)
      .not('customer_phone_prefix', 'is', null)
      .eq('payment_status', 'paid') // Only paid bookings

    if (error) {
      console.error('Error fetching bookings for notifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bookings found for notification dates',
        sentNotifications: 0
      })
    }

    // Separate bookings by notification type
    const sevenDayBookings = bookings.filter(b => b.service_date === sevenDaysDate)
    const oneDayBookings = bookings.filter(b => b.service_date === oneDayDate)

    const notifications: Promise<any>[] = []

    // Send 7-day notifications
    for (const booking of sevenDayBookings) {
      const notificationPromise = notifyCustomer({
        customerName: booking.customer_name,
        customerPhone: booking.customer_phone!,
        customerPhonePrefix: booking.customer_phone_prefix!,
        serviceDate: booking.service_date,
        serviceTime: booking.service_time,
        pickupAddress: booking.pickup_address,
        destinationAddress: booking.destination_address,
        vehicleType: booking.vehicle_type,
        driverName: booking.drivers?.name
      }, '7_days').then(result => ({
        ...result,
        bookingId: booking.id,
        type: '7_days'
      }))
      
      notifications.push(notificationPromise)
    }

    // Send 1-day notifications
    for (const booking of oneDayBookings) {
      const notificationPromise = notifyCustomer({
        customerName: booking.customer_name,
        customerPhone: booking.customer_phone!,
        customerPhonePrefix: booking.customer_phone_prefix!,
        serviceDate: booking.service_date,
        serviceTime: booking.service_time,
        pickupAddress: booking.pickup_address,
        destinationAddress: booking.destination_address,
        vehicleType: booking.vehicle_type,
        driverName: booking.drivers?.name
      }, '1_day').then(result => ({
        ...result,
        bookingId: booking.id,
        type: '1_day'
      }))
      
      notifications.push(notificationPromise)
    }

    // Execute all notifications in parallel with batching to respect rate limits
    const batchSize = 5
    const results = []
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch)
      results.push(...batchResults)
      
      // Small delay between batches
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Count successful and failed notifications
    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    // Log results
    console.log(`Customer notifications completed: ${successCount} successful, ${errorCount} failed`)
    console.log('Results:', results)

    return NextResponse.json({
      success: errorCount === 0,
      message: `Sent ${successCount} notifications, ${errorCount} failed`,
      details: {
        sevenDayNotifications: sevenDayBookings.length,
        oneDayNotifications: oneDayBookings.length,
        successCount,
        errorCount,
        results
      }
    })

  } catch (error) {
    console.error('Error in customer notification cron:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle POST requests for manual testing
export async function POST(request: NextRequest) {
  return GET(request)
}