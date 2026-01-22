import { createAdminClient } from './supabase'
import { Resend } from 'resend'
import { Database } from '@/types/database.types'

type BookingRow = Database['public']['Tables']['bookings']['Row']

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY!)

// Helper functions from stripe-webhook
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

function formatTime(time: string): string {
  if (time === "Non specificato" || !time) return "Non specificato"

  if (time.match(/^\d{1,2}:\d{2}$/)) {
    return convertTo12Hour(time)
  }

  return time
}

function formatDate(date: string): string {
  if (date === "Non specificata" || !date) return "Non specificata"

  try {
    const dateObj = new Date(date)
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
  } catch (e) {
    // If parsing fails, return original date
  }

  return date
}

function cleanVehicleName(vehicleName: string): string {
  if (!vehicleName) return vehicleName
  
  let cleanName = vehicleName.replace(/^olympic-/i, '')
  cleanName = cleanName.replace(/-/g, ' ')
  cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
  
  return cleanName
}

function createMeetGreetDescription(config: any): string {
  if (!config) return ""
  
  const parts = []
  
  if (config.selectedService) {
    parts.push(`Service: ${config.selectedService}`)
  }
  if (config.serviceId) {
    parts.push(`Location: ${config.serviceId}`)
  }
  
  const totalPax = (config.passengers || 0) + (config.children || 0) + (config.infants || 0)
  if (totalPax > 0) {
    const paxDetails = []
    if (config.passengers > 0) paxDetails.push(`${config.passengers} adults`)
    if (config.children > 0) paxDetails.push(`${config.children} children`)
    if (config.infants > 0) paxDetails.push(`${config.infants} infants`)
    parts.push(`Passengers: ${paxDetails.join(', ')} (Total: ${totalPax})`)
  }
  
  if (config.extraLuggage > 0) {
    parts.push(`Extra luggage: ${config.extraLuggage}`)
  }
  if (config.extraHours > 0) {
    parts.push(`Extra hours: ${config.extraHours}`)
  }
  
  if (config.specialServices) {
    const specials = []
    if (config.specialServices.fastTrack) specials.push("Fast Track")
    if (config.specialServices.vipLounge) specials.push("VIP Lounge")
    if (config.specialServices.veniceCombo) specials.push("Venice Combo (Fast Track + VIP)")
    if (config.specialServices.greeterOnly) specials.push("Greeter Only")
    if (config.specialServices.tarmac) specials.push("TARMAC")
    
    if (specials.length > 0) {
      parts.push(`Special services: ${specials.join(', ')}`)
    }
  }
  
  return parts.join(' | ')
}

// Get bookings that need reminders (7 days ahead)
export async function getBookingsForReminder(): Promise<{ success: boolean; data?: BookingRow[]; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    // Calculate target date (7 days from now)
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 7)
    const targetDateString = targetDate.toISOString().split('T')[0] // YYYY-MM-DD format

    console.log('🔍 Looking for bookings on:', targetDateString)

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('service_date', targetDateString)
      .eq('payment_status', 'paid')
      .order('service_time', { ascending: true })

    if (error) {
      console.error('❌ Error fetching bookings for reminder:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Found ${data?.length || 0} bookings for reminder`)

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('❌ Unexpected error fetching bookings for reminder:', error)
    return { success: false, error: 'Failed to fetch bookings' }
  }
}

