import { NextRequest, NextResponse } from 'next/server'
import { runDailyReminders } from '@/lib/reminder-system'

export async function GET(request: NextRequest) {
  try {
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









