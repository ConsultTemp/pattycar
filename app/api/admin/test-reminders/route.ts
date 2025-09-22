import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth-server'
import { runDailyReminders } from '@/lib/reminder-system'

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

    console.log('Manual reminder test triggered by admin at:', new Date().toISOString())

    // Run the daily reminders
    const result = await runDailyReminders()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test reminders sent successfully',
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
    console.error('Error in test reminders:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}






