import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import { getAuthenticatedUser } from '@/lib/auth-server'

export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    const { id, ...updateData } = body

    // Get the authenticated user
    const authenticatedUser = await getAuthenticatedUser()
    const currentUserId = authenticatedUser?.id || null

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // Prepare update data
    const bookingUpdateData = {
      ...updateData,
      updated_at: new Date().toISOString(),
      modified_by: currentUserId
    }

    // Remove undefined values
    Object.keys(bookingUpdateData).forEach(key => {
      if (bookingUpdateData[key] === undefined) {
        delete bookingUpdateData[key]
      }
    })

    const { data, error } = await supabase
      .from('bookings')
      .update(bookingUpdateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating booking:', error)
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      )
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      booking: data[0]
    })

  } catch (error) {
    console.error('Error in update-booking API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 