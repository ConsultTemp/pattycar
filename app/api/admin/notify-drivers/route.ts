import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { verifyAdminAuth } from '@/lib/auth-server'
import { notifyDriversBatch } from '@/lib/twilio-service'

interface NotifyDriversRequestBody {
  dates?: string[] // Specific dates to notify drivers for
  bookingIds?: string[] // Specific booking IDs to notify drivers for
}

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

    const supabase = createAdminClient()
    const body: NotifyDriversRequestBody = await request.json()
    
    if (!body.dates && !body.bookingIds) {
      return NextResponse.json(
        { error: 'Either dates or bookingIds must be provided' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('bookings')
      .select(`
        id,
        service_date,
        service_time,
        customer_name,
        pickup_address,
        destination_address,
        vehicle_type,
        passengers,
        notes,
        driver_id,
        drivers!inner(
          id,
          name,
          phone
        )
      `)
      .not('driver_id', 'is', null) // Only bookings with assigned drivers

    // Filter by dates or specific booking IDs
    if (body.dates && body.dates.length > 0) {
      query = query.in('service_date', body.dates)
    } else if (body.bookingIds && body.bookingIds.length > 0) {
      query = query.in('id', body.bookingIds)
    }

    const { data: bookings, error } = await query

    if (error) {
      console.error('Error fetching bookings for driver notifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bookings with assigned drivers found for the specified criteria',
        results: {
          successCount: 0,
          errorCount: 0,
          results: []
        }
      })
    }

    // Prepare notification data for drivers
    const notifications = bookings.map(booking => ({
      driverName: booking.drivers?.name || 'N/A',
      driverPhone: booking.drivers?.phone || '',
      serviceDate: booking.service_date,
      serviceTime: booking.service_time,
      customerName: booking.customer_name,
      pickupAddress: booking.pickup_address,
      destinationAddress: booking.destination_address,
      vehicleType: booking.vehicle_type,
      passengers: booking.passengers,
      notes: booking.notes
    })).filter(notification => notification.driverPhone) // Only include drivers with phone numbers

    if (notifications.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No drivers have phone numbers configured',
        results: {
          successCount: 0,
          errorCount: 0,
          results: []
        }
      })
    }

    // Send notifications
    const results = await notifyDriversBatch(notifications)
    
    // Log the notification attempt
    console.log(`Driver notifications sent: ${results.successCount} successful, ${results.errorCount} failed`)

    return NextResponse.json({
      success: results.success,
      message: `Notifications sent: ${results.successCount} successful, ${results.errorCount} failed`,
      results
    })

  } catch (error) {
    console.error('Error in notify-drivers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}