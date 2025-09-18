import { NextRequest, NextResponse } from 'next/server'
import { setupGoogleSheetsHeaders, addBookingToGoogleSheets, GoogleSheetsBookingData } from '@/lib/google-sheets'

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json()

    if (action === 'setup-headers') {
      // Setup the headers in the Google Sheet
      const result = await setupGoogleSheetsHeaders()
      
      if (result.success) {
        return NextResponse.json({ 
          success: true, 
          message: 'Google Sheets headers configured successfully' 
        })
      } else {
        return NextResponse.json({ 
          success: false, 
          error: result.error 
        }, { status: 500 })
      }
    }

    if (action === 'test-connection') {
      // Test the connection by adding a sample booking
      const testBooking: GoogleSheetsBookingData = {
        service_date: new Date().toLocaleDateString('it-IT'),
        company: 'Patty Car (TEST)',
        service_time: '10:00',
        customer_name: 'Test Customer',
        passengers_info: '2 pax',
        pickup_address: 'Test Pickup Address',
        destination_address: 'Test Destination',
        vehicle_type: 'Mercedes E-Class',
        taxable_amount: 82.0,
        vat_amount: 18.0,
        total_invoice: 100.0,
        driver_name: '',
        driver_billing: '',
        driver_commission: '',
        direct_collection: 100.0,
        payment_method: 'test',
        notes: 'This is a test booking - you can delete this row',
        
        // Additional fields
        id: 'test-' + Date.now(),
        customer_email: 'test@example.com',
        customer_phone: '+39 123 456 7890',
        amount_total: 10000, // 100€ in cents
        payment_status: 'paid'
      }

      const result = await addBookingToGoogleSheets(testBooking)
      
      if (result.success) {
        return NextResponse.json({ 
          success: true, 
          message: 'Test booking added successfully to Google Sheets' 
        })
      } else {
        return NextResponse.json({ 
          success: false, 
          error: result.error 
        }, { status: 500 })
      }
    }

    if (action === 'test-realistic-booking') {
      // Test with a realistic transfer booking
      const realisticBooking: GoogleSheetsBookingData = {
        service_date: '15/6/2025', // Format matching CSV
        company: 'Patty Car',
        service_time: '14:30',
        customer_name: 'Marco Rossi',
        passengers_info: '4 pax',
        pickup_address: 'Hotel Excelsior Gallia, Piazza Duca d\'Aosta, 9, Milano',
        destination_address: 'Aeroporto di Milano Malpensa (MXP)',
        vehicle_type: 'Mercedes V-Class',
        taxable_amount: 147.54, // €180 - 22% VAT
        vat_amount: 32.46,      // 22% VAT
        total_invoice: 180.0,   // Total amount
        driver_name: '',        // Empty - to be assigned manually
        driver_billing: '',     // Empty
        driver_commission: '',  // Empty
        direct_collection: 180.0, // Full amount
        payment_method: 'online',
        notes: 'Flight LH1853 to Frankfurt - Meet & Greet included - 2 large suitcases',
        
        // Additional fields
        id: 'realistic-' + Date.now(),
        customer_email: 'marco.rossi@email.com',
        customer_phone: '+39 333 123 4567',
        amount_total: 18000, // €180 in cents
        payment_status: 'paid'
      }

      const result = await addBookingToGoogleSheets(realisticBooking)
      
      if (result.success) {
        return NextResponse.json({ 
          success: true, 
          message: 'Realistic transfer booking added successfully to Google Sheets',
          bookingDetails: {
            date: realisticBooking.service_date,
            time: realisticBooking.service_time,
            customer: realisticBooking.customer_name,
            route: `${realisticBooking.pickup_address} → ${realisticBooking.destination_address}`,
            vehicle: realisticBooking.vehicle_type,
            total: `€${realisticBooking.total_invoice}`,
            notes: realisticBooking.notes
          }
        })
      } else {
        return NextResponse.json({ 
          success: false, 
          error: result.error 
        }, { status: 500 })
      }
    }

    if (action === 'debug-headers') {
      // Debug the headers to see what's wrong
      const { google } = require('googleapis')
      const sheets = google.sheets('v4')
      
      function createAuthClient() {
        const auth = new google.auth.GoogleAuth({
          credentials: {
            type: 'service_account',
            private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY!.replace(/\\n/g, '\n'),
            client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL!,
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        })
        return auth
      }

      try {
        const auth = createAuthClient()
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

        const headersResponse = await sheets.spreadsheets.values.get({
          auth,
          spreadsheetId,
          range: 'Sheet1!1:1',
        })

        const headers = headersResponse.data.values?.[0] || []
        
        const headerInfo = headers.map((header: string, index: number) => ({
          index,
          value: header,
          trimmed: header ? header.toLowerCase().trim() : '',
          isEmpty: !header || header.trim() === ''
        }))

        return NextResponse.json({
          success: true,
          headers: headerInfo,
          totalColumns: headers.length
        })

      } catch (error) {
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 })

  } catch (error) {
    console.error('Error in Google Sheets setup:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Google Sheets Setup API',
    endpoints: {
      'POST /api/admin/setup-google-sheets': {
        'setup-headers': 'Setup the column headers in Google Sheets',
        'test-connection': 'Test the connection by adding a sample booking',
        'debug-headers': 'Debug the headers in the Google Sheet'
      }
    },
    environment: {
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? 'Configured' : 'Missing',
      clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL ? 'Configured' : 'Missing',
      privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY ? 'Configured' : 'Missing'
    }
  })
}