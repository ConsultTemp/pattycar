import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { Resend } from "resend"

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
        vatRate = "22",
      } = metadata

      // Parsa i veicoli individuali se presenti
      let parsedIndividualVehicles: Array<{ id: string; type: string; passengers: number; luggage: number }> = []
      if (individualVehicles && individualVehicles !== "") {
        try {
          parsedIndividualVehicles = JSON.parse(individualVehicles)
          console.log("🚗 Veicoli individuali parsati:", parsedIndividualVehicles)
        } catch (error) {
          console.error("❌ Errore parsing veicoli individuali:", error)
        }
      }

      // Parsa la configurazione Meet & Greet se presente
      let parsedMeetGreetConfig: any = null
      if (meetGreetConfig && meetGreetConfig !== "") {
        try {
          parsedMeetGreetConfig = JSON.parse(meetGreetConfig)
          console.log("🤝 Meet & Greet config parsato:", parsedMeetGreetConfig)
        } catch (error) {
          console.error("❌ Errore parsing Meet & Greet config:", error)
        }
      }

      // 🔍 DEBUG: Controlla i valori del telefono
      console.log("🔍 Debug telefono - phonePrefix:", phonePrefix)
      console.log("🔍 Debug telefono - phoneNumber:", phoneNumber)
      
      // Combina prefisso e numero di telefono (migliorata la logica)
      let phone = "Non specificato"
      if (phonePrefix || phoneNumber) {
        if (phonePrefix && phoneNumber) {
          phone = `${phonePrefix} ${phoneNumber}`
        } else if (phonePrefix) {
          phone = phonePrefix
        } else if (phoneNumber) {
          phone = phoneNumber
        }
      }
      
      console.log("🔍 Debug telefono - Risultato finale:", phone)

      // Determina se mostare i veicoli individuali o la configurazione unica
      const hasIndividualVehicles = parsedIndividualVehicles.length > 0
      const isMultipleVehicles = parseInt(vehicleCount) > 1

      // 🔍 DEBUG: Controlla se esiste una fattura
      console.log("🔍 Session invoice:", session.invoice)
      console.log("🔍 Session payment_intent:", session.payment_intent)

      // Recupera l'invoice URL se disponibile
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
      let serviceIcon = "🚗"
      let serviceBadge = ""
      
      if (isCeremony) {
        serviceLabel = "Disposizione Cerimonia"
        serviceIcon = "🏆"
        serviceBadge = "CERIMONIA"
      } else if (isDisposizione) {
        serviceLabel = "Disposizione"
        serviceIcon = "⏰"
        serviceBadge = isOlympic ? "OLIMPIADI 2026" : ""
      } else if (isInterCluster) {
        serviceLabel = "Inter-Cluster"
        serviceIcon = "🏔️"
        serviceBadge = "OLIMPIADI 2026"
      } else if (isAltriServizi) {
        serviceLabel = "Altri Servizi"
        serviceIcon = "🚙"
        serviceBadge = "OLIMPIADI 2026"
      } else {
        serviceLabel = "Transfer"
        serviceIcon = "🚗"
        serviceBadge = isOlympic ? "OLIMPIADI 2026" : ""
      }

      try {
        // 📧 EMAIL AL CLIENTE - Conferma prenotazione completa
        console.log("📧 Tentativo invio email cliente a:", customerEmail)
        const customerEmailResult = await resend.emails.send({
          from: process.env.RESEND_FROM!,
          to: customerEmail,
          subject: `✅ Prenotazione Confermata - ${serviceLabel} Patty Car${serviceBadge ? ` (${serviceBadge})` : ""}`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                  ${serviceIcon} Prenotazione Confermata
                </h1>
                <p style="color: #e3f2fd; margin: 10px 0 0 0; font-size: 16px;">
                  ${serviceLabel} prenotato con successo
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
                  Gentile <strong style="color: #1e3c72;">${customerName}</strong>,
                </p>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6; margin: 0 0 35px 0;">
                  La sua prenotazione per il servizio <strong>${serviceLabel}</strong> è stata confermata e il pagamento è stato elaborato con successo. 
                  Di seguito trova tutti i dettagli del suo ${isDisposizione ? "servizio" : "viaggio"}.
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
                
                <!-- Trip Details Card -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0;">
                  <h2 style="color: #1e3c72; margin: 0 0 25px 0; font-size: 20px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
                    📋 Dettagli del ${isDisposizione ? "Servizio" : "Viaggio"}
                  </h2>
                  
                  <div style="display: grid; gap: 15px;">
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #ef4444; font-size: 18px; margin-right: 12px;">📍</span>
                      <div>
                        <strong style="color: #374151;">Partenza:</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${pickup}</span>
                        ${pickupIsCustom === "false" && pickupLocationId ? `
                        <span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 8px;">
                          📋 LISTINO
                        </span>
                        ` : pickupIsCustom === "true" ? `
                        <span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 8px;">
                          ✏️ CUSTOM
                        </span>
                        ` : ""}
                      </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #10b981; font-size: 18px; margin-right: 12px;">🎯</span>
                      <div>
                        <strong style="color: #374151;">${isDisposizione ? "Destinazione:" : "Arrivo:"}</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${destination}</span>
                        ${destinationIsCustom === "false" && destinationLocationId ? `
                        <span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 8px;">
                          📋 LISTINO
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
                        <strong style="color: #374151;">Data:</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${formattedDate}</span>
                      </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #8b5cf6; font-size: 18px; margin-right: 12px;">🕐</span>
                      <div>
                        <strong style="color: #374151;">${isDisposizione ? "Inizio servizio:" : "Orario partenza:"}</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${formattedTime}</span>
                      </div>
                    </div>
                    
                    ${
                      isDisposizione && formattedEndTime
                        ? `
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #ef4444; font-size: 18px; margin-right: 12px;">🕐</span>
                      <div>
                        <strong style="color: #374151;">Fine servizio:</strong>
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
                      <span style="color: #7c3aed; font-size: 18px; margin-right: 12px;">⏱️</span>
                      <div>
                        <strong style="color: #374151;">Durata servizio:</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${serviceDuration} ore</span>
                        <span style="background: #ede9fe; color: #7c3aed; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 8px;">
                          🏅 OLIMPIADI 2026
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
                      <span style="color: #06b6d4; font-size: 18px; margin-right: 12px;">📏</span>
                      <div>
                        <strong style="color: #374151;">Distanza:</strong>
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
                      <span style="color: #84cc16; font-size: 18px; margin-right: 12px;">⏱️</span>
                      <div>
                        <strong style="color: #374151;">Durata stimata:</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${duration}</span>
                      </div>
                    </div>
                    `
                        : ""
                    }
                    
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #06b6d4; font-size: 18px; margin-right: 12px;">👥</span>
                      <div>
                        <strong style="color: #374151;">Passeggeri:</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${passengers}</span>
                      </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #84cc16; font-size: 18px; margin-right: 12px;">🧳</span>
                      <div>
                        <strong style="color: #374151;">Bagagli:</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${luggage}</span>
                      </div>
                    </div>
                    
                    ${
                      hasIndividualVehicles
                        ? `
                    <!-- Veicoli Individuali -->
                    <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 15px 0;">
                      <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 16px; font-weight: 600; display: flex; align-items: center;">
                        <span style="color: #ec4899; font-size: 18px; margin-right: 10px;">🚙</span>
                        Configurazione Veicoli
                      </h4>
                      ${parsedIndividualVehicles
                        .map(
                          (vehicle, index) => `
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin-bottom: ${
                        index < parsedIndividualVehicles.length - 1 ? "10px" : "0px"
                      };">
                        <div style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">
                          🚗 Veicolo ${index + 1}
                        </div>
                        <div style="display: grid; gap: 8px; font-size: 14px;">
                          <div style="color: #374151;">
                            <strong>Tipo:</strong> <span style="color: #6b7280;">${vehicle.type}</span>
                          </div>
                          <div style="color: #374151;">
                            <strong>Passeggeri:</strong> <span style="color: #6b7280;">${vehicle.passengers}</span>
                          </div>
                          <div style="color: #374151;">
                            <strong>Bagagli:</strong> <span style="color: #6b7280;">${vehicle.luggage}</span>
                          </div>
                        </div>
                      </div>
                      `,
                        )
                        .join("")}
                    </div>
                    `
                        : `
                    <!-- Configurazione Unica Veicolo -->
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #ec4899; font-size: 18px; margin-right: 12px;">🚙</span>
                      <div>
                        <strong style="color: #374151;">Veicolo:</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${vehicleType}</span>
                      </div>
                    </div>
                    
                    ${
                      isMultipleVehicles
                        ? `
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #f59e0b; font-size: 18px; margin-right: 12px;">🚗</span>
                      <div>
                        <strong style="color: #374151;">Numero veicoli:</strong>
                        <span style="color: #6b7280; margin-left: 8px;">${vehicleCount} (tutti dello stesso tipo)</span>
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
                        <span style="color: #2563eb; font-size: 18px; margin-right: 12px;">🚗</span>
                        <div>
                          <strong style="color: #1e40af;">Transfer aggiuntivo incluso</strong>
                          <p style="color: #1e40af; margin: 5px 0 0 0; font-size: 14px;">Tratta: ${transferRoute}</p>
                          <p style="color: #1e40af; margin: 5px 0 0 0; font-size: 12px;">Costo transfer: €${transferCost}</p>
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
                          <strong style="color: #166534;">Tratta speciale evento</strong>
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
                          <strong style="color: #92400e;">Supplemento notturno applicato</strong>
                          <p style="color: #92400e; margin: 5px 0 0 0; font-size: 14px;">Servizio tra 19:30 - 07:30: +€${nightSurcharge}</p>
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
                        <span style="color: #16a34a; font-size: 18px; margin-right: 12px;">🤝</span>
                        <div>
                          <strong style="color: #166534;">Servizio Meet & Greet incluso</strong>
                          ${parsedMeetGreetConfig ? `
                          <div style="margin-top: 8px; font-size: 13px; color: #166534;">
                            ${parsedMeetGreetConfig.selectedService ? `<p>📍 Servizio: ${parsedMeetGreetConfig.selectedService}</p>` : ""}
                            ${parsedMeetGreetConfig.passengers > 0 ? `<p>👥 Passeggeri: ${parsedMeetGreetConfig.passengers}</p>` : ""}
                            ${parsedMeetGreetConfig.children > 0 ? `<p>👶 Bambini: ${parsedMeetGreetConfig.children}</p>` : ""}
                            ${parsedMeetGreetConfig.infants > 0 ? `<p>🍼 Neonati: ${parsedMeetGreetConfig.infants}</p>` : ""}
                            ${parsedMeetGreetConfig.extraLuggage > 0 ? `<p>🧳 Bagagli extra: ${parsedMeetGreetConfig.extraLuggage}</p>` : ""}
                            ${parsedMeetGreetConfig.extraHours > 0 ? `<p>⏰ Ore extra: ${parsedMeetGreetConfig.extraHours}</p>` : ""}
                            ${parsedMeetGreetConfig.specialServices ? `
                              ${parsedMeetGreetConfig.specialServices.tarmac ? `<p>✈️ Servizio TARMAC incluso</p>` : ""}
                              ${parsedMeetGreetConfig.specialServices.fastTrack ? `<p>⚡ Fast Track incluso</p>` : ""}
                              ${parsedMeetGreetConfig.specialServices.vipLounge ? `<p>🥂 VIP Lounge incluso</p>` : ""}
                              ${parsedMeetGreetConfig.specialServices.veniceCombo ? `<p>🎭 Venice Combo (Fast Track + VIP) incluso</p>` : ""}
                              ${parsedMeetGreetConfig.specialServices.greeterOnly ? `<p>👋 Solo Greeter (senza Porter)</p>` : ""}
                            ` : ""}
                          </div>
                          ` : `
                          <p style="color: #166534; margin: 5px 0 0 0; font-size: 14px;">Il nostro autista la aspetterà con un cartello personalizzato</p>
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
                        <span style="color: #2563eb; font-size: 18px; margin-right: 12px;">✈️</span>
                        <div>
                          ${flight ? `<div style="color: #1e40af; margin-bottom: 5px;"><strong>Numero volo/treno:</strong> ${flight}</div>` : ""}
                          ${departureCity ? `<div style="color: #1e40af; margin-bottom: 5px;"><strong>Città di provenienza:</strong> ${departureCity}</div>` : ""}
                          <p style="color: #1e40af; margin: 5px 0 0 0; font-size: 14px;">Monitoreremo eventuali ritardi del volo</p>
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
                        <span style="color: #f59e0b; font-size: 18px; margin-right: 12px;">📝</span>
                        <div>
                          <strong style="color: #92400e;">Note aggiuntive:</strong>
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
                          <strong style="color: #374151;">Dati di fatturazione:</strong>
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
                  <h3 style="color: #166534; margin: 0 0 10px 0; font-size: 18px;">Pagamento Confermato</h3>
                  <p style="color: #166534; margin: 0; font-size: 24px; font-weight: 600;">
                    €${(session.amount_total! / 100).toFixed(2)}
                  </p>
                  ${vatRate ? `
                  <p style="color: #166534; margin: 5px 0 0 0; font-size: 12px;">
                    IVA ${vatRate}% inclusa${isOlympic ? " (Tariffa Olimpica)" : ""}
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
                    📄 Visualizza Fattura
                  </a>
                </div>
                `
                    : `
                <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                  <span style="color: #f59e0b; font-size: 20px;">📄</span>
                  <p style="color: #92400e; margin: 10px 0 0 0; font-weight: 500;">
                    La fattura verrà inviata separatamente nelle prossime ore
                  </p>
                </div>
                `
                }
                
                <!-- Next Steps -->
                <div style="background: #f1f5f9; border-radius: 12px; padding: 30px; margin: 35px 0;">
                  <h3 style="color: #1e3c72; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
                    🚀 Prossimi Passi
                  </h3>
                  <ul style="color: #475569; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Ti contatteremo entro <strong>24 ore</strong> per confermare tutti i dettagli</li>
                    <li style="margin-bottom: 8px;">Riceverai un <strong>SMS promemoria</strong> il giorno prima del servizio</li>
                    <li>Il nostro autista ti contatterà <strong>30 minuti prima</strong> dell'orario concordato</li>
                  </ul>
                </div>
                
                <!-- Contact Info -->
                <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 12px; padding: 25px; margin: 30px 0;">
                  <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                    📞 Hai bisogno di assistenza?
                  </h3>
                  <p style="color: #1e40af; margin: 0 0 10px 0;">
                    Per qualsiasi domanda o modifica alla prenotazione:
                  </p>
                  <ul style="color: #1e40af; margin: 0; padding-left: 20px; line-height: 1.6;">
                    <li>📧 Email: info@pattycar.com</li>
                    <li>📱 Telefono: ${phone !== "Non specificato" ? phone : "+39 XXX XXX XXXX"}</li>
                    <li>🌐 Sito web: www.pattycar.com</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 40px 0 20px 0;">
                  <p style="color: #1e3c72; font-size: 18px; font-weight: 600; margin: 0;">
                    Grazie per aver scelto Patty Car! 🙏
                  </p>
                  <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">
                    Il tuo servizio di trasporto di fiducia
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
                <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.5;">
                  Questa è una email automatica di conferma. <br>
                  Per assistenza o modifiche contatta il nostro servizio clienti.
                </p>
              </div>
            </div>
          `,
        })

        console.log("✅ Email cliente inviata:", customerEmailResult.data?.id)
        console.log("📧 Dettagli risposta email cliente:", JSON.stringify(customerEmailResult, null, 2))

      } catch (customerEmailError) {
        console.error("❌ Errore specifico invio email cliente:", customerEmailError)
        // Non fermare il processo, continua con l'email admin
      }

      try {
        // 📧 EMAIL ALL'ADMIN - Versione completa con tutti i dettagli
        console.log("📧 Tentativo invio email admin a:", process.env.ADMIN_EMAIL)
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
                      <strong>🎯 ${isDisposizione ? "Destinazione:" : "Arrivo:"}</strong> <span style="color: #3730a3;">${destination}</span>
                      ${destinationLocationId ? `<span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 8px; font-size: 10px; margin-left: 8px;">ID: ${destinationLocationId}</span>` : ""}
                      ${destinationIsCustom === "true" ? `<span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 8px; font-size: 10px; margin-left: 8px;">CUSTOM</span>` : ""}
                    </p>
                    <p style="margin: 0; color: #1e40af;">
                      <strong>📅 Data:</strong> <span style="color: #3730a3; font-weight: 600;">${formattedDate}</span>
                    </p>
                    <p style="margin: 0; color: #1e40af;">
                      <strong>🕐 ${isDisposizione ? "Inizio:" : "Orario:"}</strong> <span style="color: #3730a3; font-weight: 600;">${formattedTime}</span>
                    </p>
                    ${
                      isDisposizione && formattedEndTime
                        ? `
                    <p style="margin: 0; color: #1e40af;">
                      <strong>🕐 Fine:</strong> <span style="color: #3730a3; font-weight: 600;">${formattedEndTime}</span>
                    </p>
                    `
                        : ""
                    }
                    ${
                      distance && !isDisposizione
                        ? `
                    <p style="margin: 0; color: #1e40af;">
                      <strong>📏 Distanza:</strong> <span style="color: #3730a3;">${distance}</span>
                    </p>
                    `
                        : ""
                    }
                    ${
                      duration && !isDisposizione
                        ? `
                    <p style="margin: 0; color: #1e40af;">
                      <strong>⏱️ Durata:</strong> <span style="color: #3730a3;">${duration}</span>
                    </p>
                    `
                        : ""
                    }
                    <p style="margin: 0; color: #1e40af;">
                      <strong>👥 Passeggeri:</strong> <span style="color: #3730a3;">${passengers}</span>
                    </p>
                    <p style="margin: 0; color: #1e40af;">
                      <strong>🧳 Bagagli:</strong> <span style="color: #3730a3;">${luggage}</span>
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
                      <strong>🚙 Veicolo:</strong> <span style="color: #3730a3;">${vehicleType}</span>
                    </p>
                    ${
                      isMultipleVehicles
                        ? `
                    <p style="margin: 0; color: #1e40af;">
                      <strong>🚗 N. Veicoli:</strong> <span style="color: #3730a3;">${vehicleCount} (tutti dello stesso tipo)</span>
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
                      <strong>⏱️ Durata Servizio:</strong> <span style="color: #7c3aed; font-weight: 600;">${serviceDuration} ore (Olimpico)</span>
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
                      <strong>IVA:</strong> <span style="color: #15803d;">${vatRate}%${isOlympic ? " (Olimpica)" : ""}</span>
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

        console.log("✅ Email admin inviata:", adminEmailResult.data?.id)
        console.log("📧 Dettagli risposta email admin:", JSON.stringify(adminEmailResult, null, 2))

      } catch (adminEmailError) {
        console.error("❌ Errore specifico invio email admin:", adminEmailError)
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
