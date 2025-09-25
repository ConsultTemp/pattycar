import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import { addBookingToGoogleSheets, GoogleSheetsBookingData } from '@/lib/google-sheets'

// Helper function to clean vehicle names (same as webhook)
function cleanVehicleName(vehicleName: string): string {
  if (!vehicleName) return vehicleName
  
  // Remove "olympic-" if present
  let cleanName = vehicleName.replace(/^olympic-/i, '')
  
  // Convert remaining dashes to spaces
  cleanName = cleanName.replace(/-/g, ' ')
  
  // Capitalize first letter
  cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
  
  return cleanName
}

// Function to create detailed Meet & Greet description (same as webhook)
function createMeetGreetDescription(config: any): string {
  if (!config) return ""
  
  const parts = []
  
  // Service
  if (config.selectedService) {
    parts.push(`Service: ${config.selectedService}`)
  }
  if (config.serviceId) {
    parts.push(`Location: ${config.serviceId}`)
  }
  
  // Passengers
  const totalPax = (config.passengers || 0) + (config.children || 0) + (config.infants || 0)
  if (totalPax > 0) {
    const paxDetails = []
    if (config.passengers > 0) paxDetails.push(`${config.passengers} adults`)
    if (config.children > 0) paxDetails.push(`${config.children} children`)
    if (config.infants > 0) paxDetails.push(`${config.infants} infants`)
    parts.push(`Passengers: ${paxDetails.join(', ')} (Total: ${totalPax})`)
  }
  
  // Extra services
  if (config.extraLuggage > 0) {
    parts.push(`Extra luggage: ${config.extraLuggage}`)
  }
  if (config.extraHours > 0) {
    parts.push(`Extra hours: ${config.extraHours}`)
  }
  
  // Special services
  if (config.specialServices) {
    const specials = []
    if (config.specialServices.fastTrack) specials.push("Fast Track")
    if (config.specialServices.vipLounge) specials.push("VIP Lounge")
    if (config.specialServices.veniceCombo) specials.push("Venice Combo (Fast Track + VIP)")
    if (config.specialServices.greeterOnly) specials.push("Greeter Only")
    
    if (specials.length > 0) {
      parts.push(`Special services: ${specials.join(', ')}`)
    }
  }
  
  return parts.join(' | ')
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    // Validate required fields
    const requiredFields = [
      'customer_name',
      'customer_email',
      'customer_phone',
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
      
      // Customer info
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      customer_phone_prefix: body.customer_phone_prefix || '+39',
      
      // Service details
      service_type: body.service_type,
      service_date: body.service_date,
      service_time: body.service_time,
      service_end_time: body.service_end_time || null,
      
      // Route
      pickup_address: body.pickup_address,
      destination_address: body.destination_address,
      
      // Vehicle configuration
      vehicle_type: body.vehicle_type,
      vehicle_count: body.vehicle_count || 1,
      passengers: body.passengers || 1,
      luggage: body.luggage || 0,
      
      // Options
      meet_and_greet: body.meet_and_greet || false,
      meet_greet_config: body.meet_greet_config || null,
      
      // Meet & Greet detailed fields (for dashboard display)
      meet_greet_passengers: body.meet_greet_config?.passengers || 0,
      meet_greet_children: body.meet_greet_config?.children || 0,
      meet_greet_infants: body.meet_greet_config?.infants || 0,
      meet_greet_extra_luggage: body.meet_greet_config?.extraLuggage || 0,
      meet_greet_extra_hours: body.meet_greet_config?.extraHours || 0,
      meet_greet_special_services: body.meet_greet_config?.specialServices || null,
      
      flight_info: body.flight_info || null,
      departure_city: body.departure_city || null,
      notes: body.notes || null,
      billing_info: body.billing_info || null,
      
      // Pricing - amount is already IVA included
      amount_total: body.amount_total, // Already includes VAT, no need to add more
      currency: 'EUR',
      vat_rate: '10', // Default VAT rate
      payment_status: body.payment_status || 'paid',
      
      // Required Stripe field - use admin booking identifier
      stripe_session_id: `admin_booking_${randomUUID()}`,
      
      // Individual vehicles for multiple vehicle bookings
      individual_vehicles: body.individual_vehicles || null,
      
      // Audit fields
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

    console.log('✅ Booking saved to database with ID:', data[0]?.id)

    // Add to Google Sheets (same logic as webhook)
    try {
      console.log('📊 Starting Google Sheets integration...')
      
      const insertedBooking = data[0]
      
      // Parse individual vehicles if present
      let parsedIndividualVehicles: Array<{ id: string; type: string; passengers: number; luggage: number }> = []
      if (body.individual_vehicles && Array.isArray(body.individual_vehicles)) {
        parsedIndividualVehicles = body.individual_vehicles.map((vehicle: any) => ({
          ...vehicle,
          type: cleanVehicleName(vehicle.type)
        }))
      }

      // Parse Meet & Greet config if present
      let parsedMeetGreetConfig: any = null
      if (body.meet_greet_config) {
        parsedMeetGreetConfig = body.meet_greet_config
      }

      // Calculate taxable amount and VAT from total
      const totalWithVat = body.amount_total / 100 // Convert from cents to euros - THIS IS IVA INCLUDED
      const vatRateNum = parseFloat(bookingData.vat_rate) || 10 // Default 10% VAT
      
      // For admin bookings, the price entered is IVA INCLUDED
      // CALCOLO CORRETTO: Con IVA 10%, il totale è diviso per 11
      // 10/11 è l'imponibile, 1/11 è l'IVA
      const taxableAmount = totalWithVat * (10 / 11) // 10 undicesimi del totale
      const vatAmount = totalWithVat * (1 / 11) // 1 undicesimo del totale

      // Format date for Google Sheets (DD/MM/YYYY format)
      const formattedDateForSheets = (() => {
        try {
          if (body.service_date) {
            const dateObj = new Date(body.service_date)
            if (!isNaN(dateObj.getTime())) {
              const day = String(dateObj.getDate()).padStart(2, '0')
              const month = String(dateObj.getMonth() + 1).padStart(2, '0')
              const year = dateObj.getFullYear()
              return `${day}/${month}/${year}`
            }
          }
          return body.service_date || 'Non specificata'
        } catch (e) {
          return body.service_date || 'Non specificata'
        }
      })()

      // Format time for Google Sheets (HH:MM format)
      const formattedTimeForSheets = body.service_time || 'Non specificato'

      // Determine if multiple vehicles
      const hasIndividualVehicles = parsedIndividualVehicles.length > 0
      const isMultipleVehicles = (body.vehicle_count || 1) > 1
      const isDisposizione = body.service_type === "disposizione" || body.service_type === "ceremony-disposition"

      // Create detailed passenger info including vehicle configuration
      const passengersInfoForSheets = (() => {
        if (hasIndividualVehicles) {
          const vehicleDetails = parsedIndividualVehicles.map((vehicle, index) => 
            `V${index + 1}: ${vehicle.passengers}pax/${vehicle.luggage}bag (${cleanVehicleName(vehicle.type)})`
          ).join(', ')
          return `${body.passengers} pax totali - ${vehicleDetails}`
        } else if (isMultipleVehicles) {
          return `${body.passengers} pax - ${body.vehicle_count} veicoli (${cleanVehicleName(body.vehicle_type)})`
        } else {
          return `${body.passengers} pax`
        }
      })()

      // Create comprehensive notes including all booking details
      const comprehensiveNotes = (() => {
        const noteParts = []
        
        // Original notes
        if (body.notes) {
          noteParts.push(`Note: ${body.notes}`)
        }
        
        // Service type
        noteParts.push(`Creato da: Admin`)
        
        // Flight/train info
        if (body.flight_info) {
          noteParts.push(`Volo/Treno: ${body.flight_info}`)
        }
        if (body.departure_city) {
          noteParts.push(`Provenienza: ${body.departure_city}`)
        }
        
        // Meet & Greet - DETAILED VERSION
        if (body.meet_and_greet && parsedMeetGreetConfig) {
          const mgParts = []
          
          // Passengers breakdown
          const totalPax = (parsedMeetGreetConfig.passengers || 0) + (parsedMeetGreetConfig.children || 0) + (parsedMeetGreetConfig.infants || 0)
          if (totalPax > 0) {
            const paxDetails = []
            if (parsedMeetGreetConfig.passengers > 0) paxDetails.push(`${parsedMeetGreetConfig.passengers} adults`)
            if (parsedMeetGreetConfig.children > 0) paxDetails.push(`${parsedMeetGreetConfig.children} children`)
            if (parsedMeetGreetConfig.infants > 0) paxDetails.push(`${parsedMeetGreetConfig.infants} infants`)
            mgParts.push(`Passengers: ${paxDetails.join(', ')} (Total: ${totalPax})`)
          }
          
          // Extra services
          if (parsedMeetGreetConfig.extraLuggage > 0) {
            mgParts.push(`Extra luggage: ${parsedMeetGreetConfig.extraLuggage}`)
          }
          if (parsedMeetGreetConfig.extraHours > 0) {
            mgParts.push(`Extra hours: ${parsedMeetGreetConfig.extraHours}`)
          }
          
          // Special services
          if (parsedMeetGreetConfig.specialServices) {
            const specials = []
            if (parsedMeetGreetConfig.specialServices.fastTrack) specials.push("Fast Track")
            if (parsedMeetGreetConfig.specialServices.vipLounge) specials.push("VIP Lounge")
            if (parsedMeetGreetConfig.specialServices.greeterOnly) specials.push("Greeter Only")
            
            if (specials.length > 0) {
              mgParts.push(`Special services: ${specials.join(', ')}`)
            }
          }
          
          if (mgParts.length > 0) {
            noteParts.push(`Meet & Greet: ${mgParts.join(' | ')}`)
          } else {
            noteParts.push('Meet & Greet incluso')
          }
        } else if (body.meet_and_greet) {
          noteParts.push('Meet & Greet incluso')
        }
        
        // Multiple vehicles details - ENHANCED VERSION
        if (hasIndividualVehicles && parsedIndividualVehicles.length > 1) {
          const vehicleDetails = parsedIndividualVehicles.map((vehicle, index) => 
            `V${index + 1}: ${vehicle.type} (${vehicle.passengers}pax, ${vehicle.luggage}bag)`
          ).join(' | ')
          noteParts.push(`Veicoli multipli: ${vehicleDetails}`)
        }
        
        // Service duration for disposizione
        if (body.service_end_time && isDisposizione) {
          noteParts.push(`Fine servizio: ${body.service_end_time}`)
        }
        
        // Billing info
        if (body.billing_info) {
          noteParts.push(`Fatturazione: ${body.billing_info.replace(/\n/g, ' | ')}`)
        }
        
        // Payment info
        noteParts.push(`Pagato: €${totalWithVat.toFixed(2)} (Admin - Netto €${taxableAmount.toFixed(2)} + IVA €${vatAmount.toFixed(2)})`)
        
        return noteParts.join(' | ')
      })()

      const googleSheetsData: GoogleSheetsBookingData = {
        // Main data matching CSV structure
        service_date: formattedDateForSheets,
        company: 'Patty Car', // Default company name
        service_time: formattedTimeForSheets,
        customer_name: body.customer_name,
        passengers_info: passengersInfoForSheets,
        pickup_address: body.pickup_address,
        destination_address: body.destination_address,
        vehicle_type: hasIndividualVehicles ? `${parsedIndividualVehicles.length} veicoli misti` : cleanVehicleName(body.vehicle_type),
        taxable_amount: Math.round(taxableAmount * 100) / 100, // Round to 2 decimals
        vat_amount: Math.round(vatAmount * 100) / 100,
        total_invoice: totalWithVat,
        driver_name: '', // Empty - to be filled manually
        driver_billing: '', // Empty - to be filled manually
        driver_commission: '', // Empty - to be filled manually
        direct_collection: totalWithVat, // Full amount as direct collection
        payment_method: 'admin', // Payment was made by admin
        notes: comprehensiveNotes,
        
        // Additional fields for internal use
        id: insertedBooking.id,
        customer_email: body.customer_email,
        customer_phone: `${body.customer_phone_prefix || ''} ${body.customer_phone || ''}`.trim(),
        amount_total: body.amount_total,
        payment_status: 'paid'
      }

      console.log('📊 Sending admin booking to Google Sheets:', {
        date: googleSheetsData.service_date,
        time: googleSheetsData.service_time,
        customer: googleSheetsData.customer_name,
        amount: totalWithVat,
        breakdown: `Netto €${taxableAmount.toFixed(2)} + IVA €${vatAmount.toFixed(2)} = €${totalWithVat.toFixed(2)}`
      })

      const googleSheetsResult = await addBookingToGoogleSheets(googleSheetsData)
      
      if (googleSheetsResult && googleSheetsResult.success) {
        console.log('✅ Successfully added admin booking to Google Sheets')
      } else {
        console.error('❌ Failed to add admin booking to Google Sheets:', googleSheetsResult?.error || 'Unknown error')
      }
      
    } catch (sheetsError) {
      console.error('❌ Error sending admin booking to Google Sheets:', sheetsError)
      // Don't fail the API call - Google Sheets is not critical
      console.log('⚠️ Continuing API response despite Google Sheets error')
    }

    return NextResponse.json({
      success: true,
      booking: data[0]
    })

  } catch (error) {
    console.error('Error in admin bookings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const url = new URL(request.url)
    const bookingId = url.searchParams.get('id')

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing booking ID' },
        { status: 400 }
      )
    }

    console.log('🗑️ Deleting booking with ID:', bookingId)

    // First check if booking exists
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, customer_name, service_date, service_time')
      .eq('id', bookingId)
      .single()

    if (fetchError) {
      console.error('Error fetching booking:', fetchError)
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Delete the booking
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId)

    if (deleteError) {
      console.error('Error deleting booking:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete booking' },
        { status: 500 }
      )
    }

    console.log('✅ Successfully deleted booking:', {
      id: bookingId,
      customer: existingBooking.customer_name,
      date: existingBooking.service_date,
      time: existingBooking.service_time
    })

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully',
      deletedBooking: existingBooking
    })

  } catch (error) {
    console.error('Error in delete booking API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
