import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { Resend } from "resend"
import { insertBooking } from "@/lib/database"
import { addBookingToGoogleSheets, GoogleSheetsBookingData } from "@/lib/google-sheets"

// Inizializza Stripe con la chiave segreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
})

// Inizializza Resend con la chiave API
const resend = new Resend(process.env.RESEND_API_KEY!)

// Funzione per convertire dal formato 24h al 12h con AM/PM
function convertTo12Hour(time24: string): string {
  if (!time24 || time24 === "Non specificato") return "Non specificato"
  
  try {
    const [hours, minutes] = time24.split(':')
    const hour24 = parseInt(hours)
    const min = minutes || "00"
    
    if (hour24 === 0) return `12:${min} AM`
    if (hour24 < 12) return `${hour24}:${min} AM`
    if (hour24 === 12) return `12:${min} PM`
    return `${hour24 - 12}:${min} PM`
  } catch (error) {
    return time24
  }
}

// Funzione per formattare l'orario in modo più elegante
function formatTime(time: string): string {
  if (time === "Non specificato" || !time) return "Non specificato"

  // Se è già in formato HH:MM, convertilo al formato 12h con AM/PM
  if (time.match(/^\d{1,2}:\d{2}$/)) {
    return convertTo12Hour(time)
  }

  return time
}

