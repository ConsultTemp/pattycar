import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
})

// Function to convert from 24h format to 12h with AM/PM
function convertTo12Hour(time24: string): string {
  if (!time24) return "Not specified"

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

// Funzione per pulire il nome del veicolo rimuovendo "olympic-" e capitalizzando
function cleanVehicleName(vehicleName: string): string {
  if (!vehicleName) return vehicleName
  
  // Rimuovi "olympic-" se presente
  let cleanName = vehicleName.replace(/^olympic-/i, '')
  
  // Converti i trattini rimanenti in spazi
  cleanName = cleanName.replace(/-/g, ' ')
  
  // Capitalizza la prima lettera
  cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
  
  return cleanName
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    

    const { amount, customerEmail, customerName, bookingData } = body

    // Validate required fields
    if (!amount || !customerEmail || !customerName || !bookingData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Crea o recupera il cliente
    let customer
    try {
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      })

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0]
        if (customerName && customer.name !== customerName) {
          customer = await stripe.customers.update(customer.id, {
            name: customerName,
            email: customerEmail,
          })
        }
        } else {
        customer = await stripe.customers.create({
          email: customerEmail,
          name: customerName,
        })
        }
    } catch (err) {
      return NextResponse.json({ error: "Error creating customer" }, { status: 500 })
    }

    // Determina il tipo di servizio
    const serviceType = bookingData.serviceType || "transfer"
    const isDisposizione = serviceType === "disposizione"

    // Format date and time
    const formatDate = (dateStr: string) => {
      if (!dateStr) return "Not specified"
      try {
        const date = new Date(dateStr)
        return date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      } catch {
        return dateStr
      }
    }

    const formattedDate = formatDate(bookingData.date)
    const startTime = convertTo12Hour(bookingData.time)
    const endTime = bookingData.endTime ? convertTo12Hour(bookingData.endTime) : null

    // Create detailed service description
    let serviceDescription = ""
    let detailedDescription = ""

    if (isDisposizione) {
      serviceDescription = `Private Driver Service - Disposition`
      detailedDescription = `Private vehicle with driver service

• Date: ${formattedDate}
• Time: From ${startTime}${endTime ? ` to ${endTime}` : ""}
• Pickup: ${bookingData.pickup}
• Destination: ${bookingData.destination}
• Passengers: ${bookingData.passengers}
• Vehicle: ${cleanVehicleName(bookingData.vehicleType)}${bookingData.vehicleCount > 1 ? ` (${bookingData.vehicleCount} vehicles)` : ""}`
    } else {
      serviceDescription = `Private Transfer Service`
      detailedDescription = `Private transfer with professional driver

• Date: ${formattedDate}
• Time: ${startTime}
• Pickup: ${bookingData.pickup}
• Destination: ${bookingData.destination}
• Passengers: ${bookingData.passengers}
• Vehicle: ${cleanVehicleName(bookingData.vehicleType)}${bookingData.vehicleCount > 1 ? ` (${bookingData.vehicleCount} vehicles)` : ""}`
    }

    // Add extra services if present
    const extras = []
    if (bookingData.meetAndGreet) {
      let meetGreetInfo = "• Meet & Greet service"
      
      // Add Meet & Greet details if available
      if (bookingData.meetGreetConfig) {
        const config = bookingData.meetGreetConfig
        const totalPax = (config.passengers || 0) + (config.children || 0) + (config.infants || 0)
        if (totalPax > 0) {
          const paxDetails = []
          if (config.passengers > 0) paxDetails.push(`${config.passengers} adults`)
          if (config.children > 0) paxDetails.push(`${config.children} children`)
          if (config.infants > 0) paxDetails.push(`${config.infants} infants`)
          meetGreetInfo += ` (${paxDetails.join(', ')})`
        }
        if (config.extraLuggage > 0) meetGreetInfo += ` +${config.extraLuggage} extra luggage`
        if (config.extraHours > 0) meetGreetInfo += ` +${config.extraHours}h extra`
      }
      extras.push(meetGreetInfo)
    }
    if (bookingData.flight) extras.push(`• Flight/Train: ${bookingData.flight}`)
    if (bookingData.departureCity) extras.push(`• Departure city: ${bookingData.departureCity}`)
    if (bookingData.luggage && bookingData.luggage > 0) extras.push(`• Luggage: ${bookingData.luggage} pieces`)

    if (extras.length > 0) {
      detailedDescription += `\n\nAdditional services:\n${extras.join("\n")}`
    }

    console.log('🔍 DEBUG DEPARTURE TIME IN CHECKOUT:')
    console.log('  - departureTime:', bookingData.departureTime)
    console.log('  - departureMinutes:', bookingData.departureMinutes)
    console.log('  - departureTimeAmPm:', bookingData.departureTimeAmPm)

    // Prepare metadata - ONLY STRING VALUES
    const metadata: Record<string, string> = {
      serviceType: serviceType,
      pickup: bookingData.pickup || "",
      destination: bookingData.destination || "",
      date: bookingData.date || "",
      time: bookingData.time || "",
      minutes: bookingData.minutes || "",
      departureTime: bookingData.departureTime || "",
      departureMinutes: bookingData.departureMinutes || "",
      departureTimeAmPm: bookingData.departureTimeAmPm || "",
      endTime: bookingData.endTime || "",
      endMinutes: bookingData.endMinutes || "",
      passengers: bookingData.passengers || "",
      vehicleType: cleanVehicleName(bookingData.vehicleType) || "",
      vehicleCount: bookingData.vehicleCount || "",
      luggage: bookingData.luggage || "",
      flight: bookingData.flight || "",
      departureCity: bookingData.departureCity || "",
      billingInfo: bookingData.billingInfo || "",
      notes: bookingData.notes || "",
      meetAndGreet: bookingData.meetAndGreet ? "true" : "false",
      meetGreetConfig: bookingData.meetGreetConfig ? JSON.stringify(bookingData.meetGreetConfig) : "",
      sameVehicleType: bookingData.sameVehicleType ? "true" : "false",
      customerName: customerName,
      customerEmail: customerEmail,
      phonePrefix: bookingData.phonePrefix || "",
      phoneNumber: bookingData.phoneNumber || "",
    }

    // Add individual vehicles as JSON string if present
    if (bookingData.individualVehicles && Array.isArray(bookingData.individualVehicles)) {
      // Pulisci i nomi dei veicoli individuali prima di serializzarli
      const cleanedIndividualVehicles = bookingData.individualVehicles.map((vehicle: any) => ({
        ...vehicle,
        type: cleanVehicleName(vehicle.type)
      }))
      metadata.individualVehicles = JSON.stringify(cleanedIndividualVehicles)
    }

    // Crea la sessione di checkout con descrizione dettagliata
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: serviceDescription,
              description: detailedDescription,
              images: [], // Puoi aggiungere immagini del servizio qui
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",

      // Invoice configuration with details
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: serviceDescription,
          custom_fields: [
            {
              name: "Service Type",
              value: isDisposizione ? "Private Driver Service" : "Private Transfer",
            },
            {
              name: "Date & Time",
              value:
                isDisposizione && endTime
                  ? `${formattedDate} from ${startTime} to ${endTime}`
                  : `${formattedDate} at ${startTime}`,
            },
            {
              name: "Route",
              value: `${bookingData.pickup} → ${bookingData.destination}`,
            },
            {
              name: "Details",
              value: `${bookingData.passengers} passengers, ${cleanVehicleName(bookingData.vehicleType)}${bookingData.vehicleCount > 1 ? ` (${bookingData.vehicleCount} vehicles)` : ""}`,
            },
          ],
          footer: `Thank you for choosing our ${isDisposizione ? "private driver" : "transfer"} service!`,
          metadata: {
            service_type: serviceType,
            pickup: bookingData.pickup || "",
            destination: bookingData.destination || "",
            passengers: bookingData.passengers || "",
            vehicleType: cleanVehicleName(bookingData.vehicleType) || "",
            date: bookingData.date || "",
            time: startTime,
            ...(endTime && { endTime }),
          },
        },
      },

      // Metadata per il webhook - SOLO STRINGHE
      metadata: metadata,

      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-cancelled`,
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("stripe")) {
        return NextResponse.json({ error: "Payment service error" }, { status: 502 })
      }
      return NextResponse.json({ error: err.message }, { status: 500 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
