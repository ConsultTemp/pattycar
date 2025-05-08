import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Store CSRF tokens in memory (in production, use a proper session store)
const validTokens = new Set<string>()

// Clean up old tokens periodically (every 1 hour)
setInterval(() => {
  validTokens.clear()
}, 3600000)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { formData, captcha, csrfToken } = body

    // Validate CSRF token
    if (!csrfToken || !validTokens.has(csrfToken)) {
      console.error('Invalid CSRF token:', { received: csrfToken, validTokens: Array.from(validTokens) })
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }

    // Remove used token
    validTokens.delete(csrfToken)

    // Validate captcha
    if (!captcha) {
      return NextResponse.json(
        { error: 'Captcha is required' },
        { status: 400 }
      )
    }

    // Here you would validate the captcha against your stored value
    // For now, we'll just check if it's not empty
    if (captcha.length < 5) {
      return NextResponse.json(
        { error: 'Invalid captcha' },
        { status: 400 }
      )
    }

    // Prepare data for FormSubmit
    const formSubmitData = {
      ...formData,
      _subject: 'New Booking Request from Patty Car Website',
      _template: 'table',
      _captcha: 'false',
      _next: `https://pattycar.com/${formData.language}/`
    }

    // Send to FormSubmit
    const formSubmitResponse = await fetch('https://formsubmit.co/14f7eed24c722a9bcf728d63f1e3d6bf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formSubmitData)
    })

    if (!formSubmitResponse.ok) {
      const errorText = await formSubmitResponse.text()
      console.error('FormSubmit error:', errorText)
      throw new Error('FormSubmit request failed')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing form submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Add CSRF token to valid tokens
export async function GET() {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  validTokens.add(token)
  
  // Set a cookie with the token for additional security
  const response = NextResponse.json({ token })
  response.cookies.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600 // 1 hour
  })
  
  return response
} 