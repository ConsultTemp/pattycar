import { NextRequest, NextResponse } from 'next/server'
import { runDailyReminders } from '@/lib/reminder-system'

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a cron job (optional security check)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Daily reminders cron job started at:', new Date().toISOString())

    // Run the daily reminders
    const result = await runDailyReminders()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Daily reminders sent successfully',
        results: result.results
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        results: result.results
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in daily reminders cron job:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}

