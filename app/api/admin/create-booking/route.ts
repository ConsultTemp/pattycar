import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    // Validate required fields
    const requiredFields = [
      'customer_name',
      'customer_email',
      'service_type',
      'pickup_address',
      'destination_address',
      'service_date',
      'service_time',
      'vehicle_type',
      'passengers',
      'amount_total'
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Create booking record
    const bookingData = {
      id: randomUUID(),
      stripe_session_id: `admin_${Date.now()}`,
      payment_intent_id: null,
      amount_total: body.amount_total,
      currency: body.currency || 'EUR',
      payment_status: 'paid',
      invoice_url: null,
      
      // Customer info
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone || null,
      customer_phone_prefix: body.customer_phone_prefix || null,
      
      // Service info
      service_type: body.service_type,
      service_label: body.service_label || null,
      service_icon: body.service_icon || null,
      service_badge: body.service_badge || null,
      
      // Journey info
      pickup_address: body.pickup_address,
      pickup_location_id: body.pickup_location_id || null,
      pickup_is_custom: body.pickup_is_custom || false,
      destination_address: body.destination_address,
      destination_location_id: body.destination_location_id || null,
      destination_is_custom: body.destination_is_custom || false,
      
      // Date & Time
      service_date: body.service_date,
      service_time: body.service_time,
      service_end_time: body.service_end_time || null,
      service_duration: body.service_duration || null,
      
      // Vehicle configuration
      vehicle_type: body.vehicle_type,
      vehicle_count: body.vehicle_count || 1,
      passengers: body.passengers,
      luggage: body.luggage || 0,
      same_vehicle_type: body.same_vehicle_type || true,
      individual_vehicles: body.individual_vehicles || null,
      
      // Options
      meet_and_greet: body.meet_and_greet || false,
      meet_greet_config: body.meet_greet_config || null,
      flight_info: body.flight_info || null,
      departure_city: body.departure_city || null,
      notes: body.notes || null,
      billing_info: body.billing_info || null,
      
      // Pricing
      distance: body.distance || null,
      duration: body.duration || null,
      transfer_cost: body.transfer_cost || null,
      transfer_route: body.transfer_route || null,
      event_route: body.event_route || null,
      night_surcharge: body.night_surcharge || null,
      vat_rate: body.vat_rate || '22',
      price_breakdown: body.price_breakdown || null,
      
      // Olympic/Event pricing
      is_olympic_pricing: body.is_olympic_pricing || false,
      
      // Metadata
      raw_metadata: body.raw_metadata || null,
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()

    if (error) {
      console.error('Error creating booking:', error)
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      booking: data[0]
    })

  } catch (error) {
    console.error('Error in create-booking API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 