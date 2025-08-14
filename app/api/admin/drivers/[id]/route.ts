import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { verifyAdminAuth } from '@/lib/auth-server'

// DELETE driver by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const isAuthenticated = await verifyAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // First check if driver exists
    const { data: existingDriver, error: fetchError } = await supabase
      .from('drivers')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError || !existingDriver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      )
    }

    // Check if driver is assigned to any bookings
    const { data: assignedBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('driver_id', id)
      .limit(1)

    if (bookingsError) {
      console.error('Error checking driver assignments:', bookingsError)
      return NextResponse.json(
        { error: 'Failed to check driver assignments' },
        { status: 500 }
      )
    }

    if (assignedBookings && assignedBookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete driver that is assigned to bookings' },
        { status: 400 }
      )
    }

    // Delete the driver
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting driver:', error)
      return NextResponse.json(
        { error: 'Failed to delete driver' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Driver deleted successfully'
    })

  } catch (error) {
    console.error('Error in driver DELETE API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update driver by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const isAuthenticated = await verifyAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { name, phone } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      )
    }

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Driver name is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // First check if driver exists
    const { data: existingDriver, error: fetchError } = await supabase
      .from('drivers')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existingDriver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      )
    }

    // Update the driver
    const { data, error } = await supabase
      .from('drivers')
      .update({
        name: name.trim(),
        phone: phone ? phone.trim() : null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating driver:', error)
      return NextResponse.json(
        { error: 'Failed to update driver' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Driver updated successfully'
    })

  } catch (error) {
    console.error('Error in driver PUT API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 