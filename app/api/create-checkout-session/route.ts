import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
})

// Funzione per convertire dal formato 24h al 12h con AM/PM
function convertTo12Hour(time24: string): string {
  if (!time24) return "Non specificato"
  
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("📥 Received request body:", JSON.stringify(body, null, 2))

    const { amount, customerEmail, customerName, bookingData } = body

    // Validate required fields
    if (!amount || !customerEmail || !customerName || !bookingData) {
      console.error("❌ Missing required fields:", {
        amount,
        customerEmail,
        customerName,
        hasBookingData: !!bookingData,
      })
      return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 })
    }

    if (amount <= 0) {
      console.error("❌ Invalid amount:", amount)
      return NextResponse.json({ error: "Importo non valido" }, { status: 400 })
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
        console.log("👤 Customer esistente aggiornato:", customer.id)
      } else {
        customer = await stripe.customers.create({
          email: customerEmail,
          name: customerName,
        })
        console.log("👤 Nuovo customer creato:", customer.id)
      }
    } catch (err) {
      console.error("❌ Errore creazione cliente:", err)
      return NextResponse.json({ error: "Errore creazione cliente" }, { status: 500 })
    }

    // Determina il tipo di servizio
    const serviceType = bookingData.serviceType || "transfer"
    const isDisposizione = serviceType === "disposizione"

    // Formatta data e ora
    const formatDate = (dateStr: string) => {
      if (!dateStr) return "Non specificata"
      try {
        const date = new Date(dateStr)
        return date.toLocaleDateString("it-IT", {
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

    // Crea descrizione dettagliata del servizio
    let serviceDescription = ""
    let detailedDescription = ""

    if (isDisposizione) {
      serviceDescription = `🚗 Servizio Disposizione NCC`
      detailedDescription = `Disposizione veicolo con autista
📅 ${formattedDate}
🕐 Dalle ${startTime}${endTime ? ` alle ${endTime}` : ""}
📍 Da: ${bookingData.pickup}
🎯 A: ${bookingData.destination}
👥 ${bookingData.passengers} passeggeri
🚙 ${bookingData.vehicleType}${bookingData.vehicleCount > 1 ? ` (${bookingData.vehicleCount} veicoli)` : ""}`
    } else {
      serviceDescription = `🚗 Servizio Transfer NCC`
      detailedDescription = `Transfer con autista privato
📅 ${formattedDate}
🕐 Ore ${startTime}
📍 Da: ${bookingData.pickup}
🎯 A: ${bookingData.destination}
👥 ${bookingData.passengers} passeggeri
🚙 ${bookingData.vehicleType}${bookingData.vehicleCount > 1 ? ` (${bookingData.vehicleCount} veicoli)` : ""}`
    }

    // Aggiungi servizi extra se presenti
    const extras = []
    if (bookingData.meetAndGreet) extras.push("✅ Meet & Greet")
    if (bookingData.flight) extras.push(`✈️ Volo/Treno: ${bookingData.flight}`)
    if (bookingData.departureCity) extras.push(`🏙️ Provenienza: ${bookingData.departureCity}`)
    if (bookingData.luggage && bookingData.luggage > 0) extras.push(`🧳 ${bookingData.luggage} bagagli`)

    if (extras.length > 0) {
      detailedDescription += `\n\nServizi inclusi:\n${extras.join("\n")}`
    }

    // Prepare metadata - ONLY STRING VALUES
    const metadata: Record<string, string> = {
      serviceType: serviceType,
      pickup: bookingData.pickup || "",
      destination: bookingData.destination || "",
      date: bookingData.date || "",
      time: bookingData.time || "",
      minutes: bookingData.minutes || "",
      endTime: bookingData.endTime || "",
      endMinutes: bookingData.endMinutes || "",
      passengers: bookingData.passengers || "",
      vehicleType: bookingData.vehicleType || "",
      vehicleCount: bookingData.vehicleCount || "",
      luggage: bookingData.luggage || "",
      flight: bookingData.flight || "",
      departureCity: bookingData.departureCity || "",
      billingInfo: bookingData.billingInfo || "",
      notes: bookingData.notes || "",
      meetAndGreet: bookingData.meetAndGreet ? "true" : "false",
      sameVehicleType: bookingData.sameVehicleType ? "true" : "false",
      customerName: customerName,
      customerEmail: customerEmail,
      phonePrefix: bookingData.phonePrefix || "",
      phoneNumber: bookingData.phoneNumber || "",
    }

    // Add individual vehicles as JSON string if present
    if (bookingData.individualVehicles && Array.isArray(bookingData.individualVehicles)) {
      metadata.individualVehicles = JSON.stringify(bookingData.individualVehicles)
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

      // 🧾 CONFIGURAZIONE INVOICE AUTOMATICA CON DETTAGLI
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: serviceDescription,
          custom_fields: [
            {
              name: "Tipo Servizio",
              value: isDisposizione ? "Disposizione con Autista" : "Transfer NCC",
            },
            {
              name: "Data e Orario",
              value:
                isDisposizione && endTime
                  ? `${formattedDate} dalle ${startTime} alle ${endTime}`
                  : `${formattedDate} ore ${startTime}`,
            },
            {
              name: "Percorso",
              value: `${bookingData.pickup} → ${bookingData.destination}`,
            },
            {
              name: "Dettagli",
              value: `${bookingData.passengers} pax, ${bookingData.vehicleType}${bookingData.vehicleCount > 1 ? ` (${bookingData.vehicleCount} veicoli)` : ""}`,
            },
          ],
          footer: `Grazie per aver scelto i nostri servizi ${isDisposizione ? "di disposizione" : "transfer"} NCC!`,
          metadata: {
            service_type: serviceType,
            pickup: bookingData.pickup || "",
            destination: bookingData.destination || "",
            passengers: bookingData.passengers || "",
            vehicleType: bookingData.vehicleType || "",
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

    console.log("✅ Sessione creata:", session.id)
    console.log("📄 Invoice creation abilitata con dettagli completi")
    console.log("🎯 Servizio:", isDisposizione ? "Disposizione" : "Transfer")
    console.log("👤 Con customer:", customer.id)
    console.log("💰 Importo:", amount, "EUR")

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (err) {
    console.error("❌ Errore creazione sessione:", err)

    if (err instanceof Error) {
      if (err.message.includes("stripe")) {
        return NextResponse.json({ error: "Errore del servizio di pagamento" }, { status: 502 })
      }
      return NextResponse.json({ error: err.message }, { status: 500 })
    }

    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
