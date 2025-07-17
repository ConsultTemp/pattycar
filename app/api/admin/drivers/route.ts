import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { verifyAdminAuth } from '@/lib/auth-server'

// GET all drivers
export async function GET() {
  try {
    // Verify admin authentication
    const isAuthenticated = await verifyAdminAuth()
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching drivers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch drivers' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('Error in drivers GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create new driver
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
    const { name } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Driver name is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('drivers')
      .insert([{ name: name.trim() }])
      .select()
      .single()

    if (error) {
      console.error('Error creating driver:', error)
      return NextResponse.json(
        { error: 'Failed to create driver' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Driver created successfully'
    })

  } catch (error) {
    console.error('Error in drivers POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 