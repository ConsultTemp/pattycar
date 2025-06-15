import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { Resend } from "resend"

// Inizializza Stripe con la chiave segreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
})

// Inizializza Resend con la chiave API
const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    // Leggi il raw body come buffer
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")

    if (!signature) {
      console.error("❌ Stripe signature mancante")
      return NextResponse.json({ error: "Stripe signature mancante" }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      // Verifica la firma del webhook con la chiave segreta
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err) {
      console.error("❌ Errore verifica firma webhook:", err)
      return NextResponse.json({ error: "Firma webhook non valida" }, { status: 400 })
    }

    // Gestisci solo l'evento checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      console.log("✅ Sessione checkout completata:", session.id)
      console.log("🔍 Dati sessione completi:", JSON.stringify(session, null, 2))

      // Estrai i dati del cliente
      const customerEmail = session.customer_details?.email
      const customerName = session.customer_details?.name || "Cliente"

      if (!customerEmail) {
        console.error("❌ Email cliente non trovata nella sessione")
        return NextResponse.json({ error: "Email cliente mancante" }, { status: 400 })
      }

      // Estrai i metadata della prenotazione
      const metadata = session.metadata || {}
      const {
        pickup = "Non specificato",
        destination = "Non specificato", 
        passengers = "1",
        luggage = "0",
        vehicleType = "Non specificato",
        date = "Non specificata",
        time = "Non specificato",
        phone = "Non specificato",
        notes = "Nessuna nota",
      } = metadata

      // 🔍 DEBUG: Controlla se esiste una fattura
      console.log("🔍 Session invoice:", session.invoice)
      console.log("🔍 Session payment_intent:", session.payment_intent)
      
      // Recupera l'invoice URL se disponibile - con più debug
      let invoiceUrl = ""
      let paymentIntentId = ""
      
      if (session.invoice) {
        try {
          console.log("📄 Tentativo recupero fattura:", session.invoice)
          const invoice = await stripe.invoices.retrieve(session.invoice as string)
          console.log("📄 Fattura recuperata:", invoice.id)
          console.log("📄 Invoice URL:", invoice.hosted_invoice_url)
          invoiceUrl = invoice.hosted_invoice_url || ""
        } catch (err) {
          console.error("⚠️ Errore recupero fattura:", err)
        }
      } else {
        console.log("⚠️ Nessuna fattura associata alla sessione")
      }

      // Recupera il Payment Intent per altre info
      if (session.payment_intent) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string)
          paymentIntentId = paymentIntent.id
          console.log("💳 Payment Intent:", paymentIntentId)
        } catch (err) {
          console.error("⚠️ Errore recupero payment intent:", err)
        }
      }

      try {
        // 📧 EMAIL AL CLIENTE - Conferma prenotazione (senza invoice per ora)
        const customerEmailResult = await resend.emails.send({
          from: process.env.RESEND_FROM!,
          to: "cahuas72@gmail.com", // La tua email per test
          subject: "Prenotazione NCC Confermata - Ricevuta Pagamento",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">🚗 Prenotazione Confermata!</h2>
              
              <p>Ciao <strong>${customerName}</strong>,</p>
              
              <p>La tua prenotazione NCC è stata confermata con successo e il pagamento è stato ricevuto.</p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">📋 Dettagli Prenotazione</h3>
                <p><strong>🚩 Partenza:</strong> ${pickup}</p>
                <p><strong>🎯 Destinazione:</strong> ${destination}</p>
                <p><strong>📅 Data:</strong> ${date}</p>
                <p><strong>🕐 Orario:</strong> ${time}</p>
                <p><strong>👥 Passeggeri:</strong> ${passengers}</p>
                <p><strong>🧳 Bagagli:</strong> ${luggage}</p>
                <p><strong>🚙 Tipo Veicolo:</strong> ${vehicleType}</p>
                ${phone !== "Non specificato" ? `<p><strong>📞 Telefono:</strong> ${phone}</p>` : ""}
                ${notes !== "Nessuna nota" ? `<p><strong>📝 Note:</strong> ${notes}</p>` : ""}
              </div>
              
              <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #388e3c;">💰 Dettagli Pagamento</h3>
                <p><strong>Importo Pagato:</strong> €${(session.amount_total! / 100).toFixed(2)}</p>
                <p><strong>ID Transazione:</strong> ${session.id}</p>
                <p><strong>Status:</strong> ✅ Completato</p>
                ${paymentIntentId ? `<p><strong>ID Pagamento:</strong> ${paymentIntentId}</p>` : ""}
              </div>
              
              ${
                invoiceUrl
                  ? `
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${invoiceUrl}" 
                     style="background: #007cba; color: white; padding: 12px 24px; 
                            text-decoration: none; border-radius: 6px; display: inline-block;">
                    📄 Visualizza la Fattura
                  </a>
                </div>
              `
                  : `
                <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404;">
                    📄 La fattura verrà inviata separatamente nelle prossime ore.
                  </p>
                </div>
              `
              }
              
              <p><strong>Prossimi passi:</strong></p>
              <ul>
                <li>Ti contatteremo entro 24 ore per confermare tutti i dettagli</li>
                <li>Riceverai un SMS di promemoria il giorno prima del servizio</li>
                <li>Il nostro autista ti contatterà 30 minuti prima dell'orario concordato</li>
              </ul>
              
              <p>Grazie per aver scelto i nostri servizi NCC!</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                Questa è una email automatica. Per assistenza contatta il nostro servizio clienti.
              </p>
            </div>
          `,
        })

        console.log("✅ Email cliente inviata:", customerEmailResult.data?.id)

        // 📧 EMAIL ALL'ADMIN - Con debug info
        const adminEmailResult = await resend.emails.send({
          from: process.env.RESEND_FROM!,
          to: process.env.ADMIN_EMAIL!,
          subject: "🚗 Nuova Prenotazione NCC - Pagamento Completato",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #d32f2f;">🚗 Nuova Prenotazione NCC</h2>
              
              <div style="background: #ffebee; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #c62828; font-weight: bold;">
                  ⚡ AZIONE RICHIESTA: Contatta il cliente per confermare i dettagli
                </p>
              </div>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">👤 Dati Cliente</h3>
                <p><strong>Nome:</strong> ${customerName}</p>
                <p><strong>Email:</strong> ${customerEmail}</p>
                ${phone !== "Non specificato" ? `<p><strong>Telefono:</strong> ${phone}</p>` : ""}
              </div>
              
              <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1976d2;">📋 Dettagli Prenotazione</h3>
                <p><strong>🚩 Partenza:</strong> ${pickup}</p>
                <p><strong>🎯 Destinazione:</strong> ${destination}</p>
                <p><strong>📅 Data:</strong> ${date}</p>
                <p><strong>🕐 Orario:</strong> ${time}</p>
                <p><strong>👥 Passeggeri:</strong> ${passengers}</p>
                <p><strong>🧳 Bagagli:</strong> ${luggage}</p>
                <p><strong>🚙 Tipo Veicolo:</strong> ${vehicleType}</p>
                ${notes !== "Nessuna nota" ? `<p><strong>📝 Note:</strong> ${notes}</p>` : ""}
              </div>
              
              <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #388e3c;">💰 Informazioni Pagamento</h3>
                <p><strong>Sessione Stripe:</strong> ${session.id}</p>
                <p><strong>Importo:</strong> €${(session.amount_total! / 100).toFixed(2)}</p>
                <p><strong>Status:</strong> ✅ Pagato</p>
                ${paymentIntentId ? `<p><strong>Payment Intent:</strong> ${paymentIntentId}</p>` : ""}
                ${invoiceUrl ? `<p><strong>Fattura:</strong> <a href="${invoiceUrl}">Visualizza</a></p>` : "<p><strong>Fattura:</strong> ⚠️ Non disponibile (vedi debug)</p>"}
              </div>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #856404;">🔍 Debug Info</h4>
                <p style="font-size: 12px; color: #856404;">
                  <strong>Has Invoice:</strong> ${session.invoice ? 'Sì' : 'No'}<br>
                  <strong>Payment Intent:</strong> ${session.payment_intent ? 'Presente' : 'Assente'}<br>
                  <strong>Customer ID:</strong> ${session.customer || 'N/A'}
                </p>
              </div>
            </div>
          `,
        })

        console.log("✅ Email admin inviata:", adminEmailResult.data?.id)
      } catch (emailError) {
        console.error("❌ Errore invio email:", emailError)
        return NextResponse.json({ error: "Errore invio email" }, { status: 500 })
      }
    }

    // Ritorna 200 OK per confermare la ricezione del webhook
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error("❌ Errore generale webhook:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

// Configurazione per disabilitare il parsing automatico del body
export const runtime = "nodejs"