import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth-server'
import { notifyCustomer } from '@/lib/twilio-service'

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
      customerName,
      customerPhone,
      customerPhonePrefix,
      serviceDate,
      serviceTime,
      pickupAddress,
      destinationAddress,
      vehicleType,
      driverName,
      notificationType,
      customMessage
    } = body

    if (!customerName || !customerPhone || !customerPhonePrefix) {
      return NextResponse.json(
        { error: 'Missing required customer data' },
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

      const phoneNumber = `${customerPhonePrefix}${customerPhone}`
      const message = `🚗 PatyCar TEST: ${customMessage}`

      const smsResult = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: phoneNumber
      })

      return NextResponse.json({
        success: true,
        messageId: smsResult.sid,
        message: 'Custom test SMS sent successfully'
      })
    } else {
      // Use standard template
      const result = await notifyCustomer({
        customerName: `${customerName} (TEST)`,
        customerPhone,
        customerPhonePrefix,
        serviceDate,
        serviceTime,
        pickupAddress,
        destinationAddress,
        vehicleType,
        driverName
      }, notificationType || '1_day')

      if (result.success) {
        return NextResponse.json({
          success: true,
          messageId: result.messageId,
          message: 'Test customer SMS sent successfully'
        })
      } else {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 500 })
      }
    }

  } catch (error) {
    console.error('Error in test customer SMS API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}