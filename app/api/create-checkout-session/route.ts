import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
})

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

    // Prepare service description
    const serviceDescription = `Servizio NCC: ${bookingData.pickup} → ${bookingData.destination}`
    const bookingDescription = `Prenotazione per ${bookingData.passengers} passeggeri - ${bookingData.date} alle ${bookingData.time}`

    // Prepare metadata - ONLY STRING VALUES
    const metadata: Record<string, string> = {
      pickup: bookingData.pickup || "",
      destination: bookingData.destination || "",
      date: bookingData.date || "",
      time: bookingData.time || "",
      passengers: bookingData.passengers || "",
      vehicleType: bookingData.vehicleType || "",
      vehicleCount: bookingData.vehicleCount || "",
      luggage: bookingData.luggage || "",
      flight: bookingData.flight || "",
      billingInfo: bookingData.billingInfo || "",
      notes: bookingData.notes || "",
      meetAndGreet: bookingData.meetAndGreet ? "true" : "false",
      sameVehicleType: bookingData.sameVehicleType ? "true" : "false",
      customerName: customerName,
      customerEmail: customerEmail,
    }

    // Add individual vehicles as JSON string if present
    if (bookingData.individualVehicles && Array.isArray(bookingData.individualVehicles)) {
      metadata.individualVehicles = JSON.stringify(bookingData.individualVehicles)
    }

    // Crea la sessione di checkout con invoice automatica
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: serviceDescription,
              description: bookingDescription,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",

      // 🧾 CONFIGURAZIONE INVOICE AUTOMATICA CORRETTA
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: serviceDescription,
          custom_fields: [
            {
              name: "Servizio",
              value: "Trasporto NCC",
            },
            {
              name: "Data/Ora",
              value: `${bookingData.date} alle ${bookingData.time}`,
            },
            {
              name: "Percorso",
              value: `${bookingData.pickup} → ${bookingData.destination}`,
            },
          ],
          footer: "Grazie per aver scelto i nostri servizi NCC!",
          metadata: {
            service_type: "ncc_booking",
            pickup: bookingData.pickup || "",
            destination: bookingData.destination || "",
            passengers: bookingData.passengers || "",
            vehicleType: bookingData.vehicleType || "",
          },
        },
      },

      // Metadata per il webhook - SOLO STRINGHE
      metadata: metadata,

      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-cancelled`,
    })

    console.log("✅ Sessione creata:", session.id)
    console.log("📄 Invoice creation abilitata")
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