// Send reminder email to a single customer
async function sendReminderEmail(booking: BookingRow): Promise<{ success: boolean; error?: string }> {
  try {
    const customerEmail = booking.customer_email
    const customerName = booking.customer_name || "Valued Customer"
    
    if (!customerEmail) {
      console.log('⚠️ No email for booking:', booking.id)
      return { success: false, error: 'No customer email' }
    }

    // Format date and time
    const formattedDate = formatDate(booking.service_date)
    const formattedTime = formatTime(booking.service_time)
    const formattedEndTime = booking.service_end_time ? formatTime(booking.service_end_time) : ""
    
    // Format departure time if present
    const formattedDepartureTime = booking.departure_time ? formatTime(booking.departure_time) : ""
    
    // Determine service type
    const isDisposizione = booking.service_type === "disposizione" || booking.service_type === "ceremony-disposition"
    const isCeremony = booking.service_type === "ceremony-disposition"
    const isOlympic = booking.is_olympic_pricing || false
    const isInterCluster = booking.service_type === "inter-cluster"
    const isAltriServizi = booking.service_type === "altri-servizi"
    
    const serviceLabel = booking.service_label || "Transfer"
    const serviceBadge = booking.service_badge || ""
    const serviceIcon = booking.service_icon || "🚗"
    
    // Vehicle configuration
    const parsedIndividualVehicles: Array<{ id?: string; type: string; passengers: number; luggage: number }> = 
      booking.individual_vehicles && Array.isArray(booking.individual_vehicles) && booking.individual_vehicles.length > 0 
        ? booking.individual_vehicles as any 
        : []
    const hasIndividualVehicles = parsedIndividualVehicles.length > 0
    const isMultipleVehicles = booking.vehicle_count > 1
    
    // Meet & Greet config
    const parsedMeetGreetConfig: any = booking.meet_greet_config as any
    
    // Phone number
    let phone = "Not specified"
    if (booking.customer_phone_prefix || booking.customer_phone) {
      if (booking.customer_phone_prefix && booking.customer_phone) {
        phone = `${booking.customer_phone_prefix} ${booking.customer_phone}`
      } else if (booking.customer_phone_prefix) {
        phone = booking.customer_phone_prefix
      } else if (booking.customer_phone) {
        phone = booking.customer_phone
      }
    }

    // Amount
    const totalAmount = booking.amount_total / 100

    console.log(`📧 Sending reminder email to ${customerEmail} for booking on ${formattedDate}`)

    // Send email
    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: customerEmail,
      subject: `🔔 Reminder: Your ${serviceLabel} is in 7 Days - Patty Car`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
              🔔 Reminder of Your Upcoming Reservation
            </h1>
            <p style="color: #e9d5ff; margin: 10px 0 0 0; font-size: 16px;">
              Your service is scheduled in 7 days
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
            <p style="font-size: 18px; color: #333; margin: 0 0 15px 0; line-height: 1.6;">
              Dear ${customerName},
            </p>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin: 0 0 35px 0;">
              We hope this message finds you well.<br><br>
              This is a kind reminder that the service you have booked with us is scheduled to take place in <strong>7 days</strong>, on <strong>${formattedDate}</strong>.
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
            
            <h2 style="color: #1e3c72; margin: 30px 0 20px 0; font-size: 20px; font-weight: 600; text-align: center;">
              📋 Reservation Summary
            </h2>
            
            <!-- Booking Summary Table -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0;">
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="color: #ef4444; font-size: 18px; margin-right: 12px;">🚩</span>
                  <div>
                    <strong style="color: #374151;">Departure:</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${booking.pickup_address}</span>
                  </div>
                </div>
                
                <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="color: #10b981; font-size: 18px; margin-right: 12px;">🏁</span>
                  <div>
                    <strong style="color: #374151;">${isDisposizione ? "Destination:" : "Arrival:"}</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${booking.destination_address}</span>
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
                    ${formattedDepartureTime ? `
                    <br><strong style="color: #374151; font-size: 14px;">Flight/Train departure time:</strong>
                    <span style="color: #6b7280; margin-left: 8px; font-size: 14px;">${formattedDepartureTime}</span>
                    ` : ""}
                  </div>
                </div>
                
                ${isDisposizione && formattedEndTime ? `
                <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="color: #ef4444; font-size: 18px; margin-right: 12px;">🕐</span>
                  <div>
                    <strong style="color: #374151;">Service end time:</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${formattedEndTime}</span>
                  </div>
                </div>
                ` : ""}
                
                ${booking.service_duration && isOlympic ? `
                <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="color: #7c3aed; font-size: 18px; margin-right: 12px;">⏱️</span>
                  <div>
                    <strong style="color: #374151;">Service duration:</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${booking.service_duration} hours</span>
                  </div>
                </div>
                ` : ""}
                
                ${booking.distance && !isDisposizione ? `
                <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="color: #06b6d4; font-size: 18px; margin-right: 12px;">📏</span>
                  <div>
                    <strong style="color: #374151;">Distance:</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${booking.distance}</span>
                  </div>
                </div>
                ` : ""}
                
                ${booking.duration && !isDisposizione ? `
                <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="color: #84cc16; font-size: 18px; margin-right: 12px;">⏰</span>
                  <div>
                    <strong style="color: #374151;">Estimated duration:</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${booking.duration}</span>
                  </div>
                </div>
                ` : ""}
                
                <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="color: #06b6d4; font-size: 18px; margin-right: 12px;">👥</span>
                  <div>
                    <strong style="color: #374151;">Passengers:</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${booking.passengers}</span>
                  </div>
                </div>
                
                <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="color: #84cc16; font-size: 18px; margin-right: 12px;">🧳</span>
                  <div>
                    <strong style="color: #374151;">Luggage:</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${booking.luggage}</span>
                  </div>
                </div>
                
                ${hasIndividualVehicles ? `
                <!-- Individual Vehicles -->
                <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 15px 0;">
                  <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 16px; font-weight: 600; display: flex; align-items: center;">
                    <span style="color: #ec4899; font-size: 18px; margin-right: 10px;">🚙</span>
                    Vehicle Configuration
                  </h4>
                  ${parsedIndividualVehicles.map((vehicle: any, index: number) => `
                  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin-bottom: ${index < parsedIndividualVehicles.length - 1 ? "10px" : "0px"};">
                    <div style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">
                      Vehicle ${index + 1}
                    </div>
                    <div style="display: grid; gap: 8px; font-size: 14px;">
                      <div style="color: #374151;">
                        <strong>Type:</strong> <span style="color: #6b7280;">${cleanVehicleName(vehicle.type)}</span>
                      </div>
                      <div style="color: #374151;">
                        <strong>Passengers:</strong> <span style="color: #6b7280;">${vehicle.passengers}</span>
                      </div>
                      <div style="color: #374151;">
                        <strong>Luggage:</strong> <span style="color: #6b7280;">${vehicle.luggage}</span>
                      </div>
                    </div>
                  </div>
                  `).join("")}
                </div>
                ` : `
                <!-- Single Vehicle Configuration -->
                <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="color: #ec4899; font-size: 18px; margin-right: 12px;">🚙</span>
                  <div>
                    <strong style="color: #374151;">Vehicle:</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${cleanVehicleName(booking.vehicle_type)}</span>
                  </div>
                </div>
                
                ${isMultipleVehicles ? `
                <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="color: #f59e0b; font-size: 18px; margin-right: 12px;">🚗🚗</span>
                  <div>
                    <strong style="color: #374151;">Number of vehicles:</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${booking.vehicle_count} (all same type)</span>
                  </div>
                </div>
                ` : ""}
                `}
                
                ${booking.transfer_cost && booking.transfer_route && isDisposizione ? `
                <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin-top: 15px;">
                  <div style="display: flex; align-items: center;">
                    <span style="color: #2563eb; font-size: 18px; margin-right: 12px;">🚕</span>
                    <div>
                      <strong style="color: #1e40af;">Additional transfer included</strong>
                      <p style="color: #1e40af; margin: 5px 0 0 0; font-size: 14px;">Route: ${booking.transfer_route}</p>
                      <p style="color: #1e40af; margin: 5px 0 0 0; font-size: 12px;">Transfer cost: €${booking.transfer_cost}</p>
                    </div>
                  </div>
                </div>
                ` : ""}
                
                ${booking.event_route ? `
                <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; margin-top: 15px;">
                  <div style="display: flex; align-items: center;">
                    <span style="color: #16a34a; font-size: 18px; margin-right: 12px;">🏁</span>
                    <div>
                      <strong style="color: #166534;">Special event route</strong>
                      <p style="color: #166534; margin: 5px 0 0 0; font-size: 14px;">${booking.event_route}</p>
                    </div>
                  </div>
                </div>
                ` : ""}
                
                ${booking.night_surcharge && parseFloat(booking.night_surcharge) > 0 ? `
                <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin-top: 15px;">
                  <div style="display: flex; align-items: center;">
                    <span style="color: #f59e0b; font-size: 18px; margin-right: 12px;">🌙</span>
                    <div>
                      <strong style="color: #92400e;">Night surcharge applied</strong>
                      <p style="color: #92400e; margin: 5px 0 0 0; font-size: 14px;">Service between 19:30 - 07:30: +€${booking.night_surcharge}</p>
                    </div>
                  </div>
                </div>
                ` : ""}
                
                ${booking.meet_and_greet ? `
                <div style="background: #dcfce7; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; margin-top: 15px;">
                  <div style="display: flex; align-items: center;">
                    <span style="color: #16a34a; font-size: 18px; margin-right: 12px;">👋</span>
                    <div>
                      <strong style="color: #166534;">Meet & Greet service included</strong>
                      ${parsedMeetGreetConfig ? `
                      <div style="margin-top: 12px; font-size: 13px; color: #166534; line-height: 1.6;">
                        ${parsedMeetGreetConfig.serviceId ? `<p style="margin: 4px 0;"><strong>Location:</strong> ${parsedMeetGreetConfig.serviceId}</p>` : ""}
                        ${parsedMeetGreetConfig.selectedService ? `<p style="margin: 4px 0;"><strong>Service type:</strong> ${parsedMeetGreetConfig.selectedService}</p>` : ""}
                        
                        ${(parsedMeetGreetConfig.passengers > 0 || parsedMeetGreetConfig.children > 0 || parsedMeetGreetConfig.infants > 0) ? `
                        <p style="margin: 8px 0 4px 0;"><strong>Passengers breakdown:</strong></p>
                        <ul style="margin: 0; padding-left: 20px;">
                          ${parsedMeetGreetConfig.passengers > 0 ? `<li>Adults: ${parsedMeetGreetConfig.passengers}</li>` : ""}
                          ${parsedMeetGreetConfig.children > 0 ? `<li>Children: ${parsedMeetGreetConfig.children}</li>` : ""}
                          ${parsedMeetGreetConfig.infants > 0 ? `<li>Infants: ${parsedMeetGreetConfig.infants}</li>` : ""}
                        </ul>
                        ` : ""}
                        
                        ${parsedMeetGreetConfig.extraLuggage > 0 ? `<p style="margin: 4px 0;"><strong>Extra luggage:</strong> ${parsedMeetGreetConfig.extraLuggage} pieces</p>` : ""}
                        ${parsedMeetGreetConfig.extraHours > 0 ? `<p style="margin: 4px 0;"><strong>Extra hours:</strong> ${parsedMeetGreetConfig.extraHours} hours</p>` : ""}
                        
                        ${parsedMeetGreetConfig.specialServices && (parsedMeetGreetConfig.specialServices.tarmac || parsedMeetGreetConfig.specialServices.fastTrack || parsedMeetGreetConfig.specialServices.vipLounge || parsedMeetGreetConfig.specialServices.veniceCombo || parsedMeetGreetConfig.specialServices.greeterOnly) ? `
                        <p style="margin: 8px 0 4px 0;"><strong>Special services:</strong></p>
                        <ul style="margin: 0; padding-left: 20px;">
                          ${parsedMeetGreetConfig.specialServices.tarmac ? `<li>TARMAC service</li>` : ""}
                          ${parsedMeetGreetConfig.specialServices.fastTrack ? `<li>Fast Track</li>` : ""}
                          ${parsedMeetGreetConfig.specialServices.vipLounge ? `<li>VIP Lounge</li>` : ""}
                          ${parsedMeetGreetConfig.specialServices.veniceCombo ? `<li>Venice Combo (Fast Track + VIP Lounge)</li>` : ""}
                          ${parsedMeetGreetConfig.specialServices.greeterOnly ? `<li>Greeter only (no Porter service)</li>` : ""}
                        </ul>
                        ` : ""}
                      </div>
                      ` : `
                      <p style="color: #166534; margin: 5px 0 0 0; font-size: 14px;">Our driver will wait for you with a personalized sign</p>
                      `}
                    </div>
                  </div>
                </div>
                ` : ""}
                
                ${booking.water_taxi ? `
                <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin-top: 15px;">
                  <div style="display: flex; align-items: center;">
                    <span style="color: #2563eb; font-size: 18px; margin-right: 12px;">🚤</span>
                    <div>
                      <strong style="color: #1e40af;">Water Taxi Service for Venice</strong>
                      <p style="color: #1e40af; margin: 5px 0 0 0; font-size: 14px;">Water taxi transport service included (+€200)</p>
                    </div>
                  </div>
                </div>
                ` : ""}
                
                ${booking.flight_info || booking.departure_city ? `
                <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin-top: 15px;">
                  <div style="display: flex; align-items: center;">
                    <span style="color: #2563eb; font-size: 18px; margin-right: 12px;">✈️</span>
                    <div>
                      ${booking.flight_info ? `<div style="color: #1e40af; margin-bottom: 5px;"><strong>Flight/Train number:</strong> ${booking.flight_info}</div>` : ""}
                      ${booking.departure_city ? `<div style="color: #1e40af; margin-bottom: 5px;"><strong>Departure city:</strong> ${booking.departure_city}</div>` : ""}
                      <p style="color: #1e40af; margin: 5px 0 0 0; font-size: 14px;">We will monitor any flight delays</p>
                    </div>
                  </div>
                </div>
                ` : ""}
                
                ${booking.notes ? `
                <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin-top: 15px;">
                  <div style="display: flex; align-items: flex-start;">
                    <span style="color: #f59e0b; font-size: 18px; margin-right: 12px;">📝</span>
                    <div>
                      <strong style="color: #92400e;">Additional notes:</strong>
                      <p style="color: #92400e; margin: 5px 0 0 0; line-height: 1.5;">${booking.notes}</p>
                    </div>
                  </div>
                </div>
                ` : ""}
              </div>
              
              <!-- Amount Paid -->
              <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border: 1px solid #22c55e; border-radius: 12px; padding: 20px; margin: 25px 0 0 0; text-align: center;">
                <div style="color: #16a34a; font-size: 20px; margin-bottom: 8px;">💳</div>
                <h3 style="color: #166534; margin: 0 0 8px 0; font-size: 16px;">Amount Paid</h3>
                <p style="color: #166534; margin: 0; font-size: 24px; font-weight: 600;">
                  €${totalAmount.toFixed(2)}
                </p>
                ${booking.vat_rate ? `
                <p style="color: #166534; margin: 5px 0 0 0; font-size: 12px;">
                  VAT ${booking.vat_rate}% included
                </p>
                ` : ""}
              </div>
            </div>
            
            <!-- Important Reminder -->
            <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                📱 What to Expect
              </h3>
              <ul style="color: #1e40af; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>You will receive another reminder <strong>1 day before</strong> the service</li>
                <li>Our driver will contact you <strong>30 minutes before</strong> the agreed time</li>
                <li>We will monitor any flight/train delays if applicable</li>
              </ul>
            </div>
            
            <!-- Contact Information -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                💬 Need Assistance?
              </h3>
              <p style="color: #6b7280; margin: 0; line-height: 1.6;">
                Should you have any requests or require further information, please do not hesitate to contact us at:<br><br>
                📞 <strong>+39 393 104 9505</strong><br>
                📧 <strong>gamestime@pattycar.com</strong><br><br>
                We will be more than happy to assist you.
              </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0 20px 0;">
              <p style="color: #1e3c72; font-size: 18px; font-weight: 600; margin: 0;">
                We look forward to welcoming you and ensuring a pleasant experience.
              </p>
              <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">
                Best regards,<br>
                <strong>Patty Car Team</strong>
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
            <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.5;">
              This is an automated reminder email from Patty Car.<br>
              For any assistance, please contact us at gamestime@pattycar.com
            </p>
          </div>
        </div>
      `,
    })

    console.log(`✅ Reminder email sent successfully to ${customerEmail}`)
    return { success: true }

  } catch (error) {
    console.error('❌ Error sending reminder email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Main function to run daily reminders
export async function runDailyReminders(): Promise<{ success: boolean; results: any; error?: string }> {
  try {
    console.log('🔔 Running daily reminders at', new Date().toISOString())

    // Get bookings for 7 days ahead
    const bookingsResult = await getBookingsForReminder()
    
    if (!bookingsResult.success || !bookingsResult.data) {
      console.log('⚠️ No bookings found or error:', bookingsResult.error)
      return {
        success: true,
        results: {
          totalBookings: 0,
          emailsSent: 0,
          emailsFailed: 0,
          message: bookingsResult.error || 'No bookings found'
        }
      }
    }

    const bookings = bookingsResult.data
    console.log(`📧 Sending reminder emails to ${bookings.length} customers...`)

    // Send reminder email to each customer
    const results = []
    let successCount = 0
    let failureCount = 0

    for (const booking of bookings) {
      const result = await sendReminderEmail(booking)
      results.push({
        bookingId: booking.id,
        customerEmail: booking.customer_email,
        customerName: booking.customer_name,
        serviceDate: booking.service_date,
        success: result.success,
        error: result.error
      })

      if (result.success) {
        successCount++
      } else {
        failureCount++
      }
    }

    console.log(`✅ Daily reminders completed: ${successCount} sent, ${failureCount} failed`)

    return {
      success: true,
      results: {
        totalBookings: bookings.length,
        emailsSent: successCount,
        emailsFailed: failureCount,
        details: results
      }
    }

  } catch (error) {
    console.error('❌ Error running daily reminders:', error)
    return {
      success: false,
      results: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
