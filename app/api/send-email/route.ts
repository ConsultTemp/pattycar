import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  console.log('📧 Email send request received')
  
  try {
    // Parse the request body
    const body = await req.json()
    const { clienteEmail, driverPhone } = body

    console.log('📋 Request data:', { clienteEmail, driverPhone })

    // Validate required fields
    if (!clienteEmail) {
      console.log('❌ Missing client email')
      return NextResponse.json(
        { error: "Client email is required" },
        { status: 400 }
      )
    }

    if (!driverPhone) {
      console.log('❌ Missing driver phone')
      return NextResponse.json(
        { error: "Driver phone is required" },
        { status: 400 }
      )
    }

    // Send email to client with driver's phone number
    console.log('📧 Sending email to client...')
    
    try {
      const emailResult = await resend.emails.send({
        from: process.env.RESEND_FROM!,
        to: clienteEmail,
        subject: "🚗 Your Driver Contact Information - Patty Car",
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                🚗 Driver Contact Information
              </h1>
              <p style="color: #e3f2fd; margin: 10px 0 0 0; font-size: 16px;">
                Your driver is ready to assist you
              </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #333; margin: 0 0 30px 0; line-height: 1.6;">
                Dear Customer,
              </p>
              
              <p style="font-size: 16px; color: #555; line-height: 1.6; margin: 0 0 35px 0;">
                We are pleased to provide you with your driver's contact information for your upcoming service with Patty Car.
              </p>
              
              <!-- Driver Phone Number -->
              <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
                <h2 style="color: #16a34a; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                  📱 Driver's Phone Number
                </h2>
                <p style="color: #166534; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px;">
                  ${driverPhone}
                </p>
                <p style="color: #16a34a; margin: 15px 0 0 0; font-size: 14px;">
                  Feel free to contact your driver if you have any questions
                </p>
              </div>
              
              <!-- Additional Information -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 30px 0;">
                <h3 style="color: #1e3c72; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
                  📋 Important Information
                </h3>
                <ul style="color: #475569; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Your driver will be available to assist you with any questions or concerns</li>
                  <li style="margin-bottom: 8px;">Please save this phone number for easy access on the day of your service</li>
                  <li style="margin-bottom: 8px;">If you need to make any changes to your booking, please contact us at <strong>gamestime@pattycar.com</strong></li>
                </ul>
              </div>
              
              <!-- Customer Support -->
              <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 12px; padding: 25px; margin: 30px 0;">
                <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                  💬 Need Help?
                </h3>
                <p style="color: #1e40af; margin: 0; line-height: 1.6;">
                  Should you require any assistance, please do not hesitate to contact us at:<br>
                  <strong>gamestime@pattycar.com</strong>
                </p>
              </div>
              
              <div style="text-align: center; margin: 40px 0 20px 0;">
                <p style="color: #1e3c72; font-size: 18px; font-weight: 600; margin: 0;">
                  We look forward to serving you!
                </p>
                <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">
                  Kind regards,<br>
                  The Patty Car Team
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.5;">
                This is an automatic notification email. <br>
                For assistance, please contact us at gamestime@pattycar.com
              </p>
            </div>
          </div>
        `,
      })

      console.log('✅ Email sent successfully:', emailResult)

      return NextResponse.json(
        {
          success: true,
          message: "Email sent successfully",
          emailId: emailResult.data?.id
        },
        { status: 200 }
      )

    } catch (emailError) {
      console.error('❌ Error sending email:', emailError)
      return NextResponse.json(
        {
          error: "Failed to send email",
          details: emailError instanceof Error ? emailError.message : "Unknown error"
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Request processing error:', error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Configuration
export const runtime = "nodejs"
