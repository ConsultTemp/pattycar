import { NextRequest, NextResponse } from 'next/server'

// Debug endpoint that ALWAYS returns 200 and logs everything
export async function POST(request: NextRequest) {
  console.log('🐛 DEBUG SMS ENDPOINT called at:', new Date().toISOString())
  
  try {
    // Parse the request body
    const rawBody = await request.text()
    console.log('📥 DEBUG - Raw request body:', rawBody)
    console.log('📥 DEBUG - Raw body length:', rawBody.length)
    console.log('📥 DEBUG - Raw body type:', typeof rawBody)
    
    let payload: any
    try {
      payload = JSON.parse(rawBody)
      console.log('✅ DEBUG - JSON parsed successfully')
    } catch (parseError) {
      console.error('❌ DEBUG - JSON Parse Error:', parseError)
      console.error('❌ DEBUG - Parse error details:', parseError instanceof Error ? parseError.message : 'Unknown')
      
      return NextResponse.json({
        debug: true,
        error: 'JSON parse failed',
        rawBody: rawBody,
        parseError: parseError instanceof Error ? parseError.message : 'Unknown',
        timestamp: new Date().toISOString()
      })
    }
    
    console.log('📋 DEBUG - Parsed payload:', JSON.stringify(payload, null, 2))
    console.log('📋 DEBUG - Payload type:', typeof payload)
    console.log('📋 DEBUG - Payload keys:', Object.keys(payload || {}))
    
    // Detailed field analysis
    console.log('🔍 DEBUG - Field analysis:')
    if (payload) {
      Object.keys(payload).forEach(key => {
        const value = payload[key]
        console.log(`  - ${key}: ${JSON.stringify(value)} (type: ${typeof value}, truthy: ${!!value})`)
      })
    }
    
    // Validation analysis (same as main endpoint)
    const missingFields = []
    if (!payload?.data) {
      missingFields.push('data')
      console.log('❌ DEBUG - Missing data field')
    }
    if (!payload?.ora) {
      missingFields.push('ora')
      console.log('❌ DEBUG - Missing ora field')
    }
    if (!payload?.target) {
      missingFields.push('target')
      console.log('❌ DEBUG - Missing target field')
    }
    
    // Target validation
    const validTargets = ['driver', 'cliente', 'entrambi']
    const isValidTarget = validTargets.includes(payload?.target)
    console.log('🎯 DEBUG - Target validation:', {
      target: payload?.target,
      isValid: isValidTarget,
      validOptions: validTargets
    })
    
    console.log('✅ DEBUG - Analysis complete, returning debug info')
    
    // ALWAYS return 200 with debug info
    return NextResponse.json({
      debug: true,
      message: 'Debug endpoint - always returns 200',
      analysis: {
        rawBodyLength: rawBody.length,
        parsedSuccessfully: !!payload,
        payload: payload,
        fieldAnalysis: payload ? Object.keys(payload).map(key => ({
          field: key,
          value: payload[key],
          type: typeof payload[key],
          truthy: !!payload[key]
        })) : [],
        validation: {
          missingFields,
          isValidTarget,
          wouldReturn400: missingFields.length > 0 || !isValidTarget
        }
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ DEBUG - Unexpected error:', error)
    console.error('❌ DEBUG - Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json({
      debug: true,
      error: 'Unexpected error in debug endpoint',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack',
      timestamp: new Date().toISOString()
    })
  }
}

// Health check
export async function GET() {
  console.log('🐛 DEBUG SMS GET endpoint called')
  return NextResponse.json({
    debug: true,
    message: 'Debug SMS endpoint is active',
    url: '/api/debug-sms',
    purpose: 'Always returns 200 and logs everything for debugging',
    usage: 'Use this instead of /api/send-sms to see detailed logs'
  })
}
