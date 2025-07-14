import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session

      // Update the booking in Supabase
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status: 'completed',
          payment_intent_id: session.payment_intent as string,
        })
        .eq('stripe_session_id', session.id)

      if (error) {
        console.error('Error updating booking:', error)
        return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
      }

      console.log('Payment completed for session:', session.id)
      break

    case 'checkout.session.expired':
      const expiredSession = event.data.object as Stripe.Checkout.Session

      // Update the booking status to failed
      const { error: expiredError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'failed',
        })
        .eq('stripe_session_id', expiredSession.id)

      if (expiredError) {
        console.error('Error updating expired booking:', expiredError)
      }

      console.log('Payment session expired:', expiredSession.id)
      break

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent

      // Update the booking status to failed
      const { error: failedError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'failed',
        })
        .eq('payment_intent_id', failedPayment.id)

      if (failedError) {
        console.error('Error updating failed booking:', failedError)
      }

      console.log('Payment failed:', failedPayment.id)
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}