// Funzione per formattare la data in modo più elegante
function formatDate(date: string): string {
  if (date === "Non specificata" || !date) return "Non specificata"

  try {
    // Prova a parsare e formattare la data
    const dateObj = new Date(date)
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString("it-IT", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
  } catch (e) {
    // Se non riesce a parsare, ritorna la data originale
  }

  return date
}

export async function POST(req: NextRequest) {
  console.log('🔵 Stripe webhook received')
  try {
    // Leggi il raw body come buffer
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")
    console.log('🔐 Signature present:', !!signature)
    console.log('🔑 Secret exists:', !!process.env.STRIPE_WEBHOOK_SECRET)

    if (!signature) {
      console.log('❌ Missing signature')
      return NextResponse.json({ error: "Stripe signature mancante" }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      console.log('🔍 Verifying signature...')
      console.log('🔑 Secret:', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 20) + '...')
      console.log('🔐 Signature:', signature?.substring(0, 50) + '...')
      // Verifica la firma del webhook con la chiave segreta
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
      console.log('✅ Signature verified, event:', event.type)
    } catch (err) {
      console.log('❌ Signature verification failed:', err)
      console.log('🔑 Full secret:', process.env.STRIPE_WEBHOOK_SECRET)
      console.log('🔐 Full signature:', signature)
      return NextResponse.json({ error: "Firma webhook non valida" }, { status: 400 })
    }

    // Gestisci solo l'evento checkout.session.completed
    if (event.type === "checkout.session.completed") {
      console.log('🎯 Processing checkout.session.completed event')
      const session = event.data.object as Stripe.Checkout.Session
      console.log('💳 Session ID:', session.id)
      console.log('💰 Amount total:', session.amount_total)

      // Estrai i dati del cliente
      const customerEmail = session.customer_details?.email
      const customerName = session.customer_details?.name || "Cliente"
      console.log('👤 Customer email:', customerEmail)
      console.log('👤 Customer name:', customerName)

      if (!customerEmail) {
        console.log('❌ Missing customer email')
        return NextResponse.json({ error: "Email cliente mancante" }, { status: 400 })
      }

      // Estrai i metadata della prenotazione
      const metadata = session.metadata || {}
      console.log('📋 Metadata keys:', Object.keys(metadata))
      console.log('📋 Metadata count:', Object.keys(metadata).length)
      
      const {
        serviceType = "transfer",
        pickup = "Non specificato",
        destination = "Non specificato",
        passengers = "1",
        luggage = "0",
        vehicleType = "Non specificato",
        vehicleCount = "1",
        date = "Non specificata",
        time = "Non specificato",
        minutes = "00",
        timeAmPm = "AM",
        endTime = "",
        endMinutes = "00",
        endTimeAmPm = "AM",
        serviceDuration = "",
        phonePrefix = "",
        phoneNumber = "",
        notes = "Nessuna nota",
        flight = "",
        departureCity = "",
        meetAndGreet = "false",
        meetGreetConfig = "",
        billingInfo = "",
        distance = "",
        duration = "",
        priceBreakdown = "",
        sameVehicleType = "true",
        individualVehicles = "",
        pickupLocationId = "",
        destinationLocationId = "",
        pickupIsCustom = "false",
        destinationIsCustom = "false",
        transferCost = "",
        transferRoute = "",
        eventRoute = "",
        isOlympicPricing = "false",
        nightSurcharge = "",
        vatRate = "10",
      } = metadata

      // Parsa i veicoli individuali se presenti
      let parsedIndividualVehicles: Array<{ id: string; type: string; passengers: number; luggage: number }> = []
      if (individualVehicles && individualVehicles !== "") {
        try {
          parsedIndividualVehicles = JSON.parse(individualVehicles)
          } catch (error) {
          }
      }

      // Parsa la configurazione Meet & Greet se presente
      let parsedMeetGreetConfig: any = null
      if (meetGreetConfig && meetGreetConfig !== "") {
        try {
          parsedMeetGreetConfig = JSON.parse(meetGreetConfig)
          } catch (error) {
          }
      }

      // 🔍 DEBUG: Controlla i valori del telefono
      // Combina prefisso e numero di telefono (migliorata la logica)
      let phone = "Not specified"
      if (phonePrefix || phoneNumber) {
        if (phonePrefix && phoneNumber) {
          phone = `${phonePrefix} ${phoneNumber}`
        } else if (phonePrefix) {
          phone = phonePrefix
        } else if (phoneNumber) {
          phone = phoneNumber
        }
      }
      
      // Determina se mostare i veicoli individuali o la configurazione unica
      const hasIndividualVehicles = parsedIndividualVehicles.length > 0
      const isMultipleVehicles = parseInt(vehicleCount) > 1

      // 🔍 DEBUG: Controlla se esiste una fattura
      // Recupera l'invoice URL se disponibile
      let invoiceUrl = ""
      let paymentIntentId = ""

      if (session.invoice) {
        try {
          const invoice = await stripe.invoices.retrieve(session.invoice as string)
          invoiceUrl = invoice.hosted_invoice_url || ""
        } catch (err) {
          }
      } else {
        }

      // Recupera il Payment Intent per altre info
      if (session.payment_intent) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string)
          paymentIntentId = paymentIntent.id
          } catch (err) {
          }
      }

      // Formatta data e ora
      const formattedDate = formatDate(date)
      const formattedTime = formatTime(time)
      const formattedEndTime = endTime ? formatTime(endTime) : ""
      
      // Determina il tipo di servizio e le etichette appropriate
      const isDisposizione = serviceType === "disposizione" || serviceType === "ceremony-disposition"
      const isCeremony = serviceType === "ceremony-disposition"
      const isOlympic = isOlympicPricing === "true"
      const isInterCluster = serviceType === "inter-cluster"
      const isAltriServizi = serviceType === "altri-servizi"
      
      // Determina l'etichetta del servizio
      let serviceLabel = "Transfer"
      let serviceIcon = ""
      let serviceBadge = ""
      
      if (isCeremony) {
        serviceLabel = "Disposizione Cerimonia"
        serviceIcon = ""
        serviceBadge = "CERIMONIA"
      } else if (isDisposizione) {
        serviceLabel = "Disposizione"
        serviceIcon = ""
        serviceBadge = isOlympic ? "EVENTI INVERNALI" : ""
      } else if (isInterCluster) {
        serviceLabel = "Transfer between cities"
        serviceIcon = ""
        serviceBadge = "EVENTI INVERNALI"
      } else if (isAltriServizi) {
        serviceLabel = "Altri Servizi"
        serviceIcon = ""
        serviceBadge = "EVENTI INVERNALI"
      } else {
        serviceLabel = "Transfer"
        serviceIcon = ""
        serviceBadge = isOlympic ? "EVENTI INVERNALI" : ""
      }

      // 💾 SALVA NEL DATABASE SUPABASE
      console.log('💾 Saving booking to database...')
      try {
        const bookingData = {
          // Stripe/Payment info
          stripe_session_id: session.id,
          payment_intent_id: paymentIntentId || null,
          amount_total: session.amount_total || 0,
          currency: session.currency || "eur",
          payment_status: "paid",
          invoice_url: invoiceUrl || null,
          
          // Customer info
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: phoneNumber || null,
          customer_phone_prefix: phonePrefix || null,
          
          // Service info
          service_type: serviceType,
          service_label: serviceLabel,
          service_icon: serviceIcon,
          service_badge: serviceBadge || null,
          
          // Journey info
          pickup_address: pickup,
          pickup_location_id: pickupLocationId || null,
          pickup_is_custom: pickupIsCustom === "true",
          destination_address: destination,
          destination_location_id: destinationLocationId || null,
          destination_is_custom: destinationIsCustom === "true",
          
          // Date & Time
          service_date: date,
          service_time: time,
          service_end_time: endTime || null,
          service_duration: serviceDuration || null,
          
          // Vehicle configuration
          vehicle_type: vehicleType,
          vehicle_count: parseInt(vehicleCount) || 1,
          passengers: parseInt(passengers) || 1,
          luggage: parseInt(luggage) || 0,
          same_vehicle_type: sameVehicleType === "true",
          individual_vehicles: parsedIndividualVehicles.length > 0 ? parsedIndividualVehicles : null,
          
          // Options
          meet_and_greet: meetAndGreet === "true",
          meet_greet_config: parsedMeetGreetConfig || null,
          flight_info: flight || null,
          departure_city: departureCity || null,
          notes: notes !== "Nessuna nota" ? notes : null,
          billing_info: billingInfo || null,
          
          // Pricing
          distance: distance || null,
          duration: duration || null,
          transfer_cost: transferCost || null,
          transfer_route: transferRoute || null,
          event_route: eventRoute || null,
          night_surcharge: nightSurcharge || null,
          vat_rate: vatRate || null,
          price_breakdown: priceBreakdown || null,
          
          // Olympic/Event pricing
          is_olympic_pricing: isOlympic,
          
          // Metadata
          raw_metadata: metadata
        }
        
        console.log('📊 Booking data prepared:', {
          serviceType: bookingData.service_type,
          customerName: bookingData.customer_name,
          customerEmail: bookingData.customer_email,
          amountTotal: bookingData.amount_total,
          serviceDate: bookingData.service_date,
          serviceTime: bookingData.service_time
        })
        
        const insertResult = await insertBooking(bookingData)
        console.log('💾 Database insert result:', insertResult.success ? 'SUCCESS' : 'FAILED')
        
        if (insertResult.success) {
          console.log('✅ Booking saved to database with ID:', insertResult.data?.id)
          // Also send to Google Sheets - TEMPORARILY DISABLED
          
          try {
            console.log('📊 Starting Google Sheets integration...')
            
            // Set timeout for Google Sheets operation (max 10 seconds)
            const googleSheetsTimeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Google Sheets timeout')), 10000)
            )
            
            const googleSheetsOperation = (async () => {
            // Calculate taxable amount and VAT from total
            const totalAmount = insertResult.data!.amount_total / 100 // Convert from cents to euros
            const vatRateNum = parseFloat(vatRate) || 10 // Default 22% VAT
            const taxableAmount = totalAmount / (1 + vatRateNum / 100)
            const vatAmount = totalAmount - taxableAmount

            // Format date for Google Sheets (DD/MM/YYYY format)
            const formattedDateForSheets = (() => {
              try {
                if (insertResult.data!.service_date) {
                  const dateObj = new Date(insertResult.data!.service_date)
                  if (!isNaN(dateObj.getTime())) {
                    const day = String(dateObj.getDate()).padStart(2, '0')
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
                    const year = dateObj.getFullYear()
                    return `${day}/${month}/${year}`
                  }
                }
                return insertResult.data!.service_date || 'Non specificata'
              } catch (e) {
                return insertResult.data!.service_date || 'Non specificata'
              }
            })()

            // Format time for Google Sheets (HH:MM format)
            const formattedTimeForSheets = (() => {
              const timeStr = insertResult.data!.service_time || 'Non specificato'
              if (timeStr === 'Non specificato' || !timeStr) return 'Non specificato'
              
              // If it's already in HH:MM format, return as is
              if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
                return timeStr
              }
              
              return timeStr
            })()

            // Create detailed passenger info including vehicle configuration
            const passengersInfoForSheets = (() => {
              if (hasIndividualVehicles) {
                const vehicleDetails = parsedIndividualVehicles.map((vehicle, index) => 
                  `V${index + 1}: ${vehicle.passengers}pax/${vehicle.luggage}bag (${vehicle.type})`
                ).join(', ')
                return `${passengers} pax totali - ${vehicleDetails}`
              } else if (isMultipleVehicles) {
                return `${passengers} pax - ${vehicleCount} veicoli (${vehicleType})`
              } else {
                return `${passengers} pax`
              }
            })()

            // Create comprehensive notes including all booking details
            const comprehensiveNotes = (() => {
              const noteParts = []
              
              // Original notes
              if (insertResult.data!.notes && insertResult.data!.notes !== 'Nessuna nota') {
                noteParts.push(`Note: ${insertResult.data!.notes}`)
              }
              
              // Service type and special features
              if (serviceBadge) {
                noteParts.push(`Servizio: ${serviceBadge}`)
              }
              
              // Flight/train info
              if (flight) {
                noteParts.push(`Volo/Treno: ${flight}`)
              }
              if (departureCity) {
                noteParts.push(`Provenienza: ${departureCity}`)
              }
              
              // Meet & Greet
              if (meetAndGreet === "true") {
                noteParts.push('Meet & Greet incluso')
                if (parsedMeetGreetConfig) {
                  if (parsedMeetGreetConfig.selectedService) {
                    noteParts.push(`M&G: ${parsedMeetGreetConfig.selectedService}`)
                  }
                  if (parsedMeetGreetConfig.specialServices) {
                    const specialServices = Object.keys(parsedMeetGreetConfig.specialServices)
                      .filter(key => parsedMeetGreetConfig.specialServices[key])
                      .join(', ')
                    if (specialServices) {
                      noteParts.push(`Servizi speciali: ${specialServices}`)
                    }
                  }
                }
              }
              
              // Distance and duration for transfers
              if (distance && !isDisposizione) {
                noteParts.push(`Distanza: ${distance}`)
              }
              if (duration && !isDisposizione) {
                noteParts.push(`Durata: ${duration}`)
              }
              
              // Service duration for disposizione
              if (serviceDuration && isDisposizione) {
                noteParts.push(`Durata servizio: ${serviceDuration} ore`)
              }
              
              // End time for disposizione
              if (isDisposizione && formattedEndTime) {
                noteParts.push(`Fine servizio: ${formattedEndTime}`)
              }
              
              // Transfer cost and route
              if (transferCost && transferRoute) {
                noteParts.push(`Transfer incluso: €${transferCost} (${transferRoute})`)
              }
              
              // Event route
              if (eventRoute) {
                noteParts.push(`Percorso evento: ${eventRoute}`)
              }
              
              // Night surcharge
              if (nightSurcharge && parseFloat(nightSurcharge) > 0) {
                noteParts.push(`Supplemento notturno: €${nightSurcharge}`)
              }
              
              // Billing info
              if (billingInfo) {
                noteParts.push(`Fatturazione: ${billingInfo.replace(/\n/g, ' | ')}`)
              }
              
              // Phone number
              const phoneForNotes = `${insertResult.data!.customer_phone_prefix || ''} ${insertResult.data!.customer_phone || ''}`.trim()
              if (phoneForNotes && phoneForNotes !== 'null null') {
                noteParts.push(`Tel: ${phoneForNotes}`)
              }
              
              // Payment info
              noteParts.push(`Pagato online: €${totalAmount.toFixed(2)}`)
              if (priceBreakdown) {
                noteParts.push(`Dettaglio: ${priceBreakdown}`)
              }
              
              return noteParts.join(' | ')
            })()

            const googleSheetsData: GoogleSheetsBookingData = {
              // Main data matching CSV structure
              service_date: formattedDateForSheets,
              company: 'Patty Car', // Default company name
              service_time: formattedTimeForSheets,
              customer_name: insertResult.data!.customer_name,
              passengers_info: passengersInfoForSheets,
              pickup_address: insertResult.data!.pickup_address,
              destination_address: insertResult.data!.destination_address,
              vehicle_type: hasIndividualVehicles ? `${parsedIndividualVehicles.length} veicoli misti` : insertResult.data!.vehicle_type,
              taxable_amount: Math.round(taxableAmount * 100) / 100, // Round to 2 decimals
              vat_amount: Math.round(vatAmount * 100) / 100,
              total_invoice: totalAmount,
              driver_name: '', // Empty - to be filled manually
              driver_billing: '', // Empty - to be filled manually
              driver_commission: '', // Empty - to be filled manually
              direct_collection: totalAmount, // Full amount as direct collection
              payment_method: 'online', // Payment was made online
              notes: comprehensiveNotes,
              
              // Additional fields for internal use
              id: insertResult.data!.id,
              customer_email: insertResult.data!.customer_email,
              customer_phone: `${insertResult.data!.customer_phone_prefix || ''} ${insertResult.data!.customer_phone || ''}`.trim(),
              amount_total: insertResult.data!.amount_total,
              payment_status: insertResult.data!.payment_status
            }

            console.log('📊 Sending booking to Google Sheets:', {
              date: googleSheetsData.service_date,
              time: googleSheetsData.service_time,
              customer: googleSheetsData.customer_name,
              service: serviceLabel,
              amount: totalAmount
            })

            // Import Google Sheets function dynamically to reduce initial load
            const { addBookingToGoogleSheets } = await import('@/lib/google-sheets')
            const googleSheetsResult = await addBookingToGoogleSheets(googleSheetsData)
            
            return googleSheetsResult
            })()

            // Race between Google Sheets operation and timeout
            const result = await Promise.race([googleSheetsOperation, googleSheetsTimeout])
            
            if (result && typeof result === 'object' && 'success' in result) {
              if (result.success) {
                console.log('✅ Successfully added booking to Google Sheets')
              } else {
                console.error('❌ Failed to add booking to Google Sheets:', 'error' in result ? result.error : 'Unknown error')
              }
            }
            
          } catch (sheetsError) {
            if (sheetsError instanceof Error && sheetsError.message === 'Google Sheets timeout') {
              console.error('⏱️ Google Sheets operation timed out after 10 seconds')
            } else {
              console.error('❌ Error sending booking to Google Sheets:', sheetsError)
            }
            // Don't fail the webhook - Google Sheets is not critical
            console.log('⚠️ Continuing webhook processing despite Google Sheets error')
          }
          
        } else {
          console.log('❌ Database insert failed:', insertResult.error)
          // Continue with email sending even if database insert fails
        }
        
      } catch (dbError) {
        console.log('❌ Database error:', dbError)
        // Continue with email sending even if database insert fails
      }

      try {
        console.log('📧 Sending customer confirmation email...')
        // 📧 EMAIL AL CLIENTE - Conferma prenotazione completa
        const customerEmailResult = await resend.emails.send({
          from: process.env.RESEND_FROM!,
          to: customerEmail,
          subject: `✅ Booking Confirmed - ${serviceLabel} Patty Car${serviceBadge ? ` (${serviceBadge})` : ""}`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                  ${serviceIcon} Booking Confirmed
                </h1>
                <p style="color: #e3f2fd; margin: 10px 0 0 0; font-size: 16px;">
                  ${serviceLabel} successfully booked
                </p>
                ${serviceBadge ? `
                <div style="margin-top: 15px;">
                  <span style="background: rgba(255,255,255,0.2); color: #ffffff; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                    ${serviceBadge}
                  </span>
                </div>
                ` : ""}
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <p style="font-size: 18px; color: #333; margin: 0 0 30px 0; line-height: 1.6;">
                  Dear Customer,
                </p>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6; margin: 0 0 35px 0;">
                  Thank you for making a reservation through our website.<br>
                  We are pleased to confirm your ${serviceLabel.toLowerCase()} booking with Patty Car.
                </p>
                
                <!-- Service Type Badge -->
                <div style="text-align: center; margin: 25px 0;">
                  <span style="display: inline-block; background: ${
                    isCeremony 
                      ? "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"
                      : isDisposizione 
                        ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" 
                        : isInterCluster || isAltriServizi
                          ? "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)"
                          : "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  }; 
                             color: white; padding: 12px 24px; border-radius: 25px; font-weight: 600; font-size: 16px;">
                    ${serviceIcon} ${serviceLabel.toUpperCase()}
                  </span>
                  ${serviceBadge ? `
                  <div style="margin-top: 10px;">
                    <span style="background: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: 500;">
                      ${serviceBadge}
                    </span>
                  </div>
                  ` : ""}
                </div>
                
                <!-- Booking Summary -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0;">
                  <h2 style="color: #1e3c72; margin: 0 0 25px 0; font-size: 20px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
                    📄 Booking Summary
                  </h2>
                  
                  <div style="display: grid; gap: 15px;">
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #ef4444; font-size: 18px; margin-right: 12px;"></span>
                      <div>
                        <strong style="color: #374151;">Departure:</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${pickup}</span>
                        ${pickupIsCustom === "false" && pickupLocationId ? `
                        <span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 8px;">
                          📋 PRICELIST
                        </span>
                        ` : pickupIsCustom === "true" ? `
                        <span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 8px;">
                          ✏️ CUSTOM
                        </span>
                        ` : ""}
                      </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #10b981; font-size: 18px; margin-right: 12px;"></span>
                      <div>
                        <strong style="color: #374151;">${isDisposizione ? "Destination:" : "Arrival:"}</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${destination}</span>
                        ${destinationIsCustom === "false" && destinationLocationId ? `
                        <span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 8px;">
                          📋 PRICELIST
                        </span>
                        ` : destinationIsCustom === "true" ? `
                        <span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 8px;">
                          ✏️ CUSTOM
                        </span>
                        ` : ""}
                      </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #f59e0b; font-size: 18px; margin-right: 12px;">📅</span>
                      <div>
                        <strong style="color: #374151;">Date:</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${formattedDate}</span>
                      </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #8b5cf6; font-size: 18px; margin-right: 12px;">🕐</span>
                      <div>
                        <strong style="color: #374151;">${isDisposizione ? "Service start time:" : "Departure time:"}</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${formattedTime}</span>
                      </div>
                    </div>
                    
                    ${
                      isDisposizione && formattedEndTime
                        ? `
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #ef4444; font-size: 18px; margin-right: 12px;">🕐</span>
                      <div>
                        <strong style="color: #374151;">Service end time:</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${formattedEndTime}</span>
                      </div>
                    </div>
                    `
                        : ""
                    }
                    
                    ${
                      serviceDuration && isOlympic
                        ? `
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #7c3aed; font-size: 18px; margin-right: 12px;"></span>
                      <div>
                        <strong style="color: #374151;">Service duration:</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${serviceDuration} hours</span>
                        <span style="background: #ede9fe; color: #7c3aed; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 8px;">
                          🏅 EVENTI INVERNALI
                        </span>
                      </div>
                    </div>
                    `
                        : ""
                    }
                    
                    ${
                      distance && !isDisposizione
                        ? `
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #06b6d4; font-size: 18px; margin-right: 12px;"></span>
                      <div>
                        <strong style="color: #374151;">Distance:</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${distance}</span>
                      </div>
                    </div>
                    `
                        : ""
                    }
                    
                    ${
                      duration && !isDisposizione
                        ? `
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #84cc16; font-size: 18px; margin-right: 12px;"></span>
                      <div>
                        <strong style="color: #374151;">Estimated duration:</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${duration}</span>
                      </div>
                    </div>
                    `
                        : ""
                    }
                    
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #06b6d4; font-size: 18px; margin-right: 12px;"></span>
                      <div>
                        <strong style="color: #374151;">Passengers:</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${passengers}</span>
                      </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #84cc16; font-size: 18px; margin-right: 12px;">🧳</span>
                      <div>
                        <strong style="color: #374151;">Luggage:</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${luggage}</span>
                      </div>
                    </div>
                    
                    ${
                      hasIndividualVehicles
                        ? `
                    <!-- Individual Vehicles -->
                    <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 15px 0;">
                      <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 16px; font-weight: 600; display: flex; align-items: center;">
                        <span style="color: #ec4899; font-size: 18px; margin-right: 10px;">🚙</span>
                        Vehicle Configuration
                      </h4>
                      ${parsedIndividualVehicles
                        .map(
                          (vehicle, index) => `
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin-bottom: ${
                        index < parsedIndividualVehicles.length - 1 ? "10px" : "0px"
                      };">
                        <div style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">
                          Vehicle ${index + 1}
                        </div>
                        <div style="display: grid; gap: 8px; font-size: 14px;">
                          <div style="color: #374151;">
                            <strong>Type:</strong> <span style="color: #6b7280;">${vehicle.type}</span>
                          </div>
                          <div style="color: #374151;">
                            <strong>Passengers:</strong> <span style="color: #6b7280;">${vehicle.passengers}</span>
                          </div>
                          <div style="color: #374151;">
                            <strong>Luggage:</strong> <span style="color: #6b7280;">${vehicle.luggage}</span>
                          </div>
                        </div>
                      </div>
                      `,
                        )
                        .join("")}
                    </div>
                    `
                        : `
                    <!-- Single Vehicle Configuration -->
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #ec4899; font-size: 18px; margin-right: 12px;">🚙</span>
                      <div>
                        <strong style="color: #374151;">Vehicle:</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${vehicleType}</span>
                      </div>
                    </div>
                    
                    ${
                      isMultipleVehicles
                        ? `
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #f59e0b; font-size: 18px; margin-right: 12px;"></span>
                      <div>
                        <strong style="color: #374151;">Number of vehicles:</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${vehicleCount} (all same type)</span>
                      </div>
                    </div>
                    `
                        : ""
                    }
                    `
                    }
                    
                    ${
                      transferCost && transferRoute && isDisposizione
                        ? `
                    <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin-top: 15px;">
                      <div style="display: flex; align-items: center;">
                        <span style="color: #2563eb; font-size: 18px; margin-right: 12px;"></span>
                        <div>
                          <strong style="color: #1e40af;">Additional transfer included</strong>
                          <p style="color: #1e40af; margin: 5px 0 0 0; font-size: 14px;">Route: ${transferRoute}</p>
                          <p style="color: #1e40af; margin: 5px 0 0 0; font-size: 12px;">Transfer cost: €${transferCost}</p>
                        </div>
                      </div>
                    </div>
                    `
                        : ""
                    }
                    
                    ${
                      eventRoute
                        ? `
                    <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; margin-top: 15px;">
                      <div style="display: flex; align-items: center;">
                        <span style="color: #16a34a; font-size: 18px; margin-right: 12px;">🏁</span>
                        <div>
                          <strong style="color: #166534;">Special event route</strong>
                          <p style="color: #166534; margin: 5px 0 0 0; font-size: 14px;">${eventRoute}</p>
                        </div>
                      </div>
                    </div>
                    `
                        : ""
                    }
                    
                    ${
                      nightSurcharge && parseFloat(nightSurcharge) > 0
                        ? `
                    <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin-top: 15px;">
                      <div style="display: flex; align-items: center;">
                        <span style="color: #f59e0b; font-size: 18px; margin-right: 12px;">🌙</span>
                        <div>
                          <strong style="color: #92400e;">Night surcharge applied</strong>
                          <p style="color: #92400e; margin: 5px 0 0 0; font-size: 14px;">Service between 19:30 - 07:30: +€${nightSurcharge}</p>
                        </div>
                      </div>
                    </div>
                    `
                        : ""
                    }
                    
                    ${
                      meetAndGreet === "true" || parsedMeetGreetConfig
                        ? `
                    <div style="background: #dcfce7; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; margin-top: 15px;">
                      <div style="display: flex; align-items: center;">
                        <span style="color: #16a34a; font-size: 18px; margin-right: 12px;"></span>
                        <div>
                          <strong style="color: #166534;">Meet & Greet service included</strong>
                          ${parsedMeetGreetConfig ? `
                          <div style="margin-top: 8px; font-size: 13px; color: #166534;">
                            ${parsedMeetGreetConfig.selectedService ? `<p>Service: ${parsedMeetGreetConfig.selectedService}</p>` : ""}
                            ${parsedMeetGreetConfig.passengers > 0 ? `<p>Passengers: ${parsedMeetGreetConfig.passengers}</p>` : ""}
                            ${parsedMeetGreetConfig.children > 0 ? `<p>Children: ${parsedMeetGreetConfig.children}</p>` : ""}
                            ${parsedMeetGreetConfig.infants > 0 ? `<p>Infants: ${parsedMeetGreetConfig.infants}</p>` : ""}
                                                          ${parsedMeetGreetConfig.extraLuggage > 0 ? `<p>Extra luggage: ${parsedMeetGreetConfig.extraLuggage}</p>` : ""}
                                                          ${parsedMeetGreetConfig.extraHours > 0 ? `<p>Extra hours: ${parsedMeetGreetConfig.extraHours}</p>` : ""}
                            ${parsedMeetGreetConfig.specialServices ? `
                              ${parsedMeetGreetConfig.specialServices.tarmac ? `<p>TARMAC service included</p>` : ""}
                              ${parsedMeetGreetConfig.specialServices.fastTrack ? `<p>Fast Track included</p>` : ""}
                              ${parsedMeetGreetConfig.specialServices.vipLounge ? `<p>VIP Lounge included</p>` : ""}
                                                              ${parsedMeetGreetConfig.specialServices.veniceCombo ? `<p>Venice Combo (Fast Track + VIP) included</p>` : ""}
                                                              ${parsedMeetGreetConfig.specialServices.greeterOnly ? `<p>Greeter only (without Porter)</p>` : ""}
                            ` : ""}
                          </div>
                          ` : `
                          <p style="color: #166534; margin: 5px 0 0 0; font-size: 14px;">Our driver will wait for you with a personalized sign</p>
                          `}
                        </div>
                      </div>
                    </div>
                    `
                        : ""
                    }
                    
                    ${
                      flight || departureCity
                        ? `
                    <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin-top: 15px;">
                      <div style="display: flex; align-items: center;">
                        <span style="color: #2563eb; font-size: 18px; margin-right: 12px;"></span>
                        <div>
                          ${flight ? `<div style="color: #1e40af; margin-bottom: 5px;"><strong>Flight/Train number:</strong> ${flight}</div>` : ""}
                          ${departureCity ? `<div style="color: #1e40af; margin-bottom: 5px;"><strong>Departure city:</strong> ${departureCity}</div>` : ""}
                          <p style="color: #1e40af; margin: 5px 0 0 0; font-size: 14px;">We will monitor any flight delays</p>
                        </div>
                      </div>
                    </div>
                    `
                        : ""
                    }
                    
                    ${
                      notes !== "Nessuna nota" && notes
                        ? `
                    <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin-top: 15px;">
                      <div style="display: flex; align-items: flex-start;">
                        <span style="color: #f59e0b; font-size: 18px; margin-right: 12px;"></span>
                        <div>
                          <strong style="color: #92400e;">Additional notes:</strong>
                          <p style="color: #92400e; margin: 5px 0 0 0; line-height: 1.5;">${notes}</p>
                        </div>
                      </div>
                    </div>
                    `
                        : ""
                    }
                    
                    ${
                      billingInfo
                        ? `
                    <div style="background: #f3f4f6; border: 1px solid #9ca3af; border-radius: 8px; padding: 15px; margin-top: 15px;">
                      <div style="display: flex; align-items: flex-start;">
                        <span style="color: #6b7280; font-size: 18px; margin-right: 12px;">🧾</span>
                        <div>
                          <strong style="color: #374151;">Billing information:</strong>
                          <p style="color: #374151; margin: 5px 0 0 0; line-height: 1.5; white-space: pre-line;">${billingInfo}</p>
                        </div>
                      </div>
                    </div>
                    `
                        : ""
                    }
                  </div>
                </div>
                
                <!-- Payment Confirmation -->
                <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border: 1px solid #22c55e; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
                  <div style="color: #16a34a; font-size: 24px; margin-bottom: 10px;">✅</div>
                  <h3 style="color: #166534; margin: 0 0 10px 0; font-size: 18px;">Payment Confirmed</h3>
                  <p style="color: #166534; margin: 0; font-size: 24px; font-weight: 600;">
                    €${(session.amount_total! / 100).toFixed(2)}
                  </p>
                  ${vatRate ? `
                  <p style="color: #166534; margin: 5px 0 0 0; font-size: 12px;">
                    VAT ${vatRate}% included${isOlympic ? " (Olympic Rate)" : ""}
                  </p>
                  ` : ""}
                  ${
                    priceBreakdown
                      ? `
                  <p style="color: #166534; margin: 10px 0 0 0; font-size: 14px;">
                    ${priceBreakdown}
                  </p>
                  `
                      : ""
                  }
                </div>
                
                ${
                  invoiceUrl
                    ? `
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${invoiceUrl}" 
                     style="display: inline-block; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); 
                            color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; 
                            font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(30, 60, 114, 0.3);">
                    📄 View Invoice
                  </a>
                </div>
                `
                    : `
                <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                  <span style="color: #f59e0b; font-size: 20px;">📄</span>
                  <p style="color: #92400e; margin: 10px 0 0 0; font-weight: 500;">
                    The invoice will be sent separately in the next few hours
                  </p>
                </div>
                `
                }
                
                <!-- Next Steps -->
                <div style="background: #f1f5f9; border-radius: 12px; padding: 30px; margin: 35px 0;">
                  <h3 style="color: #1e3c72; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
                    Next Steps
                  </h3>
                  <ul style="color: #475569; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">We will contact you within <strong>24 hours</strong> to confirm all details</li>
                    <li style="margin-bottom: 8px;">You will receive a <strong>reminder SMS</strong> the day before the service</li>
                    <li>Our driver will contact you <strong>30 minutes before</strong> the agreed time</li>
                  </ul>
                </div>
                
                <!-- Cancellation Policy -->
                <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 12px; padding: 25px; margin: 30px 0;">
                  <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                    📌 Cancellation Policy
                  </h3>
                  <p style="color: #92400e; margin: 0; line-height: 1.6;">
                    Cancellations on or before 31 October 2025 shall be free of charge. Cancellations between 1 November 2025 and 5 January 2026: bookings may be adjusted, including changes in dates, times, and flights, a 50% cancellation fee shall apply for fully cancelled bookings. Cancellations after 5 January 2026: adjustments to bookings shall be subject to availability, a 100% cancellation fee shall apply for fully cancelled bookings.
                  </p>
                </div>
                
                <!-- Customer Support -->
                <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 12px; padding: 25px; margin: 30px 0;">
                  <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                    📬 Customer Support
                  </h3>
                  <p style="color: #1e40af; margin: 0; line-height: 1.6;">
                    Should you require any assistance, wish to make changes, or cancel your reservation, please do not hesitate to contact us at:<br>
                    gamestime@pattycar.com
                  </p>
                </div>
                
                <div style="text-align: center; margin: 40px 0 20px 0;">
                  <p style="color: #1e3c72; font-size: 18px; font-weight: 600; margin: 0;">
                    We sincerely thank you for choosing us and remain at your disposal for any further assistance.
                  </p>
                  <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">
                    Kind regards,<br>
                    The Patty Car Team
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
                <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.5;">
                  This is an automatic confirmation email. <br>
                  For assistance or changes, please contact our customer service.
                </p>
              </div>
            </div>
          `,
        })

        console.log('✅ Customer email sent successfully')

      } catch (customerEmailError) {
        console.log('❌ Customer email error:', customerEmailError)
        // Non fermare il processo, continua con l'email admin
      }

      try {
        console.log('📧 Sending admin notification email...')
        // 📧 EMAIL ALL'ADMIN - Versione completa con tutti i dettagli
        const adminEmailResult = await resend.emails.send({
          from: process.env.RESEND_FROM!,
          to: process.env.ADMIN_EMAIL!,
          subject: `🚗 Nuova Prenotazione ${serviceLabel.toUpperCase()}${serviceBadge ? ` (${serviceBadge})` : ""} - Pagamento Completato - ${customerName}`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                  ${serviceIcon} Nuova Prenotazione ${serviceLabel.toUpperCase()}
                </h1>
                ${serviceBadge ? `
                <div style="margin-top: 10px;">
                  <span style="background: rgba(255,255,255,0.2); color: #ffffff; padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: 600;">
                    ${serviceBadge}
                  </span>
                </div>
                ` : ""}
                <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 14px;">
                  Pagamento completato con successo
                </p>
              </div>
              
              <!-- Urgent Action Required -->
              <div style="background: #fef2f2; border: 2px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 25px 30px;">
                <div style="display: flex; align-items: center;">
                  <span style="color: #dc2626; font-size: 24px; margin-right: 15px;">⚡</span>
                  <div>
                    <h3 style="color: #dc2626; margin: 0 0 5px 0; font-size: 16px; font-weight: 600;">
                      AZIONE RICHIESTA
                    </h3>
                    <p style="color: #dc2626; margin: 0; font-size: 14px;">
                      Contatta il cliente entro 24 ore per confermare i dettagli del ${isDisposizione ? "servizio" : "viaggio"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div style="padding: 0 30px 30px 30px;">
                <!-- Customer Info -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 25px; margin: 25px 0;">
                  <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
                    👤 Informazioni Cliente
                  </h2>
                  <div style="display: grid; gap: 12px;">
                    <p style="margin: 0; color: #374151;">
                      <strong>Nome:</strong> <span style="color: #6b7280;">${customerName}</span>
                    </p>
                    <p style="margin: 0; color: #374151;">
                      <strong>Email:</strong> <span style="color: #6b7280;">${customerEmail}</span>
                    </p>
                    ${
                      phone !== "Non specificato"
                        ? `
                    <p style="margin: 0; color: #374151;">
                      <strong>Telefono:</strong> <span style="color: #6b7280; font-weight: 600;">${phone}</span>
                    </p>
                    `
                        : ""
                    }
                  </div>
                </div>
                
                <!-- Service Type Badge -->
                <div style="text-align: center; margin: 25px 0;">
                  <span style="display: inline-block; background: ${
                    isCeremony 
                      ? "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"
                      : isDisposizione 
                        ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" 
                        : isInterCluster || isAltriServizi
                          ? "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)"
                          : "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  }; 
                             color: white; padding: 12px 24px; border-radius: 25px; font-weight: 600; font-size: 16px;">
                    ${serviceIcon} ${serviceLabel.toUpperCase()}
                  </span>
                  ${serviceBadge ? `
                  <div style="margin-top: 10px;">
                    <span style="background: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: 500;">
                      ${serviceBadge}
                    </span>
                  </div>
                  ` : ""}
                </div>
                
                <!-- Trip Details -->
                <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 10px; padding: 25px; margin: 25px 0;">
                  <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; border-bottom: 2px solid #93c5fd; padding-bottom: 8px;">
                    📋 Dettagli ${isDisposizione ? "Disposizione" : "Transfer"}
                  </h2>
                  <div style="display: grid; gap: 12px;">
                    <p style="margin: 0; color: #1e40af;">
                      <strong>🚩 Partenza:</strong> <span style="color: #3730a3;">${pickup}</span>
                      ${pickupLocationId ? `<span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 8px; font-size: 10px; margin-left: 8px;">ID: ${pickupLocationId}</span>` : ""}
                      ${pickupIsCustom === "true" ? `<span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 8px; font-size: 10px; margin-left: 8px;">CUSTOM</span>` : ""}
                    </p>
                    <p style="margin: 0; color: #1e40af;">
                      <strong>${isDisposizione ? "Destinazione:" : "Arrivo:"}</strong> <span style="color: #3730a3;">${destination}</span>
                      ${destinationLocationId ? `<span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 8px; font-size: 10px; margin-left: 8px;">ID: ${destinationLocationId}</span>` : ""}
                      ${destinationIsCustom === "true" ? `<span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 8px; font-size: 10px; margin-left: 8px;">CUSTOM</span>` : ""}
                    </p>
                    <p style="margin: 0; color: #1e40af;">
                      <strong>📅 Data:</strong> <span style="color: #3730a3; font-weight: 600;">${formattedDate}</span>
                    </p>
                    <p style="margin: 0; color: #1e40af;">
                      <strong>${isDisposizione ? "Inizio:" : "Orario:"}</strong> <span style="color: #3730a3; font-weight: 600;">${formattedTime}</span>
                    </p>
                    ${
                      isDisposizione && formattedEndTime
                        ? `
                    <p style="margin: 0; color: #1e40af;">
                      <strong>Fine:</strong> <span style="color: #3730a3; font-weight: 600;">${formattedEndTime}</span>
                    </p>
                    `
                        : ""
                    }
                    ${
                      distance && !isDisposizione
                        ? `
                    <p style="margin: 0; color: #1e40af;">
                      <strong>Distanza:</strong> <span style="color: #3730a3;">${distance}</span>
                    </p>
                    `
                        : ""
                    }
                    ${
                      duration && !isDisposizione
                        ? `
                    <p style="margin: 0; color: #1e40af;">
                      <strong>Durata:</strong> <span style="color: #3730a3;">${duration}</span>
                    </p>
                    `
                        : ""
                    }
                    <p style="margin: 0; color: #1e40af;">
                      <strong>Passeggeri:</strong> <span style="color: #3730a3;">${passengers}</span>
                    </p>
                    <p style="margin: 0; color: #1e40af;">
                      <strong>Bagagli:</strong> <span style="color: #3730a3;">${luggage}</span>
                    </p>
                    ${
                      hasIndividualVehicles
                        ? `
                    <!-- Veicoli Individuali Admin -->
                    <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 15px; margin: 10px 0;">
                      <h4 style="color: #1e40af; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">
                        🚙 Configurazione Veicoli (${parsedIndividualVehicles.length} veicoli)
                      </h4>
                      ${parsedIndividualVehicles
                        .map(
                          (vehicle, index) => `
                      <div style="background: #ffffff; border: 1px solid #93c5fd; border-radius: 6px; padding: 12px; margin-bottom: ${
                        index < parsedIndividualVehicles.length - 1 ? "8px" : "0px"
                      };">
                        <div style="font-weight: 600; color: #1e40af; margin-bottom: 6px; font-size: 13px;">
                          🚗 Veicolo ${index + 1}
                        </div>
                        <div style="display: grid; gap: 4px; font-size: 12px;">
                          <div style="color: #1e40af;">
                            <strong>Tipo:</strong> <span style="color: #3730a3;">${vehicle.type}</span>
                          </div>
                          <div style="color: #1e40af;">
                            <strong>Passeggeri:</strong> <span style="color: #3730a3;">${vehicle.passengers}</span>
                          </div>
                          <div style="color: #1e40af;">
                            <strong>Bagagli:</strong> <span style="color: #3730a3;">${vehicle.luggage}</span>
                          </div>
                        </div>
                      </div>
                      `,
                        )
                        .join("")}
                    </div>
                    `
                        : `
                    <!-- Configurazione Unica Veicolo Admin -->
                    <p style="margin: 0; color: #1e40af;">
                      <strong>Veicolo:</strong> <span style="color: #3730a3;">${vehicleType}</span>
                    </p>
                    ${
                      isMultipleVehicles
                        ? `
                    <p style="margin: 0; color: #1e40af;">
                      <strong>N. Veicoli:</strong> <span style="color: #3730a3;">${vehicleCount} (tutti dello stesso tipo)</span>
                    </p>
                    `
                        : ""
                    }
                    `
                    }
                    ${
                      serviceDuration && isOlympic
                        ? `
                    <p style="margin: 0; color: #1e40af;">
                      <strong>Durata Servizio:</strong> <span style="color: #7c3aed; font-weight: 600;">${serviceDuration} ore (Speciale)</span>
                    </p>
                    `
                        : ""
                    }
                    ${
                      transferCost && transferRoute
                        ? `
                    <p style="margin: 0; color: #1e40af;">
                      <strong>🚗 Transfer Cost:</strong> <span style="color: #3730a3;">€${transferCost} (${transferRoute})</span>
                    </p>
                    `
                        : ""
                    }
                    ${
                      eventRoute
                        ? `
                    <p style="margin: 0; color: #1e40af;">
                      <strong>🏁 Event Route:</strong> <span style="color: #16a34a; font-weight: 600;">${eventRoute}</span>
                    </p>
                    `
                        : ""
                    }
                    ${
                      nightSurcharge && parseFloat(nightSurcharge) > 0
                        ? `
                    <p style="margin: 0; color: #1e40af;">
                      <strong>🌙 Night Surcharge:</strong> <span style="color: #f59e0b; font-weight: 600;">€${nightSurcharge}</span>
                    </p>
                    `
                        : ""
                    }
                    ${
                      meetAndGreet === "true" || parsedMeetGreetConfig
                        ? `
                    <p style="margin: 0; color: #1e40af;">
                      <strong>🤝 Meet & Greet:</strong> <span style="color: #16a34a; font-weight: 600;">SÌ</span>
                      ${parsedMeetGreetConfig ? ` <span style="font-size: 11px;">(Configurazione avanzata)</span>` : ""}
                    </p>
                    ${parsedMeetGreetConfig ? `
                    <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 6px; padding: 10px; margin: 8px 0; font-size: 12px;">
                      ${parsedMeetGreetConfig.selectedService ? `<div><strong>Servizio:</strong> ${parsedMeetGreetConfig.selectedService}</div>` : ""}
                      ${parsedMeetGreetConfig.passengers > 0 ? `<div><strong>Passeggeri:</strong> ${parsedMeetGreetConfig.passengers}</div>` : ""}
                      ${parsedMeetGreetConfig.children > 0 ? `<div><strong>Bambini:</strong> ${parsedMeetGreetConfig.children}</div>` : ""}
                      ${parsedMeetGreetConfig.infants > 0 ? `<div><strong>Neonati:</strong> ${parsedMeetGreetConfig.infants}</div>` : ""}
                      ${parsedMeetGreetConfig.extraLuggage > 0 ? `<div><strong>Bagagli extra:</strong> ${parsedMeetGreetConfig.extraLuggage}</div>` : ""}
                      ${parsedMeetGreetConfig.extraHours > 0 ? `<div><strong>Ore extra:</strong> ${parsedMeetGreetConfig.extraHours}</div>` : ""}
                      ${parsedMeetGreetConfig.specialServices ? Object.keys(parsedMeetGreetConfig.specialServices).filter(key => parsedMeetGreetConfig.specialServices[key]).map(key => `<div><strong>${key}:</strong> Incluso</div>`).join('') : ""}
                    </div>
                    ` : ""}
                    `
                        : ""
                    }
                    ${
                      flight
                        ? `
                    <p style="margin: 0; color: #1e40af;">
                      <strong>✈️ Volo/Treno:</strong> <span style="color: #3730a3; font-weight: 600;">${flight}</span>
                    </p>
                    `
                        : ""
                    }
                    ${
                      departureCity
                        ? `
                    <p style="margin: 0; color: #1e40af;">
                      <strong>🏙️ Città Provenienza:</strong> <span style="color: #3730a3; font-weight: 600;">${departureCity}</span>
                    </p>
                    `
                        : ""
                    }
                    ${
                      notes !== "Nessuna nota" && notes
                        ? `
                    <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 15px; margin-top: 10px;">
                      <p style="margin: 0; color: #92400e;">
                        <strong>📝 Note:</strong> ${notes}
                      </p>
                    </div>
                    `
                        : ""
                    }
                  </div>
                </div>
                
                ${
                  billingInfo
                    ? `
                <!-- Billing Info -->
                <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 10px; padding: 25px; margin: 25px 0;">
                  <h2 style="color: #92400e; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; border-bottom: 2px solid #fbbf24; padding-bottom: 8px;">
                    🧾 Dati di Fatturazione
                  </h2>
                  <div style="color: #92400e; white-space: pre-line; line-height: 1.6;">
                    ${billingInfo}
                  </div>
                </div>
                `
                    : ""
                }
                
                <!-- Payment Info -->
                <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 10px; padding: 25px; margin: 25px 0;">
                  <h2 style="color: #16a34a; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; border-bottom: 2px solid #22c55e; padding-bottom: 8px;">
                    💰 Informazioni Pagamento
                  </h2>
                  <div style="display: grid; gap: 12px;">
                    <p style="margin: 0; color: #16a34a;">
                      <strong>Importo:</strong> <span style="color: #15803d; font-size: 20px; font-weight: 700;">€${(session.amount_total! / 100).toFixed(2)}</span>
                    </p>
                    ${vatRate ? `
                    <p style="margin: 0; color: #16a34a;">
                      <strong>IVA:</strong> <span style="color: #15803d;">${vatRate}%${isOlympic ? " (Speciale)" : ""}</span>
                    </p>
                    ` : ""}
                    <p style="margin: 0; color: #16a34a;">
                      <strong>Status:</strong> <span style="color: #15803d; font-weight: 600;">✅ Pagamento Completato</span>
                    </p>
                    ${
                      priceBreakdown
                        ? `
                    <p style="margin: 0; color: #16a34a;">
                      <strong>Dettagli:</strong> <span style="color: #15803d;">${priceBreakdown}</span>
                    </p>
                    `
                        : ""
                    }
                    ${
                      invoiceUrl
                        ? `
                    <p style="margin: 0; color: #16a34a;">
                      <strong>Fattura:</strong> 
                      <a href="${invoiceUrl}" style="color: #15803d; text-decoration: underline;">Visualizza Fattura</a>
                    </p>
                    `
                        : `
                    <p style="margin: 0; color: #f59e0b;">
                      <strong>Fattura:</strong> <span style="color: #d97706;">⚠️ Non ancora disponibile</span>
                    </p>
                    `
                    }
                  </div>
                </div>
                
                <!-- Technical Debug Info -->
                <div style="background: #fafafa; border: 1px solid #d4d4d8; border-radius: 8px; padding: 20px; margin: 25px 0;">
                  <h3 style="color: #71717a; margin: 0 0 15px 0; font-size: 14px; font-weight: 600;">
                    🔍 Info Tecniche (Debug)
                  </h3>
                  <div style="font-size: 12px; color: #71717a; line-height: 1.4;">
                    <p style="margin: 0 0 5px 0;"><strong>Sessione Stripe:</strong> ${session.id}</p>
                    ${paymentIntentId ? `<p style="margin: 0 0 5px 0;"><strong>Payment Intent:</strong> ${paymentIntentId}</p>` : ""}
                    <p style="margin: 0 0 5px 0;"><strong>Fattura Presente:</strong> ${session.invoice ? "Sì" : "No"}</p>
                    <p style="margin: 0 0 5px 0;"><strong>Customer ID:</strong> ${session.customer || "N/A"}</p>
                    <p style="margin: 0 0 5px 0;"><strong>Service Type:</strong> ${serviceType}</p>
                    ${isOlympic ? `<p style="margin: 0 0 5px 0;"><strong>Olympic Pricing:</strong> Attivo</p>` : ""}
                    ${parsedMeetGreetConfig ? `<p style="margin: 0 0 5px 0;"><strong>Meet & Greet Config:</strong> Presente</p>` : ""}
                    ${hasIndividualVehicles ? `<p style="margin: 0 0 5px 0;"><strong>Individual Vehicles:</strong> ${parsedIndividualVehicles.length} configurazioni</p>` : ""}
                    <p style="margin: 0;"><strong>Metadata Count:</strong> ${Object.keys(metadata).length} campi</p>
                  </div>
                </div>
              </div>
            </div>
          `,
        })

        console.log('✅ Admin email sent successfully')

      } catch (adminEmailError) {
        console.log('❌ Admin email error:', adminEmailError)
      }
    } else {
      console.log('ℹ️ Ignoring event type:', event.type)
    }

    // Ritorna 200 OK per confermare la ricezione del webhook
    console.log('✅ Webhook processed successfully')
    console.log('🌐 FINAL CHECK - URL being called:', req.url)
    console.log('🌐 FINAL CHECK - Host:', req.headers.get('host'))
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.log('❌ Webhook processing error:', error)
    console.log('🌐 ERROR CHECK - URL being called:', req.url)
    console.log('🌐 ERROR CHECK - Host:', req.headers.get('host'))
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

// Configurazione per disabilitare il parsing automatico del body
export const runtime = "nodejs"
