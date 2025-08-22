import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth-server'
import { notifyDriver } from '@/lib/twilio-service'

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const isAuthenticated = await verifyAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      driverName,
      driverPhone,
      serviceDate,
      serviceTime,
      customerName,
      pickupAddress,
      destinationAddress,
      vehicleType,
      passengers,
      notes,
      customMessage
    } = body

    if (!driverName || !driverPhone) {
      return NextResponse.json(
        { error: 'Missing required driver data' },
        { status: 400 }
      )
    }

    // Use custom message if provided, otherwise use standard template
    if (customMessage && customMessage.trim()) {
      // Send custom message using Twilio directly
      const { Twilio } = require('twilio')
      const client = new Twilio(
        process.env.TWILIO_ACCOUNT_SID!,
        process.env.TWILIO_AUTH_TOKEN!
      )

      const message = `🚗 PatyCar TEST: ${customMessage}`

      const smsResult = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: driverPhone
      })

      return NextResponse.json({
        success: true,
        messageId: smsResult.sid,
        message: 'Custom test SMS sent successfully'
      })
    } else {
      // Use standard template
      const result = await notifyDriver({
        driverName: `${driverName} (TEST)`,
        driverPhone,
        serviceDate,
        serviceTime,
        customerName: `${customerName} (TEST)`,
        pickupAddress,
        destinationAddress,
        vehicleType,
        passengers,
        notes: notes ? `${notes} (TEST)` : 'Test notification from admin panel'
      })

      if (result.success) {
        return NextResponse.json({
          success: true,
          messageId: result.messageId,
          message: 'Test driver SMS sent successfully'
        })
      } else {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 500 })
      }
    }

  } catch (error) {
    console.error('Error in test driver SMS API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}