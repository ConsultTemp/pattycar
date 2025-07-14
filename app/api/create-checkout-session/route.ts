import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json()
    
    // Create the booking in Supabase with 'pending' status
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        name: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phoneNumber,
        phone_prefix: bookingData.phonePrefix,
        vehicle_type: bookingData.vehicleType,
        date: bookingData.date,
        time: bookingData.time,
        passengers: parseInt(bookingData.passengers),
        departure_location: bookingData.pickupLocation,
        destination: bookingData.destination,
        luggage: parseInt(bookingData.luggage),
        flight_number: bookingData.flight,
        billing_info: bookingData.billingInfo,
        notes: bookingData.notes,
        meet_greet: bookingData.meetAndGreet === 'true',
        payment_status: 'pending',
        currency: 'EUR'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating booking:', error)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // Calculate price (you can customize this logic)
    const basePrice = 100 // Base price in euros
    const pricePerPassenger = 20
    const totalPrice = basePrice + (parseInt(bookingData.passengers) - 1) * pricePerPassenger

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Transfer Service - ${bookingData.vehicleType}`,
              description: `${bookingData.pickupLocation} → ${bookingData.destination}`,
            },
            unit_amount: totalPrice * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-cancelled`,
      metadata: {
        booking_id: booking.id,
        customer_email: bookingData.email,
        customer_name: bookingData.name,
      },
      customer_email: bookingData.email,
    })

    // Update booking with session ID
    await supabase
      .from('bookings')
      .update({ 
        stripe_session_id: session.id,
        payment_amount: totalPrice 
      })
      .eq('id', booking.id)

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}