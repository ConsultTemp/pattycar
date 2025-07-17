import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { verifyAdminAuth } from '@/lib/auth-server'

// DELETE customer by ID
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
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // First check if customer exists
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError || !existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Delete the customer
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting customer:', error)
      return NextResponse.json(
        { error: 'Failed to delete customer' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    })

  } catch (error) {
    console.error('Error in customer DELETE API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update customer by ID
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
    const { name, billing_info } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // First check if customer exists
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Update the customer
    const { data, error } = await supabase
      .from('customers')
      .update({
        name: name.trim(),
        billing_info: billing_info ? billing_info.trim() : null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating customer:', error)
      return NextResponse.json(
        { error: 'Failed to update customer' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Customer updated successfully'
    })

  } catch (error) {
    console.error('Error in customer PUT API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 