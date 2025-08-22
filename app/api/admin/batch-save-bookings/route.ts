import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-server'
import { randomUUID } from 'crypto'

interface BatchBookingRequest {
  updates: Array<{
    id: string
    [key: string]: any
  }>
  creates: Array<{
    [key: string]: any
  }>
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json() as BatchBookingRequest

    // Get the authenticated user
    const authenticatedUser = await getAuthenticatedUser()
    const currentUserId = authenticatedUser?.id || null

    const results = {
      updates: [],
      creates: [],
      errors: []
    }

    // Process updates in a transaction
    if (body.updates && body.updates.length > 0) {
      for (const updateData of body.updates) {
        try {
          const { id, ...bookingUpdateData } = updateData

          if (!id) {
            results.errors.push({ type: 'update', error: 'Missing booking ID', data: updateData })
            continue
          }

          // Prepare update data
          const finalUpdateData = {
            ...bookingUpdateData,
            updated_at: new Date().toISOString(),
            modified_by: currentUserId
          }

          // Remove undefined values
          Object.keys(finalUpdateData).forEach(key => {
            if (finalUpdateData[key] === undefined) {
              delete finalUpdateData[key]
            }
          })

          const { data, error } = await supabase
            .from('bookings')
            .update(finalUpdateData)
            .eq('id', id)
            .select()

          if (error) {
            console.error('Error updating booking:', error)
            results.errors.push({ type: 'update', error: error.message, data: updateData })
          } else if (data.length === 0) {
            results.errors.push({ type: 'update', error: 'Booking not found', data: updateData })
          } else {
            results.updates.push(data[0])
          }
        } catch (error) {
          console.error('Error processing update:', error)
          results.errors.push({ 
            type: 'update', 
            error: error instanceof Error ? error.message : 'Unknown error', 
            data: updateData 
          })
        }
      }
    }

    // Process creates
    if (body.creates && body.creates.length > 0) {
      for (const createData of body.creates) {
        try {
          // Validate required fields for new booking
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

          const missingFields = requiredFields.filter(field => !createData[field])
          if (missingFields.length > 0) {
            results.errors.push({ 
              type: 'create', 
              error: `Missing required fields: ${missingFields.join(', ')}`, 
              data: createData 
            })
            continue
          }

          // Create booking data
          const bookingData = {
            id: randomUUID(),
            stripe_session_id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            payment_intent_id: null,
            amount_total: createData.amount_total,
            currency: createData.currency || 'EUR',
            payment_status: 'paid',
            invoice_url: null,
            
            // Customer info
            customer_name: createData.customer_name,
            customer_email: createData.customer_email,
            customer_phone: createData.customer_phone || null,
            customer_phone_prefix: createData.customer_phone_prefix || null,
            
            // Service info
            service_type: createData.service_type,
            service_label: createData.service_label || createData.service_type,
            service_icon: createData.service_icon || null,
            service_badge: createData.service_badge || null,
            
            // Journey info
            pickup_address: createData.pickup_address,
            pickup_location_id: createData.pickup_location_id || null,
            pickup_is_custom: createData.pickup_is_custom || false,
            destination_address: createData.destination_address,
            destination_location_id: createData.destination_location_id || null,
            destination_is_custom: createData.destination_is_custom || false,
            
            // Date & Time
            service_date: createData.service_date,
            service_time: createData.service_time,
            service_end_time: createData.service_end_time || null,
            service_duration: createData.service_duration || null,
            
            // Vehicle configuration
            vehicle_type: createData.vehicle_type,
            vehicle_count: createData.vehicle_count || 1,
            passengers: createData.passengers,
            luggage: createData.luggage || 0,
            same_vehicle_type: createData.same_vehicle_type || true,
            individual_vehicles: createData.individual_vehicles || null,
            
            // Options
            meet_and_greet: createData.meet_and_greet || false,
            meet_greet_config: createData.meet_greet_config || null,
            flight_info: createData.flight_info || null,
            departure_city: createData.departure_city || null,
            notes: createData.notes || null,
            billing_info: createData.billing_info || null,
            
            // Pricing
            distance: createData.distance || null,
            duration: createData.duration || null,
            transfer_cost: createData.transfer_cost || null,
            transfer_route: createData.transfer_route || null,
            event_route: createData.event_route || null,
            night_surcharge: createData.night_surcharge || null,
            vat_rate: createData.vat_rate || '22',
            price_breakdown: createData.price_breakdown || null,
            
            // Olympic/Event pricing
            is_olympic_pricing: createData.is_olympic_pricing || false,
            
            // Metadata
            raw_metadata: createData.raw_metadata || null,
            
            // Driver and customer assignment
            driver_id: createData.driver_id || null,
            customer_id: createData.customer_id || null,
            
            // New spreadsheet fields (will be null if DB not updated yet)
            committente: createData.committente || null,
            passenger_details: createData.passenger_details || null,
            vehicle_details: createData.vehicle_details || null,
            net_amount: createData.net_amount || null,
            vat_amount: createData.vat_amount || null,
            driver_billing: createData.driver_billing || null,
            driver_commission: createData.driver_commission || null,
            direct_collection: createData.direct_collection || null,
            payment_method: createData.payment_method || null,
            license_plate: createData.license_plate || null,
            
            // Audit fields
            created_by: currentUserId,
            modified_by: currentUserId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const { data, error } = await supabase
            .from('bookings')
            .insert([bookingData])
            .select()

          if (error) {
            console.error('Error creating booking:', error)
            results.errors.push({ type: 'create', error: error.message, data: createData })
          } else {
            results.creates.push(data[0])
          }
        } catch (error) {
          console.error('Error processing create:', error)
          results.errors.push({ 
            type: 'create', 
            error: error instanceof Error ? error.message : 'Unknown error', 
            data: createData 
          })
        }
      }
    }

    // Return comprehensive results
    const totalOperations = results.updates.length + results.creates.length
    const totalErrors = results.errors.length

    if (totalErrors > 0 && totalOperations === 0) {
      return NextResponse.json({
        success: false,
        error: 'All operations failed',
        results
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      results: {
        updated: results.updates.length,
        created: results.creates.length,
        errors: totalErrors,
        details: results
      }
    })

  } catch (error) {
    console.error('Error in batch-save-bookings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}